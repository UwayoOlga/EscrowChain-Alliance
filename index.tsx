import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { MeshProvider } from "@meshsdk/react";

console.log("Index.tsx is executing!");

const rootElement = document.getElementById('root');
console.log("Root element found:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  try {
    root.render(
      <React.StrictMode>
        <MeshProvider>
          <div style={{ padding: 20, background: 'cyan', color: 'black' }}>
            <h1>MeshProvider Test</h1>
            <p>If you see this, MeshProvider initialized successfully.</p>
          </div>
        </MeshProvider>
      </React.StrictMode>
    );
    console.log("Render called successfully.");
  } catch (err) {
    console.error("Render failed:", err);
  }
} else {
  console.error("FATAL: Root element not found!");
}
