from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
from bson import ObjectId
import jwt, os

router = APIRouter(tags=["Habits"])
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "habitai-secret-change-me")

def _oid(s):
    try: return ObjectId(s)
    except: raise HTTPException(404, "Invalid ID")

def _fmt(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def _fmtl(docs): return [_fmt(d) for d in docs]

async def _current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        uid = payload["sub"]
    except:
        raise HTTPException(401, "Invalid token")
    user = await request.app.state.db.users.find_one({"_id": _oid(uid)})
    if not user: raise HTTPException(401, "User not found")
    return user

class HabitCreate(BaseModel):
    title: str
    description: str = ""
    emoji: str = "✅"
    frequency: str = "daily"  # daily, weekdays, weekends, custom
    target_days: List[int] = [0,1,2,3,4,5,6]  # 0=Mon ... 6=Sun
    color: str = "#7c3aed"
    category: str = "general"

class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None

@router.get("/habits")
async def get_habits(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    docs = await db.habits.find({"user_id": str(u["_id"]), "archived": {"$ne": True}}).sort("created_at", 1).to_list(200)
    today = date.today().isoformat()
    result = []
    for h in docs:
        h = _fmt(h)
        # Check if completed today
        log = await db.habit_logs.find_one({"habit_id": h["id"], "date": today, "completed": True})
        h["done_today"] = bool(log)
        # Get streak
        h["streak"] = await _get_streak(db, h["id"])
        # Get completion rate (last 30 days)
        h["completion_rate"] = await _completion_rate(db, h["id"], 30)
        result.append(h)
    return result

@router.post("/habits", status_code=201)
async def create_habit(data: HabitCreate, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    doc = {**data.dict(), "user_id": str(u["_id"]), "created_at": datetime.utcnow(),
           "archived": False, "total_completions": 0}
    res = await db.habits.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    doc["done_today"] = False
    doc["streak"] = 0
    doc["completion_rate"] = 0
    return doc

@router.put("/habits/{hid}")
async def update_habit(hid: str, data: HabitUpdate, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    patch = {k:v for k,v in data.dict().items() if v is not None}
    if not patch: raise HTTPException(400, "Nothing to update")
    updated = await db.habits.find_one_and_update(
        {"_id": _oid(hid), "user_id": str(u["_id"])},
        {"$set": patch}, return_document=True)
    if not updated: raise HTTPException(404, "Habit not found")
    return _fmt(updated)

@router.delete("/habits/{hid}")
async def delete_habit(hid: str, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    r = await db.habits.update_one(
        {"_id": _oid(hid), "user_id": str(u["_id"])},
        {"$set": {"archived": True}})
    if r.matched_count == 0: raise HTTPException(404, "Habit not found")
    return {"success": True}

@router.post("/habits/{hid}/toggle")
async def toggle_habit(hid: str, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    habit = await db.habits.find_one({"_id": _oid(hid), "user_id": str(u["_id"])})
    if not habit: raise HTTPException(404, "Habit not found")
    today = date.today().isoformat()
    existing = await db.habit_logs.find_one({"habit_id": hid, "date": today})
    if existing and existing.get("completed"):
        await db.habit_logs.update_one({"_id": existing["_id"]}, {"$set": {"completed": False}})
        await db.habits.update_one({"_id": _oid(hid)}, {"$inc": {"total_completions": -1}})
        done = False
    else:
        if existing:
            await db.habit_logs.update_one({"_id": existing["_id"]}, {"$set": {"completed": True, "completed_at": datetime.utcnow()}})
        else:
            await db.habit_logs.insert_one({"habit_id": hid, "user_id": str(u["_id"]),
                                             "date": today, "completed": True, "completed_at": datetime.utcnow()})
        await db.habits.update_one({"_id": _oid(hid)}, {"$inc": {"total_completions": 1}})
        done = True
    streak = await _get_streak(db, hid)
    rate = await _completion_rate(db, hid, 30)
    return {"done_today": done, "streak": streak, "completion_rate": rate}

@router.get("/habits/{hid}/history")
async def habit_history(hid: str, days: int = 30, request: Request = None, u=Depends(_current_user)):
    db = request.app.state.db
    logs = await db.habit_logs.find({"habit_id": hid, "user_id": str(u["_id"])}).sort("date", -1).to_list(days)
    return [_fmt(l) for l in logs]

@router.get("/stats")
async def get_stats(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    uid = str(u["_id"])
    today = date.today().isoformat()
    habits = await db.habits.find({"user_id": uid, "archived": {"$ne": True}}).to_list(200)
    total = len(habits)
    done_today = 0
    for h in habits:
        log = await db.habit_logs.find_one({"habit_id": str(h["_id"]), "date": today, "completed": True})
        if log: done_today += 1
    # Weekly completion
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    week_logs = await db.habit_logs.count_documents({"user_id": uid, "date": {"$gte": week_ago}, "completed": True})
    possible = total * 7
    weekly_pct = round(week_logs / possible * 100) if possible else 0
    # Best streak across all habits
    best_streak = 0
    for h in habits:
        s = await _get_streak(db, str(h["_id"]))
        best_streak = max(best_streak, s)
    goals_count = await db.goals.count_documents({"user_id": uid, "status": "active"})
    return {
        "total_habits": total, "done_today": done_today, "weekly_completion": weekly_pct,
        "best_streak": best_streak, "goals_active": goals_count,
        "total_completions": u.get("total_completions", 0)
    }

async def _get_streak(db, habit_id: str) -> int:
    streak = 0
    check = date.today()
    for _ in range(365):
        log = await db.habit_logs.find_one({"habit_id": habit_id, "date": check.isoformat(), "completed": True})
        if log:
            streak += 1
            check -= timedelta(days=1)
        else:
            break
    return streak

async def _completion_rate(db, habit_id: str, days: int) -> int:
    start = (date.today() - timedelta(days=days)).isoformat()
    completed = await db.habit_logs.count_documents({"habit_id": habit_id, "date": {"$gte": start}, "completed": True})
    return round(completed / days * 100)
