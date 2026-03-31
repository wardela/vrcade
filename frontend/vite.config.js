import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const devApiTarget = process.env.VITE_DEV_API_TARGET || 'http://82.29.179.227:8082';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure React builds to "dist"
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0', // Bind to all IP addresses
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: './', // Use relative paths for assets
});
