import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MeshProvider } from "@meshsdk/react";

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
