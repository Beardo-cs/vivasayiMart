import { combineReducers } from 'redux';
import alert from './alert';
import auth from './auth';
import profile from './profile';
import post from './post';
import cart from './cart';


export default combineReducers({
    alert,
    auth,
    profile,
    post,
    cart,
});
