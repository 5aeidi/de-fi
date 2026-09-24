import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set (put it in backend/.env)")

client = AsyncIOMotorClient(MONGO_URI)
db = client["radio"]  # use your own DB name
