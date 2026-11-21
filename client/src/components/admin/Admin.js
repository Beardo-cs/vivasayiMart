// Admin screen: moderate reports and verify farmers. Access is enforced on the server;
// this page just shows a message if the API says 403.
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';
import PageHeader from '../layout/PageHeader';
import '../posts/Posts.css';

const Reports = ({ setAlert }) => {
  const [status, setStatus] = useState('open');
  const [reports, setReports] = useState(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/reports', { params: { status } });
      setReports(res.data);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
      else setAlert('Could not load reports', 'danger');
    }
  }, [status, setAlert]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id, newStatus, hideListing) => {
    try {
      await api.put(`/api/admin/reports/${id}`, { status: newStatus, hideListing });
      setAlert(hideListing ? 'Listing hidden and report resolved' : 'Report updated', 'success');
      load();
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Could not update report', 'danger');
    }
  };

  const restore = async postId => {
    try {
      await api.put(`/api/admin/posts/${postId}/hidden`, { hidden: false });
      setAlert('Listing restored', 'success');
      load();
    } catch (err) {
      setAlert('Could not restore listing', 'danger');
    }
  };

  if (denied) return <p className='posts-count'>Admins only.</p>;

  return (
    <Fragment>
      <div className='posts-filters'>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value='open'>Open</option>
          <option value='reviewed'>Reviewed</option>
          <option value='dismissed'>Dismissed</option>
          <option value='all'>All</option>
        </select>
      </div>
      {reports === null && <p className='posts-count'>Loading...</p>}
      {reports && reports.length === 0 && <p className='posts-count'>No reports.</p>}
      {reports && reports.map(r => (
        <div className='order-card' key={r._id}>
          <h3>
            {r.post ? r.post.productName : '(listing deleted)'}{' '}
            <span className={`order-status ${r.status === 'open' ? 'placed' : r.status === 'reviewed' ? 'completed' : 'cancelled'}`}>{r.status}</span>
          </h3>
          <p className='order-meta'>
            Reason: <strong>{r.reason}</strong> · by {r.reporter ? r.reporter.name : 'unknown'} · <Moment format='DD MMM YYYY'>{r.date}</Moment>
            {r.post && r.post.hidden && ' · currently hidden'}
          </p>
          {r.details && <p><em>“{r.details}”</em></p>}
          {r.post && <p className='order-meta'>Farmer: {r.post.farmerName}</p>}
          <div className='order-actions'>
            {r.status === 'open' && r.post && (
              <button className='btn btn-danger' onClick={() => resolve(r._id, 'reviewed', true)}>Hide listing</button>
            )}
            {r.status === 'open' && (
              <Fragment>
                <button className='btn btn-primary' onClick={() => resolve(r._id, 'reviewed', false)}>Mark reviewed</button>
                <button className='btn btn-light' onClick={() => resolve(r._id, 'dismissed', false)}>Dismiss</button>
              </Fragment>
            )}
            {r.post && r.post.hidden && (
              <button className='btn btn-light' onClick={() => restore(r.post._id)}>Restore listing</button>
            )}
          </div>
        </div>
      ))}
    </Fragment>
  );
};

const Farmers = ({ setAlert }) => {
  const [q, setQ] = useState('');
  const [farmers, setFarmers] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/api/admin/farmers', { params: { q } });
        setFarmers(res.data);
      } catch (err) {
        setAlert('Could not load farmers', 'danger');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, setAlert]);

  const toggle = async f => {
    try {
      const res = await api.put(`/api/admin/farmers/${f._id}/verify`, { verified: !f.farmerVerified });
      setFarmers(farmers.map(x => (x._id === f._id ? { ...x, farmerVerified: res.data.farmerVerified } : x)));
    } catch (err) {
      setAlert('Could not update farmer', 'danger');
    }
  };

  return (
    <Fragment>
      <div className='posts-filters'>
        <input type='text' placeholder='Search farmer name or email' value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {farmers && farmers.length === 0 && <p className='posts-count'>No farmers found.</p>}
      {farmers && farmers.map(f => (
        <div className='order-card' key={f._id}>
          <h3>{f.name} {f.farmerVerified && <span title='Verified' style={{ color: '#1e88e5' }}>✔ Verified</span>}</h3>
          <p className='order-meta'>{f.email} · email {f.emailVerified ? 'verified' : 'not verified'}</p>
          <div className='order-actions'>
            <button className={`btn ${f.farmerVerified ? 'btn-light' : 'btn-primary'}`} onClick={() => toggle(f)}>
              {f.farmerVerified ? 'Remove verification' : 'Verify farmer'}
            </button>
          </div>
        </div>
      ))}
    </Fragment>
  );
};

const Admin = ({ auth: { user }, setAlert }) => {
  const [tab, setTab] = useState('reports');
  if (user && !user.isAdmin) return <p className='posts-count'>Admins only.</p>;
  return (
    <Fragment>
      <PageHeader icon="🛡️" title="Admin" />
      <div className='order-actions' style={{ marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'reports' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('reports')}>Reports</button>
        <button className={`btn ${tab === 'farmers' ? 'btn-primary' : 'btn-light'}`} onClick={() => setTab('farmers')}>Farmer verification</button>
      </div>
      {tab === 'reports' ? <Reports setAlert={setAlert} /> : <Farmers setAlert={setAlert} />}
    </Fragment>
  );
};

Admin.propTypes = { auth: PropTypes.object.isRequired, setAlert: PropTypes.func.isRequired };
const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps, { setAlert })(Admin);
