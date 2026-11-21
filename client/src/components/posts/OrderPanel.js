// Inline panel for a consumer to place an order request on a listing, or add it to the cart
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { setAlert } from '../../actions/alert';
import { addToCart } from '../../actions/cart';
import { unitPriceFor } from '../../utils/pricing';

const OrderPanel = ({ post, stock, setAlert, addToCart, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unit = post.unit || 'kg';
  const unitLabel = t(`units.${unit}`);
  const [form, setForm] = useState({ quantity: '', deliveryMethod: 'pickup', deliveryAddress: '', note: '' });
  const [placing, setPlacing] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const qty = parseFloat(form.quantity);
  const effPrice = qty > 0 ? unitPriceFor(post.price, post.bulkPricing, qty) : post.price;
  const total = qty > 0 ? (qty * effPrice).toFixed(2) : null;

  const validQty = () => {
    if (!(qty > 0) || qty > stock) {
      setAlert(t('orderPanel.badQuantity', { max: stock, unit: unitLabel }), 'danger');
      return false;
    }
    return true;
  };

  const onAddToCart = () => {
    if (!validQty()) return;
    addToCart({
      postId: post._id,
      productName: post.productName,
      farmerName: post.farmerName,
      unit,
      price: post.price,
      bulkPricing: post.bulkPricing || [],
      quantity: qty,
      max: stock
    });
    setAlert(t('orderPanel.added'), 'success');
    onClose();
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (!validQty()) return;
    setPlacing(true);
    try {
      const res = await api.post('/api/orders', {
        postId: post._id,
        quantity: qty,
        deliveryMethod: form.deliveryMethod,
        deliveryAddress: form.deliveryAddress,
        note: form.note
      });
      navigate('/order-placed', { state: { orders: [res.data] } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach(er => setAlert(er.msg, 'danger'));
      else setAlert(err.response?.data?.msg || 'Could not place order', 'danger');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <form className='form edit-panel' onSubmit={onSubmit}>
      <h4 className='text-primary'>{t('orderPanel.title', { name: post.productName })}</h4>
      <div className='form-group'>
        <input type='number' min='0' step='any' max={stock} name='quantity' value={form.quantity}
          placeholder={t('orderPanel.quantity', { unit: unitLabel, max: stock })} onChange={onChange} required />
        {total && <small className='form-text'>{t('orderPanel.total', { total, price: effPrice, unit: unitLabel })}{effPrice < post.price && ` · ${t('orderPanel.bulkApplied')}`}</small>}
      </div>
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
      <small className='form-text'>{t('orderPanel.payDirect')}</small>
      <div className='order-actions'>
        <button type='submit' className='btn btn-primary' disabled={placing}>{placing ? t('orderPanel.sending') : t('orderPanel.send')}</button>
        <button type='button' className='btn btn-dark' onClick={onAddToCart}>🛒 {t('orderPanel.addToCart')}</button>
        <button type='button' className='btn btn-light' onClick={onClose}>{t('orderPanel.cancel')}</button>
      </div>
    </form>
  );
};

OrderPanel.propTypes = {
  post: PropTypes.object.isRequired,
  stock: PropTypes.number.isRequired,
  setAlert: PropTypes.func.isRequired,
  addToCart: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default connect(null, { setAlert, addToCart })(OrderPanel);
