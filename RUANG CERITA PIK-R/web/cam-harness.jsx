import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './src/styles/base.css';
import Camera from './src/components/Camera.jsx';

window.__captures = [];
window.__closed = 0;
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Camera mode="story" onKind={() => {}} onGallery={() => {}} onText={() => {}}
      onClose={() => { window.__closed += 1; }}
      onCapture={(it) => { window.__captures.push({ video: it.video, music: it.music, duration: it.duration, url: it.url, size: it.file && it.file.size, type: it.file && it.file.type }); }} />
    <Toaster />
  </BrowserRouter>
);
