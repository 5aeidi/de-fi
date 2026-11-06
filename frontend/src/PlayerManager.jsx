// Global audio player: one <audio> for the whole site, mounted outside the router.
// - activateTrack(id) plays a chosen track (map popup, blog links).
// - When a track ends, a random next track plays (shuffle without repeats until
//   every track has played), so the site keeps playing on its own.
// - The player is either expanded (side pane / bottom sheet) or collapsed to a
//   small bar; the ✕ collapses it and tapping the bar expands it again.
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { getLocations, getPosts, API_BASE_URL } from "./api";
import StreamLinks from "./StreamLinks";
import "./Player.css";

export let activateTrack = () => {}; // overwritten by PlayerManager
export let currentLocId = null;      // location of the playing track, for pages mounted later

const normalise = (data) =>
  data.map((l) => {
    const id = String(l.id || l._id);
    return { ...l, id, tracks: (l.tracks || []).map((t) => ({ ...t, loc: { id, name: l.name, latitude: l.latitude, longitude: l.longitude } })) };
  });

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmt = (s) =>
  `${String(Math.floor((s || 0) / 60)).padStart(2, "0")}:${String(Math.floor((s || 0) % 60)).padStart(2, "0")}`;

/* ⓘ shown when the track's map position is only roughly right.
   Hover shows the native tooltip; tap (phones) toggles the text. */
function ApproxInfo() {
  const [open, setOpen] = useState(false);
  const text = "Location is approximate";
  return (
    <span className="approx">
      <button
        type="button"
        className="approx-btn"
        title={text}
        aria-label={text}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      {open && <span className="approx-tip" role="tooltip">{text}</span>}
    </span>
  );
}

