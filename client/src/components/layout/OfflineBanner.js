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
    <div role="status" className="status-banner offline">
      📴 {t('offline.banner')}
    </div>
  );
};

export default OfflineBanner;
