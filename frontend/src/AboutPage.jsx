// src/AboutPage.jsx
import React, { useState, useEffect } from "react";
import { getAbout } from "./api";

export default function AboutPage() {
  const [html, setHtml] = useState("<p>Loading…</p>");

  useEffect(() => {
    getAbout().then((data) => setHtml(data.html)).catch(() => setHtml("<p>Could not load.</p>"));
  }, []);

  return (
    <div className="page" style={{ padding: 20, color: "#fff", fontFamily: "inherit" }}>
      <h1>About</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <footer style={{ marginTop: 48 }}>
        <hr style={{ border: 0, borderTop: "1px solid #444", margin: "0 0 8px" }} />
        <p style={{ fontSize: "0.85em", opacity: 0.7, margin: 0 }}>
          🄯 Copyleft 2026{" "}
          <a href="https://github.com/5aeidi/de-fi" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>DE:FI</a>
        </p>
      </footer>
    </div>
  );
}
