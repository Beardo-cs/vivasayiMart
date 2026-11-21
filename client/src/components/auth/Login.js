import React, {Fragment, useState} from 'react';
// as we are using function, importing useState
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth';
import Loader from '../layout/Loader';
import { useTranslation } from 'react-i18next';

//isAuthenticated is a props here
const Login = ({ login, isAuthenticated, user, loading }) => {
  const { t } = useTranslation();
  const  [formData, setFormData] = useState({
    email: '',
    password: ''
  });

const { email, password } = formData;

// change the name to value of the input, instead of using name, can use e.taget.name..
  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value});

// onSubmit function
  const onSubmit =async  e => {
    e.preventDefault();
    login(email, password);
  };

  // Show loader while authenticating
  if(loading && !user) {
    return <Loader message={t('login.signingIn')} fullPage={true} />
  }

  // Redirected if logged in based on user type
  if(isAuthenticated && user) {
    if (user.userType === 'farmer') {
      return <Navigate to="/farmer-dashboard" />
    } else if (user.userType === 'consumer') {
      return <Navigate to="/consumer-dashboard" />
    }
    return <Navigate to="/dashboard" />
  }
   return (
     <Fragment>
      <h1 className="large text-primary">{t('login.title')}</h1>
      <p className="lead"><i className="fas fa-user"></i> {t('login.subtitle')}</p>

      <form className="form" onSubmit ={e => onSubmit(e)}>
        <div className="form-group">
        <input 
          type="email" 
          placeholder={t('register.email')} 
          name="email" 
          value={email} 
          onChange= {e=> onChange(e)} 
          required 
        />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder={t('register.password')}
            name="password"
            value={password} 
            onChange= {e=> onChange(e)} 
            minLength="6"
          />
          </div>
        <input type="submit" className="btn btn-primary" value={t('nav.login')} />
      </form>
      <p className="my-1"><Link to="/forgot-password">{t('auth.forgotLink')}</Link></p>
      <p className="my-1">
      {t('login.noAccount')} <Link to="/register">{t('login.signUp')}</Link>
    </p>
 </Fragment>
)};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated:  PropTypes.bool,
  user: PropTypes.object,
  loading: PropTypes.bool
};

const mapStateToProps = state=> ({
  //we dont need all the things like authenticated loading type and all. we need only authenticated.
    isAuthenticated : state.auth.isAuthenticated,
    user: state.auth.user,
    loading: state.auth.loading
});

export default connect(
  mapStateToProps, 
  {login }) (Login); 