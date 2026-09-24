// Chip-style tag picker: choose from existing tags or create new ones.
import React, { useState } from "react";

export default function TagInput({ value, onChange, allTags, disabled }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const has = (t) => value.some((v) => v.toLowerCase() === t.toLowerCase());

  const add = (raw) => {
    const t = raw.trim().replace(/^#/, "").trim();
    if (t && !has(t)) onChange([...value, t]);
    setText("");
  };
  const remove = (t) => onChange(value.filter((v) => v !== t));

  const q = text.trim().toLowerCase();
  const matches = allTags.filter((t) => !has(t) && t.toLowerCase().includes(q));
  const exact = allTags.some((t) => t.toLowerCase() === q);

  return (
    <div className="tag-input" style={{ position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
        {value.map((t) => (
          <span key={t} className="tag-chip">
            #{t}
            {!disabled && (
              <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`}>×</button>
            )}
          </span>
        ))}
      </div>
      <input
        placeholder="Add tag…"
        value={text}
        disabled={disabled}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(text); }
          else if (e.key === "Backspace" && !text && value.length) remove(value[value.length - 1]);
        }}
      />
      {open && !disabled && (matches.length > 0 || (q && !exact)) && (
        <ul className="tag-dropdown">
          {q && !exact && !has(q) && (
            <li onMouseDown={(e) => { e.preventDefault(); add(text); }}>Create “{text.trim()}”</li>
          )}
          {matches.slice(0, 30).map((t) => (
            <li key={t} onMouseDown={(e) => { e.preventDefault(); add(t); }}>#{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
