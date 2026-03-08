// React is a Opensource JS library for building user interface
import React from 'react';

// DOM-Document Object Modal, is a program interface for web documents
import ReactDOM from 'react-dom/client';

import App from './App';

// React 18: Use createRoot instead of ReactDOM.render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

