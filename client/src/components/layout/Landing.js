import React from 'react'
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const Landing = ({isAuthenticated}) => {
  // as we dont want to see the landing page when we click the devconnector in dashboard page
  if (isAuthenticated) {
    return <Navigate to='/dashboard'/>;
  }
    return (
        <section className="landing">
          <div className="dark-overlay">
            <div className="landing-inner">
             <h1 className="x-large">Vivasayi Mart</h1>
              <p className="lead">
                Create an account to connect Farmers around the world, Connect here to Buy and Sell.
              </p>
            <div className="buttons">
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
              <Link to="/login" className="btn btn-light">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
};
Landing.propTypes  ={
  isAuthenticated: PropTypes.bool
}

const mapStateToProps = state => ({
  isAuthenticated : state.auth.isAuthenticated
});
export default connect(mapStateToProps) (Landing);
