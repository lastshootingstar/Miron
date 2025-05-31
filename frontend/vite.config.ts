import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateCSP } from './src/middleware';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        headers: {
            'Content-Security-Policy': generateCSP(),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    utils: ['axios']
                }
            }
        }
    }
}); 