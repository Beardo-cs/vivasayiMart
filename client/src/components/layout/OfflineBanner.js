import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Slim bar shown while the device has no connection
const OfflineBanner = () => {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" style={{ background: '#fff3cd', color: '#664d03', textAlign: 'center', padding: '0.4rem', fontSize: '0.9rem' }}>
      📴 {t('offline.banner')}
    </div>
  );
};

export default OfflineBanner;
