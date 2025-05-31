import React, { useState } from 'react';
import { searchAPI, SearchResponse } from '../services/api';

interface SearchBarProps {
    onSearchResults: (results: SearchResponse) => void;
    onError: (error: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults, onError }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const results = await searchAPI.crowSearch(query.trim());
            onSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            onError('Failed to perform search. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto" id="search-form" name="search-form">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    id="search-query"
                    name="search-query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search research papers..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    aria-label="Search query"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    id="search-submit"
                    name="search-submit"
                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoading}
                    aria-label={isLoading ? 'Searching...' : 'Search'}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>
        </form>
    );
};

export default SearchBar; 