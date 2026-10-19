import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Force browser to bust favicon cache and display the new logo
const forceFaviconRefresh = () => {
  const existing = document.querySelectorAll("link[rel*='icon']");
  existing.forEach((el) => el.remove());
  const link = document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = `/favicon.png?v=${Date.now()}`;
  document.head.appendChild(link);
};
forceFaviconRefresh();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
