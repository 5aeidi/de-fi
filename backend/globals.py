from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent    # .../backend
print(BASE_DIR)

UPLOAD_FOLDER = BASE_DIR / "uploads"
print(UPLOAD_FOLDER)
def get_upload_folder():
    return UPLOAD_FOLDER