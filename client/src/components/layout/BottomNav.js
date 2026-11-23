// Phone-style tab bar. Shown only on small screens (see App.css) for logged-in users.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useOrderBadge from '../../utils/useOrderBadge';
import { canUseCropHealth } from '../vivasayi-ai/access';

const BottomNav = ({ isAuthenticated, user, cartCount }) => {
  const { t } = useTranslation();
  const ordersBadge = useOrderBadge(isAuthenticated);

  if (!isAuthenticated || !user || !user.userType) return null;

  const farmerTabs = [
    { to: '/farmer-dashboard', icon: 'fa-home', label: t('bottomNav.home') },
    { to: '/posts?mine=1', icon: 'fa-box', label: t('nav.myProducts') },
    { to: '/add-product', icon: 'fa-plus-circle', label: t('bottomNav.add'), highlight: true },
    { to: '/orders', icon: 'fa-receipt', label: t('nav.orders'), badge: ordersBadge },
    canUseCropHealth(user)
      ? { to: '/vivasayi-ai', icon: 'fa-seedling', label: t('bottomNav.ai'), end: false }
      : { to: '/market-price', icon: 'fa-chart-line', label: t('bottomNav.prices') }
  ];
  const buyerTabs = [
    { to: '/consumer-dashboard', icon: 'fa-home', label: t('bottomNav.home') },
    { to: '/posts', icon: 'fa-shopping-basket', label: t('bottomNav.shop') },
    { to: '/cart', icon: 'fa-shopping-cart', label: t('nav.cart'), badge: cartCount },
    { to: '/orders', icon: 'fa-receipt', label: t('nav.orders'), badge: ordersBadge },
    { to: '/farmers', icon: 'fa-users', label: t('nav.farmers') }
  ];
  const tabs = user.userType === 'consumer' ? buyerTabs : farmerTabs;

  return (
    <nav className="bottom-nav" aria-label={t('bottomNav.label')}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end ?? !tab.to.includes('?')}
          className={({ isActive }) => `bottom-tab${tab.highlight ? ' highlight' : ''}${isActive && !tab.to.includes('?') ? ' active' : ''}`}
        >
          <i className={`fas ${tab.icon}`}></i>
          <span>{tab.label}</span>
          {tab.badge > 0 && <b className="bottom-badge">{tab.badge}</b>}
        </NavLink>
      ))}
    </nav>
  );
};

BottomNav.propTypes = {
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
  cartCount: PropTypes.number
};

const mapStateToProps = state => ({
  isAuthenticated: !!state.auth.isAuthenticated,
  user: state.auth.user,
  cartCount: state.cart.items.length
});

export default connect(mapStateToProps)(BottomNav);
