import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';
import PageHeader from '../layout/PageHeader';
import { removeFromCart, setCartQuantity, clearCart } from '../../actions/cart';
import { unitPriceFor } from '../../utils/pricing';
import '../posts/Posts.css';

const Cart = ({ items, setAlert, removeFromCart, setCartQuantity, clearCart }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ deliveryMethod: 'pickup', deliveryAddress: '', note: '' });
  const [sending, setSending] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const linePrice = i => unitPriceFor(i.price, i.bulkPricing, i.quantity);
  const total = items.reduce((sum, i) => sum + i.quantity * linePrice(i), 0);

  const checkout = async e => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/api/orders/checkout', {
        items: items.map(i => ({ postId: i.postId, quantity: i.quantity })),
        ...form
      });
      clearCart();
      navigate('/order-placed', { state: { orders: res.data } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach(er => setAlert(er.msg, 'danger'));
      else setAlert(err.response?.data?.msg || 'Could not place orders', 'danger');
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <Fragment>
        <PageHeader icon="🛒" title={t('cart.title')} />
        <p className='posts-count'>{t('cart.empty')}</p>
        <p style={{ textAlign: 'center' }}><Link to='/posts' className='btn btn-primary'>{t('cart.browse')}</Link></p>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageHeader icon="🛒" title={t('cart.title')} />

      {items.map(i => (
        <div className='order-card' key={i.postId}>
          <h3>{i.productName}</h3>
          <p className='order-meta'>{i.farmerName} · ₹{linePrice(i)}/{t(`units.${i.unit}`)}{linePrice(i) < i.price && ` (${t('orderPanel.bulkApplied')})`}</p>
          <div className='form-group' style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type='number' min='0' max={i.max} step='any' style={{ maxWidth: 120 }}
              value={i.quantity}
              onChange={e => setCartQuantity(i.postId, parseFloat(e.target.value) || 0)}
            />
            <span>{t(`units.${i.unit}`)}</span>
            <strong style={{ marginLeft: 'auto' }}>₹{(i.quantity * linePrice(i)).toFixed(2)}</strong>
            <button type='button' className='btn btn-light' onClick={() => removeFromCart(i.postId)}>{t('cart.remove')}</button>
          </div>
        </div>
      ))}

      <form className='form' onSubmit={checkout}>
        <div className='form-group'>
          <select name='deliveryMethod' value={form.deliveryMethod} onChange={onChange}>
            <option value='pickup'>{t('orderPanel.pickup')}</option>
            <option value='delivery'>{t('orderPanel.delivery')}</option>
          </select>
        </div>
        {form.deliveryMethod === 'delivery' && (
          <div className='form-group'>
            <textarea name='deliveryAddress' rows='2' placeholder={t('orderPanel.address')} value={form.deliveryAddress} onChange={onChange} required />
          </div>
        )}
        <div className='form-group'>
          <textarea name='note' rows='2' maxLength='500' placeholder={t('orderPanel.note')} value={form.note} onChange={onChange} />
        </div>
        <p><strong>{t('cart.total')}: ₹{total.toFixed(2)}</strong></p>
        <small className='form-text'>{t('cart.perFarmerNote')} {t('cart.pricesNote')}</small>
        <button type='submit' className='btn btn-primary my-1' disabled={sending || items.some(i => !(i.quantity > 0))}>
          {sending ? t('cart.sending') : t('cart.checkout')}
        </button>
      </form>
    </Fragment>
  );
};

Cart.propTypes = {
  items: PropTypes.array.isRequired,
  setAlert: PropTypes.func.isRequired,
  removeFromCart: PropTypes.func.isRequired,
  setCartQuantity: PropTypes.func.isRequired,
  clearCart: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ items: state.cart.items });

export default connect(mapStateToProps, { setAlert, removeFromCart, setCartQuantity, clearCart })(Cart);
