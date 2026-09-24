// import React, { useState } from "react";
// import TracksPanel from "./TracksPanel";
// import BlogPanel   from "./BlogPanel";
// import "./Admin.css";

// export default function AdminPage({ token }) {
//   /* ----- tabs ----- */
//   const [tab, setTab] = useState("tracks");      // "tracks" | "blog"

//   return (
//     <div className="page" style={{ padding: 20 }}>
//       <h1>Admin</h1>

//       {/* tab bar */}
//       <div className="adm-tabs">
//         <button onClick={() => setTab("tracks")} className={tab==="tracks"?"on":""}>Tracks</button>
//         <button onClick={() => setTab("blog")}   className={tab==="blog"  ?"on":""}>Blog</button>
//       </div>

//       {/* panel */}
//       {tab === "tracks" ? (
//         <TracksPanel token={token} />
//       ) : (
//         <BlogPanel token={token} />
//       )}
//     </div>
//   );
// }
// src/AdminPage.jsx
import React, { useState } from "react";
import TracksPanel from "./TracksPanel";
import BlogPanel   from "./BlogPanel";

import { login }   from "./api";          // helper that POSTs /auth/login
import "./Admin.css";
import AboutPanel  from "./AboutPanel";    // <-- Import AboutPanel
import SubscribersPanel from "./SubscribersPanel";

export default function AdminPage() {
  /* -------- login state -------- */
  const [token, setToken] = useState(localStorage.getItem("admTok") || "");
  const [pw, setPw]       = useState("");
  const [tab, setTab] = useState("tracks");  // "tracks" | "blog"

  /* -------- login handler (THIS is doLogin) -------- */
  const doLogin = async () => {
    try {
      const { token } = await login(pw);          // backend returns {token:"…"}
      localStorage.setItem("admTok", token);
      setToken(token);                            // re-renders page as admin

      /* 🔔 notify navbar (and any other tab) immediately */
      window.dispatchEvent(new Event("adminlogin"));
    } catch (e) {
      alert(e.message);
    }
  };

  /* -------- render login form if no token -------- */
  if (!token) {
    return (
      <div className="page" style={{ padding: 20 }}>
        <h1>Admin Login</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
        />
        <button onClick={doLogin}>Login</button>
      </div>
    );
  }

  /* -------- tabs -------- */

  return (
    <div className="page" style={{ padding: 20 , paddingBottom: "120px" }}>
      <h1>Admin</h1>

      {/* tab bar */}
      <div className="adm-tabs">
        <button onClick={() => setTab("tracks")} className={tab==="tracks"?"on":""}>Tracks</button>
        <button onClick={() => setTab("blog")}   className={tab==="blog"  ?"on":""}>Blog</button>
        <button onClick={()=>setTab("about")}  className={tab==="about" ?"on":""}>About</button>
        <button onClick={()=>setTab("subs")}   className={tab==="subs"  ?"on":""}>Subscribers</button>

      </div>

      {/* panel content
      // {tab === "tracks" ? (
      //   <TracksPanel token={token} />
      // ) : (
      //   <BlogPanel token={token} />
      // )} */}
      {tab==="tracks" && <TracksPanel token={token} />}
      {tab==="blog"   && <BlogPanel   token={token} />}
      {tab==="about"  && <AboutPanel token={token} />}
      {tab==="subs"   && <SubscribersPanel />}

    </div>
  );
}
