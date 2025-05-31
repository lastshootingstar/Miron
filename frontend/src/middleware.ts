import { CSP } from './utils/csp';

export function generateCSP() {
    // Convert the CSP object into a string
    const csp = Object.entries(CSP)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');

    return csp;
}

export function middleware(req: Request) {
    const headers = new Headers(req.headers);
    
    // Add CSP header
    headers.set(
        'Content-Security-Policy',
        generateCSP()
    );

    // Add other security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return new Response(null, {
        status: 200,
        headers
    });
} 