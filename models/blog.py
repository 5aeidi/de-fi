from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class BlogPostBase(BaseModel):
    title: str
    slug: str                # e.g. "my-first-post"
    content: str             # markdown or HTML
    track_ids: List[str] = []  # list of track_id strings

class BlogPostCreate(BlogPostBase):
    pass

class BlogPostUpdate(BaseModel):
    title: Optional[str]
    slug: Optional[str]
    content: Optional[str]
    track_ids: Optional[List[str]]

class BlogPost(BlogPostBase):
    post_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
