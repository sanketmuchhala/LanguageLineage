import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Serve static HTML files from public/ before falling through to SPA
    {
      name: 'static-html-pages',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? '/';
          const candidates = [
            join('public', url, 'index.html'),
            join('public', url.replace(/\/$/, ''), 'index.html'),
          ];
          for (const candidate of candidates) {
            if (existsSync(candidate)) {
              res.setHeader('Content-Type', 'text/html');
              res.end(readFileSync(candidate));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'cytoscape-vendor': ['cytoscape', 'cytoscape-cose-bilkent'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  publicDir: 'public', // Copies /public/dataset to /dist/dataset
});
