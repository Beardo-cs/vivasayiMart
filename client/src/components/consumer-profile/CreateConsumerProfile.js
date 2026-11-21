// Create / edit the consumer's own profile (saves to POST /api/consumer-profile, which upserts)
import React, { useEffect, useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setAlert } from '../../actions/alert';
import { getCurrentProfile, saveProfile } from '../../actions/profile';
import './ConsumerProfile.css';

const CreateConsumerProfile = ({ profile: { profile, loading }, auth: { user }, getCurrentProfile, saveProfile, setAlert }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', location: '', mobileNumber: '', preferences: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { getCurrentProfile('consumer'); }, [getCurrentProfile]);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                location: profile.location || '',
                mobileNumber: profile.mobileNumber || '',
                preferences: (profile.preferences || []).join(', ')
            });
        } else if (user) {
            setFormData(f => ({ ...f, name: f.name || user.name }));
        }
    }, [profile, user]);

    const isEdit = !!profile;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setSaving(true);
        const ok = await saveProfile('consumer', {
            ...formData,
            preferences: formData.preferences.split(',').map(s => s.trim()).filter(Boolean)
        });
        setSaving(false);
        if (ok) {
            setAlert(t('profileForm.saved'), 'success');
            navigate('/consumer-dashboard');
        }
    };

    return loading && !profile ? null : (
        <Fragment>
            <div className="modern-container">
                <div className="profile-header">
                    <h1 className="gradient-text">🛒 {isEdit ? t('profileForm.consumerTitleEdit') : t('profileForm.consumerTitleCreate')}</h1>
                    <p className="subtitle">{t('profileForm.consumerSubtitle')}</p>
                </div>

                <form className="modern-form" onSubmit={onSubmit}>
                    <div className="form-section">
                        <h2 className="section-title consumer-title">📋 {t('profileForm.basic')}</h2>
                        <div className="form-grid">
                            <div className="form-group-modern">
                                <label>{t('profileForm.fullName')} *</label>
                                <input type="text" name="name" value={formData.name} onChange={onChange} required className="modern-input" />
                            </div>
                            <div className="form-group-modern">
                                <label>{t('profileForm.location')}</label>
                                <input type="text" name="location" value={formData.location} onChange={onChange} className="modern-input" placeholder={t('profileForm.locationPh')} />
                            </div>
                            <div className="form-group-modern">
                                <label>{t('profileForm.mobile')}</label>
                                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={onChange} className="modern-input" placeholder="+91 98765 43210" />
                                <small>{t('profileForm.mobileWhy')}</small>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title consumer-title">🌱 {t('profileForm.preferencesTitle')}</h2>
                        <div className="form-group-modern">
                            <label>{t('profileForm.preferences')}</label>
                            <input type="text" name="preferences" value={formData.preferences} onChange={onChange} className="modern-input"
                                placeholder={t('profileForm.preferencesPh')} />
                            <small>{t('profileForm.specializationsHint')}</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-modern btn-primary-modern" disabled={saving}>
                            <i className="fas fa-check"></i> {isEdit ? t('profileForm.save') : t('profileForm.create')}
                        </button>
                        <Link to="/consumer-dashboard" className="btn-modern btn-secondary-modern">
                            <i className="fas fa-times"></i> {t('orderPanel.cancel')}
                        </Link>
                    </div>
                </form>
            </div>
        </Fragment>
    );
};

CreateConsumerProfile.propTypes = {
    profile: PropTypes.object.isRequired,
    auth: PropTypes.object.isRequired,
    getCurrentProfile: PropTypes.func.isRequired,
    saveProfile: PropTypes.func.isRequired,
    setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ profile: state.profile, auth: state.auth });
export default connect(mapStateToProps, { getCurrentProfile, saveProfile, setAlert })(CreateConsumerProfile);
