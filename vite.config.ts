import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Serve static HTML files from public/ before falling through to SPA.
    // /explore (and /embed, for the same reason) are excluded even though
    // public/explore/index.html exists on disk: that file is a
    // production-only crawlable shell whose app entry tags only get patched
    // in by scripts/patchExplorePage.ts after a real `vite build`. In dev
    // mode it would serve the placeholder and break the live interactive
    // app; a developer running `npm run dev` should always see the real
    // thing, never the SEO shell.
    //
    // These two routes are served directly here, via server.transformIndexHtml
    // (Vite's documented API for a plugin to serve the dev-mode SPA shell for
    // a custom route), rather than calling next() and trusting Vite's own SPA
    // fallback: once public/explore/ exists as a real directory, Vite's own
    // internal middleware tries to resolve "/explore" as a module import
    // before ever reaching that fallback and throws ("this file is in
    // /public... should not be imported from source code"). Serving the
    // transformed shell ourselves sidesteps that entirely.
    {
      name: 'static-html-pages',
      configureServer(server) {
        const SPA_ONLY_ROUTES = new Set(['/explore', '/embed']);
        server.middlewares.use(async (req, res, next) => {
          const url = (req.url?.split('?')[0] ?? '/').replace(/\/$/, '') || '/';

          if (SPA_ONLY_ROUTES.has(url)) {
            const rawHtml = readFileSync('index.html', 'utf8');
            const html = await server.transformIndexHtml(req.url ?? url, rawHtml);
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
          }

          const candidate = join('public', url, 'index.html');
          if (existsSync(candidate)) {
            res.setHeader('Content-Type', 'text/html');
            res.end(readFileSync(candidate));
            return;
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
