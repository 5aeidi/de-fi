import { getLocations, createLocation, uploadTrack, authFetch, getTags } from "./api";
import TagInput from "./TagInput";
import React, { useState, useEffect, useRef } from "react";
import {
  Map,
  Marker,
  NavigationControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, transformRequest, MAPTILER_KEY } from "./mapStyle";
import "./Admin.css";

const LINK_PLATFORMS = [
  ["bandcamp", "Bandcamp"],
  ["spotify", "Spotify"],
  ["soundcloud", "SoundCloud"],
  ["youtube", "YouTube"],
];
export default function TracksPanel({ token }) {
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [currentLoc, setCurrentLoc] = useState(null);

  /* create-form */
  const [locName, setLocName] = useState("");
  const [createLat, setCreateLat] = useState("");
  const [createLng, setCreateLng] = useState("");

  /* upload-form */
  const [trackTitle, setTrackTitle] = useState("");
  const [hoverInfo, setHoverInfo] = useState("");
  const [artist, setArtist] = useState("");
  const [year,   setYear]   = useState("");
  const [infoTxt, setInfoTxt] = useState("");   // optional

  const [file, setFile] = useState(null);
  const [artFile, setArtFile] = useState(null);   // artwork image (optional)
  const [tags, setTags] = useState([]);
  const [links, setLinks] = useState({});         // platform -> url (optional)
  const [allTags, setAllTags] = useState([]);
  const [editTags, setEditTags] = useState([]);

  /* location search (MapTiler geocoding) */
  const mapRef = useRef(null);
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState([]);
  const [locFilter, setLocFilter] = useState("");
  const [editingTrack, setEditingTrack] = useState(null);   // holds track being edited
  const listRef  = useRef(null);   // track list
  const editRef  = useRef(null);   // edit form
  const isMobile = window.matchMedia("(max-width:600px)").matches;
    const [locations, setLocations] = useState([]);

      
    /* create new location */
    const handleCreateLocation = async () => {
      if (!locName || !createLat || !createLng) {
        return alert("Fill name / lat / lng");
      }
      const newLoc = {
        name: locName,
        latitude: +createLat,
        longitude: +createLng,
      };
      const created = await createLocation(newLoc);
      const norm = { ...created, id: String(created.id || created._id) };
      setLocations((prev) => [...prev, norm]);
      setSelectedLocationId(norm.id);
      setLocName("");
      setCreateLat("");
      setCreateLng("");
    };
  
    /* upload track */
    const handleUpload = async () => {
      if (!selectedLocationId) return alert("Select a location first");
      if (!file) return alert("Choose an MP3 file");
      const form = new FormData();
      form.append("file", file);
      form.append("title", trackTitle);
      form.append("location_id", selectedLocationId);
      form.append("artist", artist);
      form.append("year", year);
      if (hoverInfo) form.append("hover_info", hoverInfo);
      if (infoTxt)   form.append("info", infoTxt);
      if (artFile) form.append("image", artFile);
      if (tags.length) form.append("tags", JSON.stringify(tags));
      LINK_PLATFORMS.forEach(([p]) => {
        if (links[p]?.trim()) form.append(p, links[p].trim());
      });

      let res;
      try {
        res = await uploadTrack(form);
      } catch (e) {
        return alert(e.message);
      }
      /* show the new track in the list without a reload */
      setLocations((prev) =>
        prev.map((l) =>
          l.id === selectedLocationId ? { ...l, tracks: [...(l.tracks || []), res.track] } : l
        )
      );
      getTags().then(setAllTags);
      setTrackTitle("");
      setHoverInfo("");
      setFile(null);
      setTags([]);
      setLinks({});
      alert("Uploaded");
    };
  
    /* pick coords by clicking on map */
    const handleMapClick = (e) => {
      const { lat, lng } = e.lngLat;
      setCreateLat(lat.toFixed(6));
      setCreateLng(lng.toFixed(6));
    };
  /* ... copy the rest of your track upload / location create code ... */

  /* Helper that always adds Authorization header */
//   const authFetch = (url, opts={}) =>
//     fetch(url, { ...opts, headers:{ ...opts.headers, Authorization: token }});

useEffect(() => {
    console.log(selectedLocationId);
    setCurrentLoc(locations.find(l => l.id === selectedLocationId) || null);
  }, [selectedLocationId, locations]);
  /* Use authFetch inside uploadTrack / createLocation etc. */
  useEffect(() => {
    if (selectedLocationId && listRef.current) {
      listRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedLocationId]);

  /* when edit form opens – scroll to it */
  useEffect(() => {
    if (editingTrack && editRef.current) {
      editRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [editingTrack]);
useEffect(() => { getTags().then(setAllTags); }, []);

/* debounced place search */
useEffect(() => {
  const q = geoQuery.trim();
  if (q.length < 2 || !MAPTILER_KEY) { setGeoResults([]); return; }
  const ctrl = new AbortController();
  const t = setTimeout(async () => {
    try {
      const r = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${MAPTILER_KEY}&limit=8`,
        { signal: ctrl.signal }
      );
      const data = await r.json();
      setGeoResults(data.features || []);
    } catch {}
  }, 400);
  return () => { clearTimeout(t); ctrl.abort(); };
}, [geoQuery]);

const pickPlace = (f) => {
  const [lng, lat] = f.center;
  setLocName(f.text || f.place_name);
  setCreateLat(lat.toFixed(6));
  setCreateLng(lng.toFixed(6));
  setGeoResults([]);
  setGeoQuery(f.place_name);
  mapRef.current?.flyTo({ center: [lng, lat], zoom: 9 });
};

useEffect(() => {
  if (editingTrack) setEditTags(editingTrack.tags || []);
}, [editingTrack]);

useEffect(() => {
  (async () => {
    const data = await getLocations();
    setLocations(
      data.map((l) => ({ ...l, id: String(l.id || l._id) }))
    );
  })();
}, []);


  return (
    <div style={{ padding: 0, color: "#fff" }}>
      <h2>Uploads</h2>

      {/* ----- Upload track ----- */}
{/* ----- Upload track ----- */}



      {/* ----- Create location ----- */}
      <fieldset style={{ padding: 16 }}>
        <legend>Create location</legend>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Name"
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
          />
          <input
            placeholder="Latitude"
            value={createLat}
            onChange={(e) => setCreateLat(e.target.value)}
          />
          <input
            placeholder="Longitude"
            value={createLng}
            onChange={(e) => setCreateLng(e.target.value)}
          />
          <button onClick={handleCreateLocation}>Create</button>
        </div>

        <div style={{ marginTop: 8 }}>
          <input
            placeholder="Search a city or place (e.g. Tehran)"
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          {geoResults.length > 0 && (
            <ul className="geo-results">
              {geoResults.map((f) => (
                <li key={f.id} onClick={() => pickPlace(f)}>{f.place_name}</li>
              ))}
            </ul>
          )}
        </div>

        <p style={{ fontSize: 14, marginTop: 8 }}>Or click on the map:</p>

        {/* Same MapLibre map as MapPage, but shorter height */}
        <Map
          ref={mapRef}
          initialViewState={{ latitude: 0, longitude: 0, zoom: 1.5 }}
          style={{ height: 240, width: "100%", border: "1px solid #fff" }}
          mapStyle={MAP_STYLE}
          transformRequest={transformRequest}
          onClick={handleMapClick}
        // onClick={() => setSelectedLocationId(null)} 

        >
          <NavigationControl position={isMobile ? "bottom-left" : "top-left"} />

          {createLat && createLng && !isNaN(+createLat) && !isNaN(+createLng) && (
            <Marker latitude={+createLat} longitude={+createLng} anchor="center">
              <div style={{ width: 10, height: 10, border: "2px solid #0ff", boxSizing: "border-box" }} />
            </Marker>
          )}
          {locations.map((loc) => (
            <Marker
                key={loc.id}
              latitude={Number(loc.latitude)}
              longitude={Number(loc.longitude)}
                anchor="bottom"
                onClick={() => setSelectedLocationId(loc.id)}

            >
                <div
                style={{
                    width: "14px",          // size of the square
                    height: "14px",
                  background: loc.id === selectedLocationId ? "#ffff00" : "#ff0000",
                    
                  border: loc.id === selectedLocationId ? "1px solid #111" :"2px solid #fff",
                  boxSizing: "border-box",
                    cursor: "pointer",
                }}

                />
            </Marker>
            ))}


        </Map>
      </fieldset>
      
      {/* Track list for selected location */}
{selectedLocationId && (
  <fieldset ref={listRef} style={{ padding: 16, marginTop: 24 }}>
    <legend>Tracks in this location</legend>

    {locations
      .find((l) => l.id === selectedLocationId)
      ?.tracks.map((t) => (
        <div
          key={t.track_id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 6,
            borderBottom: "1px solid #444",
          }}
        >
          <span style={{ flexGrow: 1 }}>{t.title}</span>

          {/* Edit button */}
          <button
            style={{ cursor: "pointer" }}
            onClick={() => setEditingTrack(t)}
          >
            MOD
          </button>

          {/* Delete button */}
          <button
            style={{ cursor: "pointer" }}
            onClick={async () => {
              if (!window.confirm("Delete this track?")) return;

              const res  = await authFetch(
                `/tracks/locations/${selectedLocationId}/track/${t.track_id}`,
                { method: "DELETE" }
              );
              const json = await res.json();

              if (json.message?.includes("location deleted")) {
                /* backend removed the whole location */
                setLocations((prev) => prev.filter((l) => l.id !== selectedLocationId));
                setSelectedLocationId("");              // nothing selected
              } else {
                /* only the single track was removed */
                setLocations((prev) =>
                  prev.map((loc) =>
                    loc.id === selectedLocationId
                      ? {
                          ...loc,
                          tracks: loc.tracks.filter(
                            (x) => x.track_id !== t.track_id
                          ),
                        }
                      : loc
                  )
                );
              }
            }}
          >
            DEL
          </button>

        </div>
      ))}
  </fieldset>
)}
<fieldset style={{ padding: 16, marginTop: 24 }}>
  <legend>Upload track</legend>

  {/* Location dropdown */}
  <input
    placeholder="Filter locations…"
    value={locFilter}
    onChange={(e) => setLocFilter(e.target.value)}
    style={{ marginBottom: 4 }}
  />
  <label style={{ display: "block", marginBottom: 8 }}>
    Location:&nbsp;
    <select
      value={selectedLocationId}
      onChange={(e) => setSelectedLocationId(e.target.value)}
    >
      <option value="">choose a location</option>
      {locations
        .filter((l) => l.id === selectedLocationId || l.name.toLowerCase().includes(locFilter.trim().toLowerCase()))
        .map((l) => (
        <option key={l.id} value={l.id}>
          {l.name} ({l.latitude.toFixed(2)}, {l.longitude.toFixed(2)})
        </option>
      ))}
    </select>
    {currentLoc && !(currentLoc.tracks || []).length && (
      <button
        style={{ marginLeft: 8, cursor: "pointer" }}
        onClick={async () => {
          if (!window.confirm(`Delete empty location "${currentLoc.name}"?`)) return;
          const res = await authFetch(`/locations/${currentLoc.id}`, { method: "DELETE" });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            return alert(j.detail || "Could not delete location");
          }
          setLocations((prev) => prev.filter((l) => l.id !== currentLoc.id));
          setSelectedLocationId("");
        }}
      >
        Delete location
      </button>
    )}
  </label>

  {/* Text inputs */}
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label>
      Title:<br />
      <input
        placeholder="Track title"
        value={trackTitle}
        onChange={(e) => setTrackTitle(e.target.value)}
        disabled={!selectedLocationId}
      />
    </label>
    <label>
      Artist:<br />
      <input
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        disabled={!selectedLocationId}
      />
    </label>

    <label>
      Year:<br />
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        disabled={!selectedLocationId}
      />
    </label>

    <label>
      Extra info (optional):<br />
      <input
        value={infoTxt}
        onChange={(e) => setInfoTxt(e.target.value)}
        disabled={!selectedLocationId}
      />
    </label>

    <label>
      Hover info:<br />
      <input
        placeholder="Hover text"
        value={hoverInfo}
        onChange={(e) => setHoverInfo(e.target.value)}
        disabled={!selectedLocationId}
      />
    </label>

    <label>
      Tags:<br />
      <TagInput value={tags} onChange={setTags} allTags={allTags} disabled={!selectedLocationId} />
    </label>

    {LINK_PLATFORMS.map(([p, label]) => (
      <label key={p}>
        {label} link (optional):<br />
        <input
          type="url"
          placeholder="https://…"
          value={links[p] || ""}
          onChange={(e) => setLinks((prev) => ({ ...prev, [p]: e.target.value }))}
          disabled={!selectedLocationId}
        />
      </label>
    ))}

    {/* MP3 upload */}
    <label>
      Audio file (MP3):<br />
      <input
        type="file"
        accept=".mp3"
        onChange={(e) => setFile(e.target.files[0] || null)}
        disabled={!selectedLocationId}
      />
    </label>

    {/* Artwork upload */}
    <label>
      Artwork image&nbsp;<span style={{ fontSize: 12 }}>(optional, will be resized to 300 × 300)</span>:<br />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setArtFile(e.target.files[0] || null)}
        disabled={!selectedLocationId}
      />
    </label>

    <button onClick={handleUpload} disabled={!selectedLocationId}>
      Upload
    </button>
  </div>
</fieldset>

{editingTrack && (
  <fieldset key={editingTrack.track_id} ref={editRef} style={{ padding: 16, marginTop: 24 }}>
    <legend>Edit track</legend>

    {/* title */}
    <input
      id="edt-title"
      placeholder="Title"
      defaultValue={editingTrack.title}
    /><br />

    {/* artist */}
    <input
      id="edt-artist"
      placeholder="Artist"
      defaultValue={editingTrack.artist}
    /><br />

    {/* year */}
    <input
      id="edt-year"
      type="number"
      placeholder="Year"
      defaultValue={editingTrack.year}
    /><br />

    {/* hover / extra info */}
    <input
      id="edt-hover"
      placeholder="Hover info (optional)"
      defaultValue={editingTrack.hover_info || ""}
    /><br />
    <input
      id="edt-info"
      placeholder="Extra info (optional)"
      defaultValue={editingTrack.info || ""}
    /><br />

    {/* tags */}
    <div style={{ margin: "6px 0" }}>
      Tags:
      <TagInput value={editTags} onChange={setEditTags} allTags={allTags} />
    </div>

    {/* streaming links: clear a field to remove that link */}
    {LINK_PLATFORMS.map(([p, label]) => (
      <React.Fragment key={p}>
        <input
          id={`edt-link-${p}`}
          type="url"
          placeholder={`${label} link (optional)`}
          defaultValue={editingTrack.links?.[p] || ""}
        /><br />
      </React.Fragment>
    ))}

    {/* replace files */}
    <label>
      Replace audio (optional):
      <input type="file" accept=".mp3" id="edt-audio" />
    </label><br />
    <label>
      Replace image (optional):
      <input type="file" accept="image/*" id="edt-img" />
    </label><br />

    {/* buttons */}
    <button
      onClick={async () => {
        const form = new FormData();

        /* collect changed text fields */
        const titleVal  = document.getElementById("edt-title").value;
        const artistVal = document.getElementById("edt-artist").value;
        const yearVal   = Number(document.getElementById("edt-year").value);
        const hoverVal  = document.getElementById("edt-hover").value;
        const infoVal   = document.getElementById("edt-info").value;

        if (titleVal  !== editingTrack.title)   form.append("title",  titleVal);
        if (artistVal !== editingTrack.artist)  form.append("artist", artistVal);
        if (yearVal   !== editingTrack.year)    form.append("year",   yearVal);
        if (hoverVal  !== (editingTrack.hover_info || "")) form.append("hover_info", hoverVal);
        if (infoVal   !== (editingTrack.info || ""))       form.append("info",       infoVal);

        const oldTags = editingTrack.tags || [];
        const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(oldTags);
        if (tagsChanged) form.append("tags", JSON.stringify(editTags));
        const newLinks = { ...(editingTrack.links || {}) };
        LINK_PLATFORMS.forEach(([p]) => {
          const v = document.getElementById(`edt-link-${p}`).value.trim();
          if (v !== (editingTrack.links?.[p] || "")) {
            form.append(p, v);
            if (v) newLinks[p] = v; else delete newLinks[p];
          }
        });

        /* optional new files */
        const audFile = document.getElementById("edt-audio").files[0];
        const imgFile = document.getElementById("edt-img").files[0];
        if (audFile) form.append("file",  audFile);
        if (imgFile) form.append("image", imgFile);
        console.log('FORM: ', form);
        /* send PUT */
        const res = await authFetch(
          `/tracks/locations/${selectedLocationId}/track/${editingTrack.track_id}`,
          { method: "PUT", body: form }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return alert(err.detail || `Save failed (${res.status})`);
        }
        if (tagsChanged) getTags().then(setAllTags);
        {currentLoc && (
            <p style={{ marginTop:4, fontSize:12 }}>
              Selected: {currentLoc.name} ({currentLoc.latitude.toFixed(2)}, {currentLoc.longitude.toFixed(2)})
            </p>
          )}
          
        /* update local state so UI refreshes */
        setLocations(prev =>
          prev.map(loc =>
            loc.id === selectedLocationId
              ? {
                  ...loc,
                  tracks: loc.tracks.map(tr =>
                    tr.track_id === editingTrack.track_id
                      ? {
                          ...tr,
                          title:      titleVal,
                          artist:     artistVal,
                          year:       yearVal,
                          hover_info: hoverVal || null,
                          info:       infoVal   || null,
                          tags:       editTags,
                          links:      newLinks,
                        }
                      : tr
                  ),
                }
              : loc
          )
        );
        setEditingTrack(null);
      }}
    >
      Save
    </button>
    <button onClick={() => setEditingTrack(null)}>Cancel</button>
  </fieldset>
)}

    </div>
  );
}
