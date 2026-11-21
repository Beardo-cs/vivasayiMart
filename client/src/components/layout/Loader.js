import React from 'react';
import { useTranslation } from 'react-i18next';
import './Loader.css';

const Loader = ({ message, fullPage = false }) => {
  const { t } = useTranslation();
  const text = message || t('loading');
  return (
    <div className={`loader-container ${fullPage ? 'loader-fullpage' : ''}`}>
      <div className="loader-content">
        <div className="loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-leaf">🌾</div>
        </div>
        <p className="loader-message">{text}</p>
      </div>
    </div>
  );
};

export default Loader;

