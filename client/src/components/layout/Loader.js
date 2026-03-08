import React from 'react';
import './Loader.css';

const Loader = ({ message = 'Loading...', fullPage = false }) => {
  return (
    <div className={`loader-container ${fullPage ? 'loader-fullpage' : ''}`}>
      <div className="loader-content">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-leaf">🌾</div>
        </div>
        <p className="loader-message">{message}</p>
      </div>
    </div>
  );
};

export default Loader;

