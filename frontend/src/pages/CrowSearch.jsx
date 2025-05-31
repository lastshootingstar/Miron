import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';

export default function CrowSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    total_count: 0,
    current_page: 1,
    total_pages: 0
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', {
            state: { from: `/crow-search?query=${encodeURIComponent(query)}` }
          });
          return;
        }

        const data = await searchAPI.crowSearch(query);
        setResults(data.results || []);
        setPagination({
          total_count: data.total_count || 0,
          current_page: data.current_page || 1,
          total_pages: data.total_pages || 0
        });
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login', {
            state: { from: `/crow-search?query=${encodeURIComponent(query)}` }
          });
          return;
        }
        setError(err.message || 'Failed to fetch results');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, navigate]);

  if (!query) {
    return (
      <div className="p-8 text-center text-white">
        <h2 className="text-2xl">No search query provided</h2>
        <p className="mt-4 text-gray-400">Please enter a search query to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Search Results</h1>

      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Your Query</h2>
        <p className="text-gray-300">{query}</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-400">Searching through scientific literature...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
          <p className="mt-4 text-sm text-gray-400">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      )}

      {results.length > 0 && !loading && !error && (
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Found {pagination.total_count} Results
            </h2>
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={index} className="border-b border-gray-700 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-lg font-medium text-white mb-2">{result.title}</h3>
                  {result.abstract && (
                    <p className="text-gray-300 mb-3 line-clamp-3">{result.abstract}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {result.authors?.length > 0 && (
                      <span className="text-gray-400">{result.authors.join(', ')}</span>
                    )}
                    {result.year && <span className="text-gray-400">• {result.year}</span>}
                    {result.score && (
                      <span className="text-teal-500">• Score: {(result.score * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  {result.doi && (
                    <a
                      href={`https://doi.org/${result.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-red-500 hover:text-red-400 text-sm"
                    >
                      DOI: {result.doi}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <span className="text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700 text-center">
          <h3 className="text-xl font-semibold mb-2 text-white">No Results Found</h3>
          <p className="text-gray-300">Try adjusting your search query or using different keywords.</p>
        </div>
      )}
    </div>
  );
}
