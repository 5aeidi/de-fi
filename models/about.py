# models/about.py
from pydantic import BaseModel
class About(BaseModel):
    html: str
