import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Types
export interface SearchResult {
    title: string;
    abstract?: string;
    authors?: string[];
    year?: string;
    doi?: string;
    url?: string;
    score: number;
}

export interface SearchResponse {
    results: SearchResult[];
    total_count: number;
    current_page: number;
    total_pages: number;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await api.post('/api/login', credentials);
        return response.data;
    },
};

// Search API
export const searchAPI = {
    crowSearch: async (query: string): Promise<SearchResponse> => {
        const response = await api.post('/api/crow-search', { query });
        return response.data;
    },
    
    search: async (query: string, page: number = 1): Promise<SearchResponse> => {
        const response = await api.get(`/search?query=${encodeURIComponent(query)}&page=${page}`);
        return response.data;
    },
    
    suggestions: async (query: string): Promise<string[]> => {
        const response = await api.get(`/suggestions?query=${encodeURIComponent(query)}`);
        return response.data.suggestions;
    },
};

export default api;
