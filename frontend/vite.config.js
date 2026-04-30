import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { normalizeApiUrl } from './src/config.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devApiTarget =
    normalizeApiUrl(env.VITE_SERVER_IP) || "http://localhost:3002";

  return {
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
  };
});
