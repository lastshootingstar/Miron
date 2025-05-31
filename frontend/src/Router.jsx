import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Dalee from "./pages/dalee";
import BYT from "./pages/byt";
import Login from "./pages/login";
import SystematicReview from "./pages/SystematicReview";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default function RouterSetup() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dalee"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dalee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/byt"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <BYT />
          </ProtectedRoute>
        }
      />
      <Route
        path="/systematic-review"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SystematicReview />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
