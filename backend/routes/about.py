# routes/about.py
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from db import db
from models.about import About
from routes.auth import admin_required   # the auth helper you made earlier

router = APIRouter(prefix="/about", tags=["about"])

# a single doc with _id="about"
ABOUT_ID = ObjectId("0000000000000000000abcd1")

@router.get("/", response_model=About)
async def get_about():
    doc = await db.misc.find_one({"_id": ABOUT_ID})
    return {"html": doc["html"] if doc else "<p>About page not set yet.</p>"}

@router.put("/", dependencies=[Depends(admin_required)])
async def set_about(payload: About):
    await db.misc.update_one(
        {"_id": ABOUT_ID},
        {"$set": {"html": payload.html}},
        upsert=True,
    )
    return {"message": "saved"}
