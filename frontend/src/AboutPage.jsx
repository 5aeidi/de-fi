// src/AboutPage.jsx
import React, { useState, useEffect } from "react";
import { getAbout } from "./api";

export default function AboutPage() {
  const [html, setHtml] = useState("<p>Loading…</p>");

  useEffect(() => {
    getAbout().then((data) => setHtml(data.html));
  }, []);

  return (
    <div className="page" style={{ padding: 20, color: "#fff", fontFamily: "inherit" }}>
      <h1>About</h1>
      <hr style={{ border: 0, borderTop: "1px solid #444", margin: "8px 0" }} />
      <p style={{ fontSize: "0.85em", opacity: 0.7, margin: "0 0 16px" }}>
        🄯 Copyleft {new Date().getFullYear()} DE:FI — free software under the{" "}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>GNU AGPL v3</a>.
        Source:{" "}
        <a href="https://github.com/5aeidi/de-fi" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>github.com/5aeidi/de-fi</a>
      </p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
