// Sends a logged-in user to the right dashboard for their role
import React from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Loader from '../layout/Loader';

const Home = ({ auth: { user, loading } }) => {
    if (loading || !user) return <Loader message="..." fullPage={false} />;
    if (!user.userType) return <Navigate to='/choose-role' replace />;
    return <Navigate to={user.userType === 'consumer' ? '/consumer-dashboard' : '/farmer-dashboard'} replace />;
};

Home.propTypes = { auth: PropTypes.object.isRequired };
export default connect(state => ({ auth: state.auth }))(Home);
