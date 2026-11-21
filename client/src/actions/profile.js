import api from '../utils/api';
import { setAlert } from './alert';
import { GET_PROFILE, GET_PROFILES, PROFILE_ERROR, UPDATE_PROFILE, CLEAR_PROFILE } from './types';

const errorPayload = err => ({ msg: err.response?.statusText || err.message, status: err.response?.status });

// Logged-in user's own profile (farmer or consumer). Missing profile => profile: null (not an error screen).
export const getCurrentProfile = userType => async dispatch => {
    try {
        const path = userType === 'consumer' ? '/api/consumer-profile/me' : '/api/farmer-profile/me';
        const res = await api.get(path);
        dispatch({ type: GET_PROFILE, payload: res.data });
    } catch (err) {
        if (err.response?.status === 400 || err.response?.status === 404) {
            dispatch({ type: CLEAR_PROFILE });
            dispatch({ type: PROFILE_ERROR, payload: errorPayload(err) });
        } else {
            dispatch({ type: PROFILE_ERROR, payload: errorPayload(err) });
        }
    }
};

// All farmers (public list with rating + verified badge)
export const getFarmers = () => async dispatch => {
    try {
        const res = await api.get('/api/farmer-profile');
        dispatch({ type: GET_PROFILES, payload: res.data });
    } catch (err) {
        dispatch({ type: PROFILE_ERROR, payload: errorPayload(err) });
    }
};

// Create or update own profile. Returns true on success.
export const saveProfile = (userType, formData) => async dispatch => {
    try {
        const path = userType === 'consumer' ? '/api/consumer-profile' : '/api/farmer-profile';
        const res = await api.post(path, formData);
        dispatch({ type: UPDATE_PROFILE, payload: res.data });
        return true;
    } catch (err) {
        const errors = err.response?.data?.errors;
        if (errors) errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
        else dispatch(setAlert(err.response?.data?.msg || 'Could not save profile', 'danger'));
        dispatch({ type: PROFILE_ERROR, payload: errorPayload(err) });
        return false;
    }
};
