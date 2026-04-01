import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    server: {
        proxy: {
            '/svgs': {
                target: 'http://localhost:3010',
                changeOrigin: true,
            },
            '/events': {
                target: 'http://localhost:3010',
                changeOrigin: true,
            },
            '/files': {
                target: 'http://localhost:3010',
                changeOrigin: true,
            },
            '/assets': {
                target: 'http://localhost:3010',
                changeOrigin: true,
            },
        },
    },
});
