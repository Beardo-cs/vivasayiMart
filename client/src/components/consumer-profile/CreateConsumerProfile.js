import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setAlert } from '../../actions/alert';
import './ConsumerProfile.css';

const CreateConsumerProfile = ({ setAlert }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        mobileNumber: '',
        preferences: ''
    });

    const { name, location, mobileNumber, preferences } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        // TODO: Dispatch create consumer profile action
        console.log('Creating consumer profile:', formData);
        setAlert('Consumer profile created successfully!', 'success');
        navigate('/consumer-dashboard');
    };

    return (
        <Fragment>
            <div className="modern-container">
                <div className="profile-header consumer-header">
                    <h1 className="gradient-text">🛒 Create Your Consumer Profile</h1>
                    <p className="subtitle">Connect with local farmers and get fresh produce</p>
                </div>

                <form className="modern-form" onSubmit={onSubmit}>
                    {/* Basic Information */}
                    <div className="form-section">
                        <h2 className="section-title consumer-title">📋 Basic Information</h2>
                        <div className="form-grid">
                            <div className="form-group-modern">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Rajesh Kumar"
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    required
                                    className="modern-input"
                                />
                            </div>
                            <div className="form-group-modern">
                                <label>Location *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Chennai, Tamil Nadu"
                                    name="location"
                                    value={location}
                                    onChange={onChange}
                                    required
                                    className="modern-input"
                                />
                            </div>
                            <div className="form-group-modern full-width">
                                <label>Mobile Number *</label>
                                <input
                                    type="tel"
                                    placeholder="e.g., +91 98765 43210"
                                    name="mobileNumber"
                                    value={mobileNumber}
                                    onChange={onChange}
                                    required
                                    className="modern-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="form-section">
                        <h2 className="section-title consumer-title">🌱 Your Preferences</h2>
                        <div className="form-group-modern">
                            <label>What are you looking for?</label>
                            <textarea
                                placeholder="e.g., Organic vegetables, Fresh fruits, Dairy products, etc."
                                name="preferences"
                                value={preferences}
                                onChange={onChange}
                                rows="4"
                                className="modern-textarea"
                            />
                            <small>This helps farmers understand what you're interested in</small>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="info-box">
                        <h3>🎯 Why Create a Profile?</h3>
                        <ul>
                            <li>✅ Get personalized product recommendations</li>
                            <li>✅ Save your favorite farmers and products</li>
                            <li>✅ Receive notifications about fresh arrivals</li>
                            <li>✅ Direct communication with farmers</li>
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="submit" className="btn-modern btn-consumer-primary">
                            <i className="fas fa-check"></i> Create Profile
                        </button>
                        <Link to="/consumer-dashboard" className="btn-modern btn-secondary-modern">
                            <i className="fas fa-times"></i> Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </Fragment>
    );
};

CreateConsumerProfile.propTypes = {
    setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(CreateConsumerProfile);

