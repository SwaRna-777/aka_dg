from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
import jwt, os

router = APIRouter(tags=["Goals"])
security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "habitai-secret-change-me")

def _oid(s):
    try: return ObjectId(s)
    except: raise HTTPException(404, "Invalid ID")

def _fmt(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

async def _current_user(request: Request, creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        uid = payload["sub"]
    except:
        raise HTTPException(401, "Invalid token")
    user = await request.app.state.db.users.find_one({"_id": _oid(uid)})
    if not user: raise HTTPException(401, "User not found")
    return user

class GoalCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "personal"
    target_date: str
    emoji: str = "🎯"

class GoalUpdate(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None
    title: Optional[str] = None

@router.get("/goals")
async def get_goals(request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    docs = await db.goals.find({"user_id": str(u["_id"])}).sort("created_at", -1).to_list(100)
    return [_fmt(d) for d in docs]

@router.post("/goals", status_code=201)
async def create_goal(data: GoalCreate, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    doc = {**data.dict(), "user_id": str(u["_id"]), "progress": 0, "status": "active", "created_at": datetime.utcnow()}
    res = await db.goals.insert_one(doc)
    doc["id"] = str(res.inserted_id); doc.pop("_id", None)
    return doc

@router.put("/goals/{gid}")
async def update_goal(gid: str, data: GoalUpdate, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    patch = {k:v for k,v in data.dict().items() if v is not None}
    if not patch: raise HTTPException(400, "Nothing to update")
    updated = await db.goals.find_one_and_update(
        {"_id": _oid(gid), "user_id": str(u["_id"])},
        {"$set": patch}, return_document=True)
    if not updated: raise HTTPException(404, "Goal not found")
    return _fmt(updated)

@router.delete("/goals/{gid}")
async def delete_goal(gid: str, request: Request, u=Depends(_current_user)):
    db = request.app.state.db
    r = await db.goals.delete_one({"_id": _oid(gid), "user_id": str(u["_id"])})
    if r.deleted_count == 0: raise HTTPException(404, "Goal not found")
    return {"success": True}
