import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = process.env.FLOWOPS_API_URL || 'http://127.0.0.1:8011';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: Object.fromEntries(
      ['/api', '/login', '/logout', '/sanctum', '/up'].map((path) => [
        path,
        { target: backend, changeOrigin: false },
      ]),
    ),
  },
  test: { environment: 'node' },
});
