import React, {Fragment, useState} from 'react';
// as we are using function, importing useState
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth';

//isAuthenticated is a props here
const Login = ({ login, isAuthenticated, user }) => {
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
      <h1 className="large text-primary">Sign in</h1>
      <p className="lead"><i className="fas fa-user"></i> Sign Into Your Account</p>

      <form className="form" onSubmit ={e => onSubmit(e)}>
        <div className="form-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          name="email" 
          value={email} 
          onChange= {e=> onChange(e)} 
          required 
        />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password} 
            onChange= {e=> onChange(e)} 
            minLength="6"
          />
          </div>
        <input type="submit" className="btn btn-primary" value="Login" />
      </form>
      <p className="my-1">
      Don't have an account? <Link to="/register">Sign Up</Link>
    </p>
 </Fragment>
)};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated:  PropTypes.bool,
  user: PropTypes.object
};

const mapStateToProps = state=> ({
  //we dont need all the things like authenticated loading type and all. we need only authenticated.
    isAuthenticated : state.auth.isAuthenticated,
    user: state.auth.user
});

export default connect(
  mapStateToProps, 
  {login }) (Login); 