import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      { find: '@hooks', replacement: '/src/hooks' },
      { find: '@datas', replacement: '/src/datas' },
    ],
  },
});
