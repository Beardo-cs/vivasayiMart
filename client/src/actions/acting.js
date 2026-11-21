import api from '../utils/api';
import setAuthToken from '../utils/setAuthToken';
import { clearApiCache } from '../utils/offline';
import { ADMIN_TOKEN_KEY } from '../utils/actingSession';
import { loadUser } from './auth';
import { CLEAR_PROFILE } from './types';

// The offline cache and the profile belong to whoever was signed in, so both are cleared on every switch
const switchTo = async (dispatch, token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    await clearApiCache();
    dispatch({ type: CLEAR_PROFILE });
    await dispatch(loadUser());
};

export const startActing = farmerId => async dispatch => {
    const res = await api.post(`/api/admin/act-as/${farmerId}`);
    localStorage.setItem(ADMIN_TOKEN_KEY, localStorage.getItem('token'));
    await switchTo(dispatch, res.data.token);
};

export const stopActing = () => async dispatch => {
    try {
        await api.post('/api/auth/stop-acting');
    } catch (err) {
        // the hour already ran out: nothing left to stop
    }
    const own = localStorage.getItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    if (own) await switchTo(dispatch, own);
};
