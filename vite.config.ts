import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/tikz-preview': {
                target: 'http://localhost:3010',
                changeOrigin: true,
            },
        },
    },
});
