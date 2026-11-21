import React, { Fragment } from 'react';
// instead of using a tag for linking file, importing link from react-router-dom
import { Link} from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../actions/auth';
import Loader from './Loader';
import api from '../../utils/api';
import useOrderBadge from '../../utils/useOrderBadge';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';
import { setAlert } from '../../actions/alert';

const Navbar = ({  auth: { isAuthenticated, loading, user }, cartCount, logout, setAlert }) => {
  const { t, i18n } = useTranslation();
  const orderBadge = useOrderBadge(isAuthenticated);

  const switchLang = e => {
    e.preventDefault();
    setLanguage(i18n.language === 'ta' ? 'en' : 'ta');
  };

  const resendVerification = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/resend-verification');
      setAlert(res.data.msg, 'success');
    } catch (err) {
      setAlert(err.response?.data?.msg || 'Could not send email', 'danger');
    }
  };

  // Show loader during logout
  if (loading && !isAuthenticated && !user) {
    return <Loader message={t('loggingOut')} fullPage={true} />;
  }

  // Farmer Links
  const farmerLinks = (
    <ul>
          <li className="nav-main">
            <Link to="/farmer-dashboard">
            <i className="fas fa-tachometer-alt"></i>{' '}
            <span className="hide-sm">{t('nav.dashboard')}</span>
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/posts?mine=1">
            <i className="fas fa-box"></i>{' '}
            <span className="hide-sm">{t('nav.myProducts')}</span>
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/orders">
            <i className="fas fa-receipt"></i>{' '}
            <span className="hide-sm">{t('nav.orders')}</span>
            {orderBadge > 0 && <span className="order-badge">{orderBadge}</span>}
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">{t('nav.marketPrice')}</span>
            </Link>
          </li>
          {user && user.isAdmin && (
          <li>
            <Link to="/admin">
            <i className="fas fa-shield-alt"></i>{' '}
            <span className="hide-sm">{t('nav.admin')}</span>
            </Link>
          </li>
          )}
          <li className="keep-label">
          <a onClick={logout} href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">{t('nav.logout')}</span>
          </a>
          </li>
          <li>
          <a onClick={switchLang} href='#!'>
          <i className="fas fa-language"></i>{' '}
          <span>{t('language')}</span>
          </a>
          </li>
        </ul>
  );

  // Consumer Links
  const consumerLinks = (
    <ul>
          <li className="nav-main">
            <Link to="/consumer-dashboard">
            <i className="fas fa-tachometer-alt"></i>{' '}
            <span className="hide-sm">{t('nav.dashboard')}</span>
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/posts">
            <i className="fas fa-shopping-basket"></i>{' '}
            <span className="hide-sm">{t('nav.browse')}</span>
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/farmers">
            <i className="fas fa-users"></i>{' '}
            <span className="hide-sm">{t('nav.farmers')}</span>
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/cart">
            <i className="fas fa-shopping-cart"></i>{' '}
            <span className="hide-sm">{t('nav.cart')}</span>
            {cartCount > 0 && <span className="order-badge">{cartCount}</span>}
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/orders">
            <i className="fas fa-receipt"></i>{' '}
            <span className="hide-sm">{t('nav.orders')}</span>
            {orderBadge > 0 && <span className="order-badge">{orderBadge}</span>}
            </Link>
          </li>
          <li className="nav-main">
            <Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">{t('nav.marketPrice')}</span>
            </Link>
          </li>
          {user && user.isAdmin && (
          <li>
            <Link to="/admin">
            <i className="fas fa-shield-alt"></i>{' '}
            <span className="hide-sm">{t('nav.admin')}</span>
            </Link>
          </li>
          )}
          <li className="keep-label">
          <a onClick={logout} href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">{t('nav.logout')}</span>
          </a>
          </li>
          <li>
          <a onClick={switchLang} href='#!'>
          <i className="fas fa-language"></i>{' '}
          <span>{t('language')}</span>
          </a>
          </li>
        </ul>
  );

  // Old accounts with no role yet: only language + logout until they choose
  const roleLessLinks = (
    <ul>
          <li className="keep-label">
          <a onClick={logout} href='#!'>
          <i className="fas fa-sign-out-alt"></i>{' '}
          <span className="hide-sm">{t('nav.logout')}</span>
          </a>
          </li>
          <li>
          <a onClick={switchLang} href='#!'>
          <i className="fas fa-language"></i>{' '}
          <span>{t('language')}</span>
          </a>
          </li>
    </ul>
  );

  // Determine which auth links to show
  const authLinks = user && user.userType === 'farmer' ? farmerLinks :
                    user && user.userType === 'consumer' ? consumerLinks :
                    user ? roleLessLinks :
                    farmerLinks; // (user still loading)

  const guestLinks = (
    <ul>
          <li className="nav-secondary"><Link to="/market-price">
            <i className="fas fa-chart-line"></i>{' '}
            <span className="hide-sm">{t('nav.marketPrice')}</span>
          </Link></li>
          <li className="nav-secondary"><Link to="/register">
            <i className="fas fa-user-plus"></i>{' '}
            <span className="hide-sm">{t('nav.register')}</span>
          </Link></li>
          <li className="keep-label"><Link to="/login">
            <i className="fas fa-sign-in-alt"></i>{' '}
            <span className="hide-sm">{t('nav.login')}</span>
          </Link></li>
          <li><a onClick={switchLang} href='#!'><i className="fas fa-language"></i>{' '}<span>{t('language')}</span></a></li>
        </ul>
  );

    return (
      <Fragment>
        <nav className="navbar bg-dark">
        <h1>
          <Link to ='/'>
            <i className="fas fa-seedling"></i> VivasayiMart
          </Link>
        </h1>
        {!loading && (<Fragment> { isAuthenticated ? authLinks : guestLinks }</Fragment>)}
      </nav>
      {isAuthenticated && user && user.emailVerified === false && (
        <div className="status-banner verify" role="status">
          {t('auth.unverifiedBanner')}{' '}
          <a href="#!" onClick={resendVerification}>{t('auth.resend')}</a>
        </div>
      )}
      </Fragment>
    )
}

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  cartCount: PropTypes.number,
  auth: PropTypes.object.isRequired
};

const mapStateToProps =  state => ({
  auth: state.auth,
  cartCount: state.cart.items.length
});

export default connect(
  mapStateToProps, 
  { logout, setAlert }
  ) (Navbar);