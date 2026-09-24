// src/AboutPanel.jsx
import React, { useState, useEffect } from "react";
import { saveAbout, getAbout } from "./api";

export default function AboutPanel({ token }) {
  const [text, setText] = useState("");

  // Get the current About content when the component mounts
  useEffect(() => {
    getAbout().then((data) => setText(data.html));
  }, []);

  // Save the updated About content
  const save = async () => {
    await saveAbout(text);
    alert("About page saved!");
  };

  return (
    <div>
      <h2>Edit About Page</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: "200px" }}
      />
      <button onClick={save} style={{ marginTop: 8 }}>Save</button>
    </div>
  );
}
