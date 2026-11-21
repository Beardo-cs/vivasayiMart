import React from 'react'
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const Landing = ({isAuthenticated}) => {
  const { t } = useTranslation();
  // as we dont want to see the landing page when we click the devconnector in dashboard page
  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }
    return (
        <section className="landing">
          <div className="dark-overlay">
            <div className="landing-inner">
             <h1 className="x-large">{t('landing.title')}</h1>
              <p className="lead">
                {t('landing.tagline')}
              </p>
            <div className="buttons">
              <Link to="/register" className="btn btn-primary">
                {t('login.signUp')}
              </Link>
              <Link to="/login" className="btn btn-light">
                {t('nav.login')}
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
