// Helpers for running inside the Android/iOS app (Capacitor). Everything here is safe on the
// plain website: isNative() is false there and the web fallbacks are used.
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

// Where the API lives. On the website it is the same address, so relative URLs work; inside a
// native app there is no website address, so it must be absolute (override with REACT_APP_API_URL).
export const API_BASE = isNative()
  ? (process.env.REACT_APP_API_URL || 'https://vivasayimart.vercel.app')
  : (process.env.NODE_ENV === 'production' ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:4000'));

// The website's public address, used for links people share. Inside the app the page address is
// capacitor://localhost, which would be useless to anyone else.
export const PUBLIC_SITE = isNative()
  ? (process.env.REACT_APP_PUBLIC_URL || 'https://vivasayimart.vercel.app')
  : window.location.origin;

// Share a link: the system share sheet in the app, the browser's share sheet or the clipboard on the web.
// Resolves 'shared' | 'copied' | 'cancelled'.
export const shareLink = async ({ title, text, url }) => {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url, dialogTitle: title });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (err) {
    return 'cancelled'; // user closed the sheet, or clipboard blocked
  }
};

// Hardware back button (Android) and status bar colour. Call once at start-up.
export const initNative = async history => {
  if (!isNative()) return;
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) window.history.back();
      else App.exitApp();
    });
    // open shared farmer links (https://.../farmer/ID) inside the app
    App.addListener('appUrlOpen', ({ url }) => {
      try {
        const u = new URL(url);
        if (history) history(`${u.pathname}${u.search}`);
        else window.location.assign(`${u.pathname}${u.search}`);
      } catch (e) { /* ignore malformed links */ }
    });
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform() === 'android') await StatusBar.setBackgroundColor({ color: '#1b3409' });
  } catch (err) {
    console.warn('Native init skipped:', err.message);
  }
};
