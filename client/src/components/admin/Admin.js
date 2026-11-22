// Admin console: farmers waiting for approval, farmers the team runs, test accounts and listing reports.
// Access is enforced on the server; this page just shows a message if the API says 403.
// English only: the founder is the only user.
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Moment from 'react-moment';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';
import { startActing } from '../../actions/acting';
import PageHeader from '../layout/PageHeader';
import '../posts/Posts.css';

const errorText = (err, fallback) =>
  err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || fallback;

const ACTIVITY_LABELS = {
  'farmer.create': () => 'Added this farmer',
  'farmer.approve': e => `Approved${e.details && e.details.note ? `: ${e.details.note}` : ''}`,
  'farmer.decline': e => `Declined: ${e.details && e.details.note}`,
  'badge.add': e => `Badge added: ${e.details.type}`,
  'badge.remove': e => `Badge removed: ${e.details.type}`,
  'account.test': e => (e.details.isTest ? 'Marked as a test account' : 'No longer a test account'),
  'act-as.start': () => 'Started acting for this farmer',
  'POST /api/auth/stop-acting': () => 'Stopped acting',
  'DELETE /api/auth/account': () => 'Delete account',
  'PUT /api/auth/role': () => 'Change role',
  'POST /api/auth/resend-verification': () => 'Resend email check',
  'POST /api/posts': e => `Added listing: ${e.details && e.details.productName}`,
  'PUT /api/posts/:id': () => 'Edited a listing',
  'DELETE /api/posts/:id': () => 'Deleted a listing',
  'PUT /api/orders/:id/status': e => `Order ${e.details && e.details.status}`,
  'PUT /api/orders/seen': () => 'Opened new orders',
  'POST /api/farmer-profile': () => 'Updated the farm profile',
  'POST /api/ai/analyze-product': () => 'Used photo help for a listing',
  'POST /api/ai/suggest-price': () => 'Asked for a price suggestion'
};
const activityLabel = e => {
  const label = ACTIVITY_LABELS[e.action] ? ACTIVITY_LABELS[e.action](e) : e.action;
  return e.status >= 400 ? `${label} (failed)` : label;
};

// Approving takes an optional note for yourself; declining needs a reason the farmer will see
const askDecision = status => {
  if (status === 'approved') {
    const note = window.prompt('Approve this farmer. Add a note for yourself (optional):', '');
    return note === null ? null : note.trim();
  }
  const reason = window.prompt('Why are you declining? The farmer will see this.', '');
  return reason && reason.trim() ? reason.trim() : null;
};

const decideApproval = async (farmerId, status, setAlert) => {
  const note = askDecision(status);
  if (note === null) return null;
  try {
    const res = await api.put(`/api/admin/farmers/${farmerId}/approval`, { status, note });
    setAlert(status === 'approved' ? 'Farmer approved' : 'Farmer declined', 'success');
    return res.data;
  } catch (err) {
    setAlert(errorText(err, 'Could not update the farmer'), 'danger');
    return null;
  }
};

const TestToggle = ({ account, onChange, setAlert }) => {
  const toggle = async e => {
    try {
      const res = await api.put(`/api/admin/users/${account._id}/test`, { isTest: e.target.checked });
      onChange(res.data.isTest);
    } catch (err) {
      setAlert(errorText(err, 'Could not change the test setting'), 'danger');
    }
  };
  return (
    <label className='admin-check'>
      <input type='checkbox' checked={!!account.isTest} onChange={toggle} /> Test account
    </label>
  );
};

const NeedsAttention = ({ setAlert }) => {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api.get('/api/admin/attention')
      .then(res => setPending(res.data.pendingFarmers))
      .catch(() => setAlert('Could not load what needs attention', 'danger'));
  }, [setAlert]);

  const decide = async (farmer, status) => {
    if (await decideApproval(farmer._id, status, setAlert)) {
      setPending(list => list.filter(f => f._id !== farmer._id));
    }
  };

  if (pending === null) return <p className='posts-count'>Loading...</p>;
  if (pending.length === 0) return <p className='posts-count'>Nothing needs you right now.</p>;
  return (
    <Fragment>
      <h2 className='admin-section'>Farmers waiting for approval ({pending.length})</h2>
      {pending.map(f => (
        <div className='order-card' key={f._id}>
          <h3>{f.name}</h3>
          <p className='order-meta'>{f.email} · signed up <Moment fromNow>{f.waitingSince}</Moment></p>
          <div className='order-actions'>
            <button className='btn btn-primary' onClick={() => decide(f, 'approved')}>Approve</button>
            <button className='btn btn-light' onClick={() => decide(f, 'declined')}>Decline</button>
          </div>
        </div>
      ))}
    </Fragment>
  );
};

const EMPTY_FARMER = {
  name: '', mobileNumber: '', location: '', farmName: '', crops: '', farmSize: '',
  phoneVerified: false, visitedOn: '', isTest: false
};

