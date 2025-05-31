import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function SystematicReview() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [included, setIncluded] = useState(() => {
    const saved = localStorage.getItem("includedArticles");
    return saved ? JSON.parse(saved) : [];
  });
  const [excluded, setExcluded] = useState(() => {
    const saved = localStorage.getItem("excludedArticles");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  // Suggestions for search queries
  const [suggestions, setSuggestions] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Chatbot query and response state
  const [chatbotQuery, setChatbotQuery] = useState("");
  const [chatbotResponses, setChatbotResponses] = useState({});

  // PICOT fields
  const [population, setPopulation] = useState("");
  const [intervention, setIntervention] = useState("");
  const [comparison, setComparison] = useState("");
  const [outcome, setOutcome] = useState("");
  const [studyType, setStudyType] = useState("RCT");
  const [timeFrame, setTimeFrame] = useState("");

  // Full text state
  const [selectedFullTexts, setSelectedFullTexts] = useState({});
  const [fullTextLoading, setFullTextLoading] = useState(false);
  const [fullTextChatQuery, setFullTextChatQuery] = useState("");
  const [fullTextChatResponse, setFullTextChatResponse] = useState("");

  // Add new state for chat history
  const [chatHistory, setChatHistory] = useState({});

  // Add new state for full text content
  const [fullTextContent, setFullTextContent] = useState({});

  // Add new state for PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState({});

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  const location = useLocation();

  // Handle input changes and debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]); // Clear suggestions when query is empty
    }
  }, [debouncedQuery]);

  // Function to suggest search queries based on the current query
  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(`http://localhost:8000/suggestions?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]); // If no suggestions are found
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]); // Clear suggestions on error
    }
  };

  const handleSearch = async (page = 1, searchQuery = query) => {
    setLoading(true);
    try {
        console.log('Starting search with query:', searchQuery, 'page:', page);
        const res = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(searchQuery)}&page=${page}`);
        if (!res.ok) {
            throw new Error('Failed to fetch articles');
        }
        const data = await res.json();
        console.log('Search response data:', data);
        
        if (data.results) {
            console.log('Setting articles:', data.results.length);
            console.log('Setting current page:', data.current_page);
            console.log('Setting total pages:', data.total_pages);
            console.log('Setting total results:', data.total_count);
            
            setArticles(data.results);
            setCurrentPage(data.current_page || 1);
            setTotalPages(data.total_pages || 1);
            setTotalResults(data.total_count || 0);
            setLastSearchQuery(searchQuery);
        }
    } catch (err) {
        console.error("Error fetching articles:", err);
        setArticles([]);
        setTotalPages(1);
        setCurrentPage(1);
        setTotalResults(0);
    } finally {
        setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        handleSearch(newPage, lastSearchQuery || query);
    }
  };

  // Function to send a query to the chatbot about an article
  const askAboutArticle = async (articleContent, userQuery, index) => {
    try {
      const res = await fetch("http://localhost:8000/ask-about-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article_content: articleContent,  // This can be the abstract or title of the article
          query: userQuery,
        }),
      });
      const data = await res.json();
      setChatbotResponses((prev) => ({ ...prev, [index]: data.response }));
    } catch (err) {
      console.error("Error getting chatbot response:", err);
      setChatbotResponses((prev) => ({ ...prev, [index]: "Sorry, I couldn't answer your query." }));
    }
  };

  // Function to handle the user submitting the query
  const handleQuerySubmit = async (article, index) => {
    try {
      const history = chatHistory[index] || [];
      
      const response = await fetch("http://localhost:8000/ask-about-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_content: article.abstract,
          query: chatbotQuery,
          context: `This is a ${article.type || 'research'} article titled "${article.title}" from ${article.year}`,
          history: history
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      
      // Update chat history
      const newHistory = [...history, { q: chatbotQuery, a: data.response }];
      setChatHistory(prev => ({ ...prev, [index]: newHistory }));
      
      // Update chat responses with confidence indicator
      setChatbotResponses(prev => ({
        ...prev,
        [index]: {
          text: data.response,
          confidence: data.confidence
        }
      }));
      
      setChatbotQuery(""); // Clear the input
    } catch (error) {
      console.error('Error asking about article:', error);
      setChatbotResponses(prev => ({
        ...prev,
        [index]: {
          text: "Failed to get response. Please try again.",
          confidence: "error"
        }
      }));
    }
  };

  const summarize = async (index) => {
    const abstract = articles[index].abstract;
    const updated = [...articles];
    try {
      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abstract }),
      });
      const data = await res.json();
      updated[index].summary = data.summary;
    } catch (err) {
      updated[index].summary = "Failed to summarize.";
    }
    setArticles(updated);
  };

  const handleDecision = async (index, decision) => {
    const article = articles[index];
    if (decision === "include") {
      try {
        const res = await fetch("http://localhost:8000/extract-study-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abstract: article.abstract }),
        });
        const data = await res.json();
        article.extracted = data;
      } catch {
        article.extracted = {
          sample_size: "N/A",
          outcome: "N/A",
          effect_size: "N/A",
          confidence_interval: "N/A",
        };
      }
      setIncluded((prev) => {
        const updated = [...prev, article];
        localStorage.setItem("includedArticles", JSON.stringify(updated));
        return updated;
      });
    } else if (decision === "exclude") {
      setExcluded((prev) => {
        const updated = [...prev, article];
        localStorage.setItem("excludedArticles", JSON.stringify(updated));
        return updated;
      });
    }
    
    // Update the article's status in the list
    const updated = [...articles];
    updated[index] = {
      ...article,
      status: decision
    };
    setArticles(updated);
  };

  const handleRemove = (index) => {
    const articleToRemove = included[index];
    const updatedIncluded = included.filter((_, i) => i !== index);
    setIncluded(updatedIncluded);
    localStorage.setItem("includedArticles", JSON.stringify(updatedIncluded));
    setExcluded((prev) => [...prev, articleToRemove]);
    localStorage.setItem("excludedArticles", JSON.stringify([...excluded, articleToRemove]));
  };

  const handleViewFullText = async (article, index) => {
    setFullTextLoading(true);
    try {
      const res = await fetch("http://localhost:8000/get-full-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          doi: article.doi,
          pmid: article.pmid,
          pmcid: article.pmcid
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch full text');
      }
      
      // Use article PMID as key instead of index
      const cacheKey = article.pmid || `${article.title}-${index}`;
      
      // Store the full text content
      setFullTextContent(prev => ({
        ...prev,
        [cacheKey]: {
          htmlUrl: data.htmlUrl,
          pdfUrl: data.pdfUrl,
          source: data.source,
          message: data.message,
          embedPdf: data.embedPdf
        }
      }));

      // Only open in new tab if we don't have a PDF to embed
      if (data.htmlUrl && !data.embedPdf) {
        window.open(data.htmlUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Error fetching full text:', error);
      setError(`Failed to get full text: ${error.message}`);
    } finally {
      setFullTextLoading(false);
    }
  };

  const askAboutFullText = async (article, index) => {
    try {
      const fullText = fullTextContent[index]?.fullText;
      if (!fullText) {
        setFullTextChatResponse("No full text content available to analyze.");
        return;
      }
      
      const history = chatHistory[`fulltext-${index}`] || [];
      
      const response = await fetch("http://localhost:8000/ask-about-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_content: fullText,
          query: fullTextChatQuery,
          context: `This is the full text of a ${article.type || 'research'} article titled "${article.title}" from ${article.year}`,
          history: history
        }),
      });
      
      if (!response.ok) throw new Error('Failed to analyze full text');
      const data = await response.json();
      
      // Update chat history for full text
      const newHistory = [...history, { q: fullTextChatQuery, a: data.response }];
      setChatHistory(prev => ({ ...prev, [`fulltext-${index}`]: newHistory }));
      
      setFullTextChatResponse(data.response);
      setFullTextChatQuery(""); // Clear input
      
    } catch (error) {
      console.error('Error analyzing full text:', error);
      setFullTextChatResponse("Failed to analyze full text. Please try again.");
    }
  };

  const getFullText = async (article) => {
    try {
      const response = await fetch('http://localhost:8000/api/get-full-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doi: article.doi,
          pmcid: article.pmcid,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting full text:', error);
      return null;
    }
  };

  const handlePdfUpload = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('query', query);

    try {
      const response = await fetch('http://localhost:8003/api/askpdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
  };

  // Handle URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlQuery = searchParams.get("query");
    if (urlQuery) {
      setQuery(urlQuery);
      handleSearch(1, urlQuery);
    }
  }, [location.search]); // Re-run when URL changes

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      <h2 className="text-3xl font-bold mb-6 text-teal-400">Systematic Review Assistant</h2>

      {/* PICOT Protocol Builder */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-semibold mb-4 text-teal-300">🧪 PICOT Protocol Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Population"
            value={population}
            onChange={(e) => setPopulation(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          />
          <input
            placeholder="Intervention"
            value={intervention}
            onChange={(e) => setIntervention(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          />
          <input
            placeholder="Comparator"
            value={comparison}
            onChange={(e) => setComparison(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          />
          <input
            placeholder="Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          />
          <select
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          >
            <option value="RCT">RCT</option>
            <option value="Cohort">Cohort</option>
            <option value="Case-Control">Case-Control</option>
          </select>
          <input
            placeholder="Time Frame (e.g. 2010–2024)"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="bg-gray-900 p-2 rounded border border-gray-700"
          />
        </div>
      </div>

      {/* Search Input with Suggestions */}
      <textarea
        className="w-full p-4 bg-gray-800 border border-gray-700 rounded mb-4"
        rows="3"
        placeholder="Search query (e.g. mindfulness for adolescent anxiety)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {suggestions.length > 0 && (
        <div className="bg-gray-800 p-2 mt-2 rounded-lg border border-gray-700">
          <h4 className="text-teal-300">Suggestions:</h4>
          <ul>
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-gray-300">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => handleSearch(1)}
        className="bg-teal-500 hover:bg-teal-400 px-6 py-2 rounded font-semibold disabled:opacity-50 mb-4"
        disabled={!query || loading}
      >
        {loading ? "Searching..." : "Search Articles"}
      </button>

      {/* Debug info */}
      <div className="text-xs text-gray-500 mb-2">
          Debug: Articles: {articles.length}, Current Page: {currentPage}, Total Pages: {totalPages}, Total Results: {totalResults}
      </div>

      {/* Pagination Controls - Below search bar but above articles */}
      {articles.length > 0 && (
          <div className="bg-gray-900 shadow-lg border border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                  <div className="text-teal-400 font-semibold">
                      Showing results {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalResults)} of {totalResults}
                  </div>
                  <div className="flex items-center space-x-4">
                      <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-teal-600 rounded disabled:opacity-50 hover:bg-teal-500"
                      >
                          First
                      </button>
                      <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-teal-600 rounded disabled:opacity-50 hover:bg-teal-500"
                      >
                          Previous
                      </button>
                      
                      <div className="flex items-center space-x-2">
                          <span className="text-gray-400">Page</span>
                          <input
                              type="number"
                              min="1"
                              max={totalPages}
                              value={currentPage}
                              onChange={(e) => {
                                  const page = parseInt(e.target.value);
                                  if (page >= 1 && page <= totalPages) {
                                      handlePageChange(page);
                                  }
                              }}
                              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center"
                          />
                          <span className="text-gray-400">of {totalPages}</span>
                      </div>
                      
                      <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-teal-600 rounded disabled:opacity-50 hover:bg-teal-500"
                      >
                          Next
                      </button>
                      <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-teal-600 rounded disabled:opacity-50 hover:bg-teal-500"
                      >
                          Last
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Articles List */}
      {articles.map((a, idx) => (
        <div key={idx} className="bg-gray-900 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <span className="text-teal-400 font-bold mr-2">#{a.number}</span>
              <span className="bg-blue-500 text-xs px-2 py-1 rounded mr-2">{a.article_type}</span>
              {a.full_text_available && (
                <span className="bg-green-500 text-xs px-2 py-1 rounded">Full Text Available</span>
              )}
              {a.status && (
                <span className={`text-xs px-2 py-1 rounded ml-2 ${
                  a.status === 'include' ? 'bg-green-700' : 'bg-red-700'
                }`}>
                  {a.status === 'include' ? 'Included' : 'Excluded'}
                </span>
              )}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{a.title}</h3>
          <p className="text-sm text-gray-400 italic mb-2">Year: {a.year}</p>
          <p className="text-sm text-gray-300 mb-2">Authors: {a.authors.join(", ")}</p>
          <p className="text-gray-200 text-sm mb-2">{a.abstract}</p>

          {/* Chatbot for abstract */}
          <div className="mt-4">
            <textarea
              className="w-full p-4 bg-gray-800 border border-gray-700 rounded mb-4"
              rows="3"
              placeholder="Ask a question about this article..."
              value={chatbotQuery}
              onChange={(e) => setChatbotQuery(e.target.value)}
            />
            <button
              onClick={() => handleQuerySubmit(a, idx)}
              className="bg-purple-600 hover:bg-purple-500 px-4 py-1 rounded text-sm"
            >
              Ask
            </button>

            {/* Display chat history */}
            {chatHistory[idx]?.map((chat, chatIdx) => (
              <div key={chatIdx} className="mt-2 text-sm">
                <div className="text-purple-400">Q: {chat.q}</div>
                <div className="text-teal-200">A: {chat.a}</div>
              </div>
            ))}

            {/* Display current response with confidence */}
            {chatbotResponses[idx] && (
              <div className={`mt-4 p-3 rounded text-sm ${
                chatbotResponses[idx].confidence === "high" 
                  ? "bg-gray-800 text-teal-200"
                  : "bg-gray-800 text-yellow-200"
              }`}>
                {chatbotResponses[idx].text}
              </div>
            )}
          </div>

          {/* Full text section */}
          <div className="flex flex-col space-y-2 mt-4">
            {/* View Full Text Button */}
            {a.full_text_available && (
              <button
                onClick={() => handleViewFullText(a, idx)}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm w-fit"
                disabled={fullTextLoading}
              >
                {fullTextLoading ? "Loading..." : "📄 View Full Text"}
              </button>
            )}
            
            {/* Full Text Content */}
            {fullTextContent[a.pmid || `${a.title}-${idx}`] && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">{fullTextContent[a.pmid || `${a.title}-${idx}`].message}</p>
                
                {/* PDF Viewer */}
                {fullTextContent[a.pmid || `${a.title}-${idx}`].embedPdf && fullTextContent[a.pmid || `${a.title}-${idx}`].pdfUrl && (
                  <div className="mt-4 bg-gray-900 p-4 rounded-lg">
                    <iframe
                      src={`http://localhost:8000${fullTextContent[a.pmid || `${a.title}-${idx}`].pdfUrl}`}
                      className="w-full h-[800px] rounded-lg"
                      title="PDF Viewer"
                    />
                  </div>
                )}
                
                {/* External Link */}
                {fullTextContent[a.pmid || `${a.title}-${idx}`].htmlUrl && (
                  <a 
                    href={fullTextContent[a.pmid || `${a.title}-${idx}`].htmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    View on {fullTextContent[a.pmid || `${a.title}-${idx}`].source}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-4">
            <button onClick={() => summarize(idx)} className="bg-purple-600 hover:bg-purple-500 px-4 py-1 rounded text-sm">Summarize</button>
            {!a.status && (
              <>
                <button onClick={() => handleDecision(idx, "include")} className="bg-green-600 hover:bg-green-500 px-4 py-1 rounded text-sm">✅ Include</button>
                <button onClick={() => handleDecision(idx, "exclude")} className="bg-red-600 hover:bg-red-500 px-4 py-1 rounded text-sm">❌ Exclude</button>
              </>
            )}
          </div>

          {a.summary && (
            <div className="mt-3 p-3 bg-gray-800 rounded text-sm text-teal-200">
              <strong>Summary:</strong> {a.summary}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}