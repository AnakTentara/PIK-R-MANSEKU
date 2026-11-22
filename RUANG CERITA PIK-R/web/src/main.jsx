import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/base.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" gutter={10} toastOptions={{
        duration: 2800,
        style: { borderRadius: '16px', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: '14px', boxShadow: '0 10px 30px rgba(60, 30, 10, .18)' },
        success: { iconTheme: { primary: '#15803d', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } }
      }} />
    </BrowserRouter>
  </React.StrictMode>
);

// Daftarkan Service Worker untuk caching PWA & akses offline
if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
