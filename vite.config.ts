import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const indexPath = resolve(__dirname, 'dist/index.html');
      const fallbackPath = resolve(__dirname, 'dist/404.html');
      if (existsSync(indexPath)) {
        copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '@apis', replacement: '/src/apis' },
      { find: '@components', replacement: '/src/components' },
      { find: '@commons', replacement: '/src/components/common' },
      { find: '@modals', replacement: '/src/components/modal' },
      { find: '@pages', replacement: '/src/pages' },
      { find: '@layouts', replacement: '/src/layouts' },
      { find: '@assets', replacement: '/src/assets' },
      { find: '@routes', replacement: '/src/routes' },
    ],
  },
  server: { port: 5173 },
});
