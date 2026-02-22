import React, { useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setAlert } from '../../actions/alert';
import './FarmerProfile.css';

const CreateFarmerProfile = ({ setAlert }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        farmName: '',
        location: '',
        mobileNumber: '',
        bio: '',
        farmingSpecializations: '',
        yearsOfExperience: '',
        farmSize: '',
        certifications: '',
        profileImage: '',
        facebook: '',
        instagram: '',
        whatsapp: ''
    });

    const {
        farmName,
        location,
        mobileNumber,
        bio,
        farmingSpecializations,
        yearsOfExperience,
        farmSize,
        certifications,
        profileImage,
        facebook,
        instagram,
        whatsapp
    } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        // TODO: Dispatch create farmer profile action
        console.log('Creating farmer profile:', formData);
        setAlert('Farmer profile created successfully!', 'success');
        navigate('/farmer-dashboard');
    };

    return (
        <Fragment>
            <div className="modern-container">
                <div className="profile-header">
                    <h1 className="gradient-text">🌾 Create Your Farmer Profile</h1>
                    <p className="subtitle">Showcase your farm and connect with consumers</p>
                </div>

                <form className="modern-form" onSubmit={onSubmit}>
                    {/* Basic Information */}
                    <div className="form-section">
                        <h2 className="section-title">📋 Basic Information</h2>
                        <div className="form-grid">
                            <div className="form-group-modern">
                                <label>Farm Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Green Valley Organic Farm"
                                    name="farmName"
                                    value={farmName}
                                    onChange={onChange}
                                    required
                                    className="modern-input"
                                />
                            </div>
                            <div className="form-group-modern">
                                <label>Location *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Salem, Tamil Nadu"
                                    name="location"
                                    value={location}
                                    onChange={onChange}
                                    required
                                    className="modern-input"
                                />
                            </div>
                            <div className="form-group-modern">
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
                            <div className="form-group-modern">
                                <label>Profile Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/your-photo.jpg"
                                    name="profileImage"
                                    value={profileImage}
                                    onChange={onChange}
                                    className="modern-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Farm Details */}
                    <div className="form-section">
                        <h2 className="section-title">🚜 Farm Details</h2>
                        <div className="form-grid">
                            <div className="form-group-modern">
                                <label>Farming Specializations</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Organic Vegetables, Rice, Fruits"
                                    name="farmingSpecializations"
                                    value={farmingSpecializations}
                                    onChange={onChange}
                                    className="modern-input"
                                />
                                <small>Separate multiple items with commas</small>
                            </div>
                            <div className="form-group-modern">
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 10"
                                    name="yearsOfExperience"
                                    value={yearsOfExperience}
                                    onChange={onChange}
                                    className="modern-input"
                                />
                            </div>
                            <div className="form-group-modern full-width">
                                <label>Farm Size</label>
                                <input
                                    type="text"
                                    placeholder="e.g., 5 acres"
                                    name="farmSize"
                                    value={farmSize}
                                    onChange={onChange}
                                    className="modern-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="form-section">
                        <h2 className="section-title">✍️ Tell Your Story</h2>
                        <div className="form-group-modern">
                            <label>Bio</label>
                            <textarea
                                placeholder="Tell consumers about your farm, farming practices, and what makes your products special..."
                                name="bio"
                                value={bio}
                                onChange={onChange}
                                rows="5"
                                className="modern-textarea"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="form-actions">
                        <button type="submit" className="btn-modern btn-primary-modern">
                            <i className="fas fa-check"></i> Create Profile
                        </button>
                        <Link to="/farmer-dashboard" className="btn-modern btn-secondary-modern">
                            <i className="fas fa-times"></i> Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </Fragment>
    );
};

CreateFarmerProfile.propTypes = {
    setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(CreateFarmerProfile);

