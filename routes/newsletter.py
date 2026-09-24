# routes/newsletter.py
import time
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr
from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError
from db import db
from routes.auth import admin_required
from ratelimit import RateLimiter

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

SUBSCRIBE_LIMIT = RateLimiter(limit=5, window=10 * 60)  # signups per IP
MAX_SUBSCRIBERS = 50_000  # safety cap so bots can't fill the disk

class SubscribeInput(BaseModel):
    email: EmailStr
    website: str = ""  # honeypot: hidden in the form, only bots fill it

@router.post("/subscribe")
async def subscribe(data: SubscribeInput, request: Request):
    ip = SUBSCRIBE_LIMIT.check(request)
    SUBSCRIBE_LIMIT.hit(ip)
    if data.website:
        return {"message": "subscribed"}  # pretend success so bots don't adapt
    if await db.subscribers.estimated_document_count() >= MAX_SUBSCRIBERS:
        raise HTTPException(503, "Signups are closed for now")
    try:
        await db.subscribers.update_one(
            {"email": data.email.lower()},
            {"$setOnInsert": {"email": data.email.lower(), "created_at": int(time.time())}},
            upsert=True,
        )
    except DuplicateKeyError:
        pass  # concurrent duplicate: already subscribed
    return {"message": "subscribed"}

@router.get("/subscribers", dependencies=[Depends(admin_required)])
async def list_subscribers():
    subs = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(None)
    return subs
