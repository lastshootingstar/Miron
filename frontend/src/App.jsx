import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Dalee from "./pages/Dalee";
import Picot from "./pages/Picot";
import Results from "./pages/Results";
import SystematicReview from "./pages/SystematicReview";
import BYT from "./pages/byt";
import Login from "./pages/Login";  // Import Login page
import CrowSearch from './pages/CrowSearch';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Toggle sidebar state
  const toggleSidebar = () => setCollapsed(!collapsed);

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-white">
        {isAuthenticated && (
          <Sidebar collapsed={collapsed} toggleCollapse={toggleSidebar} />
        )}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-800 rounded-tl-2xl shadow-lg">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Home />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/dalee"
              element={
                isAuthenticated ? (
                  <Dalee />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/picot"
              element={
                isAuthenticated ? (
                  <Picot />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/results"
              element={
                isAuthenticated ? (
                  <Results />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/systematic-review"
              element={
                isAuthenticated ? (
                  <SystematicReview />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/byt"
              element={
                isAuthenticated ? (
                  <BYT />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/crow-search"
              element={
                isAuthenticated ? (
                  <CrowSearch />
                ) : (
                  <Navigate to="/login" /> // Redirect to login if not authenticated
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
