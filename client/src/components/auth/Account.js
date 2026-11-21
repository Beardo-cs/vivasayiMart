// Account & privacy: links to the policies and the in-app "delete my account" that
// the Apple App Store and Google Play require.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { logout } from '../../actions/auth';
import { setAlert } from '../../actions/alert';
import '../posts/Posts.css';

const Account = ({ user, logout, setAlert }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const bullets = t('account.deleteBullets', { returnObjects: true });

  const onDelete = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.delete('/api/auth/account', { data: { password } });
      setAlert(t('account.deleted'), 'success');
      logout();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg;
      setAlert(msg || t('alerts.serverError'), 'danger');
      setBusy(false);
    }
  };

  return (
    <div className="legal">
      <h1 className="large text-primary">{t('account.title')}</h1>
      <p className="lead">{user.name} · {user.email}</p>
      <p className="updated">{user.userType === 'farmer' ? t('register.farmer') : t('register.consumer')}</p>

      <div className="order-actions" style={{ margin: '1rem 0' }}>
        <Link to={user.userType === 'farmer' ? '/create-farmer-profile' : '/create-consumer-profile'} className="btn btn-light">{t('dashboard.editProfile')}</Link>
        <Link to="/privacy" className="btn btn-light">{t('footer.privacy')}</Link>
        <Link to="/terms" className="btn btn-light">{t('footer.terms')}</Link>
      </div>

      <h2>{t('account.deleteTitle')}</h2>
      {!open ? (
        <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>{t('account.deleteStart')}</button>
      ) : (
        <form className="form" onSubmit={onDelete}>
          <div className="notice">
            <strong>{t('account.deleteWarn')}</strong>
            {Array.isArray(bullets) && <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
          </div>
          <div className="form-group">
            <input type="password" placeholder={t('account.password')} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="form-group">
            <label className="consent">
              <input type="checkbox" checked={sure} onChange={e => setSure(e.target.checked)} required />
              <span>{t('account.sure')}</span>
            </label>
          </div>
          <button type="submit" className="btn btn-danger" disabled={busy || !sure || !password}>{busy ? '...' : t('account.deleteButton')}</button>{' '}
          <button type="button" className="btn btn-light" onClick={() => { setOpen(false); setPassword(''); setSure(false); }}>{t('orderPanel.cancel')}</button>
        </form>
      )}
    </div>
  );
};

Account.propTypes = {
  user: PropTypes.object,
  logout: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired
};

export default connect(state => ({ user: state.auth.user }), { logout, setAlert })(Account);
