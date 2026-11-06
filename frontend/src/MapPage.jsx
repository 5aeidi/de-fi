// src/MapPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Map, Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import { useSwipeable } from "react-swipeable";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE, transformRequest, MAX_ZOOM, MIN_ZOOM } from "./mapStyle";
import { getLocations } from "./api";
import { activateTrack, currentLocId } from "./PlayerManager";

/* ---------------- component ---------------- */
export default function MapPage() {
  /* data */
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [playingLocId, setPlayingLocId] = useState(currentLocId);
  const mapRef = useRef(null);
  const locsRef = useRef([]);
  locsRef.current = locations;
  
  const isMobile = window.matchMedia("(max-width:600px)").matches;

  /* fetch locations */
  useEffect(() => {
    getLocations().then((data) => {
      setLocations(
        data.map((l) => ({
          ...l,
          id: String(l.id || l._id),          // ⭐ always string
        }))
      );
    });
      }, []);
      useEffect(() => {
        const handler = (e) => {
          setPlayingLocId(e.detail);
          // glide to the new track's location (e.g. when shuffle moves on)
          const loc = locsRef.current.find((l) => l.id === e.detail);
          const map = mapRef.current;
          if (loc && map) map.flyTo({ center: [+loc.longitude, +loc.latitude], zoom: Math.max(map.getZoom(), 2.5), duration: 2000 });
        };
        window.addEventListener("tracklocationchange", handler);
        return () => window.removeEventListener("tracklocationchange", handler);
      }, []);
  /* valid coords only */
  const valid = locations.filter((l) => {
    const lat = +l.latitude,
      lon = +l.longitude;
    return (
      !Number.isNaN(lat) &&
      !Number.isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  });

  return (
    <>
      {/* ------------- MAP ------------- */}
      <Map
        ref={mapRef}
        maxZoom={MAX_ZOOM}
        minZoom={MIN_ZOOM}
        initialViewState={{ latitude: 0, longitude: 0, zoom: 1.5 }}
        onClick={() => setSelectedLoc(null)} 
        style={{ width: "100%", height: "100vh" }}
        mapStyle={MAP_STYLE}
        transformRequest={transformRequest}
      >
        <NavigationControl position={isMobile ? "bottom-left" : "top-left"} />

        {valid.map((loc) => (
          <Marker
            /* 🔑  add “-p” suffix when this loc is the active one */
            key={loc.id + (loc.id === playingLocId ? "-p" : "")}

            latitude={+loc.latitude}
            longitude={+loc.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedLoc(loc);
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                background: loc.id === playingLocId ? "#ffff00" : "#ff0000",
                border: loc.id === playingLocId ? "1px solid #111" :"2px solid #fff",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            />
          </Marker>
        ))}

      {selectedLoc && (
        <Popup
          latitude={+selectedLoc.latitude}
          longitude={+selectedLoc.longitude}
          anchor="top"
          closeOnClick={false}
          onClose={() => setSelectedLoc(null)}
          offset={[0, -5]}
          className="sor-popup"      /* <-- add this */
        >
          {/* inner layout now needs no border/font styling */}
          <div style={{ width: 220 }}>
            <h3 style={{ margin: 0 }}>{selectedLoc.name}</h3>

            {selectedLoc.tracks.length ? (
              selectedLoc.tracks.map((t) => (
                <div
                  key={t.track_id}
                  title={t.hover_info || undefined}
                  style={{ cursor: "pointer", margin: "6px 0" }}
                  onClick={() => {
                    activateTrack(t.track_id);
                    setSelectedLoc(null);
                  }}
                >
                  {t.artist} — {t.title} ({t.year})
                  {t.hover_info && <div className="popup-hover">{t.hover_info}</div>}
                  {(t.tags || []).length > 0 && (
                    <div className="track-tags">
                      {t.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: "#aaa" }}>No tracks.</p>
            )}
          </div>
        </Popup>
      )}
      </Map>
      
    </>
  );
}
