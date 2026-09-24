from pydantic import BaseModel, Field

class TrackModel(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    hover_info: str
    file_path: str
    location_id: str
