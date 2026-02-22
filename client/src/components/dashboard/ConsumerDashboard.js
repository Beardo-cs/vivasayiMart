import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';

const ConsumerDashboard = ({
    auth: { user, loading }
}) => {
    return loading ? (
        <Spinner />
    ) : (
        <Fragment>
            <h1 className="large text-primary">🛒 Consumer Dashboard</h1>
            <p className="lead">
                <i className="fas fa-user"></i> Welcome {user && user.name}
            </p>
            
            <div className="dash-buttons">
                <Link to="/posts" className="btn btn-primary">
                    <i className="fas fa-shopping-basket"></i> Browse All Products
                </Link>
                <Link to="/farmers" className="btn btn-light">
                    <i className="fas fa-users text-primary"></i> Find Farmers Near Me
                </Link>
                <Link to="/market-price" className="btn btn-light">
                    <i className="fas fa-chart-line text-primary"></i> Check Market Prices
                </Link>
                <Link to="/consumer-profile" className="btn btn-light">
                    <i className="fas fa-user-circle text-primary"></i> My Profile
                </Link>
            </div>

            <div className="my-2">
                <h2 className="text-primary">Featured Categories</h2>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '1rem',
                    marginTop: '1rem'
                }}>
                    <Link to="/posts?category=Vegetables" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🥬</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Vegetables</p>
                        </div>
                    </Link>
                    <Link to="/posts?category=Fruits" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🍎</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Fruits</p>
                        </div>
                    </Link>
                    <Link to="/posts?category=Grains" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🌾</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Grains</p>
                        </div>
                    </Link>
                    <Link to="/posts?category=Dairy" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🥛</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Dairy</p>
                        </div>
                    </Link>
                    <Link to="/posts?category=Poultry" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🐔</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Poultry</p>
                        </div>
                    </Link>
                    <Link to="/posts?category=Other" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '1.5rem', 
                            background: '#f4f4f4', 
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <h3 style={{ fontSize: '2rem' }}>🌱</h3>
                            <p style={{ margin: '0.5rem 0', fontWeight: 'bold', color: '#333' }}>Other</p>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="my-2">
                <h2 className="text-primary">Why Buy Direct from Farmers?</h2>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1rem',
                    marginTop: '1rem'
                }}>
                    <div style={{ padding: '1rem', background: '#f4f4f4', borderRadius: '5px' }}>
                        <h4>🌱 Fresh & Organic</h4>
                        <p>Get farm-fresh produce directly from local farmers</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f4f4f4', borderRadius: '5px' }}>
                        <h4>💰 Fair Prices</h4>
                        <p>No middlemen - better prices for you and farmers</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f4f4f4', borderRadius: '5px' }}>
                        <h4>🤝 Support Local</h4>
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

