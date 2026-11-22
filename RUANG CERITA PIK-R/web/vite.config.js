import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev: API diteruskan ke backend (bawaan produksi 25552; preview/sandbox lewat VITE_PROXY_TARGET)
const API = process.env.VITE_PROXY_TARGET || 'http://localhost:25552';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 25556,
    host: true,
    allowedHosts: true,
    proxy: { '/api': API, '/uploads': API }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'zustand', 'axios']
        }
      }
    }
  }
});
