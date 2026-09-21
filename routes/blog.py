from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import datetime
from bson import ObjectId
from db import db
from routes.auth import admin_required
from models.blog import BlogPost, BlogPostCreate, BlogPostUpdate

router = APIRouter(prefix="/posts", tags=["blog"])

@router.post("/", response_model=BlogPost, dependencies=[Depends(admin_required)])
async def create_post(post: BlogPostCreate):
    now = datetime.utcnow()
    doc = post.dict()
    doc.update({
        "post_id": str(ObjectId()),
        "created_at": now,
        "updated_at": now,
    })
    await db.posts.insert_one(doc)
    return doc

@router.get("/", response_model=list[BlogPost])
async def list_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50)
):
    cursor = (
        db.posts.find()
        .sort("created_at", -1)        # newest first
        .skip(skip)
        .limit(limit)
    )
    return [BlogPost(**p) async for p in cursor]

@router.get("/{post_id}", response_model=BlogPost)
async def get_post(post_id: str):
    p = await db.posts.find_one({"post_id": post_id})
    if not p:
        raise HTTPException(404, "Post not found")
    return BlogPost(**p)

@router.put("/{post_id}", response_model=BlogPost, dependencies=[Depends(admin_required)])
async def update_post(post_id: str, upd: BlogPostUpdate):
    changes = {f: v for f, v in upd.dict().items() if v is not None}
    if not changes:
        raise HTTPException(400, "No changes supplied")
    changes["updated_at"] = datetime.utcnow()
    res = await db.posts.update_one(
        {"post_id": post_id},
        {"$set": changes}
    )
    if res.modified_count == 0:
        raise HTTPException(404, "Post not found")
    p = await db.posts.find_one({"post_id": post_id})
    return BlogPost(**p)

@router.delete("/{post_id}", dependencies=[Depends(admin_required)])
async def delete_post(post_id: str):
    res = await db.posts.delete_one({"post_id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"message": "Deleted"}
