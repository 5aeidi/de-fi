# DE:FI

Live at **[de-fi.media](https://de-fi.media)**.

## Structure

| Folder | Stack |
|---|---|
| [`backend/`](backend) | FastAPI · Motor (async MongoDB) · uvicorn |
| [`frontend/`](frontend) | React 18 · react-router · MapLibre (`react-map-gl`) · Create React App |

## Features

- World map with location pins; each location holds a list of tracks
- Persistent site-wide audio player with artwork, tags and streaming-link icons
- Blog posts that can play tracks inline, plus an editable About page
- Admin panel: search or click the map to place locations; upload tracks with artwork, tags and links; manage posts
- Newsletter signup (rate-limited, with a honeypot field)

## Running locally

```bash
# backend (needs MongoDB)
cd backend
python -m venv env && source env/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set MONGO_URI and ADMIN_PASSWORD
python main.py              # http://localhost:8000

# frontend
cd frontend
npm install
echo "REACT_APP_MAPTILER_KEY=your_key" > .env.local
npm start                   # http://localhost:3000
```

## License

[GNU AGPL v3](LICENSE)

Map data © OpenStreetMap contributors, tiles by MapTiler.
