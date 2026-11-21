// Confirmation screen shown after an order request (single order or cart checkout)
import React, { Fragment } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import '../posts/Posts.css';

const OrderPlaced = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const orders = (location.state && location.state.orders) || [];

  // opened directly (e.g. page refresh): nothing to show
  if (orders.length === 0) return <Navigate to='/orders' replace />;

  const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const farmers = [...new Set(orders.map(o => o.farmerName).filter(Boolean))];
  const first = orders[0];

  return (
    <Fragment>
      <PageHeader icon="✅" title={t('orderPlaced.title')} subtitle={t('orderPlaced.subtitle', { count: farmers.length, names: farmers.join(', ') })} />

      <div className='order-card'>
        <h3>{t('orderPlaced.summary')}</h3>
        {orders.map(o => (
          <p key={o._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <span>{o.productName} × {o.quantity} {t(`units.${o.unit}`, o.unit)}</span>
            <strong>₹{o.totalAmount.toFixed(2)}</strong>
          </p>
        ))}
        <hr />
        <p style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>{t('cart.total')}</strong><strong>₹{total.toFixed(2)}</strong>
        </p>
        <p className='order-meta'>
          {first.deliveryMethod === 'delivery' ? t('orders.deliverTo', { address: first.deliveryAddress }) : t('orders.pickupNote')}
        </p>
      </div>

      <div className='order-card'>
        <h3>{t('orderPlaced.next')}</h3>
        <ol style={{ paddingLeft: '1.2rem' }}>
          <li>{t('orderPlaced.step1')}</li>
          <li>{t('orderPlaced.step2')}</li>
          <li>{t('orderPlaced.step3')}</li>
        </ol>
      </div>

      <div className='order-actions' style={{ justifyContent: 'center' }}>
        <Link to='/orders' className='btn btn-primary'>{t('orderPanel.viewOrders')}</Link>
        <Link to='/posts' className='btn btn-light'>{t('orderPlaced.continue')}</Link>
      </div>
    </Fragment>
  );
};

export default OrderPlaced;
