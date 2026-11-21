//when we loged out the account and go back to the page we can see the previous datas, but this should not happen. To avoid this we have create a private route
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// rest operator, it will take anything was passed in
const PrivateRoute = ( { children,
    auth: { isAuthenticated, loading}
}) => {
    const location = useLocation();
    if (!isAuthenticated && !loading) {
        return <Navigate to='/login' replace state={{ from: location }} />;
    }

    return children;
};

PrivateRoute.propTypes = {
    auth: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
    auth: state.auth
});

export default connect (mapStateToProps) (PrivateRoute)