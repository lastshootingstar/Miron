import React, { useState } from "react";

export default function Picot() {
  const [form, setForm] = useState({
    topic: "",
    p: "",
    i: "",
    c: "",
    o: "",
    t: ""
  });
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setTitles("");
    try {
      const res = await fetch("http://localhost:8000/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setTitles(data.titles);
    } catch (err) {
      console.error("Error generating titles:", err);
      setTitles("Failed to generate titles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-white bg-gray-800 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4 text-yellow-300">📄 PICOT Study Title Generator</h2>
      <p className="text-gray-400 mb-6">Enter your research question using the PICOT format to generate academic study titles.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="topic" placeholder="Topic" value={form.topic} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
        <input name="p" placeholder="Population (P)" value={form.p} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
        <input name="i" placeholder="Intervention (I)" value={form.i} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
        <input name="c" placeholder="Comparator (C)" value={form.c} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
        <input name="o" placeholder="Outcome (O)" value={form.o} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
        <input name="t" placeholder="Timeframe (T)" value={form.t} onChange={handleChange}
          className="p-2 rounded bg-gray-900 border border-gray-700 text-white" />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-md font-semibold disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Titles"}
      </button>

      {titles && (
        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded text-yellow-100 whitespace-pre-wrap">
          <strong>Generated Titles:</strong>
          <div className="mt-2">{titles}</div>
        </div>
      )}
    </div>
  );
}
