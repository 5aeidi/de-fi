// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";          // ← no Link here
import MapPage from "./MapPage";
import AdminPage from "./AdminPage";
import Header from "./Header";
import BlogListPage from "./BlogListPage";
import BlogPostPage from "./BlogPostPage";
import AdminBlogPage from "./AdminBlogPage";
import PlayerManager from "./PlayerManager";
import AboutPage from "./AboutPage";

const token = localStorage.getItem("admTok") || "";

export default function App() {
  return (
    <>
    <PlayerManager /> 
    <Router>
      <Header />                      {/* the new bar with its own <Link>s */}

      <Routes>
        <Route path="/admin" element={<AdminPage token={token} />} />
        <Route path="/" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />   
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/blog" element={<AdminBlogPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />
      </Routes>
    </Router>
    </>
  );
}
