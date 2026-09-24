from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class TrackInfo(BaseModel):
    track_id: str
    title: str
    artist: Optional[str] = None   # ← optional for existing docs
    year:   Optional[int] = None
    hover_info: Optional[str] = None
    info: Optional[str] = None
    file_path: str
    image_path: Optional[str] = None
    tags: List[str] = []            # optional: absent on older tracks
    links: Dict[str, str] = {}      # platform -> URL, optional

class LocationModel(BaseModel):
    id: Optional[str] = Field(default='str', alias="_id")
    name: str
    latitude: float
    longitude: float
    tracks: Optional[List[TrackInfo]] = []
    class Config:            # 👈
        allow_population_by_field_name = True