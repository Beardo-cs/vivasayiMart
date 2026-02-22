import React, { useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Spinner from '../layout/Spinner';
import DashboardActions from './DashboardActions';

const FarmerDashboard = ({
    auth: { user },
    profile: { profile, loading }
}) => {
    return loading && profile === null ? (
        <Spinner />
    ) : (
        <Fragment>
            <h1 className="large text-primary">🌾 Farmer Dashboard</h1>
            <p className="lead">
                <i className="fas fa-user"></i> Welcome {user && user.name}
            </p>
            {profile !== null ? (
                <Fragment>
                    <DashboardActions />
                    <div className="dash-buttons">
                        <Link to="/posts" className="btn btn-light">
                            <i className="fas fa-box text-primary"></i> My Products
                        </Link>
                        <Link to="/add-post" className="btn btn-primary">
                            <i className="fas fa-plus"></i> Create New Product
                        </Link>
                        <Link to="/market-price" className="btn btn-light">
                            <i className="fas fa-chart-line text-primary"></i> Market Prices
                        </Link>
                    </div>

                    <div className="my-2">
                        <h2 className="text-primary">Quick Stats</h2>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '1rem',
                            marginTop: '1rem'
                        }}>
                            <div style={{ 
                                padding: '1.5rem', 
                                background: '#f4f4f4', 
                                borderRadius: '5px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ color: '#17a2b8' }}>📦 Total Products</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>0</p>
                                <small>Products listed</small>
                            </div>
                            <div style={{ 
                                padding: '1.5rem', 
                                background: '#f4f4f4', 
                                borderRadius: '5px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ color: '#28a745' }}>✅ Active Listings</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>0</p>
                                <small>Currently available</small>
                            </div>
                            <div style={{ 
                                padding: '1.5rem', 
                                background: '#f4f4f4', 
                                borderRadius: '5px',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ color: '#ffc107' }}>👁️ Profile Views</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>0</p>
                                <small>This month</small>
                            </div>
                        </div>
                    </div>
                </Fragment>
            ) : (
                <Fragment>
                    <p>You have not yet set up a farmer profile. Please add your farm information.</p>
                    <Link to="/create-farmer-profile" className="btn btn-primary my-1">
                        Create Farmer Profile
                    </Link>
                </Fragment>
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

