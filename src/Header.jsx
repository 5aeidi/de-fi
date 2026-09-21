// src/Header.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const [adm,setAdm] = useState(!!localStorage.getItem("admTok"));

  useEffect(() => {
    const fn = () => setAdm(!!localStorage.getItem("admTok"));
    window.addEventListener("adminlogin", fn);
    window.addEventListener("storage", fn); // covers login in another tab
    return () => {
      window.removeEventListener("adminlogin", fn);
      window.removeEventListener("storage", fn);
    };
  }, []);

  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);

  return (
    <header className="sor-header">
      <img
        src="/icon.png"
        alt="Logo"
        width={28}
        height={28}
        style={{ imageRendering: "pixelated" }}
      />

      <h1 className="sor-title">Sounds&nbsp;Of&nbsp;Resistance</h1>

      {/* burger — mobile only */}
      <button
        className="sor-burger"
        onClick={toggle}
        aria-label="Menu"
      >
        {open ? "×" : "☰"}      {/* ← show × when open, ☰ when closed */}
      </button>


      {/* nav */}
      <nav className={`sor-nav ${open ? "open" : ""}`}>
        <Link to="/"        onClick={() => setOpen(false)}>Map</Link>
        <Link to="/blog"    onClick={() => setOpen(false)}>Blog</Link>
        <Link to="/about">About</Link>
        {adm && <Link to="/admin">Admin</Link>}    {/* only if logged in */}

      </nav>
    </header>
  );
}
