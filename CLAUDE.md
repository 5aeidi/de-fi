# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"Radio on map": a map of locations, each with a list of music tracks that play in a site-wide audio player, plus a blog and an About page, all managed from an admin UI. The top-level directory is the single git repo (`github.com/5aeidi/de-fi`, branch `main`), containing `backend/` and `frontend/`. Licensed AGPL-3.0.

- `backend/`: FastAPI plus Motor (async MongoDB), served by uvicorn on port 8000.
- `frontend/`: Create React App (react-scripts 5), React 18, react-router v6, MapLibre through `react-map-gl/maplibre`.

There are no tests, linters or formatters configured in either project. `npm run build` is the quickest compile check for the frontend.

## Commands

Backend (the venv is `backend/env/`; run from `backend/`, because imports such as `from db import db` and the `uploads/` paths are relative to it):
```bash
cd backend && source env/bin/activate
pip install -r requirements.txt
python main.py                    # uvicorn main:app on 0.0.0.0:8000 with reload
```
`main.py` loads `backend/.env` (python-dotenv) before importing routes. `MONGO_URI` and `ADMIN_PASSWORD` are required, and the app refuses to start without them. See `backend/.env.example`.

Frontend:
```bash
cd frontend
npm start        # dev server on :3000, talks to http://localhost:8000 (.env.development)
npm run build    # production build into build/
```

## Architecture

### Data model (MongoDB database `radio`)
- `locations`: each document is `{name, latitude, longitude, tracks: [...]}`. **Tracks are embedded in their location document; there is no tracks collection** (`models/track.py` is unused). Each embedded track has its own string `track_id`, and track routes address it through `tracks.$` positional updates. Deleting a location's last track also deletes the location.
- `posts`: blog posts, looked up by a string `post_id` field rather than `_id`. `track_ids` links a post to tracks.
- `misc`: holds the single About page document (a fixed ObjectId in `routes/about.py`) containing raw HTML.

Uploaded audio goes to `backend/uploads/` and artwork, resized to 300x300 JPEG, to `backend/uploads/art/`. Both are served as static files at `/uploads`, and the stored `file_path`/`image_path` values are URL paths like `/uploads/...`.

Mixed ObjectId and string IDs are a recurring hazard. The `/locations` routes stringify `_id` and `track_id` by hand. `POST /locations/{id}/track` stores `track_id` as an ObjectId, while `/tracks/upload` stores a string, and the update and delete routes match on the string.

### Auth
`POST /auth/login` checks the password against `ADMIN_PASSWORD` and returns a random token stored in the Mongo `sessions` collection (sliding 30-day expiry, `ADMIN_SESSION_DAYS`; failed logins rate-limited). Every write route declares `dependencies=[Depends(admin_required)]`, which reads the raw token from the `Authorization` header; add the same dependency to any new write route. The frontend keeps the token in `localStorage["admTok"]`. All admin writes go through `authFetch` in `src/api.js`, which attaches the token and sends the user back to `/admin` on a 401.

### Frontend wiring
- The API base URL is `API_BASE_URL` in `src/api.js`, taken from `REACT_APP_API`: `.env.development` points at localhost:8000 and `.env.production` at `https://de-fi.media/api`. Import it rather than hardcoding URLs. Audio and art URLs are `${API_BASE_URL}${file_path}`. The backend's CORS allows only `http://localhost:3000`, and production presumably sits behind a reverse proxy that strips `/api`.
- `PlayerManager` is mounted outside the `<Router>` in `App.jsx` and owns the global `<Audio>` player. It exports a mutable module-level function `activateTrack(trackId)` that other modules call to start playback.
- Components talk through window events rather than shared state:
  - `tracklocationchange` (detail = location id or null): the player tells `MapPage` which marker to highlight.
  - `adminlogin` (plus `storage`): tells `Header` to show admin links.
- Blog post HTML can embed `<a class="play-track" data-track="<track_id>">`. `BlogPostPage` delegates clicks on these to `activateTrack`.
- `/admin` shows a login form, then tabs: `TracksPanel` (map picker to create locations, upload/edit/delete tracks), `BlogPanel` and `AboutPanel`.
- The map style is `public/toner.json`, a custom dark MapLibre style that uses MapTiler vector tiles and local VT323 glyphs under `public/fonts/`. The MapTiler key is **not** in the style: `src/mapStyle.js` appends `REACT_APP_MAPTILER_KEY` (from the gitignored `.env.local`) through `transformRequest`, so every `<Map>` needs `mapStyle={MAP_STYLE} transformRequest={transformRequest}`.
