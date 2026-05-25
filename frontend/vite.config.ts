import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  server: {
    port: 5173,
    host: 'localhost',
    hmr: {
      port: 5173,
    },
  },
  css: {
    devSourcemap: false,
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'process', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: 'globalThis',
    'process.version': JSON.stringify('v18.0.0'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  build: {
    sourcemap: false,
    target: 'esnext'
  },
  optimizeDeps: {
    include: ['lodash', 'recharts', '@cardano-sdk/util', '@cardano-sdk/core', '@cardano-sdk/crypto', 'bech32', 'blake2b', 'blakejs', 'bip39'],
    exclude: ['@meshsdk/core', '@meshsdk/react', '@harmoniclabs/uplc', '@harmoniclabs/plutus-data'],
  }
});
