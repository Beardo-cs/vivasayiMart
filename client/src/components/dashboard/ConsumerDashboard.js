import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Loader from '../layout/Loader';
import './Dashboard.css';

const ConsumerDashboard = ({
    auth: { user, loading }
}) => {
    return loading ? (
        <Loader message="Loading your consumer dashboard..." fullPage={true} />
    ) : (
        <Fragment>
            <div className="dashboard-header consumer-header">
                <div className="header-content">
                    <h1 className="dashboard-title">🛒 Consumer Dashboard</h1>
                    <p className="dashboard-subtitle">Welcome back, {user && user.name}!</p>
                </div>
            </div>

            <div className="dashboard-actions-modern">
                <Link to="/posts" className="action-card consumer-card primary">
                    <div className="card-icon">🛍️</div>
                    <h3>Browse Products</h3>
                    <p>Fresh from local farms</p>
                </Link>
                <Link to="/farmers" className="action-card consumer-card">
                    <div className="card-icon">👨‍🌾</div>
                    <h3>Find Farmers</h3>
                    <p>Connect with local farmers</p>
                </Link>
                <Link to="/market-price" className="action-card consumer-card">
                    <div className="card-icon">📊</div>
                    <h3>Market Prices</h3>
                    <p>Check current rates</p>
                </Link>
                <Link to="/consumer-profile" className="action-card consumer-card">
                    <div className="card-icon">👤</div>
                    <h3>My Profile</h3>
                    <p>Manage preferences</p>
                </Link>
            </div>

            <div className="categories-section">
                <h2 className="section-title">🌾 Featured Categories</h2>
                <div className="categories-grid">
                    <Link to="/posts?category=Vegetables" className="category-card">
                        <div className="category-icon">🥬</div>
                        <h3>Vegetables</h3>
                    </Link>
                    <Link to="/posts?category=Fruits" className="category-card">
                        <div className="category-icon">🍎</div>
                        <h3>Fruits</h3>
                    </Link>
                    <Link to="/posts?category=Grains" className="category-card">
                        <div className="category-icon">🌾</div>
                        <h3>Grains</h3>
                    </Link>
                    <Link to="/posts?category=Dairy" className="category-card">
                        <div className="category-icon">🥛</div>
                        <h3>Dairy</h3>
                    </Link>
                    <Link to="/posts?category=Poultry" className="category-card">
                        <div className="category-icon">🐔</div>
                        <h3>Poultry</h3>
                    </Link>
                    <Link to="/posts?category=Other" className="category-card">
                        <div className="category-icon">🌱</div>
                        <h3>Other</h3>
                    </Link>
                </div>
            </div>

            <div className="benefits-section">
                <h2 className="section-title">✨ Why Buy Direct from Farmers?</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                        <div className="benefit-icon">🌱</div>
                        <h3>Fresh & Organic</h3>
                        <p>Get farm-fresh produce directly from local farmers</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">💰</div>
                        <h3>Fair Prices</h3>
                        <p>No middlemen - better prices for you and farmers</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">🤝</div>
                        <h3>Support Local</h3>
                        <p>Help local farmers and strengthen your community</p>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

ConsumerDashboard.propTypes = {
    auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    auth: state.auth
});

export default connect(mapStateToProps)(ConsumerDashboard);

