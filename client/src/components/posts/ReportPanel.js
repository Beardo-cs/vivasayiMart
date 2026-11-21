// Inline panel to report a listing
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';

const ReportPanel = ({ post, setAlert, onClose }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/api/reports', { postId: post._id, reason, details });
      setAlert(res.data.msg, 'success');
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach(er => setAlert(er.msg, 'danger'));
      else setAlert(err.response?.data?.msg || 'Could not send report', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className='form edit-panel' onSubmit={onSubmit}>
      <h4 className='text-primary'>{t('report.title')}</h4>
      <div className='form-group'>
        <select value={reason} onChange={e => setReason(e.target.value)}>
          <option value='spam'>{t('report.spam')}</option>
          <option value='fake'>{t('report.fake')}</option>
          <option value='wrong-price'>{t('report.wrongPrice')}</option>
          <option value='inappropriate'>{t('report.inappropriate')}</option>
          <option value='other'>{t('report.other')}</option>
        </select>
      </div>
      <div className='form-group'>
        <textarea rows='2' maxLength='1000' placeholder={t('report.details')} value={details} onChange={e => setDetails(e.target.value)} />
      </div>
      <button type='submit' className='btn btn-danger' disabled={sending}>{sending ? '...' : t('report.send')}</button>{' '}
      <button type='button' className='btn btn-light' onClick={onClose}>{t('orderPanel.cancel')}</button>
    </form>
  );
};

ReportPanel.propTypes = {
  post: PropTypes.object.isRequired,
  setAlert: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(ReportPanel);
