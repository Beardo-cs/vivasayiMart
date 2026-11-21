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
    CLEAR_PROFILE,
    AUTH_NETWORK_ERROR
} from './types';
import setAuthToken from '../utils/setAuthToken';
import { clearApiCache } from '../utils/offline';
import { ADMIN_TOKEN_KEY } from '../utils/actingSession';
import i18n from '../i18n';

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
    const status = err.response?.status;
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (status === 401 && adminToken) {
        // the hour of acting for a farmer ran out: back to the admin's own account
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.setItem('token', adminToken);
        setAuthToken(adminToken);
        await clearApiCache();
        dispatch({ type: CLEAR_PROFILE });
        dispatch(setAlert(i18n.t('acting.ended'), 'success'));
        return dispatch(loadUser());
    }
    // Only a server "no" (bad/expired token) logs the user out. Being offline must not.
    dispatch({ type: status === 401 || status === 404 ? AUTH_ERROR : AUTH_NETWORK_ERROR });
 }
};

// Register User
export const register = ({ name, email, password, userType, acceptedTerms }) => async dispatch => {
    const config = {
        headers:  {
            'Content-Type': 'application/json'
        }
    }

    const body = JSON.stringify ({ name, email, password, userType, acceptedTerms });

    try {
        const res = await api.post ('/api/users', body, config);

        await clearApiCache();
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
            dispatch(setAlert(i18n.t('alerts.serverError'), 'danger'));
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

        await clearApiCache();
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
            dispatch(setAlert(i18n.t('alerts.serverError'), 'danger'));
        }
        dispatch({
            type: LOGIN_FAIL
        });
    }
};

// Logout / Clear Profile
export const logout = () => dispatch => {
    clearApiCache();
    localStorage.removeItem(ADMIN_TOKEN_KEY);
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