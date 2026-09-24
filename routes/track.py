# backend/routes/track.py
import os, re, uuid, json
from typing import Optional
from io import BytesIO
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from PIL import Image             # pip install pillow
from bson import ObjectId
from db import db                 # your motor client
from routes.auth import admin_required

router = APIRouter(prefix="/tracks", tags=["tracks"])

AUDIO_DIR = "uploads"
ART_DIR   = "uploads/art"          # keep artwork separate
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(ART_DIR,  exist_ok=True)

LINK_PLATFORMS = ("bandcamp", "spotify", "soundcloud", "youtube")

def parse_tags(raw: str) -> list[str]:
    """JSON array string -> trimmed, case-insensitively de-duplicated tags."""
    try:
        items = json.loads(raw)
    except ValueError:
        items = raw.split(",")
    if not isinstance(items, list):
        raise HTTPException(400, "tags must be a list")
    seen, out = set(), []
    # "#a #b" inside one item is several tags
    items = [p for t in items for p in (re.split(r"[#\s]+", str(t)) if "#" in str(t) else [str(t)])]
    for t in items:
        t = t.strip()
        if t and t.lower() not in seen:
            seen.add(t.lower())
            out.append(t[:50])
    return out

def check_link(url: str) -> str:
    url = url.strip()
    if url and not url.lower().startswith(("http://", "https://")):
        raise HTTPException(400, f"Link must start with http:// or https://: {url}")
    return url

@router.get("/tags")
async def list_tags():
    pipeline = [
        {"$unwind": "$tracks"},
        {"$unwind": "$tracks.tags"},
        {"$group": {"_id": "$tracks.tags"}},
    ]
    tags = [d["_id"] async for d in db.locations.aggregate(pipeline) if isinstance(d["_id"], str)]
    return sorted(tags, key=str.lower)

@router.post("/upload", dependencies=[Depends(admin_required)])
async def upload_track(
    file: UploadFile = File(...),
    title: str = Form(...),
    artist: str = Form(...),
    year: int = Form(...),
    location_id: str = Form(...),
    hover_info: str | None = Form(None),
    info: str | None = Form(None),
    tags: str | None = Form(None),
    bandcamp: str | None = Form(None),
    spotify: str | None = Form(None),
    soundcloud: str | None = Form(None),
    youtube: str | None = Form(None),
    image: UploadFile | None = File(None)
):
    # ---------- save MP3 ----------
    audio_path = os.path.join(AUDIO_DIR, file.filename)
    with open(audio_path, "wb") as out:
        out.write(await file.read())

    # ---------- optional artwork ----------
    art_path = None
    if image:
        try:
            img_bytes = await image.read()
            img = Image.open(BytesIO(img_bytes)).convert("RGB")
            img = img.resize((300, 300), Image.LANCZOS)
            art_path = os.path.join(ART_DIR, image.filename)
            img.save(art_path, format="JPEG", quality=85)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Bad image: {e}")

    # ---------- push into Mongo ----------
    track_doc = {
        "track_id": str(ObjectId()),
        "title": title,
        "artist": artist,
        "year": year,
        "hover_info": hover_info,
        "info": info,
        "file_path": f"/{audio_path}",
        "image_path": f"/{art_path}" if art_path else None,
        "tags": parse_tags(tags) if tags else [],
        "links": {p: check_link(u) for p, u in zip(LINK_PLATFORMS, (bandcamp, spotify, soundcloud, youtube)) if u and u.strip()},
    }

    result = await db.locations.update_one(
        {"_id": ObjectId(location_id)},
        {"$push": {"tracks": track_doc}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Location not found.")

    return {"message": "Track uploaded", "track": track_doc}

# ---------- UPDATE track ----------
@router.put("/locations/{loc_id}/track/{track_id}", dependencies=[Depends(admin_required)])
async def update_track(
    loc_id: str,
    track_id: str,
    title: str | None = Form(None),
    artist: str | None = Form(None),
    year:  int | None = Form(None),
    hover_info: str | None = Form(None),
    info: str | None = Form(None),
    file: UploadFile | None = File(None),
    tags: str | None = Form(None),
    bandcamp: str | None = Form(None),
    spotify: str | None = Form(None),
    soundcloud: str | None = Form(None),
    youtube: str | None = Form(None),
    image: UploadFile | None = File(None)
):
    loc_oid  = ObjectId(loc_id)

    # build update dict
    changes = {}
    if title      is not None: changes["tracks.$.title"]       = title
    if artist     is not None: changes["tracks.$.artist"]      = artist
    if year is not None:        changes["tracks.$.year"]       = year
    if hover_info is not None:  changes["tracks.$.hover_info"] = hover_info
    if info       is not None:  changes["tracks.$.info"] = info
    if tags       is not None:  changes["tracks.$.tags"] = parse_tags(tags)
    # links: a sent empty string removes that platform's link
    for plat, url in zip(LINK_PLATFORMS, (bandcamp, spotify, soundcloud, youtube)):
        if url is not None:
            url = check_link(url)
            changes[f"tracks.$.links.{plat}"] = url
    # optional new audio file
    if file:
        audio_fn   = f"{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
        audio_path = os.path.join(AUDIO_DIR, audio_fn)
        with open(audio_path, "wb") as f_out:
            f_out.write(await file.read())
        changes["tracks.$.file_path"] = f"/{audio_path}"

    # optional new artwork
    if image:
        img_bytes = await image.read()
        img = Image.open(BytesIO(img_bytes)).convert("RGB").resize((300, 300))
        art_fn   = f"{uuid.uuid4().hex}.jpg"
        art_path = os.path.join(ART_DIR, art_fn)
        img.save(art_path, "JPEG", quality=85)
        changes["tracks.$.image_path"] = f"/{art_path}"

    if not changes:
        raise HTTPException(status_code=400, detail="No changes supplied")

    unset = {k: "" for k, v in changes.items() if k.startswith("tracks.$.links.") and v == ""}
    for k in unset:
        del changes[k]
    if not changes and not unset:
        raise HTTPException(status_code=400, detail="No changes supplied")
    # older tracks may lack a links object (or have it null); give them one first
    if any(k.startswith("tracks.$.links.") for k in changes):
        await db.locations.update_one(
            {"_id": loc_oid, "tracks": {"$elemMatch": {"track_id": track_id, "links": {"$not": {"$type": "object"}}}}},
            {"$set": {"tracks.$.links": {}}},
        )
    update = {}
    if changes: update["$set"] = changes
    if unset:   update["$unset"] = unset
    res = await db.locations.update_one(
        {"_id": loc_oid, "tracks.track_id": track_id},
        update
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")

    return {"message": "Track updated", "changes": changes}

# ---------- DELETE track ----------
# routes/track.py  (replace the delete_track function)

@router.delete("/locations/{loc_id}/track/{track_id}", dependencies=[Depends(admin_required)])
async def delete_track(loc_id: str, track_id: str):
    loc_oid = ObjectId(loc_id)

    # 1) pull the track out
    res = await db.locations.update_one(
        {"_id": loc_oid},
        {"$pull": {"tracks": {"track_id": track_id}}}
    )
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")

    # 2) see how many tracks remain
    loc = await db.locations.find_one({"_id": loc_oid}, {"tracks": 1})
    if loc and not loc["tracks"]:                      # list is empty
        await db.locations.delete_one({"_id": loc_oid})
        return {"message": "Last track removed — location deleted"}

    return {"message": "Track deleted"}
