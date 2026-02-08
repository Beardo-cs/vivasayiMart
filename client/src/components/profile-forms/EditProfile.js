import React, {Fragment, useState, useEffect} from 'react';
//it is used to redirect from the action.
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {connect } from 'react-redux';
import { createProfile, getCurrentProfile} from '../../actions/profile';

const EditProfile = ({
    profile: {profile, loading},
    createProfile,
    getCurrentProfile
  }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        company: '',
        website: '',
        location: '',
        skills: '',
        bio: ''
    });

    useEffect (() => {
      getCurrentProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!loading && profile) {
        setFormData({
          company: !profile.company ? '' : profile.company,
          website: !profile.website ? '' : profile.website,
          location: !profile.location ? '' : profile.location,
          status: !profile.status ? '' : profile.status,
          skills: !profile.skills ? '' : profile.skills.join(','),
          bio: !profile.bio ? '' : profile.bio
        });
      }
    }, [loading, profile]);

    const {
        company,
        website,
        location,
        status,
        skills,
        bio
      } = formData;
    const onChange = e => setFormData ({...formData, [e.target.name]: e.target.value });

    const onSubmit = e => {
      e.preventDefault();
      createProfile(formData, navigate, true);
    }

    return (
        <Fragment>
        <h1 className="large text-primary">
        Edit Farmer Profile
      </h1>
      <p className="lead">
        <i className="fas fa-user"></i> Update your farmer profile information
      </p>

      <small>* = required field</small>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <select name="status" value={status} onChange = {e=> onChange(e)}>
            <option value="0">* Select Farmer Type</option>
            <option value="Small Scale Farmer">Small Scale Farmer</option>
            <option value="Medium Scale Farmer">Medium Scale Farmer</option>
            <option value="Large Scale Farmer">Large Scale Farmer</option>
            <option value="Organic Farmer">Organic Farmer</option>
            <option value="Dairy Farmer">Dairy Farmer</option>
            <option value="Poultry Farmer">Poultry Farmer</option>
            <option value="Livestock Farmer">Livestock Farmer</option>
            <option value="Other">Other</option>
          </select>
          <small className="form-text">Select the type of farming you do</small>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Farm Name (Optional)"
            name="company"
            value={company}
            onChange = {e => onChange(e)} />
            <small className="form-text">Your farm name or business name</small>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="* Location"
            name="location"
            value={location}
            onChange = {e => onChange(e)}/>
            <small className="form-text">City & state (e.g., Chennai, TN)</small>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="* Agricultural Products"
            name="skills" value={skills}
            onChange = {e => onChange(e)} />
            <small className="form-text">Comma separated values (e.g., Tomato, Brinjal, Rice, Wheat)</small>
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Contact Number"
            name="website"
            value={website}
            onChange = {e => onChange(e)}/>
            <small className="form-text">Mobile number for buyers to contact you</small>
        </div>

        <div className="form-group">
          <textarea
            placeholder="About the Farm"
            name="bio"
            value={bio}
            onChange = {e => onChange(e)} />
            <small className="form-text">Tell us about your farm and farming practices</small>
        </div>

        <input type="submit" className="btn btn-primary my-1" value="Update Farmer Profile" />
        <Link className="btn btn-light my-1" to="/dashboard">
        Go Back
        </Link>
      </form>
        </Fragment>
    )
}

EditProfile.propTypes = {
    createProfile: PropTypes.func.isRequired,
    getCurrentProfiles: PropTypes.func.isRequired,
    profile: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
    profile: state.profile
    });

export default connect(
    mapStateToProps,
    {createProfile, getCurrentProfile}
    ) (EditProfile);