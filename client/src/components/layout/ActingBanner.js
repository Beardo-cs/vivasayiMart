import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { stopActing } from '../../actions/acting';
import { setAlert } from '../../actions/alert';

// Shown on every screen while an admin is working inside a farmer's account
const ActingBanner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const until = user && user.acting ? user.acting.until : null;

  useEffect(() => {
    if (!until) return undefined;
    const timer = setTimeout(async () => {
      await dispatch(stopActing());
      dispatch(setAlert(t('acting.ended'), 'success'));
      navigate('/admin');
    }, Math.max(until - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [until, dispatch, navigate, t]);

  if (!until) return null;

  const stop = async () => {
    await dispatch(stopActing());
    navigate('/admin');
  };

  return (
    <div className='status-banner acting' role='status'>
      <span>🧑‍🌾 {t('acting.banner', { name: user.name })}</span>
      <button type='button' className='btn btn-light' onClick={stop}>{t('acting.stop')}</button>
    </div>
  );
};

export default ActingBanner;
