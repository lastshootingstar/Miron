// Content Security Policy configuration
export const CSP = {
    'default-src': ["'self'"],
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        'http://localhost:8000',  // Backend API
        'https://api.futurehouse.org'  // FutureHouse API
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': [
        "'self'",
        'http://localhost:8000',
        'https://api.futurehouse.org',
        'ws://localhost:*'  // For development hot reload
    ],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'self'"]
}; 