// import React, { useState, useEffect } from "react";
// import { getPosts, createPost, updatePost, deletePost, authFetch } from "./api";
// import { getLocations } from "./api";
// 
// export default function BlogPanel({ token }) {
//   const [posts, setPosts] = useState([]);
//   const [editing, setEditing] = useState(null);
//   const [locations, setLocations] = useState([]);

//   const reload = () => getPosts().then(setPosts);

//   const save = async () => {
//     const payload = {
//       title: document.getElementById("b-title").value,
//       slug: document.getElementById("b-slug").value,
//       content: document.getElementById("b-content").value,
//       track_ids: Array.from(document.getElementById("b-tracks").selectedOptions).map(
//         (o) => o.value
//       ),
//     };
//     if (editing) {
//       await updatePost(editing.post_id, payload);
//     } else {
//       await createPost(payload);
//     }
//     setEditing(null);
//     reload();
//   };

//   const remove = async (id) => {
//     if (!window.confirm("Delete post?")) return;
//     await deletePost(id);
//     reload();
//   };

//   useEffect(() => {
//     authFetch("/posts")
//       .then((res) => res.json())
//       .then(setPosts);
//   }, []);

//   useEffect(() => {
//     getPosts().then(setPosts);
//     getLocations().then((locs) =>
//       setLocations(locs.flatMap((l) => l.tracks.map((t) => ({ ...t, locName: l.name }))))
//     );
//   }, []);

//   return (
//     <div style={{ padding: 0, color: "#fff", fontFamily: "inherit" }}>
//       <h2>Blog</h2>

//       {/* List of posts in a fieldset */}
//       <fieldset style={{ marginTop: 16, padding: 12 }}>
//         <legend>Blog Post List</legend>
//         {posts.map((p) => (
//           <div key={p.post_id} style={{ margin: "8px 0", borderBottom: "1px solid #444" }}>
//             <strong>{p.title}</strong>
//             <button onClick={() => setEditing(p)} style={{ marginLeft: 8 }}>✏️</button>
//             <button onClick={() => remove(p.post_id)} style={{ marginLeft: 4 }}>🗑️</button>
//           </div>
//         ))}
//       </fieldset>

//       {/* Editor section */}
//       <fieldset style={{ marginTop: 16, padding: 12 }}>
//         <legend>{editing ? "Edit Post" : "New Post"}</legend>

//         <label>
//           Title:<br />
//           <input
//             id="b-title"
//             defaultValue={editing?.title || ""}
//             style={{ width: "100%" }}
//           />
//         </label>
//         <br />

//         <label>
//           Slug:<br />
//           <input
//             id="b-slug"
//             defaultValue={editing?.slug || ""}
//             style={{ width: "100%" }}
//           />
//         </label>
//         <br />

//         <label>
//           Content (HTML or Markdown):<br />
//           <textarea
//             id="b-content"
//             defaultValue={editing?.content || ""}
//             style={{ width: "100%", height: 120 }}
//           />
//         </label>
//         <br />

//         <label>
//           Reference tracks:<br />
//           <select id="b-tracks" multiple style={{ width: "100%", height: 80 }}>
//             {locations.map((t) => (
//               <option
//                 key={t.track_id}
//                 value={t.track_id}
//                 selected={editing?.track_ids.includes(t.track_id)}
//               >
//                 {t.locName} — {t.title}
//               </option>
//             ))}
//           </select>
//         </label>
//         <br />

//         <button onClick={save}>{editing ? "Update" : "Create"}</button>
//         {editing && (
//           <button onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>
//             Cancel
//           </button>
//         )}
//       </fieldset>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { getPosts, createPost, updatePost, deletePost, authFetch } from "./api";
import { getLocations } from "./api";

const PAGE = 3;

export default function BlogPanel({ token }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);  // zero-based
  const [editing, setEditing] = useState(null);
  const [locations, setLocations] = useState([]);

  const reload = () => getPosts(page * PAGE, PAGE).then(setPosts);

  // Save or update a blog post
  const save = async () => {
    const payload = {
      title: document.getElementById("b-title").value,
      slug: document.getElementById("b-slug").value,
      content: document.getElementById("b-content").value,
      track_ids: Array.from(document.getElementById("b-tracks").selectedOptions).map(
        (o) => o.value
      ),
    };
    if (editing) {
      await updatePost(editing.post_id, payload);
    } else {
      await createPost(payload);
    }
    setEditing(null);
    reload();
  };

  // Delete a post
  const remove = async (id) => {
    if (!window.confirm("Delete post?")) return;
    await deletePost(id);
    reload();
  };

  // Fetch the posts on page load
  useEffect(() => {
    authFetch(`/posts`)
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  // Get locations and their tracks
  useEffect(() => {
    getPosts(page * PAGE, PAGE).then(setPosts);
    getLocations().then((locs) =>
      setLocations(locs.flatMap((l) => l.tracks.map((t) => ({ ...t, locName: l.name }))))
    );
  }, [page]);

  const fmt = (iso) => new Date(iso).toLocaleDateString();

  return (
    <div style={{ padding: 0, color: "#fff", fontFamily: "inherit" }}>
      <h2>Blog Posts</h2>

      {/* list of posts */}
      <fieldset style={{ marginTop: 16, padding: 12 }}>
        <legend>Blog Post List</legend>
        {posts.map((p) => (
          <div key={p.post_id} style={{ margin: "8px 0", borderBottom: "1px solid #444" }}>
            <h3>{p.title}</h3>
            <small>{fmt(p.created_at)}</small><br />
            <button onClick={() => setEditing(p)} style={{ marginLeft: 8 }}>MOD</button>
            <button onClick={() => remove(p.post_id)} style={{ marginLeft: 4 }}>DEL</button>
            
          </div>
        ))}
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
      </fieldset>

      {/* editor */}
      <fieldset style={{ marginTop: 16, padding: 12 }}>
        <legend>{editing ? "Edit Post" : "New Post"}</legend>

        <label>
          Title:<br />
          <input id="b-title" defaultValue={editing?.title || ""} style={{ width: "100%" }} />
        </label>
        <br />

        <label>
          Slug:<br />
          <input id="b-slug" defaultValue={editing?.slug || ""} style={{ width: "100%" }} />
        </label>
        <br />

        <label>
          Content (HTML or Markdown):<br />
          <textarea id="b-content" defaultValue={editing?.content || ""} style={{ width: "100%", height: 120 }} />
        </label>
        <br />

        <label>
          Reference tracks:<br />
          <select id="b-tracks" multiple style={{ width: "100%", height: 80 }}>
            {locations.map((t) => (
              <option
                key={t.track_id}
                value={t.track_id}
                selected={editing?.track_ids?.includes(t.track_id)}
              >
                {t.locName} — {t.title}
              </option>
            ))}
          </select>
        </label>
        <br />

        <button onClick={save}>{editing ? "Update" : "Create"}</button>
        {editing && (
          <button onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </fieldset>

      {/* Pagination controls */}

    </div>
  );
}
