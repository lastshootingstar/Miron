import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in first!");
      return;
    }

    axios
      .get("http://localhost:8000/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage("Session expired. Please log in again."));
  }, []);

  return <div>{message}</div>;
}
