import React, { useState, useEffect } from "react";
import { getPosts, createPost, updatePost, deletePost } from "./api";
import { getLocations } from "./api";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    getPosts().then(setPosts);
    getLocations().then((locs) =>
      setLocations(locs.flatMap((l) => l.tracks.map((t) => ({ ...t, locName: l.name }))))
    );
  }, []);

  const reload = () => getPosts().then(setPosts);

  const save = async () => {
    const payload = {
      title: document.getElementById("b-title").value,
      slug:  document.getElementById("b-slug").value,
      content: document.getElementById("b-content").value,
      track_ids: Array.from(
        document.getElementById("b-tracks").selectedOptions
      ).map((o) => o.value),
    };
    if (editing) {
      await updatePost(editing.post_id, payload);
    } else {
      await createPost(payload);
    }
    setEditing(null);
    reload();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete post?")) return;
    await deletePost(id);
    reload();
  };

  return (
    <div  className="page" style={{ padding: 20, color: "#fff", fontFamily: "inherit" }}>
      <h2>Admin Blog</h2>

      {/* list of posts */}
      {posts.map((p) => (
        <div key={p.post_id} style={{ margin: "8px 0", borderBottom: "1px solid #444" }}>
          {p.title}
          <button onClick={() => setEditing(p)} style={{ marginLeft: 8 }}>✏️</button>
          <button onClick={() => remove(p.post_id)}      style={{ marginLeft: 4 }}>🗑️</button>
        </div>
      ))}

      {/* editor */}
      <fieldset style={{ marginTop: 16, padding: 12 }}>
        <legend>{editing ? "Edit Post" : "New Post"}</legend>

        <label>
          Title:<br/>
          <input id="b-title" defaultValue={editing?.title || ""} style={{ width: "100%" }}/>
        </label><br/>

        <label>
          Slug:<br/>
          <input id="b-slug" defaultValue={editing?.slug || ""} style={{ width: "100%" }}/>
        </label><br/>

        <label>
          Content (HTML or Markdown):<br/>
          <textarea id="b-content" defaultValue={editing?.content || ""} style={{ width: "100%", height: 120 }} />
        </label><br/>

        <label>
          Reference tracks:<br/>
          <select id="b-tracks" multiple style={{ width: "100%", height: 80 }}>
            {locations.map((t) => (
              <option
                key={t.track_id}
                value={t.track_id}
                selected={editing?.track_ids.includes(t.track_id)}
              >
                {t.locName} — {t.title}
              </option>
            ))}
          </select>
        </label><br/>

        <button onClick={save}>{editing ? "Update" : "Create"}</button>
        {editing && (
          <button onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </fieldset>
    </div>
  );
}
