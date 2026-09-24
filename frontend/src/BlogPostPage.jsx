import React, { useEffect, useState } from "react";
import { getPost } from "./api";
import { activateTrack } from "./PlayerManager";   // global helper
import { useParams, useNavigate } from "react-router-dom";   // ← add useNavigate

export default function BlogPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  const navigate = useNavigate();               // ← hook for Back button

  useEffect(() => { getPost(id).then(setPost); }, [id]);


  /* ---------- play-track click delegation ---------- */
  useEffect(() => {
    const handler = (e) => {
      const el = e.target.closest(".play-track");
      if (!el) return;
      e.preventDefault();
      const tid = el.dataset.track;
      if (tid) activateTrack(tid);   // start playing in global player
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (!post) return <p style={{ color:"#fff" }}>Loading…</p>;

  /* simple date formatter */
  const fmt = (iso) => new Date(iso).toLocaleDateString();

  return (
    <div className="page" style={{ padding:20, color:"#fff", fontFamily:"inherit" }}>
 {/* ---- Back button ---- */}
        <button
                onClick={() => navigate(-1)}        // go to previous page
                style={{
                background:"#000", color:"#fff",
                border:"1px solid #fff", padding:"4px 10px",
                cursor:"pointer", marginBottom:16,
                }}
            >
                ◀ Back
            </button>

            {/* ---- title + date ---- */}
            <h1 style={{ margin:"0 0 4px 0", maxWidth:1700}}>{post.title}</h1>
            <small>{fmt(post.created_at)}</small>
      {/* we render HTML the admin saved (markdown already converted) */}
      <div
    dangerouslySetInnerHTML={{ __html: post.content }}
    style={{ lineHeight: 1.4, maxWidth: '1500px' }}
    />


      {/* list referenced tracks as buttons, too (optional) */}
      {post.track_ids.length > 0 && (
        <>
          <h3>Referenced Sounds:</h3>
          {post.track_ids.map((tid) => (
            <button
              key={tid}
              className="play-track"
              data-track={tid}
              style={{
                display:"block", margin:"6px 0",
                background:"#222", color:"#fff",
                border:"1px solid #fff", padding:"4px 8px",
                cursor:"pointer", fontFamily:"inherit"
              }}
            >
              {/* ▶ Play track&nbsp;{tid.slice(-4)} */}
              ▶ Play

            </button>
          ))}
        </>
      )}
    </div>
  );
}
