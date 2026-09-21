# routes/auth.py
import os, secrets, time
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])
ADMIN_PW = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PW:
    raise RuntimeError("ADMIN_PASSWORD is not set (put it in backend/.env)")
TOKENS   = {}  # token:str → exp_ts:int
class LoginInput(BaseModel):
    password: str

@router.post("/login")
async def login(data: LoginInput):
    if not secrets.compare_digest(data.password.encode(), ADMIN_PW.encode()):
        raise HTTPException(401, "wrong password")
    tok = secrets.token_hex(16)
    TOKENS[tok] = int(time.time()) + 3600  # 1-h token
    return {"token": tok}

def admin_required(authorization: str = Header("")):
    """Dependency for write routes: expects the login token in the Authorization header."""
    if TOKENS.get(authorization, 0) < time.time():
        TOKENS.pop(authorization, None)
        raise HTTPException(401, "re-login")
