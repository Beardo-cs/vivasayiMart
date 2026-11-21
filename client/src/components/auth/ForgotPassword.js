import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';

const ForgotPassword = ({ setAlert }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/api/auth/forgot', { email });
      setAlert(res.data.msg, 'success');
      setDone(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach(er => setAlert(er.msg, 'danger'));
      else setAlert(err.response?.data?.msg || 'Something went wrong', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <Fragment>
      <h1 className='large text-primary'>{t('auth.forgotTitle')}</h1>
      <p className='lead'>{t('auth.forgotHint')}</p>
      {!done && (
        <form className='form' onSubmit={onSubmit}>
          <div className='form-group'>
            <input type='email' placeholder={t('register.email')} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <input type='submit' className='btn btn-primary' value={sending ? '...' : t('auth.sendLink')} disabled={sending} />
        </form>
      )}
      <p className='my-1'><Link to='/login'>{t('auth.backToLogin')}</Link></p>
    </Fragment>
  );
};

ForgotPassword.propTypes = { setAlert: PropTypes.func.isRequired };
export default connect(null, { setAlert })(ForgotPassword);
