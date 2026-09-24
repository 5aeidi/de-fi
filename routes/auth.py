# routes/auth.py
import os, secrets, time
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from db import db

router = APIRouter(prefix="/auth", tags=["auth"])
ADMIN_PW = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PW:
    raise RuntimeError("ADMIN_PASSWORD is not set (put it in backend/.env)")
# Sessions live in Mongo so they survive restarts; expiry slides forward on use.
SESSION_TTL = int(os.getenv("ADMIN_SESSION_DAYS", "30")) * 86400

class LoginInput(BaseModel):
    password: str

@router.post("/login")
async def login(data: LoginInput):
    if not secrets.compare_digest(data.password.encode(), ADMIN_PW.encode()):
        raise HTTPException(401, "wrong password")
    tok = secrets.token_hex(16)
    await db.sessions.insert_one({"token": tok, "exp": int(time.time()) + SESSION_TTL})
    return {"token": tok}

async def admin_required(authorization: str = Header("")):
    """Dependency for write routes: expects the login token in the Authorization header."""
    now = int(time.time())
    if not authorization:
        raise HTTPException(401, "re-login")
    res = await db.sessions.update_one(
        {"token": authorization, "exp": {"$gt": now}},
        {"$set": {"exp": now + SESSION_TTL}},
    )
    if res.matched_count == 0:
        await db.sessions.delete_many({"exp": {"$lte": now}})
        raise HTTPException(401, "re-login")
