import axios from "axios";

// Set per environment in .env.development / .env.production (REACT_APP_API).
export const API_BASE_URL = process.env.REACT_APP_API;

export const getLocations = async () => {
  const res = await axios.get(`${API_BASE_URL}/locations/`);
  return res.data;
};

export const uploadTrack = async (formData) => {
  // formData must contain file, title, hover_info, location_id
  const r = await authFetch("/tracks/upload", { method: "POST", body: formData });
  if (!r.ok) throw new Error(`upload failed (${r.status})`);
  return r.json();
};

export const createLocation = async (locationData) => {
  const r = await authFetch("/locations/", {
    method: "POST",
    body: JSON.stringify(locationData),
  });
  if (!r.ok) throw new Error(`create location failed (${r.status})`);
  return r.json();
};

// ==========================
export async function login(password){
  const r = await fetch(`${API_BASE_URL}/auth/login`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ password })
  });
  if(r.status === 429) throw new Error("Too many attempts, try again in 15 minutes");
  if(!r.ok) throw new Error("Wrong password");
  return r.json();          //  { token:"…" }
}
export async function authFetch(path, opts = {}) {
  const token = localStorage.getItem("admTok") || "";
  const headers = { ...opts.headers, Authorization: token };
  // FormData must set its own multipart boundary, so only JSON bodies get a Content-Type
  if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const r = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers });
  if (r.status === 401) {
    // token expired or backend restarted: drop it so /admin shows the login form again
    localStorage.removeItem("admTok");
    alert("Admin session expired - please log in again.");
    window.location.assign("/admin");
  }
  return r;
}

export async function getPosts(skip = 0, limit =10) {
  const r = await fetch(`${API_BASE_URL}/posts?skip=${skip}&limit=${limit}`);
  return r.json();
}

export async function getPost(id) {
  const res = await fetch(`${API_BASE_URL}/posts/${id}`);
  return res.json();
}

export async function createPost(data) {
  const res = await authFetch("/posts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePost(id, data) {
  const res = await authFetch(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePost(id) {
  const res = await authFetch(`/posts/${id}`, { method: "DELETE" });
  return res.json();
}

// api.js
export async function getAbout() {
  const r = await fetch(`${API_BASE_URL}/about/`);
  return r.json();
}
export async function saveAbout(html) {
  return authFetch("/about/", {
    method: "PUT",
    body: JSON.stringify({ html }),
  });
}

export async function getTags() {
  const r = await fetch(`${API_BASE_URL}/tracks/tags`);
  return r.ok ? r.json() : [];
}

export async function subscribeNewsletter(email, website = "") {
  const r = await fetch(`${API_BASE_URL}/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, website }),
  });
  if (r.status === 429 || r.status === 503) throw new Error("busy");
  if (!r.ok) throw new Error("invalid email");
  return r.json();
}

export async function getSubscribers() {
  const r = await authFetch("/newsletter/subscribers");
  return r.ok ? r.json() : [];
}
