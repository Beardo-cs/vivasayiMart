import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Loader from '../layout/Loader';
import api from '../../utils/api';
import { getCurrentProfile } from '../../actions/profile';
import './Dashboard.css';

const FarmerDashboard = ({ auth: { user }, profile: { profile, loading }, getCurrentProfile }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);

    useEffect(() => { getCurrentProfile('farmer'); }, [getCurrentProfile]);
    useEffect(() => {
        api.get('/api/orders/stats').then(res => setStats(res.data)).catch(() => {});
    }, []);
    const n = key => (stats ? stats[key] : 0);

    return loading && profile === null ? (
        <Loader message={t('dashboard.loadingFarmer')} fullPage={true} />
    ) : (
        <Fragment>
            <div className="dashboard-header farmer-header">
                <div className="header-content">
                    <h1 className="dashboard-title">🌾 {t('dashboard.farmerTitle')}</h1>
                    <p className="dashboard-subtitle">{t('dashboard.welcome', { name: user && user.name })}</p>
                </div>
            </div>

            {(() => {
                const steps = [
                    { done: profile !== null, label: t('dashboard.todoProfile'), to: '/create-farmer-profile' },
                    { done: !!stats && stats.totalProducts > 0, label: t('dashboard.todoProduct'), to: '/add-product' },
                    { done: !(user && user.emailVerified === false), label: t('dashboard.todoEmail'), to: null }
                ];
                const left = steps.filter(s => !s.done).length;
                // wait for stats so the checklist doesn't flash a wrong state
                if (left === 0 || stats === null) return null;
                return (
                    <div className="order-card" style={{ margin: '1rem 0' }}>
                        <h3>🚀 {t('dashboard.getStarted')} <small>({steps.length - left}/{steps.length})</small></h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {steps.map(s => (
                                <li key={s.label} style={{ padding: '0.3rem 0' }}>
                                    {s.done ? '✅' : '⬜'}{' '}
                                    {s.done || !s.to ? <span style={s.done ? { textDecoration: 'line-through', color: '#7a8a6a' } : {}}>{s.label}</span> : <Link to={s.to}>{s.label}</Link>}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })()}

            {profile !== null ? (
                <Fragment>
                    <div className="dashboard-actions-modern">
                        <Link to="/add-product" className="action-card farmer-card primary">
                            <div className="card-icon">📸</div>
                            <h3>{t('posts.addProduct')}</h3>
                            <p>{t('dashboard.addDesc')}</p>
                        </Link>
                        <Link to="/posts?mine=1" className="action-card farmer-card">
                            <div className="card-icon">📦</div>
                            <h3>{t('nav.myProducts')}</h3>
                            <p>{t('dashboard.productsDesc')}</p>
                        </Link>
                        <Link to="/orders" className="action-card farmer-card">
                            <div className="card-icon">📥</div>
                            <h3>{t('nav.orders')}</h3>
                            <p>{t('dashboard.ordersDesc')}</p>
                        </Link>
                        <Link to={`/farmer/${user && user._id}`} className="action-card farmer-card">
                            <div className="card-icon">🔗</div>
                            <h3>{t('dashboard.myPage')}</h3>
                            <p>{t('dashboard.myPageDesc')}</p>
                        </Link>
                        <Link to="/market-price" className="action-card farmer-card">
                            <div className="card-icon">📊</div>
                            <h3>{t('nav.marketPrice')}</h3>
                            <p>{t('dashboard.marketDesc')}</p>
                        </Link>
                        <Link to="/create-farmer-profile" className="action-card farmer-card">
                            <div className="card-icon">⚙️</div>
                            <h3>{t('dashboard.editProfile')}</h3>
                            <p>{t('dashboard.editProfileDesc')}</p>
                        </Link>
                        <Link to="/account" className="action-card farmer-card">
                            <div className="card-icon">🔐</div>
                            <h3>{t('account.title')}</h3>
                            <p>{t('account.cardDesc')}</p>
                        </Link>
                    </div>

                    <div className="stats-section">
                        <h2 className="section-title">📈 {t('dashboard.stats')}</h2>
                        <div className="stats-grid">
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">📦</div>
                                <div className="stat-content">
                                    <h3>{t('dashboard.totalProducts')}</h3>
                                    <p className="stat-number">{n('totalProducts')}</p>
                                    <small>{t('dashboard.totalProductsSub')}</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">✅</div>
                                <div className="stat-content">
                                    <h3>{t('dashboard.activeListings')}</h3>
                                    <p className="stat-number">{n('activeListings')}</p>
                                    <small>{t('dashboard.activeListingsSub')}</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">📥</div>
                                <div className="stat-content">
                                    <h3>{t('dashboard.pendingOrders')}</h3>
                                    <p className="stat-number">{n('pendingOrders')}</p>
                                    <small>{t('dashboard.pendingOrdersSub', { count: n('confirmedOrders') })}</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <h3>{t('dashboard.salesCompleted')}</h3>
                                    <p className="stat-number">₹{Number(n('revenue')).toFixed(2)}</p>
                                    <small>{t('dashboard.salesCompletedSub', { count: n('completedOrders') })}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </Fragment>
            ) : (
                <div className="no-profile-card">
                    <div className="no-profile-icon">🌾</div>
                    <h2>{t('dashboard.noProfileTitle')}</h2>
                    <p>{t('dashboard.noProfileText')}</p>
                    <Link to="/create-farmer-profile" className="btn-modern btn-primary-modern">
                        <i className="fas fa-plus"></i> {t('dashboard.createProfile')}
                    </Link>
                    {' '}
                    <Link to="/posts?mine=1" className="btn-modern btn-secondary-modern">{t('dashboard.productsCard')}</Link>
                </div>
            )}
        </Fragment>
    );
};

FarmerDashboard.propTypes = {
    auth: PropTypes.object.isRequired,
    profile: PropTypes.object.isRequired,
    getCurrentProfile: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ auth: state.auth, profile: state.profile });
export default connect(mapStateToProps, { getCurrentProfile })(FarmerDashboard);
