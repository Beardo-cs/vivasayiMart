import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const IntroDialog = ({ onStart, onClose }) => {
  const { t } = useTranslation();
  const [showData, setShowData] = useState(false);
  const dialogRef = useRef(null);
  const startRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    startRef.current.focus();
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    };
  }, []);

  return (
    <div className="ai-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="ai-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-intro-title"
        aria-describedby="ai-intro-body"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="ai-intro-title"><span aria-hidden="true">🌿</span> {t('cropHealth.title')}</h2>
        <div id="ai-intro-body">
          <p>{t('cropHealth.intro.body')}</p>
          <p className="ai-caution">{t('cropHealth.intro.notDiagnosis')}</p>
        </div>
        <button type="button" className="ai-link" aria-expanded={showData} onClick={() => setShowData(s => !s)}>
          {t('cropHealth.intro.dataLink')}
        </button>
        {showData && <p className="ai-data-note">{t('cropHealth.intro.data')}</p>}
        <div className="ai-dialog-actions">
          <button ref={startRef} type="button" className="btn btn-primary" onClick={onStart}>{t('cropHealth.intro.start')}</button>
          <button type="button" className="btn btn-light" onClick={onClose}>{t('cropHealth.intro.notNow')}</button>
        </div>
      </div>
    </div>
  );
};

export default IntroDialog;
