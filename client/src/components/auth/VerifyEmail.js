import React, { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import PageHeader from '../layout/PageHeader';

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
      <PageHeader icon="✉️" title={t('auth.verifyTitle')} subtitle={state.loading ? t('auth.verifying') : state.msg} />
      {!state.loading && <Link to='/login' className='btn btn-primary'>{t('auth.backToLogin')}</Link>}
    </Fragment>
  );
};

export default VerifyEmail;
