import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];

// Search / filter bar. Text inputs are debounced so we don't query on every keystroke.
const PostFilters = ({ filters, onChange }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false); // phones: extra filters hidden until opened
  const [local, setLocal] = useState(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      const changed = ['q', 'location', 'minPrice', 'maxPrice'].some(k => (local[k] || '') !== (filters[k] || ''));
      if (changed) onChange(local);
    }, 400);
    return () => clearTimeout(t);
  }, [local, filters, onChange]);

  const setField = (name, value, immediate) => {
    const next = { ...local, [name]: value };
    setLocal(next);
    if (immediate) onChange(next);
  };

  const activeCount = ['category', 'location', 'minPrice', 'maxPrice', 'inStock', 'saved'].filter(k => filters[k]).length
    + (filters.sort && filters.sort !== 'newest' ? 1 : 0);

  const clear = () => onChange({ q: '', category: '', location: '', minPrice: '', maxPrice: '', inStock: false, saved: false, sort: 'newest' });

  return (
    <div className='posts-filters'>
      <div className='filters-bar'>
        <input type='search' aria-label={t('filters.search')} placeholder={t('filters.search')} value={local.q || ''} onChange={e => setField('q', e.target.value)} />
        <button type='button' className='filters-toggle btn btn-light' onClick={() => setOpen(!open)} aria-expanded={open}>
          ⚙ {t('filters.title')}{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>
      <div className={`filters-extra${open ? ' open' : ''}`}>
      <select value={local.category || ''} onChange={e => setField('category', e.target.value, true)}>
        <option value=''>{t('filters.allCategories')}</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
      </select>
      <input type='text' placeholder={t('filters.location')} value={local.location || ''} onChange={e => setField('location', e.target.value)} />
      <input type='number' min='0' placeholder={t('filters.minPrice')} value={local.minPrice || ''} onChange={e => setField('minPrice', e.target.value)} />
      <input type='number' min='0' placeholder={t('filters.maxPrice')} value={local.maxPrice || ''} onChange={e => setField('maxPrice', e.target.value)} />
      <select value={local.sort || 'newest'} onChange={e => setField('sort', e.target.value, true)}>
        <option value='newest'>{t('filters.newest')}</option>
        <option value='price_asc'>{t('filters.priceAsc')}</option>
        <option value='price_desc'>{t('filters.priceDesc')}</option>
      </select>
      <label>
        <input type='checkbox' checked={!!local.inStock} onChange={e => setField('inStock', e.target.checked, true)} /> {t('filters.inStock')}
      </label>
      <label>
        <input type='checkbox' checked={!!local.saved} onChange={e => setField('saved', e.target.checked, true)} /> {t('filters.savedOnly')}
      </label>
      <button type='button' className='btn btn-light' onClick={clear}>{t('filters.clear')}</button>
      </div>
    </div>
  );
};

PostFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default PostFilters;
