// Create / edit the farmer's own profile (saves to POST /api/farmer-profile, which upserts)
import React, { useEffect, useState, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { setAlert } from '../../actions/alert';
import { getCurrentProfile, saveProfile } from '../../actions/profile';
import './FarmerProfile.css';

const empty = {
    farmName: '', location: '', mobileNumber: '', bio: '', farmingSpecializations: '',
    yearsOfExperience: '', farmSize: '', certifications: '', profileImage: '', whatsapp: ''
};

const CreateFarmerProfile = ({ profile: { profile, loading }, getCurrentProfile, saveProfile, setAlert }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(empty);
    const [saving, setSaving] = useState(false);

    useEffect(() => { getCurrentProfile('farmer'); }, [getCurrentProfile]);

    // pre-fill when editing an existing profile
    useEffect(() => {
        if (profile) {
            setFormData({
                ...empty,
                ...Object.fromEntries(Object.keys(empty).map(k => [k, profile[k] ?? ''])),
                farmingSpecializations: (profile.farmingSpecializations || []).join(', '),
                whatsapp: (profile.social && profile.social.whatsapp) || ''
            });
        }
    }, [profile]);

    const isEdit = !!profile;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        const specializations = formData.farmingSpecializations.split(',').map(s => s.trim()).filter(Boolean);
        if (specializations.length === 0) {
            setAlert(t('profileForm.needSpecialization'), 'danger');
            return;
        }
        setSaving(true);
        const ok = await saveProfile('farmer', {
            ...formData,
            farmingSpecializations: specializations,
            yearsOfExperience: formData.yearsOfExperience === '' ? undefined : Number(formData.yearsOfExperience)
        });
        setSaving(false);
        if (ok) {
            setAlert(t('profileForm.saved'), 'success');
            navigate('/farmer-dashboard');
        }
    };

    const field = (name, label, props = {}) => (
        <div className="form-group-modern">
            <label>{label}</label>
            <input name={name} value={formData[name]} onChange={onChange} className="modern-input" {...props} />
        </div>
    );

    return loading && !profile ? null : (
        <Fragment>
            <div className="modern-container">
                <div className="profile-header">
                    <h1 className="gradient-text">🌾 {isEdit ? t('profileForm.titleEdit') : t('profileForm.titleCreate')}</h1>
                    <p className="subtitle">{t('profileForm.farmerSubtitle')}</p>
                </div>

                <form className="modern-form" onSubmit={onSubmit}>
                    <div className="form-section">
                        <h2 className="section-title">📋 {t('profileForm.basic')}</h2>
                        <div className="form-grid">
                            {field('farmName', `${t('profileForm.farmName')} *`, { type: 'text', required: true, placeholder: t('profileForm.farmNamePh') })}
                            {field('location', `${t('profileForm.location')} *`, { type: 'text', required: true, placeholder: t('profileForm.locationPh') })}
                            {field('mobileNumber', `${t('profileForm.mobile')} *`, { type: 'tel', required: true, placeholder: '+91 98765 43210' })}
                            {field('whatsapp', t('profileForm.whatsapp'), { type: 'tel', placeholder: '+91 98765 43210' })}
                            {field('profileImage', t('profileForm.imageUrl'), { type: 'url', placeholder: 'https://example.com/your-photo.jpg' })}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">🚜 {t('profileForm.farmDetails')}</h2>
                        <div className="form-grid">
                            <div className="form-group-modern">
                                <label>{t('profileForm.specializations')} *</label>
                                <input name="farmingSpecializations" value={formData.farmingSpecializations} onChange={onChange}
                                    className="modern-input" required placeholder={t('profileForm.specializationsPh')} />
                                <small>{t('profileForm.specializationsHint')}</small>
                            </div>
                            {field('yearsOfExperience', t('profileForm.years'), { type: 'number', min: 0, max: 100 })}
                            {field('farmSize', t('profileForm.size'), { type: 'text', placeholder: t('profileForm.sizePh') })}
                            {field('certifications', t('profileForm.certifications'), { type: 'text' })}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">✍️ {t('profileForm.story')}</h2>
                        <div className="form-group-modern">
                            <label>{t('profileForm.bio')}</label>
                            <textarea name="bio" value={formData.bio} onChange={onChange} rows="5" className="modern-textarea"
                                placeholder={t('profileForm.bioPh')} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-modern btn-primary-modern" disabled={saving}>
                            <i className="fas fa-check"></i> {isEdit ? t('profileForm.save') : t('profileForm.create')}
                        </button>
                        <Link to="/farmer-dashboard" className="btn-modern btn-secondary-modern">
                            <i className="fas fa-times"></i> {t('orderPanel.cancel')}
                        </Link>
                    </div>
                </form>
            </div>
        </Fragment>
    );
};

CreateFarmerProfile.propTypes = {
    profile: PropTypes.object.isRequired,
    getCurrentProfile: PropTypes.func.isRequired,
    saveProfile: PropTypes.func.isRequired,
    setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({ profile: state.profile });
export default connect(mapStateToProps, { getCurrentProfile, saveProfile, setAlert })(CreateFarmerProfile);
