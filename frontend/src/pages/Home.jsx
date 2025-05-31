import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("systematic"); // "systematic" or "crow"
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchType === "systematic") {
        navigate(`/systematic-review?query=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/crow-search?query=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  // Example suggested questions
  const suggestedQuestions = [
    "What are some likely mechanisms by which mutations near the HTRA1 locus in humans might be causal for age-related macular degeneration?",
    "How might you capture electron transfer effects using classical force fields for molecular dynamics simulations of protein-protein interactions?",
    "How compelling is genetic evidence for targeting PTH1R in small cell lung cancer?",
    "What factors limit the wavelengths of light detectable by mammalian eyes?"
  ];

  return (
    <div className="flex flex-col min-h-[80vh] p-8">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-16 text-center">
        <span className="text-white">Autonomous </span>
        <span className="text-red-500">AI</span>
        <span className="text-white"> for Scientific Discovery</span>
      </h1>

      {/* Search Section */}
      <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto mb-12">
        <div className="flex flex-col gap-4">
          {/* Search Type Toggle */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => setSearchType("systematic")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                searchType === "systematic"
                  ? "bg-red-500 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              Systematic Review
            </button>
            <button
              type="button"
              onClick={() => setSearchType("crow")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                searchType === "crow"
                  ? "bg-red-500 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]"
              }`}
            >
              Crow Search
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center bg-[#1a1a1a] rounded-lg border border-gray-700 p-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchType === "systematic" ? "Enter your research question..." : "Ask Crow anything..."}
              className="flex-1 bg-transparent border-none text-white text-base p-4 focus:outline-none placeholder-gray-500"
            />

            {/* AI Indicators */}
            <div className="flex items-center gap-2 px-4">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">🤖</div>
              <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center">↻</div>
            </div>
          </div>
        </div>
      </form>

      {/* Food for thought section */}
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-gray-500 mb-4 text-base">Food for thought:</h2>
        <div className="space-y-3">
          {suggestedQuestions.map((question, index) => (
            <div
              key={index}
              onClick={() => {
                setSearchQuery(question);
                navigate(`/${searchType === "systematic" ? "systematic-review" : "crow-search"}?query=${encodeURIComponent(question)}`);
              }}
              className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-700 cursor-pointer hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-500">▶</span>
                <span className="text-white">{question}</span>
              </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}