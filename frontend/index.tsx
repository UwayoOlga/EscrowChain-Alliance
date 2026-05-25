import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { MeshProvider } from "@meshsdk/react";

console.log("Index.tsx is executing!");

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <MeshProvider>
        <App />
      </MeshProvider>
    </React.StrictMode>
  );
}
