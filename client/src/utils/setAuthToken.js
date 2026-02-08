//created a utls folder to use a global header
import api from './api';

const setAuthToken = token => {
    //if there is a token, set a global header
    if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete api.defaults.headers.common['x-auth-token'];
    }
}

export default setAuthToken;