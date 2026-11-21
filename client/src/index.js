// React is a Opensource JS library for building user interface
import React from 'react';

// DOM-Document Object Modal, is a program interface for web documents
import ReactDOM from 'react-dom/client';

import './i18n';
import { registerServiceWorker } from './utils/offline';
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
if (process.env.NODE_ENV === 'production') installGlobalErrorReporting();
