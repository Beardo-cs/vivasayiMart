import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';
import PageHeader from '../layout/PageHeader';

const ResetPassword = ({ setAlert }) => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setAlert(t('auth.passwordsMismatch'), 'danger');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/auth/reset', { token, password });
      setAlert(res.data.msg, 'success');
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach(er => setAlert(er.msg, 'danger'));
      else setAlert('Could not reset password', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <PageHeader icon="🔑" title={t('auth.resetTitle')} />
      <form className='form' onSubmit={onSubmit}>
        <div className='form-group'>
          <input type='password' placeholder={t('auth.newPassword')} minLength='6' value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className='form-group'>
          <input type='password' placeholder={t('auth.confirmPassword')} minLength='6' value={password2} onChange={e => setPassword2(e.target.value)} required />
        </div>
        <input type='submit' className='btn btn-primary' value={t('auth.savePassword')} disabled={saving} />
      </form>
      <p className='my-1'><Link to='/forgot-password'>{t('auth.forgotLink')}</Link></p>
    </Fragment>
  );
};

ResetPassword.propTypes = { setAlert: PropTypes.func.isRequired };
export default connect(null, { setAlert })(ResetPassword);
