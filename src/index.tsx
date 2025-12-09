import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { exposeDiagnosticsToWindow } from './utils/authDiagnostics';

// Note: Errors from browser extensions (content_script.js) may appear in console
// These are harmless and come from password managers/autofill tools trying to access form fields
// They don't affect application functionality and can be safely ignored

// Expose authentication diagnostics tools in development mode
if (process.env.NODE_ENV === 'development') {
  exposeDiagnosticsToWindow();
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
      })
      .catch((registrationError) => {
      });
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
