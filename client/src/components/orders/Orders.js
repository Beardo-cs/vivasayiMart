// Orders page: buyers see orders they placed, farmers see orders received.
import React, { Fragment, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Moment from 'react-moment';
import { useTranslation } from 'react-i18next';
import Loader from '../layout/Loader';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { addToCart } from '../../actions/cart';
import { setAlert } from '../../actions/alert';
import '../posts/Posts.css';

// "98765 43210" / "+91 98765-43210" -> "919876543210" for wa.me; 10-digit numbers are assumed Indian
const phoneDigits = raw => {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return `91${d}`;
  return d.length >= 11 ? d : '';
};

// Star rating form shown to the buyer on completed orders
const ReviewForm = ({ orderId, onDone, setAlert }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/api/reviews', { orderId, rating, comment });
      setAlert('Thanks for your review!', 'success');
      onDone(res.data);
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Could not save review', 'danger');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className='form' onSubmit={submit}>
      <div className='form-group'>
        <select value={rating} onChange={e => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>)}
        </select>
      </div>
      <div className='form-group'>
        <textarea rows='2' maxLength='1000' placeholder={t('orders.reviewPlaceholder')} value={comment} onChange={e => setComment(e.target.value)} />
      </div>
      <button type='submit' className='btn btn-primary' disabled={sending}>{sending ? '...' : t('orders.submitReview')}</button>
    </form>
  );
};

const Orders = ({ auth: { user }, setAlert, addToCart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isFarmer = user && user.userType === 'farmer';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(isFarmer ? '/api/orders/received' : '/api/orders/mine');
      setOrders(res.data);
      api.put('/api/orders/seen').catch(() => {}); // clears the buyer's unread badge
    } catch (err) {
      setAlert('Could not load orders', 'danger');
    } finally {
      setLoading(false);
    }
  }, [isFarmer, setAlert]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      const res = await api.put(`/api/orders/${id}/status`, { status });
      setOrders(orders.map(o => (o._id === id ? res.data : o)));
      setAlert(`Order ${status}`, 'success');
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Could not update order', 'danger');
    } finally {
      setBusyId(null);
    }
  };

  // Re-add the same product and quantity to the cart using today's price and stock
  const orderAgain = async o => {
    try {
      const res = await api.get(`/api/posts/${o.post}`);
      const p = res.data;
      const stock = p.quantityAvailable ?? p.weight;
      if (!p.available || stock <= 0) {
        setAlert(t('orders.againSoldOut', { name: p.productName }), 'danger');
        return;
      }
      addToCart({
        postId: p._id, productName: p.productName, farmerName: p.farmerName, unit: p.unit || 'kg',
        price: p.price, bulkPricing: p.bulkPricing || [], quantity: Math.min(o.quantity, stock), max: stock
      });
      if (o.quantity > stock) setAlert(t('orders.againReduced', { max: stock }), 'success');
      navigate('/cart');
    } catch (err) {
      setAlert(t('orders.againGone'), 'danger');
    }
  };

  if (loading || !user) return <Loader message={t('orders.loading')} fullPage={false} />;

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <Fragment>
      <h1 className='large text-primary'>{isFarmer ? t('orders.titleFarmer') : t('orders.titleBuyer')}</h1>
      <div className='posts-filters'>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value='all'>{t('orders.allStatuses')}</option>
          {['placed', 'confirmed', 'completed', 'rejected', 'cancelled'].map(st => (
            <option key={st} value={st}>{t(`orders.status.${st}`)}</option>
          ))}
        </select>
      </div>

      {shown.length === 0 && <p className='posts-count'>{t('orders.none')}</p>}

      {shown.map(o => (
        <div className='order-card' key={o._id}>
          <h3>
            {o.productName} — {o.quantity} {t(`units.${o.unit}`, o.unit)}{' '}
            <span className={`order-status ${o.status}`}>{t(`orders.status.${o.status}`)}</span>
          </h3>
          <p className='order-meta'>
            ₹{o.totalAmount.toFixed(2)} (₹{o.pricePerUnit}/{t(`units.${o.unit}`, o.unit)}) · {t('orders.placedOn')} <Moment format='DD MMM YYYY, h:mm A'>{o.date}</Moment>
          </p>
          {isFarmer ? (
            <p>{t('orders.buyer')}: <strong>{o.buyerName}</strong>{o.buyerMobile && <> · 📱 {o.buyerMobile}</>}</p>
          ) : (
            <p>{t('orders.farmer')}: <strong>{o.farmerName}</strong>{o.farmerMobile && <> · 📱 {o.farmerMobile}</>}</p>
          )}
          <p>
            {o.deliveryMethod === 'delivery' ? t('orders.deliverTo', { address: o.deliveryAddress }) : t('orders.pickupNote')}
          </p>
          {o.note && <p><em>“{o.note}”</em></p>}

          {!isFarmer && o.status === 'completed' && (
            o.review ? (
              <p><strong>{t('orders.yourReview')}</strong> {'★'.repeat(o.review.rating)}{'☆'.repeat(5 - o.review.rating)} {o.review.comment}</p>
            ) : (
              <ReviewForm
                orderId={o._id}
                setAlert={setAlert}
                onDone={review => setOrders(orders.map(x => (x._id === o._id ? { ...x, review } : x)))}
              />
            )
          )}

          {['confirmed', 'completed'].includes(o.status) && (() => {
            const number = isFarmer ? o.buyerMobile : o.farmerMobile;
            const wa = phoneDigits(number);
            return number ? (
              <div className='order-actions'>
                <a className='btn btn-light' href={`tel:${String(number).replace(/[^\d+]/g, '')}`}>📞 {t('orders.call')}</a>
                {wa && (
                  <a className='btn btn-light' target='_blank' rel='noopener noreferrer'
                    href={`https://wa.me/${wa}?text=${encodeURIComponent(t('orders.waText', { name: o.productName, qty: o.quantity, unit: t(`units.${o.unit}`, o.unit) }))}`}>
                    <i className='fab fa-whatsapp'></i> WhatsApp
                  </a>
                )}
              </div>
            ) : null;
          })()}

          <div className='order-actions'>
            {!isFarmer && ['completed', 'rejected', 'cancelled'].includes(o.status) && (
              <button className='btn btn-primary' onClick={() => orderAgain(o)}>🔁 {t('orders.again')}</button>
            )}
            {isFarmer && o.status === 'placed' && (
              <Fragment>
                <button className='btn btn-primary' disabled={busyId === o._id} onClick={() => changeStatus(o._id, 'confirmed')}>{t('orders.accept')}</button>
                <button className='btn btn-danger' disabled={busyId === o._id} onClick={() => changeStatus(o._id, 'rejected')}>{t('orders.reject')}</button>
              </Fragment>
            )}
            {isFarmer && o.status === 'confirmed' && (
              <button className='btn btn-primary' disabled={busyId === o._id} onClick={() => changeStatus(o._id, 'completed')}>{t('orders.complete')}</button>
            )}
            {['placed', 'confirmed'].includes(o.status) && (
              <button className='btn btn-light' disabled={busyId === o._id} onClick={() => {
                if (window.confirm(t('orders.confirmCancel'))) changeStatus(o._id, 'cancelled');
              }}>{t('orders.cancelOrder')}</button>
            )}
          </div>
        </div>
      ))}
    </Fragment>
  );
};

Orders.propTypes = {
  auth: PropTypes.object.isRequired,
  setAlert: PropTypes.func.isRequired,
  addToCart: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ auth: state.auth });

export default connect(mapStateToProps, { setAlert, addToCart })(Orders);
