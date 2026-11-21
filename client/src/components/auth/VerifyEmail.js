import React, { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const VerifyEmail = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, ok: false, msg: '' });

  useEffect(() => {
    let cancelled = false;
    api.post('/api/auth/verify', { token })
      .then(res => { if (!cancelled) setState({ loading: false, ok: true, msg: res.data.msg }); })
      .catch(err => {
        const msg = err.response?.data?.errors?.[0]?.msg || 'Verification failed';
        if (!cancelled) setState({ loading: false, ok: false, msg });
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <Fragment>
      <h1 className='large text-primary'>{t('auth.verifyTitle')}</h1>
      <p className='lead'>{state.loading ? t('auth.verifying') : state.msg}</p>
      {!state.loading && <Link to='/login' className='btn btn-primary'>{t('auth.backToLogin')}</Link>}
    </Fragment>
  );
};

export default VerifyEmail;
