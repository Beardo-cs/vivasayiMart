import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Loader from '../layout/Loader';
import './Dashboard.css';

const CATEGORIES = [
    ['Vegetables', '🥬'], ['Fruits', '🍎'], ['Grains', '🌾'],
    ['Dairy', '🥛'], ['Poultry', '🐔'], ['Other', '🌱']
];

const ConsumerDashboard = ({ auth: { user, loading } }) => {
    const { t } = useTranslation();

    return loading ? (
        <Loader message={t('dashboard.loadingConsumer')} fullPage={true} />
    ) : (
        <Fragment>
            <div className="dashboard-header consumer-header">
                <div className="header-content">
                    <h1 className="dashboard-title">🛒 {t('dashboard.consumerTitle')}</h1>
                    <p className="dashboard-subtitle">{t('dashboard.welcome', { name: user && user.name })}</p>
                </div>
            </div>

            <div className="dashboard-actions-modern">
                <Link to="/posts" className="action-card consumer-card primary">
                    <div className="card-icon">🛍️</div>
                    <h3>{t('nav.browse')}</h3>
                    <p>{t('dashboard.browseDesc')}</p>
                </Link>
                <Link to="/orders" className="action-card consumer-card">
                    <div className="card-icon">🧾</div>
                    <h3>{t('nav.orders')}</h3>
                    <p>{t('dashboard.myOrdersDesc')}</p>
                </Link>
                <Link to="/farmers" className="action-card consumer-card">
                    <div className="card-icon">👨‍🌾</div>
                    <h3>{t('nav.farmers')}</h3>
                    <p>{t('dashboard.findFarmersDesc')}</p>
                </Link>
                <Link to="/market-price" className="action-card consumer-card">
                    <div className="card-icon">📊</div>
                    <h3>{t('nav.marketPrice')}</h3>
                    <p>{t('dashboard.marketDesc')}</p>
                </Link>
                <Link to="/create-consumer-profile" className="action-card consumer-card">
                    <div className="card-icon">👤</div>
                    <h3>{t('dashboard.myProfile')}</h3>
                    <p>{t('dashboard.myProfileDesc')}</p>
                </Link>
            </div>

            <div className="categories-section">
                <h2 className="section-title">🌾 {t('dashboard.featuredCategories')}</h2>
                <div className="categories-grid">
                    {CATEGORIES.map(([name, icon]) => (
                        <Link key={name} to={`/posts?category=${name}`} className="category-card">
                            <div className="category-icon">{icon}</div>
                            <h3>{t(`categories.${name}`)}</h3>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="benefits-section">
                <h2 className="section-title">✨ {t('dashboard.whyDirect')}</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                        <div className="benefit-icon">🌱</div>
                        <h3>{t('dashboard.benefit1Title')}</h3>
                        <p>{t('dashboard.benefit1Text')}</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">💰</div>
                        <h3>{t('dashboard.benefit2Title')}</h3>
                        <p>{t('dashboard.benefit2Text')}</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">🤝</div>
                        <h3>{t('dashboard.benefit3Title')}</h3>
                        <p>{t('dashboard.benefit3Text')}</p>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

ConsumerDashboard.propTypes = { auth: PropTypes.object.isRequired };
const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(ConsumerDashboard);
