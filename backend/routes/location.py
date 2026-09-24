from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.location import LocationModel, TrackInfo
from db import db
from routes.auth import admin_required
from bson import ObjectId

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=List[LocationModel])
async def get_locations():
    locations_cursor = db.locations.find({})
    locations = []
    async for loc in locations_cursor:
        # Convert _id to string
        loc["_id"] = str(loc["_id"])
        # Convert track _id to string if needed
        if "tracks" in loc:
            for t in loc["tracks"]:
                t["track_id"] = str(t["track_id"])
        locations.append(LocationModel(**loc))
    return locations

@router.get("/{location_id}", response_model=LocationModel)
async def get_location(location_id: str):
    loc = await db.locations.find_one({"_id": ObjectId(location_id)})
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")
    loc["_id"] = str(loc["_id"])
    if "tracks" in loc:
        for t in loc["tracks"]:
            t["track_id"] = str(t["track_id"])
    return LocationModel(**loc)

@router.post("/", response_model=LocationModel, response_model_by_alias=False, dependencies=[Depends(admin_required)])
async def create_location(location: LocationModel):
    new_loc = location.dict(by_alias=True)
    new_loc["_id"] = ObjectId()  # convert to ObjectId
    result = await db.locations.insert_one(new_loc)
    created_loc = await db.locations.find_one({"_id": result.inserted_id})
    created_loc["_id"] = str(created_loc["_id"])
    return LocationModel(**created_loc)

@router.post("/{location_id}/track", response_model=LocationModel, dependencies=[Depends(admin_required)])
async def add_track_to_location(location_id: str, track: TrackInfo):
    loc_obj_id = ObjectId(location_id)
    # Convert track_id to a new ObjectId so each track has a unique ID
    track_dict = track.dict()
    track_dict["track_id"] = ObjectId()
    
    updated = await db.locations.update_one(
        {"_id": loc_obj_id},
        {"$push": {"tracks": track_dict}}
    )
    if updated.modified_count == 0:
        raise HTTPException(status_code=404, detail="Location not found or track not added.")
    
    loc = await db.locations.find_one({"_id": loc_obj_id})
    loc["_id"] = str(loc["_id"])
    for t in loc["tracks"]:
        t["track_id"] = str(t["track_id"])
    return LocationModel(**loc)


@router.delete("/{location_id}", dependencies=[Depends(admin_required)])
async def delete_location(location_id: str):
    try:
        loc_obj_id = ObjectId(location_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Location not found.")
    # only delete when there are no tracks; the filter makes it atomic
    result = await db.locations.delete_one(
        {"_id": loc_obj_id, "$or": [{"tracks": {"$exists": False}}, {"tracks": {"$size": 0}}]}
    )
    if result.deleted_count == 0:
        if await db.locations.find_one({"_id": loc_obj_id}, {"_id": 1}):
            raise HTTPException(status_code=409, detail="Location still has tracks.")
        raise HTTPException(status_code=404, detail="Location not found.")
    return {"message": "location deleted"}
