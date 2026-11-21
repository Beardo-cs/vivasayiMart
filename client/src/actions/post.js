import api from '../utils/api';
import {setAlert} from './alert';
import i18n from '../i18n';
import {
    DELETE_POST,
    GET_POSTS,
    POST_ERROR,
    UPDATE_LIKES,
    ADD_POST,
    GET_POST,
    ADD_COMMENT,
    REMOVE_COMMENT,
    UPDATE_POST
} from './types';

//Get posts (optional filters: q, category, location, minPrice, maxPrice, inStock, sort, page, limit)
export const getPosts = (filters = {}) => async dispatch => {
    try {
        const params = {};
        Object.keys(filters).forEach(key => {
            const v = filters[key];
            if (v !== '' && v !== null && v !== undefined && v !== false) params[key] = v;
        });
        const res = await api.get('/api/posts', { params });

        dispatch ({
            type: GET_POSTS,
            payload: res.data
        });
    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
}

//Add Like
export const addLike = id => async dispatch => {
    try {
        const res = await api.put(`/api/posts/like/${id}`);

        dispatch ({
            type: UPDATE_LIKES,
            // send along with id and like data
            payload: {id, likes: res.data}
        });
    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

//Remove Like
export const removeLike = id => async dispatch => {
    try {
      const res = await api.put(`/api/posts/unlike/${id}`);

      dispatch({
        type: UPDATE_LIKES,
        payload: { id, likes: res.data }
      });
    } catch (err) {
      dispatch({
        type: POST_ERROR,
        payload: { msg: err.response?.statusText || err.message, status: err.response?.status }
      });
    }
  };

//Delete Post
export const deletePost = id => async dispatch => {
    try {
         await api.delete(`/api/posts/${id}`);

        dispatch ({
            type: DELETE_POST,
            payload: id
        });

        dispatch(setAlert(i18n.t('alerts.postRemoved'), 'success'));
    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

//Add Post
export const addPost = formData => async dispatch => {
    const config = {
        headers: {
            'Content-type': 'application/json'
       }
    }
    try {
        const res = await api.post('/api/posts', formData, config);

        dispatch ({
            type: ADD_POST,
            payload: res.data
        });

        dispatch(setAlert(i18n.t('alerts.postCreated'), 'success'));
    } catch (err) {
        const errors = err.response?.data?.errors;
        if (errors) {
            errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
        }
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

//Get Post
export const getPost = id => async dispatch => {

    try {
        const res = await api.get(`/api/posts/${id}`);

        dispatch ({
            type: GET_POST,
            payload: res.data
        });

    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

//Add comment
export const addComment = (postId, formData) => async dispatch => {
    const config = {
        headers: {
            'Content-type': 'application/json'
       }
    }
    try {
        const res = await api.post(`/api/posts/comment/${postId}`, formData, config);

        dispatch ({
            type: ADD_COMMENT,
            payload: res.data
        });

        dispatch(setAlert(i18n.t('alerts.commentAdded'), 'success'));
    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};

//Delete comment
export const deleteComment = (postId, commentId ) => async dispatch => {

    try {
        await api.delete(`/api/posts/comment/${postId}/${commentId}`);

        dispatch ({
            type: REMOVE_COMMENT,
            payload: commentId
        });

        dispatch(setAlert(i18n.t('alerts.commentDeleted'), 'success'));
    } catch (err) {
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
    }
};



//Update post (edit listing / toggle availability)
export const updatePost = (id, formData) => async dispatch => {
    try {
        const res = await api.put(`/api/posts/${id}`, formData);

        dispatch ({
            type: UPDATE_POST,
            payload: res.data
        });

        dispatch(setAlert(i18n.t('alerts.productUpdated'), 'success'));
        return true;
    } catch (err) {
        const errors = err.response?.data?.errors;
        if (errors) {
            errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
        } else if (err.response?.data?.msg) {
            dispatch(setAlert(err.response.data.msg, 'danger'));
        }
        dispatch ({
            type: POST_ERROR,
            payload: {msg: err.response?.statusText || err.message, status: err.response?.status }
        });
        return false;
    }
};