export default function PlayerManager() {
  /* ---------- data ---------- */
  const [locations, setLocations] = useState([]);
  const [posts, setPosts] = useState([]);
  const reload = useCallback(() => getLocations().then((d) => setLocations(normalise(d))).catch(() => {}), []);
  useEffect(() => {
    reload();
    getPosts().then((p) => setPosts(Array.isArray(p) ? p : [])).catch(() => {});
    // admin edits in this tab dispatch this so the player isn't stale
    window.addEventListener("tracksupdated", reload);
    return () => window.removeEventListener("tracksupdated", reload);
  }, [reload]);

  const allTracks = useMemo(() => locations.flatMap((l) => l.tracks), [locations]);

  /* ---------- player state ---------- */
  const [track, setTrack]       = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [time, setTime]         = useState(0);
  const [duration, setDuration] = useState(0);
  const [upNextId, setUpNextId] = useState(null);
  const audioRef = useRef(new Audio());
  const queueRef = useRef([]);    // shuffled track ids still to play
  const loadedIdRef = useRef(null); // track whose file is in the <audio> element

  /* Load + play right away. Called synchronously from the "ended" event and
     from button clicks: iOS Safari and background tabs refuse a play() that
     happens later (e.g. after a React re-render). */
  const load = useCallback((t) => {
    const a = audioRef.current;
    a.src = `${API_BASE_URL}${t.file_path}`;
    loadedIdRef.current = t.track_id;
    setTime(0);
    setDuration(0);
    a.play().catch(() => {});
  }, []);

  /* next id in the shuffle queue (refilled when empty, never the current track) */
  const peekNext = useCallback((currentId) => {
    const ids = allTracks.map((t) => t.track_id);
    queueRef.current = queueRef.current.filter((id) => id !== currentId && ids.includes(id));
    if (!queueRef.current.length) queueRef.current = shuffle(ids.filter((id) => id !== currentId));
    return queueRef.current[0] || null;
  }, [allTracks]);

  const start = useCallback((t, { expand } = {}) => {
    queueRef.current = queueRef.current.filter((id) => id !== t.track_id);
    setTrack(t);
    if (expand !== undefined) setExpanded(expand);
    currentLocId = t.loc.id;
    window.dispatchEvent(new CustomEvent("tracklocationchange", { detail: t.loc.id }));
  }, []);

  const playNext = useCallback(() => {
    const id = peekNext(track?.track_id);
    const next = allTracks.find((t) => t.track_id === id);
    if (!next) return;
    load(next);              // start audio now, inside the triggering event
    start(next);             // then update the UI; keeps expanded/collapsed state
  }, [peekNext, track, allTracks, start, load]);

  activateTrack = async (trackId) => {
    let found = allTracks.find((t) => t.track_id === trackId);
    if (!found) {
      const fresh = normalise(await getLocations());
      setLocations(fresh);
      found = fresh.flatMap((l) => l.tracks).find((t) => t.track_id === trackId);
    }
    if (found) { load(found); start(found, { expand: true }); }
    else console.warn("Track not found:", trackId);
  };

  /* "Up next" label follows the current track and the queue */
  useEffect(() => { if (track) setUpNextId(peekNext(track.track_id)); }, [track, peekNext]);
  const upNext = allTracks.find((t) => t.track_id === upNextId);

  /* ---------- audio ---------- */
  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  useEffect(() => {
    const a = audioRef.current;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime  = () => setTime(a.currentTime);
    const onMeta  = () => setDuration(a.duration);
    const onEnded = () => playNextRef.current();
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (!track) return;
    if (loadedIdRef.current !== track.track_id) load(track);
  }, [track, load]);

  /* lock-screen / headset controls */
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    const art = track.image_path ? [{ src: `${API_BASE_URL}${track.image_path}`, sizes: "300x300", type: "image/jpeg" }] : [];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title, artist: track.artist || "", album: track.loc.name, artwork: art,
    });
    const a = audioRef.current;
    const set = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch {} };
    set("play", () => a.play());
    set("pause", () => a.pause());
    set("nexttrack", () => playNextRef.current());
  }, [track]);

  const toggle = (e) => {
    e?.stopPropagation();
    const a = audioRef.current;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };
  const seek = (v) => (audioRef.current.currentTime = v);
  const skip = (d) => (audioRef.current.currentTime += d);
  const next = (e) => { e?.stopPropagation(); playNext(); };

  /* swipe right (desktop pane) or down (phone sheet, when scrolled to top) collapses */
  const paneRef = useRef(null);
  const swipe = useSwipeable({
    onSwipedRight: () => setExpanded(false),
    onSwipedDown: () => { if (!paneRef.current || paneRef.current.scrollTop <= 0) setExpanded(false); },
    trackMouse: false,
  });
  const setPaneRef = (el) => { paneRef.current = el; swipe.ref(el); };

  if (!track) return null;

  const postRefs = posts.filter((p) => (p.track_ids || []).includes(track.track_id));
  const art = track.image_path ? `${API_BASE_URL}${track.image_path}` : null;
  const tags = track.tags || [];
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <>
      {/* ---------- collapsed bar ---------- */}
      {!expanded && (
        <div
          className="player-bar"
          role="button"
          tabIndex={0}
          aria-label="Open player"
          onClick={() => setExpanded(true)}
          onKeyDown={(e) => { if (e.key === "Enter") setExpanded(true); }}
        >
          <div className="player-bar-progress" style={{ width: `${progress}%` }} />
          {art ? <img src={art} alt="" className="player-bar-art" /> : <div className="player-bar-art" />}
          <div className="player-bar-text">
            <div className="player-bar-title">{track.title}</div>
            <div className="player-bar-sub">
              <span className="ellip">{track.artist}{track.loc.name ? ` · ${track.loc.name}` : ""}</span>
              {track.approximate && <ApproxInfo />}
            </div>
          </div>
          <button type="button" className="player-bar-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <button type="button" className="player-bar-btn" onClick={next} aria-label="Next track">▶▶</button>
        </div>
      )}

      {/* ---------- expanded pane / bottom sheet ---------- */}
      <div {...swipe} ref={setPaneRef} className={`player-pane${expanded ? " open" : ""}`} aria-hidden={!expanded}>
        <button type="button" className="player-close" onClick={() => setExpanded(false)} aria-label="Minimise player">×</button>

        <div className="player-head">
          {art && <img src={art} alt="art" className="player-art" />}
          <div className="player-head-text">
            <h2 className="player-title">{track.title}</h2>
            <p className="player-sub">{track.artist}{track.year ? ` · ${track.year}` : ""}</p>
            <p className="player-sub">
              {track.loc.name}
              {track.approximate && <ApproxInfo />}
            </p>
          </div>
        </div>

        <input type="range" min={0} max={duration || 0} value={time} onChange={(e) => seek(+e.target.value)} />
        <small>{fmt(time)} / {fmt(duration)}</small>

        <div className="player-controls">
          <button type="button" onClick={() => skip(-10)}>-10s</button>
          <button type="button" onClick={toggle}>{playing ? "Pause" : "Play"}</button>
          <button type="button" onClick={() => skip(10)}>+10s</button>
          <button type="button" onClick={next} aria-label="Next track">Next</button>
        </div>

        <StreamLinks links={track.links} />

        {tags.length > 0 && (
          <div className="track-tags">
            {tags.map((t) => <span key={t}>#{t}</span>)}
          </div>
        )}
        {track.hover_info && <p className="player-note">{track.hover_info}</p>}
        {track.info && <p className="player-note">{track.info}</p>}

        {upNext && (
          <p className="player-upnext">
            Up next: {upNext.artist ? `${upNext.artist} — ` : ""}{upNext.title} ({upNext.loc.name})
          </p>
        )}

        {postRefs.length > 0 && (
          <div style={{ marginTop: "auto" }}>
            <small>Featured in:</small>
            {postRefs.map((p) => (
              <div key={p.post_id}>
                <a href={`/blog/${p.post_id}`} style={{ fontSize: 10, color: "#0af" }}>{p.title}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
