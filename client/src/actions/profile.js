import api from '../utils/api';
import { setAlert } from './alert';

import {
    CLEAR_PROFILE,
    GET_PROFILE,
    PROFILE_ERROR,
    UPDATE_PROFILE,
    ACCOUNT_DELETED,
    GET_PROFILES,
    GET_REPOS
} from './types';

//Get current users profile
export const getCurrentProfile = () => async dispatch => {
    try {
        const res = await api.get('/api/profile/me');

        dispatch ({
            type: GET_PROFILE,
            payload: res.data
        });
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Get all profiles
export const getProfiles = () => async dispatch => {
    dispatch ({ type: CLEAR_PROFILE});

    try {
        const res = await api.get('/api/profile');

        dispatch ({
            type: GET_PROFILES,
            payload: res.data
        });
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Get profile by ID
export const getProfileById = userId => async dispatch => {
    try {
        const res = await api.get(`/api/profile/user/${userId}`);

        dispatch ({
            type: GET_PROFILE,
            payload: res.data
        });
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Get Github repos
export const getGithubRepos = username => async dispatch => {
    try {
        const res = await api.get(`/api/profile/github/${username}`);

        dispatch ({
            type: GET_REPOS,
            payload: res.data
        });
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Create or update profile
// inorder to redirect to a client side route after submit the form, we use push method. Edit enable us to know whether use creating a new profile or modifying it.
export const createProfile =(formData, history, edit= false) => async dispatch => {
    try  {
        const config = {
            headers: {
                'Content-Type' : 'application/json'
            }
        }

        const res = await api.post('/api/profile', formData, config);
        dispatch ({
            type: GET_PROFILE,
            payload: res.data
        });
        // setAlert to notify us whether profile updated or created
        dispatch (setAlert(edit ? 'Profile Updated' : 'Profile Created', 'success'));
        
        //if creating means have to redirect to dashboard
        if(!edit) {
            history.push ('/dashboard');
        }

    } catch (err) {
        //if user forget anything tat will show in alert
        const errors = err.response?.data?.errors;

        if (errors) {
            errors.forEach(error => dispatch (setAlert(error.msg, 'danger')));
        }

        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Add experience
export const addExperience = (formData, history) => async dispatch => {
     try  {
        const config = {
            headers: {
                'Content-Type' : 'application/json'
            }
        }

        const res = await api.put('/api/profile/experience', formData, config);
        dispatch ({
            type: UPDATE_PROFILE,
            payload: res.data
        });
        // setAlert to notify us whether profile updated or created
        dispatch (setAlert('Experience Added', 'success'));
        history.push ('/dashboard');
        
    } catch (err) {
        //if user forget anything tat will show in alert
        const errors = err.response?.data?.errors;

        if (errors) {
            errors.forEach(error => dispatch (setAlert(error.msg, 'danger')));
        }

        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
}

// Add Education
export const addEducation = (formData, history) => async dispatch => {
     try  {
        const config = {
            headers: {
                'Content-Type' : 'application/json'
            }
        }

        const res = await api.put('/api/profile/education', formData, config);
        dispatch ({
            type: UPDATE_PROFILE,
            payload: res.data
        });
        // setAlert to notify us whether profile updated or created
        dispatch (setAlert('Education Added', 'success'));
        history.push ('/dashboard');
        
    } catch (err) {
        //if user forget anything tat will show in alert
        const errors = err.response?.data?.errors;

        if (errors) {
            errors.forEach(error => dispatch (setAlert(error.msg, 'danger')));
        }

        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
}

// Delete Experience
export const deleteExperience = id => async dispatch => {
    try {
        const res = await api.delete(`/api/profile/experience/${id}`);

        dispatch ({
            type: UPDATE_PROFILE,
            payload: res.data
        });

        dispatch (setAlert('Experience Removed', 'success'));
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

// Delete Education
export const deleteEducation = id => async dispatch => {
    try {
        const res = await api.delete(`/api/profile/education/${id}`);

        dispatch ({
            type: UPDATE_PROFILE,
            payload: res.data
        });

        dispatch (setAlert('Education Removed', 'success'));
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};
// Delete Account & profile
export const deleteAccount = id => async dispatch => {
    if (window.confirm ('Are you sure? This can NOT be undone!')) {
    try {
        await api.delete('api/profile');

        dispatch ({type: CLEAR_PROFILE});
        dispatch ({type: ACCOUNT_DELETED});

        dispatch (setAlert('Your Account has been permanently deleted'));
    } catch (err) {
        dispatch ({
            type: PROFILE_ERROR,
            payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
    }
};

//res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
// { mode: 'cors' }