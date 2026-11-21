// as we are using function, importing useState
import React, {Fragment, useState} from 'react';
// connect used to connect the alert with components
import { connect } from 'react-redux';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { setAlert } from '../../actions/alert';
import { register } from '../../actions/auth';
import PropTypes from 'prop-types';
import Loader from '../layout/Loader';
import PageHeader from '../layout/PageHeader';
import { useTranslation } from 'react-i18next';

// instead of using props.setAlert we changed props to setAlert
const Register = ({ setAlert, register, isAuthenticated, user, loading  }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [accepted, setAccepted] = useState(false);
  const [searchParams] = useSearchParams();
  const from = location.state && location.state.from;
  const  [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    userType: searchParams.get('role') === 'consumer' ? 'consumer' : 'farmer'
  });

  const { name, email, password, password2, userType } = formData;

// change the name to value of the input, instead of using name, can use e.taget.name..
  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value});

// onSubmit function
  const onSubmit =async  e => {
    e.preventDefault();
    if(password !== password2) {
// this msg willbe passed to action
      setAlert(t('auth.passwordsMismatch'), 'danger');
    } else {
//console.log("SUCESS");
      register ({ name, email, password, userType, acceptedTerms: true });
    }
  };

  // Show loader while registering
  if(loading && !user) {
    return <Loader message={t('register.creating')} fullPage={true} />
  }

  if (isAuthenticated && user) {
    if (user.userType === 'farmer') {
      return <Navigate to="/farmer-dashboard" />
    } else if (user.userType === 'consumer') {
      if (from && from.pathname && !['/login', '/register'].includes(from.pathname)) {
        return <Navigate to={`${from.pathname}${from.search || ''}`} replace />
      }
      return <Navigate to="/consumer-dashboard" />
    }
    return <Navigate to="/dashboard" />
  }
   return (
     <Fragment>
   <PageHeader icon="🌱" title={t('register.title')} subtitle={t('register.subtitle')} />
      <form className="form" onSubmit ={e => onSubmit(e)}>
        <div className="form-group">
          <label className="form-label"><strong>{t('register.iAm')}</strong></label>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="userType"
                value="farmer"
                checked={userType === 'farmer'}
                onChange={e => onChange(e)}
                style={{ marginRight: '8px' }}
              />
              <span>🌾 {t('register.farmer')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="userType"
                value="consumer"
                checked={userType === 'consumer'}
                onChange={e => onChange(e)}
                style={{ marginRight: '8px' }}
              />
              <span>🛒 {t('register.consumer')}</span>
            </label>
          </div>
        </div>
        <div className="form-group">
          <input
          type="text"
          placeholder={t('register.name')}
          name="name"
          value={name}
  // onChange function
          onChange= {e=> onChange(e)}
          //required
        />
        </div>
        <div className="form-group">
        <input 
          type="email" 
          placeholder={t('register.email')} 
          name="email" 
          value={email} 
          onChange= {e=> onChange(e)} 
          //required 
        />
          <small className="form-text">
          {t('register.gravatar')}
          </small>
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder={t('register.password')}
            name="password"
            value={password} 
            onChange= {e=> onChange(e)} 
            //minLength="6"
          />
        </div>
        <div className="form-group">
          <input
            type="password" 
            placeholder={t('register.confirm')}
            name="password2"
            value={password2} 
          onChange= {e=> onChange(e)}
           // minLength="6"
          />
        </div>
        <div className="form-group">
          <label className="consent">
            <input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} />
            <span>
              {t('register.agree')} <Link to="/terms" target="_blank">{t('footer.terms')}</Link> {t('register.and')} <Link to="/privacy" target="_blank">{t('footer.privacy')}</Link>
            </span>
          </label>
        </div>
        <input type="submit" className="btn btn-primary" value={t('nav.register')} />
      </form>
      <p className="my-1">
        {t('register.haveAccount')} <Link to="/login" state={location.state}>{t('register.signIn')}</Link>
      </p>
   </Fragment>
   ); 
};

Register.propTypes = {
  setAlert: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  user: PropTypes.object,
  loading: PropTypes.bool
};

const mapStateToProps = state=> ({
    isAuthenticated : state.auth.isAuthenticated,
    user: state.auth.user,
    loading: state.auth.loading
});

export default connect(
  mapStateToProps, 
  { setAlert, register }
  )(Register); 