const AddFarmer = ({ setAlert, onAdded, onCancel }) => {
  const [form, setForm] = useState(EMPTY_FARMER);
  const [saving, setSaving] = useState(false);
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { crops, ...rest } = form;
      const res = await api.post('/api/admin/farmers', {
        ...rest,
        farmingSpecializations: crops.split(',').map(s => s.trim()).filter(Boolean)
      });
      setAlert(`${res.data.name} added`, 'success');
      setForm(EMPTY_FARMER);
      onAdded(res.data);
    } catch (err) {
      setAlert(errorText(err, 'Could not add the farmer'), 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className='form order-card' onSubmit={onSubmit}>
      <h3>Add a farmer</h3>
      <p className='order-meta'>For farmers without a smartphone. You add their listings and answer their orders for them.</p>
      <div className='form-group'><input type='text' name='name' placeholder='Name' value={form.name} onChange={onChange} required /></div>
      <div className='form-group'>
        <input type='tel' name='mobileNumber' inputMode='numeric' placeholder='Mobile number' value={form.mobileNumber} onChange={onChange} required />
      </div>
      <div className='form-group'><input type='text' name='location' placeholder='Village or town' value={form.location} onChange={onChange} required /></div>
      <div className='form-group'><input type='text' name='farmName' placeholder='Farm name' value={form.farmName} onChange={onChange} required /></div>
      <div className='form-group'>
        <input type='text' name='crops' placeholder='What they grow (comma separated)' value={form.crops} onChange={onChange} required />
      </div>
      <div className='form-group'><input type='text' name='farmSize' placeholder='Farm size (optional)' value={form.farmSize} onChange={onChange} /></div>
      <label className='admin-check'>
        <input type='checkbox' name='phoneVerified' checked={form.phoneVerified} onChange={onChange} /> I called this number and they answered
      </label>
      <label className='admin-check'>
        Visited the farm on <input type='date' name='visitedOn' value={form.visitedOn} onChange={onChange} />
      </label>
      <label className='admin-check'>
        <input type='checkbox' name='isTest' checked={form.isTest} onChange={onChange} /> Test farmer
      </label>
      <div className='order-actions'>
        <button type='submit' className='btn btn-primary' disabled={saving}>{saving ? 'Adding...' : 'Add farmer'}</button>
        <button type='button' className='btn btn-light' onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const ActivityList = ({ accountId }) => {
  const [entries, setEntries] = useState(null);
  useEffect(() => {
    api.get('/api/admin/activity', { params: { account: accountId } })
      .then(res => setEntries(res.data))
      .catch(() => setEntries([]));
  }, [accountId]);

  if (entries === null) return <p className='order-meta'>Loading...</p>;
  if (entries.length === 0) return <p className='order-meta'>No activity yet.</p>;
  return (
    <ul className='admin-activity'>
      {entries.map(e => (
        <li key={e._id}>
          <Moment format='D MMM, h:mm a'>{e.at}</Moment> · {e.actor ? e.actor.name : 'someone'} · {activityLabel(e)}
        </li>
      ))}
    </ul>
  );
};

const FarmerRow = ({ farmer, onChange, setAlert, startActing }) => {
  const navigate = useNavigate();
  const [visitDate, setVisitDate] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const badge = type => (farmer.badges || []).find(b => b.type === type);
  const status = farmer.approval.status;

  const setBadge = async (type, on) => {
    try {
      const res = await api.put(`/api/admin/farmers/${farmer._id}/badges`, { type, on, visitedOn: on ? visitDate : undefined });
      onChange({ ...farmer, badges: res.data.badges });
      setVisitDate('');
    } catch (err) {
      setAlert(errorText(err, 'Could not change the badge'), 'danger');
    }
  };

  const decide = async newStatus => {
    const updated = await decideApproval(farmer._id, newStatus, setAlert);
    if (updated) onChange({ ...farmer, approval: updated.approval });
  };

  const openAs = async () => {
    try {
      await startActing(farmer._id);
      navigate('/dashboard');
    } catch (err) {
      setAlert(errorText(err, 'Could not open this farmer\'s account'), 'danger');
    }
  };

  const visit = badge('visit');
  return (
    <div className='order-card'>
      <h3>
        {farmer.name}{' '}
        <span className={`order-status ${status === 'approved' ? 'completed' : status === 'pending' ? 'placed' : 'cancelled'}`}>
          {status === 'pending' ? 'waiting for approval' : status}
        </span>
      </h3>
      <p className='order-meta'>
        {[farmer.farmName, farmer.location].filter(Boolean).join(' · ') || 'No farm details yet'}
        {' · '}{farmer.managed ? 'Added by you' : farmer.email}
      </p>
      {status === 'declined' && farmer.approval.note && <p className='order-meta'>Reason: {farmer.approval.note}</p>}

      <div className='order-actions'>
        {status === 'pending' && (
          <Fragment>
            <button className='btn btn-primary' onClick={() => decide('approved')}>Approve</button>
            <button className='btn btn-light' onClick={() => decide('declined')}>Decline</button>
          </Fragment>
        )}
        {status === 'declined' && <button className='btn btn-light' onClick={() => decide('approved')}>Approve after all</button>}
        {farmer.managed && <button className='btn btn-dark' onClick={openAs}>Open as {farmer.name}</button>}
        <button className='btn btn-light' onClick={() => setShowActivity(!showActivity)}>{showActivity ? 'Hide activity' : 'Activity'}</button>
      </div>

      <div className='admin-badges'>
        {badge('phone')
          ? <span>📞 Phone verified <button className='btn btn-light' onClick={() => setBadge('phone', false)}>Remove</button></span>
          : <button className='btn btn-light' onClick={() => setBadge('phone', true)}>📞 Mark phone verified</button>}
        {visit
          ? (
            <span>
              🏡 Farm visited <Moment format='D MMM YYYY'>{visit.visitedOn}</Moment>{' '}
              <button className='btn btn-light' onClick={() => setBadge('visit', false)}>Remove</button>
            </span>
          ) : (
            <span>
              <input type='date' aria-label='Farm visit date' value={visitDate} onChange={e => setVisitDate(e.target.value)} />{' '}
              <button className='btn btn-light' disabled={!visitDate} onClick={() => setBadge('visit', true)}>🏡 Mark farm visited</button>
            </span>
          )}
        <TestToggle account={farmer} onChange={isTest => onChange({ ...farmer, isTest })} setAlert={setAlert} />
      </div>

      {showActivity && <ActivityList accountId={farmer._id} />}
    </div>
  );
};

const FarmersTab = ({ setAlert, startActing }) => {
  const [q, setQ] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [farmers, setFarmers] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/api/admin/farmers', { params: { q, status: onlyPending ? 'pending' : undefined } });
        setFarmers(res.data);
      } catch (err) {
        setAlert('Could not load farmers', 'danger');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, onlyPending, setAlert]);

  const replace = updated => setFarmers(list => list.map(f => (f._id === updated._id ? updated : f)));

  return (
    <Fragment>
      {adding
        ? (
          <AddFarmer
            setAlert={setAlert}
            onAdded={f => { setFarmers(list => [f, ...(list || [])]); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )
        : <div className='admin-add'><button className='btn btn-primary' onClick={() => setAdding(true)}>➕ Add a farmer</button></div>}
      <div className='posts-filters'>
        <input type='text' placeholder='Search farmer name or email' value={q} onChange={e => setQ(e.target.value)} />
        <label className='admin-check'>
          <input type='checkbox' checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} /> Only waiting for approval
        </label>
      </div>
      {farmers === null && <p className='posts-count'>Loading...</p>}
      {farmers && farmers.length === 0 && <p className='posts-count'>No farmers found.</p>}
      {farmers && farmers.map(f => (
        <FarmerRow key={f._id} farmer={f} onChange={replace} setAlert={setAlert} startActing={startActing} />
      ))}
    </Fragment>
  );
};

const Accounts = ({ setAlert }) => {
  const [q, setQ] = useState('');
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!q.trim()) {
      setAccounts([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/api/admin/users', { params: { q } });
        setAccounts(res.data);
      } catch (err) {
        setAlert('Could not search accounts', 'danger');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, setAlert]);

  return (
    <Fragment>
      <p className='order-meta'>Test accounts only see each other, and stay out of the pilot numbers.</p>
      <div className='posts-filters'>
        <input type='text' placeholder='Search any account by name or email' value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {q.trim() && accounts.length === 0 && <p className='posts-count'>No accounts found.</p>}
      {accounts.map(a => (
        <div className='order-card' key={a._id}>
          <h3>{a.name}</h3>
          <p className='order-meta'>{a.managed ? 'Added by you' : a.email} · {a.userType || 'no role yet'}</p>
          <TestToggle
            account={a}
            onChange={isTest => setAccounts(list => list.map(x => (x._id === a._id ? { ...x, isTest } : x)))}
            setAlert={setAlert}
          />
        </div>
      ))}
    </Fragment>
  );
};

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

const TABS = [
  ['attention', 'Needs attention'],
  ['farmers', 'Farmers'],
  ['accounts', 'Accounts'],
  ['reports', 'Listing reports']
];

const Admin = ({ auth: { user }, setAlert, startActing }) => {
  const [tab, setTab] = useState('attention');
  if (user && user.acting) return <p className='posts-count'>Press Stop on the banner to go back to the console.</p>;
  if (user && !user.isAdmin) return <p className='posts-count'>Admins only.</p>;
  return (
    <Fragment>
      <PageHeader icon="🛡️" title="Admin" />
      <div className='order-actions admin-tabs'>
        {TABS.map(([id, label]) => (
          <button key={id} className={`btn ${tab === id ? 'btn-primary' : 'btn-light'}`} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'attention' && <NeedsAttention setAlert={setAlert} />}
      {tab === 'farmers' && <FarmersTab setAlert={setAlert} startActing={startActing} />}
      {tab === 'accounts' && <Accounts setAlert={setAlert} />}
      {tab === 'reports' && <Reports setAlert={setAlert} />}
    </Fragment>
  );
};

Admin.propTypes = {
  auth: PropTypes.object.isRequired,
  setAlert: PropTypes.func.isRequired,
  startActing: PropTypes.func.isRequired
};
const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps, { setAlert, startActing })(Admin);
