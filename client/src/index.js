// React is a Opensource JS library for building user interface
import React from 'react';
// Fonts and icons are bundled with the app (no CDN): they work offline and inside the Android/iOS apps
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/noto-sans-tamil/tamil-400.css';
import '@fontsource/noto-sans-tamil/tamil-600.css';
import '@fontsource/noto-sans-tamil/tamil-700.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// DOM-Document Object Modal, is a program interface for web documents
import ReactDOM from 'react-dom/client';

import './i18n';
import { registerServiceWorker } from './utils/offline';
import { initNative } from './utils/native';
import App from './App';
import ErrorBoundary, { installGlobalErrorReporting } from './components/layout/ErrorBoundary';

// React 18: Use createRoot instead of ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);


registerServiceWorker();
initNative(); // Android/iOS app only: back button, status bar, shared links
if (process.env.NODE_ENV === 'production') installGlobalErrorReporting();
