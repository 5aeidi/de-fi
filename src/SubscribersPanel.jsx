import React, { useEffect, useState } from "react";
import { getSubscribers } from "./api";

export default function SubscribersPanel() {
  const [subs, setSubs] = useState([]);
  useEffect(() => { getSubscribers().then(setSubs); }, []);

  const copyAll = () => navigator.clipboard.writeText(subs.map((s) => s.email).join("\n"));

  return (
    <div style={{ color: "#fff" }}>
      <h2>Subscribers ({subs.length})</h2>
      <button onClick={copyAll} disabled={!subs.length}>Copy all</button>
      <ul>
        {subs.map((s) => (
          <li key={s.email}>
            {s.email} <small>({new Date(s.created_at * 1000).toLocaleDateString()})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
