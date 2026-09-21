from dotenv import load_dotenv
load_dotenv()  # must run before routes/db read the environment

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routes.location import router as location_router
from routes.track import router as track_router
from routes.blog import router as blog_router
from routes.auth import router as auth_router
from routes.about import router as about_router



import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from globals import get_upload_folder

# BASE_DIR = Path(__file__).resolve().parent    # .../backend
# print(BASE_DIR)

# UPLOAD_FOLDER = BASE_DIR / "uploads"
# print(UPLOAD_FOLDER)

# UPLOAD_FOLDER.mkdir(exist_ok=True)
upload_folder = get_upload_folder()
app = FastAPI()
app.mount("/uploads", StaticFiles(directory=upload_folder), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(location_router)
app.include_router(track_router)
app.include_router(blog_router)
app.include_router(auth_router)
app.include_router(about_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
