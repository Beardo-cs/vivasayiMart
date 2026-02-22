import React, { useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import DashboardActions from './DashboardActions';
import './Dashboard.css';

const FarmerDashboard = ({
    auth: { user },
    profile: { profile, loading }
}) => {
    return loading && profile === null ? (
        <Spinner />
    ) : (
        <Fragment>
            <div className="dashboard-header farmer-header">
                <div className="header-content">
                    <h1 className="dashboard-title">🌾 Farmer Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome back, {user && user.name}!</p>
                </div>
            </div>

            {profile !== null ? (
                <Fragment>
                    <div className="dashboard-actions-modern">
                        <Link to="/posts" className="action-card farmer-card">
                            <div className="card-icon">📦</div>
                            <h3>My Products</h3>
                            <p>View and manage your listings</p>
                        </Link>
                        <Link to="/add-post" className="action-card farmer-card primary">
                            <div className="card-icon">➕</div>
                            <h3>Add Product</h3>
                            <p>List a new product</p>
                        </Link>
                        <Link to="/market-price" className="action-card farmer-card">
                            <div className="card-icon">📊</div>
                            <h3>Market Prices</h3>
                            <p>Check current rates</p>
                        </Link>
                        <Link to="/edit-profile" className="action-card farmer-card">
                            <div className="card-icon">⚙️</div>
                            <h3>Edit Profile</h3>
                            <p>Update farm details</p>
                        </Link>
                    </div>

                    <div className="stats-section">
                        <h2 className="section-title">📈 Quick Stats</h2>
                        <div className="stats-grid">
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">📦</div>
                                <div className="stat-content">
                                    <h3>Total Products</h3>
                                    <p className="stat-number">0</p>
                                    <small>Products listed</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">✅</div>
                                <div className="stat-content">
                                    <h3>Active Listings</h3>
                                    <p className="stat-number">0</p>
                                    <small>Currently available</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">👁️</div>
                                <div className="stat-content">
                                    <h3>Profile Views</h3>
                                    <p className="stat-number">0</p>
                                    <small>This month</small>
                                </div>
                            </div>
                            <div className="stat-card farmer-stat">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <h3>Total Value</h3>
                                    <p className="stat-number">₹0</p>
                                    <small>Listed products</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </Fragment>
            ) : (
                <div className="no-profile-card">
                    <div className="no-profile-icon">🌾</div>
                    <h2>Create Your Farmer Profile</h2>
                    <p>You haven't set up your farmer profile yet. Create one to start listing your products and connect with consumers.</p>
                    <Link to="/create-farmer-profile" className="btn-modern btn-primary-modern">
                        <i className="fas fa-plus"></i> Create Farmer Profile
                    </Link>
                </div>
            )}
        </Fragment>
    );
};

FarmerDashboard.propTypes = {
    auth: PropTypes.object.isRequired,
    profile: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth,
    profile: state.profile
});

export default connect(mapStateToProps)(FarmerDashboard);

