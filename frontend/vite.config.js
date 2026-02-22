import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@store': path.resolve(__dirname, './src/store'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Use explicit 127.0.0.1 to avoid Node 18+ resolving localhost→::1 (IPv6)
        target: process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_BACKEND_URL || 'ws://127.0.0.1:8001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          editor: ['@monaco-editor/react'],
          charts: ['recharts'],
        },
      },
    },
  },
});
