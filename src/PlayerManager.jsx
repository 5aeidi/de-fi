import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { getLocations, getPosts, API_BASE_URL } from "./api";

const HEADER_H = 56;               // same as your header height
const isMobile = window.matchMedia("(max-width:600px)").matches;
console.log('inplayerismobile', isMobile);
export let activateTrack = () => {}; // will be overwritten

export default function PlayerManager() {
  /* ---------- load everything once ---------- */
  const [locations, setLocations] = useState([]);
  const [posts, setPosts] = useState([]);
  useEffect(() => { getLocations().then(setLocations); getPosts().then(setPosts); }, []);
useEffect(() => {
    getLocations().then((data) => {
    const normalised = data.map((l) => ({
        ...l,
        id: String(l.id || l._id),              // ← always a plain string
        tracks: l.tracks.map((t) => ({         //   and each track’s parent id
        ...t,
        parentLocId: String(l.id || l._id),
        })),
    }));
    setLocations(normalised);
    });
}, []);
  
  /* ---------- audio & player state ---------- */
  const [track, setTrack]       = useState(null);
  const [showPane, setShowPane] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(new Audio());

activateTrack = async (trackId) => {
    console.log("activateTrack called with", trackId);   // <- TEMP

    // helper to search the local copy
    const find = (locs) =>
      locs.flatMap((l) => l.tracks.map((t) => ({ ...t, loc: l })))
          .find((t) => t.track_id === trackId);
  
    let found = find(locations);
    console.log('found',found);
    // if not loaded yet, fetch locations once
    if (!found) {
      const fresh = await getLocations();
      setLocations(fresh);            // keeps UI in sync next time
      found = find(fresh);
    }
  
    if (found) {
        console.log('found', found);
      setTrack(found);                // start playback
      setShowPane(true);
      const locId = String(found.loc.id || found.loc._id);   // ← force to string
      window.dispatchEvent(new CustomEvent("tracklocationchange", { detail: locId }));
    } else {
      console.warn("Track not found:", trackId);
    }
  };
  /* runs once: keep <playing> flag in sync with real audio state */
    useEffect(() => {
        const a = audioRef.current;
        const onPlay  = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        a.addEventListener("play",  onPlay);
        a.addEventListener("pause", onPause);
        return () => {
        a.removeEventListener("play",  onPlay);
        a.removeEventListener("pause", onPause);
        };
    }, []);

  /* ---------- audio side-effects ---------- */
  useEffect(() => {
    if (!track) return;
    const a = audioRef.current;
    a.src = `${API_BASE_URL}${track.file_path}`;
    a.play().catch(() => {});
    setPlaying(true);

    const up  = () => setTime(a.currentTime);
    const md  = () => setDuration(a.duration);
    const end = () => {
        setPlaying(false);
        window.dispatchEvent(new CustomEvent("tracklocationchange", { detail: null }));
      };

    a.addEventListener("timeupdate", up);
    a.addEventListener("loadedmetadata", md);
    a.addEventListener("ended", end);
    return () => {
      a.removeEventListener("timeupdate", up);
      a.removeEventListener("loadedmetadata", md);
      a.removeEventListener("ended", end);
    };
  }, [track]);

  /* ---------- helper fns ---------- */
  const toggle = () => {
    const a = audioRef.current;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };
  const seek   = (v) => (audioRef.current.currentTime = v);
  const skip   = (d) => (audioRef.current.currentTime += d);

  /* ---------- UI (mini-box + pane) ---------- */
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const swipe = useSwipeable({ onSwipedRight: () => setShowPane(false), trackMouse: true });

  const postRefs = track ? posts.filter((p) => p.track_ids.includes(track.track_id)) : [];

  return (
    <>
      {/* mini box */}
      {track && !showPane && (
            <div
            className="mini-box"
            onClick={() => setShowPane(true)}
            style={{
                background:"#111", border:"1px solid #fff",
                padding:12, zIndex:1100, cursor:"pointer",
                width:260, color:"#fff", fontFamily:"inherit",
            }}
            >
          <strong>{track.title}</strong><br/>
          <small>{track.artist} &middot; {track.year}</small>
          <input type="range" min={0} max={duration||0} value={time} onChange={(e)=>seek(+e.target.value)} style={{ width: "100%", marginTop: 4 }} />
          <small>{fmt(time)} / {fmt(duration)}</small><br/>
          <button onClick={(e)=>{e.stopPropagation();toggle();}} style={{ marginTop:4 }}> {playing?"Pause":"Play"} </button>
        </div>
      )}

      {/* side pane */}
      <div
  {...swipe}
  className="player-pane"
  style={{
    position: "fixed",

    /* ---- position ------------------------------------------------------ */
    top:    isMobile ? "auto"     : HEADER_H+20,
    bottom: isMobile ? 0          : "auto",
    left:   isMobile ? "50%"      : "auto",
    right:  isMobile ? "auto"     : 1,

    /* ---- size ---------------------------------------------------------- */
    width:  isMobile ? "90vw"     : 300,
    height: isMobile ? "60vh"     : `calc(100vh - ${HEADER_H}px)`,

    /* ---- border -------------------------------------------------------- */
    borderLeft: isMobile ? "none"           : "1px solid #fff",
    borderTop:  isMobile ? "1px solid #fff" : "none",
    borderRight: isMobile ? "none"           : "1px solid #fff",

    /* ---- slide-in transform ------------------------------------------- */
    transform: showPane
      ? isMobile
          ? "translate(-50%, 0)"            // centered & visible
          : "translateX(0)"
      : isMobile
          ? "translate(-50%, 100%)"         // slide down off-screen
          : "translateX(100%)",

    transition: "transform .25s ease-out",

    /* ---- misc ---------------------------------------------------------- */
    zIndex: 1000,
    background: "#000",
    display: track ? "flex" : "none",
    flexDirection: "column",
    padding: 18,
    boxSizing: "border-box",
    color: "#fff",
    fontFamily: "inherit",
    overflowY: "auto",
  }}
>


        <button onClick={()=>setShowPane(false)} style={{ alignSelf:"flex-end", background:"none", border:"none", color:"#fff", fontSize:18 }}>×</button>
        {track && (
          <>
            <h2 style={{margin:"0px 0", fontSize:16}}>{track.title}</h2>
            <p style={{margin:"0 0 6px 0", fontSize:12}}>{track.artist} &middot; {track.year}</p>
            {track.image_path && <img src={`${API_BASE_URL}${track.image_path}`} width={200} height={200} style={{ alignSelf:"center", objectFit:"cover", border:"1px solid #fff", marginBottom:12 }} alt="art" />}
            

            <input type="range" min={0} max={duration||0} value={time} onChange={(e)=>seek(+e.target.value)} />
            <small>{fmt(time)} / {fmt(duration)}</small>

            <div style={{ marginTop:8 }}>
              <button onClick={()=>skip(-10)}>-10s</button>
              <button onClick={toggle} style={{ margin:"0 6px" }}>{playing?"Pause":"Play"}</button>
              <button onClick={()=>skip(10)}>+10s</button>
            </div>
            {track.info && <p style={{fontSize:10, marginBottom:12}}>{track.info}</p>}
            {postRefs.length>0 && (
              <div style={{ marginTop:"auto" }}>
                <small>Featured in:</small>
                {postRefs.map((p)=>
                  <div key={p.post_id}>
                    <a href={`/blog/${p.post_id}`} style={{fontSize:10, color:"#0af"}}>{p.title}</a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
    </>
  );
}
