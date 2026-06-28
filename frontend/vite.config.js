import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      events: resolve(__dirname, './src/stubs.js'),
      util: resolve(__dirname, './src/stubs.js'),
      stream: resolve(__dirname, './src/stubs.js'),
    },
  },
  define: {
    global: "window",
    "process.env": {},
    "process.browser": true,
    "process.version": '""',
    "process.argv": "[]",
    Buffer: 'globalThis.Buffer',
  },
  build: {
    target: 'es2022'
  }
})
