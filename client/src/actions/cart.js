import { CART_ADD, CART_REMOVE, CART_SET_QTY, CART_CLEAR } from './types';

export const addToCart = item => ({ type: CART_ADD, payload: item });
export const removeFromCart = postId => ({ type: CART_REMOVE, payload: postId });
export const setCartQuantity = (postId, quantity) => ({ type: CART_SET_QTY, payload: { postId, quantity } });
export const clearCart = () => ({ type: CART_CLEAR });
