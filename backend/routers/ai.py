from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, timedelta
from bson import ObjectId
import jwt, os

from services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Coach"])
security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "habitai-secret-change-me")

def _oid(s):
    try: return ObjectId(s)
    except: raise HTTPException(404, "Invalid ID")

async def _current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        uid = payload["sub"]
    except:
        raise HTTPException(401, "Invalid token")
    user = await request.app.state.db.users.find_one({"_id": _oid(uid)})
    if not user: raise HTTPException(401, "User not found")
    return user

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class SuggestGoal(BaseModel):
    goal: str

# ── Helper: gather habit data for AI ─────────────────────────────────────────
async def _gather_habit_data(db, uid: str) -> dict:
    habits = await db.habits.find({"user_id": uid, "archived": {"$ne": True}}).to_list(50)
    today = date.today().isoformat()
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    month_ago = (date.today() - timedelta(days=30)).isoformat()

    habit_summaries = []
    for h in habits:
        hid = str(h["_id"])
        # 30-day completion rate
        completed_30 = await db.habit_logs.count_documents(
            {"habit_id": hid, "date": {"$gte": month_ago}, "completed": True})
        rate_30 = round(completed_30 / 30 * 100)
        # 7-day completion rate
        completed_7 = await db.habit_logs.count_documents(
            {"habit_id": hid, "date": {"$gte": week_ago}, "completed": True})
        rate_7 = round(completed_7 / 7 * 100)
        # Current streak
        streak = 0
        check = date.today()
        for _ in range(60):
            log = await db.habit_logs.find_one({"habit_id": hid, "date": check.isoformat(), "completed": True})
            if log: streak += 1; check -= timedelta(days=1)
            else: break
        # Day-of-week pattern (last 30 days)
        dow_pattern = {0:0,1:0,2:0,3:0,4:0,5:0,6:0}
        logs = await db.habit_logs.find({"habit_id": hid, "date": {"$gte": month_ago}, "completed": True}).to_list(100)
        for lg in logs:
            try:
                d = date.fromisoformat(lg["date"])
                dow_pattern[d.weekday()] = dow_pattern.get(d.weekday(), 0) + 1
            except: pass
        dow_names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
        pattern_str = ", ".join(f"{dow_names[k]}:{v}" for k,v in dow_pattern.items())
        habit_summaries.append({
            "name": h["title"],
            "category": h.get("category","general"),
            "emoji": h.get("emoji","✅"),
            "streak": streak,
            "completion_rate_7d": rate_7,
            "completion_rate_30d": rate_30,
            "day_pattern": pattern_str,
            "total_completions": h.get("total_completions", 0)
        })

    goals = await db.goals.find({"user_id": uid, "status": "active"}).to_list(20)
    goal_list = [{"title": g["title"], "progress": g.get("progress", 0), "category": g.get("category","personal")} for g in goals]

    total_habits = len(habits)
    done_today = await db.habit_logs.count_documents({"user_id": uid, "date": today, "completed": True})
    week_logs = await db.habit_logs.count_documents({"user_id": uid, "date": {"$gte": week_ago}, "completed": True})
    weekly_pct = round(week_logs / max(total_habits * 7, 1) * 100)

    return {
        "habits": habit_summaries,
        "goals": goal_list,
        "summary": {
            "total_habits": total_habits,
            "done_today": done_today,
            "weekly_completion_pct": weekly_pct,
        }
    }

# ── 1. Analyze Habits ─────────────────────────────────────────────────────────
@router.post("/analyze-habits")
async def analyze_habits(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    habit_data = await _gather_habit_data(db, uid)

    if not habit_data["habits"]:
        return {
            "analysis": "You haven't added any habits yet! Start by adding a few daily habits.",
            "suggestions": [
                "Start with just 1-2 habits to build momentum",
                "Pick habits tied to your goals",
                "Choose a specific time of day for each habit"
            ],
            "patterns": [],
            "score": 0
        }

    ai = AIService()
    result = await ai.analyze_habits(habit_data, u["name"])
    return result

# ── 2. AI Chat Coach ──────────────────────────────────────────────────────────
@router.post("/chat")
async def chat(data: ChatMessage, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    habit_data = await _gather_habit_data(db, uid)
    ai = AIService()
    result = await ai.chat(data.message, habit_data, u["name"], data.history or [])
    return result

# ── 3. Weekly Report ──────────────────────────────────────────────────────────
@router.post("/weekly-report")
async def weekly_report(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    habit_data = await _gather_habit_data(db, uid)

    if not habit_data["habits"]:
        return {
            "report": "No habits tracked this week. Add some habits to get your weekly report!",
            "completion_rate": 0,
            "best_habit": None,
            "weak_habit": None,
            "recommendation": "Start tracking habits to receive personalized weekly reports.",
            "streaks": []
        }

    ai = AIService()
    result = await ai.weekly_report(habit_data, u["name"])
    return result

# ── 4. Suggest Habits ─────────────────────────────────────────────────────────
@router.post("/suggest-habits")
async def suggest_habits(data: SuggestGoal, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    existing = await _gather_habit_data(db, uid)
    existing_names = [h["name"] for h in existing["habits"]]
    ai = AIService()
    result = await ai.suggest_habits(data.goal, existing_names, u["name"])
    return result

# ── 5. Motivation Boost ───────────────────────────────────────────────────────
@router.post("/motivate")
async def motivate(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    habit_data = await _gather_habit_data(db, uid)
    ai = AIService()
    result = await ai.motivation_boost(habit_data, u["name"])
    return result
