// Shown once to old accounts that have no role (created before farmer/buyer roles existed)
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { loadUser } from '../../actions/auth';
import { setAlert } from '../../actions/alert';
import PageHeader from '../layout/PageHeader';

const ChooseRole = ({ user, loadUser, setAlert }) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  if (user.userType) return <Navigate to='/dashboard' replace />;

  const choose = async userType => {
    setSaving(true);
    try {
      await api.put('/api/auth/role', { userType });
      await loadUser();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg;
      setAlert(msg || t('alerts.serverError'), 'danger');
      setSaving(false);
    }
  };

  return (
    <div className='crash'>
      <PageHeader icon="👋" title={t('chooseRole.title')} subtitle={t('chooseRole.text')} />
      <div className='landing-roles' style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className='btn btn-primary' disabled={saving} onClick={() => choose('farmer')}>🌾 {t('landing.imFarmer')}</button>
        <button className='btn btn-primary' disabled={saving} onClick={() => choose('consumer')}>🛒 {t('landing.imBuyer')}</button>
      </div>
      <p className='form-text' style={{ marginTop: '1rem' }}>{t('chooseRole.once')}</p>
    </div>
  );
};

ChooseRole.propTypes = {
  user: PropTypes.object,
  loadUser: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired
};

export default connect(state => ({ user: state.auth.user }), { loadUser, setAlert })(ChooseRole);
