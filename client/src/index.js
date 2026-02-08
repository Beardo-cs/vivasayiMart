// React is a Opensource JS library for building user interface
import React from 'react';

// DOM-Document Object Modal, is a program interface for web documents
import ReactDOM from 'react-dom';

import App from './App';

// To render the React element into root DOM node, we are passing both(element and root) to ReactDOM.render()
ReactDOM.render(
 <App />,
  document.getElementById('root')
);

