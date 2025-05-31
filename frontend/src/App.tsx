import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import SearchBar from './components/SearchBar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div className="container mx-auto px-4 py-8">
                                <h1 className="text-3xl font-bold mb-8 text-center">
                                    Research Paper Search
                                </h1>
                                <SearchBar
                                    onSearchResults={(results) => console.log(results)}
                                    onError={(error) => console.error(error)}
                                />
                            </div>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App; 