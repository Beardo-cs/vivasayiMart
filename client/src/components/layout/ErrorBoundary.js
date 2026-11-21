// Catches crashes in any screen: shows a friendly page instead of a blank one,
// and tells the server (-> Vercel logs / Sentry) what happened.
import React from 'react';
import api from '../../utils/api';
import i18n from '../../i18n';

let reported = 0;
export const reportClientError = (kind, error) => {
  if (reported >= 5) return; // never flood the server from a crash loop
  reported += 1;
  try {
    const err = error || {};
    api.post('/api/client-error', {
      kind,
      message: err.message || String(error),
      stack: err.stack,
      url: window.location.pathname
    }).catch(() => {});
  } catch (e) { /* reporting must never throw */ }
};

export const installGlobalErrorReporting = () => {
  window.addEventListener('error', e => reportClientError('error', e.error || { message: e.message }));
  window.addEventListener('unhandledrejection', e => reportClientError('promise', e.reason));
};

export default class ErrorBoundary extends React.Component {
  state = { crashed: false };

  static getDerivedStateFromError() { return { crashed: true }; }

  componentDidCatch(error) { reportClientError('render', error); }

  render() {
    if (!this.state.crashed) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div className="crash" role="alert">
        <div className="icon">🌱</div>
        <h1 className="large text-primary">{t('crash.title')}</h1>
        <p className="lead">{t('crash.text')}</p>
        <button className="btn btn-primary" onClick={() => window.location.assign('/')}>{t('crash.reload')}</button>
      </div>
    );
  }
}
