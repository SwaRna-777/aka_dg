"""
HabitAI — FastAPI Backend
AI-powered habit tracking with OpenAI integration
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os, jwt, bcrypt
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

from routers import habits, goals, ai as ai_router

# ── Startup / shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create indexes on startup
    try:
        await db.users.create_index("email", unique=True)
        await db.habits.create_index([("user_id", 1), ("created_at", -1)])
        await db.goals.create_index([("user_id", 1)])
        await db.habit_logs.create_index([("habit_id", 1), ("date", -1)])
    except Exception:
        pass
    yield

app = FastAPI(title="HabitAI API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME    = os.environ.get("DB_NAME", "habitai")
JWT_SECRET = os.environ.get("JWT_SECRET", "habitai-secret-change-me")
JWT_ALG    = "HS256"

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ── Auth helpers (shared across routers via app.state) ────────────────────────
security = HTTPBearer()

def make_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": datetime.utcnow() + timedelta(days=30)},
        JWT_SECRET, algorithm=JWT_ALG
    )

def oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except (InvalidId, Exception):
        raise HTTPException(404, "Invalid ID")

def fmt(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def fmtl(docs) -> list:
    return [fmt(d) for d in docs]

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"_id": oid(uid)})
    if not user:
        raise HTTPException(401, "User not found")
    return user

# Store helpers on app state so routers can access them
app.state.db = db
app.state.make_token = make_token
app.state.oid = oid
app.state.fmt = fmt
app.state.fmtl = fmtl
app.state.get_current_user = get_current_user

# ── Auth Routes ───────────────────────────────────────────────────────────────
from pydantic import BaseModel
from typing import Optional

class RegisterReq(BaseModel):
    name: str
    email: str
    password: str

class LoginReq(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
async def register(data: RegisterReq):
    if await db.users.find_one({"email": data.email.lower()}):
        raise HTTPException(400, "Email already registered")
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())
    res = await db.users.insert_one({
        "name": data.name,
        "email": data.email.lower(),
        "password": hashed,
        "created_at": datetime.utcnow(),
        "streak": 0,
        "total_completions": 0
    })
    uid = str(res.inserted_id)
    return {"token": make_token(uid), "user": {"id": uid, "name": data.name, "email": data.email.lower()}}

@app.post("/api/auth/login")
async def login(data: LoginReq):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not bcrypt.checkpw(data.password.encode(), user["password"]):
        raise HTTPException(401, "Invalid credentials")
    uid = str(user["_id"])
    return {"token": make_token(uid), "user": {"id": uid, "name": user["name"], "email": user["email"]}}

@app.get("/api/auth/me")
async def me(u=Depends(get_current_user)):
    return {"id": str(u["_id"]), "name": u["name"], "email": u["email"],
            "streak": u.get("streak", 0), "total_completions": u.get("total_completions", 0)}

# ── Include Routers ───────────────────────────────────────────────────────────
app.include_router(habits.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(ai_router.router, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "HabitAI", "version": "2.0.0"}

@app.get("/")
async def root():
    return {"message": "HabitAI API v2.0", "docs": "/docs"}
