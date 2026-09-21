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
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
