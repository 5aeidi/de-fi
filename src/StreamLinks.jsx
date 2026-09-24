// Icon-only links to a track on external platforms; renders nothing if none set.
import React from "react";

const ICONS = {
  bandcamp: { label: "Bandcamp", path: "M0 18.75l7.437-13.5H24l-7.438 13.5H0z" },
  spotify: {
    label: "Spotify",
    path: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
  },
  soundcloud: {
    label: "SoundCloud",
    path: "M1 14.5h1v3.5H1zm2-1.5h1v5H3zm2-1h1v6H5zm2-1.5h1V18H7zm2-1.5h1v9H9zm2-1h1v10h-1zm2.5-1.5c.6-.3 1.3-.5 2-.5 2.6 0 4.8 2 5 4.6.3-.1.6-.1 1-.1 1.4 0 2.5 1.1 2.5 2.5S22.9 18 21.5 18h-8z",
  },
  youtube: {
    label: "YouTube",
    path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
  },
};

export default function StreamLinks({ links, size = 20 }) {
  const entries = Object.entries(links || {}).filter(([p, u]) => ICONS[p] && u);
  if (!entries.length) return null;
  return (
    <div style={{ display: "flex", gap: 12, margin: "8px 0" }} onClick={(e) => e.stopPropagation()}>
      {entries.map(([p, url]) => (
        <a key={p} href={url} target="_blank" rel="noopener noreferrer"
           title={ICONS[p].label} aria-label={ICONS[p].label} style={{ color: "#fff", lineHeight: 0 }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={ICONS[p].path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
