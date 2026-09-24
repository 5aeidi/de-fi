import React, { useState } from "react";
import { subscribeNewsletter } from "./api";

export default function NewsletterModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    setState("sending");
    try {
      await subscribeNewsletter(email.trim());
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="nl-backdrop" onClick={onClose}>
      <div className="nl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Newsletter">
        <button className="nl-close" onClick={onClose} aria-label="Close">×</button>
        <h2>Newsletter</h2>
        {state === "done" ? (
          <p>Thanks! We'll be in touch.</p>
        ) : (
          <form onSubmit={submit}>
            <p>Leave your email and we'll write when there's news.</p>
            <input type="email" required placeholder="you@example.com" value={email}
                   onChange={(e) => setEmail(e.target.value)} autoFocus />
            <button type="submit" disabled={state === "sending"}>Subscribe</button>
            {state === "error" && <p style={{ color: "#f55" }}>That email doesn't look right.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
