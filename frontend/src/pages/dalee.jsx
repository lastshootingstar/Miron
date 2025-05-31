import React, { useState } from "react";

export default function Dalee() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [overallSummary, setOverallSummary] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setArticles([]);
    setOverallSummary("");
    try {
      const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await res.json();
      console.log('Search results:', data);
      const withSummaries = data.results.map((a) => ({
        ...a,
        summary: null,
        summarizing: false,
        stats: null,
        appraisal: null
      }));
      setArticles(withSummaries);
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const summarizeOne = async (index) => {
    const abstract = articles[index].abstract;
    const updated = [...articles];
    updated[index].summarizing = true;
    setArticles(updated);
    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract })
      });
      const data = await res.json();
      updated[index].summary = data.summary;
    } catch (err) {
      updated[index].summary = "Failed to summarize.";
    } finally {
      updated[index].summarizing = false;
      setArticles(updated);
    }
  };

  const fetchStats = async (index) => {
    const abstract = articles[index].abstract;
    const updated = [...articles];
    try {
      const res = await fetch("http://localhost:8000/statistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract })
      });
      const data = await res.json();
      updated[index].stats = data.stats;
      setArticles(updated);
    } catch (err) {
      updated[index].stats = "Failed to extract statistics.";
      setArticles(updated);
    }
  };

  const fetchAppraisal = async (index) => {
    const abstract = articles[index].abstract;
    const updated = [...articles];
    try {
      const res = await fetch("http://localhost:8000/appraisal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract })
      });
      const data = await res.json();
      updated[index].appraisal = data.appraisal;
      setArticles(updated);
    } catch (err) {
      updated[index].appraisal = "Failed to perform critical appraisal.";
      setArticles(updated);
    }
  };

  const summarizeAll = async () => {
    const abstracts = articles.map((a) => a.abstract);
    setOverallSummary("Loading overall summary...");
    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstracts })
      });
      const data = await res.json();
      setOverallSummary(data.output);
    } catch (err) {
      setOverallSummary("Failed to generate overall summary.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-xl shadow text-white">
      <h2 className="text-2xl font-semibold mb-4 text-teal-300">DALEE – Literature Gap Analyzer</h2>
      <p className="text-gray-400 mb-6">Enter a research topic to fetch papers from PubMed and analyze them.</p>

      <textarea
        className="w-full p-4 bg-gray-900 text-white border border-gray-700 rounded-md mb-4"
        rows="3"
        placeholder="e.g. Post-COVID lung fibrosis in adolescents"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={handleSearch}
        disabled={!query || loading}
        className="px-6 py-2 bg-teal-500 hover:bg-teal-400 rounded-md font-semibold disabled:opacity-50"
      >
        {loading ? "Fetching..." : "Search PubMed"}
      </button>

      {articles.length > 0 && (
        <div className="mt-6 space-y-6">
          {articles.map((article, idx) => (
            <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white">{article.title}</h3>
              <p className="text-sm text-gray-400 italic mb-2">Year: {article.year}</p>
              <p className="text-sm text-gray-300 mb-2">Authors: {article.authors.join(", ")}</p>
              <p className="text-gray-200 text-sm mb-2">{article.abstract}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => summarizeOne(idx)}
                  className="px-4 py-1 text-sm bg-teal-600 rounded hover:bg-teal-500"
                  disabled={article.summarizing}
                >
                  {article.summarizing ? "Summarizing..." : "Summarize"}
                </button>
                <button
                  onClick={() => fetchStats(idx)}
                  className="px-4 py-1 text-sm bg-blue-600 rounded hover:bg-blue-500"
                >
                  Statistics
                </button>
                <button
                  onClick={() => fetchAppraisal(idx)}
                  className="px-4 py-1 text-sm bg-yellow-600 rounded hover:bg-yellow-500"
                >
                  Critical Appraisal
                </button>
              </div>

              {article.summary && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600 text-sm text-teal-200 leading-relaxed">
                  <h4 className="text-lg font-semibold mb-2 text-white">📝 Summary</h4>
                  <p className="whitespace-pre-wrap">{article.summary}</p>
                </div>
              )}

              {article.stats && (
                <div className="mt-4 p-4 bg-blue-900 rounded-lg border border-blue-600 text-sm text-blue-100 leading-relaxed">
                  <h4 className="text-lg font-semibold mb-2 text-white">📊 Statistical Insights</h4>
                  <p className="whitespace-pre-wrap">{article.stats}</p>
                </div>
              )}

              {article.appraisal && (
                <div className="mt-4 p-4 bg-yellow-900 rounded-lg border border-yellow-600 text-sm text-yellow-100 leading-relaxed">
                  <h4 className="text-lg font-semibold mb-2 text-white">🧠 Critical Appraisal</h4>
                  <p className="whitespace-pre-wrap">{article.appraisal}</p>
                </div>
              )}
            </div>
          ))}

          {/* Final Summary Section */}
          <div className="mt-10">
            <button
              onClick={summarizeAll}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-semibold"
            >
              Generate Overall Summary + Gaps
            </button>
            {overallSummary && (
              <div className="mt-4 p-4 bg-purple-800 text-white rounded-md whitespace-pre-wrap leading-relaxed">
                <strong>Overall Analysis:</strong>
                <div>{overallSummary}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
