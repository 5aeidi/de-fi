import React, { useEffect, useState } from "react";
import { getPosts } from "./api";
import { Link } from "react-router-dom";

const PAGE = 10;

export default function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage]   = useState(0);          // zero-based

  /* fetch every time page changes */
  useEffect(() => {
    getPosts(page * PAGE, PAGE).then(setPosts);
  }, [page]);

  const fmt = (iso) => new Date(iso).toLocaleDateString();

  return (
    <div className="page" style={{ padding: 20, color: "#fff", fontFamily: "inherit" }}>
      <h1>Blog</h1>

      {posts.map((p) => (
        <div key={p.post_id} style={{ margin: "12px 0", borderBottom: "1px solid #444" }}>
          <h2 style={{ margin: 0 }}>{p.title}</h2>
          <small>{fmt(p.created_at)}</small><br/>
          <Link to={`/blog/${p.post_id}`} style={{ color: "#0af" }}>
            Read more…
          </Link>
        </div>
      ))}

      {/* pagination controls */}
      <div style={{ marginTop: 20 }}>
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ◀ Prev
        </button>
        <span style={{ margin: "0 12px" }}>Page {page + 1}</span>
        <button
          disabled={posts.length < PAGE}
          onClick={() => setPage((p) => p + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
