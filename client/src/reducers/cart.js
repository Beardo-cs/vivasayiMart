import { CART_ADD, CART_REMOVE, CART_SET_QTY, CART_CLEAR } from '../actions/types';

// Cart lines: { postId, productName, unit, price, quantity, max, farmerName }
// Persisted in localStorage so it survives refreshes. Prices/stock are re-checked by the server on checkout.
const KEY = 'cart';

const load = () => {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
};

const save = items => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
    return items;
};

export default function cartReducer(state = { items: load() }, action) {
    const { type, payload } = action;
    switch (type) {
        case CART_ADD: {
            const existing = state.items.find(i => i.postId === payload.postId);
            const items = existing
                ? state.items.map(i => i.postId === payload.postId
                    ? { ...i, ...payload, quantity: Math.min(i.quantity + payload.quantity, payload.max) }
                    : i)
                : [...state.items, payload];
            return { items: save(items) };
        }
        case CART_SET_QTY:
            return { items: save(state.items.map(i => i.postId === payload.postId
                ? { ...i, quantity: Math.min(Math.max(payload.quantity, 0), i.max) }
                : i)) };
        case CART_REMOVE:
            return { items: save(state.items.filter(i => i.postId !== payload)) };
        case CART_CLEAR:
            return { items: save([]) };
        default:
            return state;
    }
}
