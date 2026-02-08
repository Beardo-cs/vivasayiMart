/*it will get all our profile and also others profile if we visit their page , if there is no profile for the user it will give profile error status and if we want to move to new user previous users profile need to cleard */
import { GET_PROFILE, PROFILE_ERROR, CLEAR_PROFILE, UPDATE_PROFILE, GET_PROFILES, GET_REPOS } from "../actions/types";

const initialState = {
    profile: null,
    // it is for profile listing page
    profiles: [],
    repos: [],
    loading: true,
    error: {}
}

function profileReducer(state= initialState,action) {
    const {type, payload} =action;

    switch(type) {
        case GET_PROFILE:
        case UPDATE_PROFILE:
            return {
                ...state,
                profile: payload,
                loading: false
            };
        case GET_PROFILES:
            return {
                ...state,
                profiles: payload,
                loading: false
            };
        case PROFILE_ERROR:
            return {
                ...state,
                error: payload,
                loading: false
            };
        case CLEAR_PROFILE:
            return {
                ...state,
                profile : null,
                repos: [],
                loading: false
            };
        case GET_REPOS:
            return {
                ...state,
                repos: payload,
                loading: false
            };
        default:
            return state;
    }
}

export default profileReducer;