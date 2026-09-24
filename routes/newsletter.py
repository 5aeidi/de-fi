# routes/newsletter.py
import time
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from pymongo.errors import DuplicateKeyError
from db import db
from routes.auth import admin_required

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

class SubscribeInput(BaseModel):
    email: EmailStr

@router.post("/subscribe")
async def subscribe(data: SubscribeInput):
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
