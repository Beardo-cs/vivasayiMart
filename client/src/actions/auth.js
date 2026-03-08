import api from '../utils/api';
import { setAlert } from './alert';
import {
    REGISTER_SUCCESS,
    REGISTER_FAIL,
    USER_LOADED,
    AUTH_ERROR,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    LOGOUT_START,
    CLEAR_PROFILE
} from './types';
import setAuthToken from '../utils/setAuthToken';

// Load user
export const loadUser = () => async dispatch => {
    if (localStorage.token) {
        setAuthToken (localStorage.token);
    }
 
 try {
     const res = await api.get('/api/auth');
     dispatch ({
         type: USER_LOADED,
         payload: res.data
     });
} catch (err) {
    dispatch({
        type: AUTH_ERROR
    });
 }
};

// Register User
export const register = ({ name, email, password, userType }) => async dispatch => {
    const config = {
        headers:  {
            'Content-Type': 'application/json'
        }
    }

    const body = JSON.stringify ({ name, email, password, userType });

    try {
        const res = await api.post ('/api/users', body, config);

        dispatch ({
            type: REGISTER_SUCCESS,
            payload: res.data
        });

        // Load user data after successful registration
        await dispatch(loadUser());

        // Small delay to show success state before redirect
        setTimeout(() => {
            // The redirect will be handled by the Register component
        }, 500);
    } catch (err) {
        const errors = err.response?.data?.errors;

        if (errors) {
            errors.forEach(error => dispatch (setAlert(error.msg, 'danger')));
        } else {
            // Handle network errors or server not responding
            dispatch(setAlert('Server error. Please try again later.', 'danger'));
        }
        dispatch({
            type: REGISTER_FAIL
        });
    }
};

// Login User
export const login = ( email, password ) => async dispatch => {
    const config = {
        headers:  {
            'Content-Type': 'application/json'
        }
    }

    const body = JSON.stringify ({ email, password });

    try {
        //as we r authenticating..using path api/auth
        const res = await api.post ('/api/auth', body, config);

        dispatch ({
            type: LOGIN_SUCCESS,
            payload: res.data
        });

        // Load user data after successful login
        await dispatch(loadUser());

        // Small delay to show success state before redirect
        setTimeout(() => {
            // The redirect will be handled by the Login component
        }, 500);
    } catch (err) {
        const errors = err.response?.data?.errors;

        if (errors) {
            errors.forEach(error => dispatch (setAlert(error.msg, 'danger')));
        } else {
            // Handle network errors or server not responding
            dispatch(setAlert('Server error. Please try again later.', 'danger'));
        }
        dispatch({
            type: LOGIN_FAIL
        });
    }
};

// Logout / Clear Profile
export const logout = () => dispatch => {
    // Dispatch logout start to show loader
    dispatch ({ type: LOGOUT_START });

    // Small delay to show the loader animation
    setTimeout(() => {
        dispatch ({ type: LOGOUT });
        dispatch ({ type: CLEAR_PROFILE });

        // Reload the page after logout to ensure clean state
        window.location.href = '/';
    }, 1000);
};