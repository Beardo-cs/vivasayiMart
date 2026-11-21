// Inline panel for a farmer to edit their own listing (price, stock, unit, category, ...)
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updatePost } from '../../actions/post';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];
const UNITS = ['kg', 'litre', 'dozen', 'piece'];

const EditPostPanel = ({ post, updatePost, onClose }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    productName: post.productName || '',
    text: post.text || '',
    category: post.category || 'Other',
    unit: post.unit || 'kg',
    price: post.price,
    quantityAvailable: post.quantityAvailable ?? post.weight,
    mobileNumber: post.mobileNumber || '',
    address: post.address || '',
    bulkMin: post.bulkPricing && post.bulkPricing[0] ? post.bulkPricing[0].minQuantity : '',
    bulkPrice: post.bulkPricing && post.bulkPricing[0] ? post.bulkPricing[0].price : ''
  });
  const [saving, setSaving] = useState(false);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    const { bulkMin, bulkPrice, ...rest } = form;
    const ok = await updatePost(post._id, {
      ...rest,
      price: parseFloat(form.price),
      quantityAvailable: parseFloat(form.quantityAvailable),
      bulkPricing: bulkMin !== '' && bulkPrice !== '' ? [{ minQuantity: parseFloat(bulkMin), price: parseFloat(bulkPrice) }] : []
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <form className='form edit-panel' onSubmit={onSubmit}>
      <h4 className='text-primary'>{t('editPanel.title')}</h4>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.productName')}</small>
        <input type='text' name='productName' value={form.productName} onChange={onChange} required />
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.category')}</small>
        <select name='category' value={form.category} onChange={onChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
        </select>
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.unit')}</small>
        <select name='unit' value={form.unit} onChange={onChange}>
          {UNITS.map(u => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
        </select>
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.price', { unit: t(`units.${form.unit}`) })}</small>
        <input type='number' min='0' step='any' name='price' value={form.price} onChange={onChange} required />
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.stock', { unit: t(`units.${form.unit}`) })}</small>
        <input type='number' min='0' step='any' name='quantityAvailable' value={form.quantityAvailable} onChange={onChange} required />
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('postForm.bulkTitle')}</small>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type='number' min='0' step='any' name='bulkMin' value={form.bulkMin} onChange={onChange}
            placeholder={t('postForm.bulkMin', { unit: t(`units.${form.unit}`) })} />
          <input type='number' min='0' step='any' name='bulkPrice' value={form.bulkPrice} onChange={onChange}
            placeholder={t('postForm.bulkPrice')} />
        </div>
        <small className='form-text'>{t('postForm.bulkHint')}</small>
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.contact')}</small>
        <input type='text' name='mobileNumber' value={form.mobileNumber} onChange={onChange} required />
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.address')}</small>
        <textarea name='address' rows='2' value={form.address} onChange={onChange} required />
      </div>
      <div className='form-group'>
        <small className='form-text'>{t('editPanel.description')}</small>
        <textarea name='text' rows='3' value={form.text} onChange={onChange} required />
      </div>
      <button type='submit' className='btn btn-primary' disabled={saving}>{saving ? '...' : t('editPanel.save')}</button>{' '}
      <button type='button' className='btn btn-light' onClick={onClose}>{t('orderPanel.cancel')}</button>
    </form>
  );
};

EditPostPanel.propTypes = {
  post: PropTypes.object.isRequired,
  updatePost: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default connect(null, { updatePost })(EditPostPanel);
