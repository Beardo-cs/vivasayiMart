import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from '../reducers';
import i18n, { setLanguage } from '../i18n';

jest.mock('uuid', () => ({ v4: () => 'test-id' })); // uuid ships ESM only, which this Jest cannot load

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), defaults: { headers: { common: {} } } }
}));
const api = require('../utils/api').default;

const FARMER = { _id: 'f1', name: 'Farmer Fay', userType: 'farmer', emailVerified: true };
const BUYER = { _id: 'b1', name: 'Buyer Ben', userType: 'consumer' };

const makeStore = user => createStore(
  rootReducer,
  { auth: { token: user ? 't' : null, isAuthenticated: !!user, loading: false, user } },
  applyMiddleware(thunk)
);

const renderAt = (ui, { user = null, path = '/', state } = {}) =>
  render(
    <Provider store={makeStore(user)}>
      <MemoryRouter initialEntries={[{ pathname: path.split('?')[0], search: path.includes('?') ? `?${path.split('?')[1]}` : '', state }]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  setLanguage('en');
  api.get.mockResolvedValue({ data: [] });
});

const Where = () => <div data-testid="where">{useLocation().pathname}{useLocation().search}</div>;

describe('Landing', () => {
  const Landing = require('../components/layout/Landing').default;

  test('role buttons carry the role, and the language switch translates the page', async () => {
    api.get.mockResolvedValue({ data: [{ _id: 'p1', productName: 'Tomato', category: 'Vegetables', price: 20, unit: 'kg', farmerName: 'Fay' }] });
    renderAt(<Landing />);
    expect(screen.getByRole('link', { name: /I am a farmer/ })).toHaveAttribute('href', '/register?role=farmer');
    expect(screen.getByRole('link', { name: /I want to buy/ })).toHaveAttribute('href', '/register?role=consumer');
    expect(await screen.findByText('Tomato')).toBeInTheDocument(); // featured product

    fireEvent.click(screen.getByRole('button', { name: 'தமிழ்' }));
    expect(await screen.findByRole('link', { name: /நான் ஒரு விவசாயி/ })).toBeInTheDocument();
  });
});

describe('PostItem', () => {
  const PostItem = require('../components/posts/PostItem').default;
  const post = {
    _id: 'p1', user: 'f1', farmerName: 'Farmer Fay', name: 'Fay', avatar: '', productName: 'Tomato', text: 'Fresh tomatoes',
    price: 20, weight: 10, quantityAvailable: 10, unit: 'kg', category: 'Vegetables', available: true,
    address: 'Salem', comments: [], date: new Date().toISOString(), bulkPricing: []
  };

  test('buyer sees price + stock first, details on demand, and no phone number', () => {
    renderAt(<PostItem post={post} />, { user: BUYER });
    expect(screen.getByText('₹20')).toBeInTheDocument();
    expect(screen.queryByText('Salem')).not.toBeInTheDocument();      // behind "Details"
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    expect(screen.getByText(/Salem/)).toBeInTheDocument();
    expect(screen.getByText(/Phone number is shared after the farmer confirms/)).toBeInTheDocument();
    expect(screen.queryByText(/Delete/)).not.toBeInTheDocument();
  });

  test('owner sees their phone number and must confirm before deleting', async () => {
    api.delete.mockResolvedValue({});
    const confirmSpy = jest.spyOn(window, 'confirm');
    renderAt(<PostItem post={{ ...post, mobileNumber: '9000000001' }} />, { user: FARMER });
    fireEvent.click(screen.getByRole('button', { name: /Details/ }));
    expect(screen.getByText(/9000000001/)).toBeInTheDocument();

    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    expect(api.delete).not.toHaveBeenCalled();                          // cancelled: nothing happens

    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/posts/p1'));
    confirmSpy.mockRestore();
  });
});

describe('Orders page', () => {
  const Orders = require('../components/orders/Orders').default;
  const base = { unit: 'kg', pricePerUnit: 20, deliveryMethod: 'pickup', date: new Date().toISOString(), buyerName: 'Ben', farmerName: 'Fay' };
  const orders = [
    { ...base, _id: 'o1', productName: 'Tomato', quantity: 2, totalAmount: 40, status: 'placed' },
    { ...base, _id: 'o2', productName: 'Mango', quantity: 1, totalAmount: 20, status: 'confirmed', buyerMobile: '9111111111' },
    { ...base, _id: 'o3', productName: 'Rice', quantity: 5, totalAmount: 100, status: 'completed' }
  ];

  test('farmer sees orders grouped by what needs attention, contact only when confirmed', async () => {
    api.get.mockResolvedValue({ data: orders });
    api.put.mockResolvedValue({ data: {} });
    renderAt(<Orders />, { user: FARMER });
    const headings = await screen.findAllByRole('heading', { level: 2 });
    expect(headings.map(h => h.textContent.replace(/\d+$/, '').trim())).toEqual(['New requests', 'Confirmed - to deliver', 'Past orders']);
    expect(screen.getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:9111111111'); // only the confirmed order
    expect(screen.getByText(/Phone numbers are shared once the farmer confirms/)).toBeInTheDocument(); // on the new request
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    // a farmer rejects a NEW request (the server only lets buyers cancel it); cancelling is for confirmed orders
    expect(screen.getAllByRole('button', { name: 'Cancel order' })).toHaveLength(1);
  });

  test('buyer with no orders gets a next step', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderAt(<Orders />, { user: BUYER });
    expect(await screen.findByRole('link', { name: /Browse products/ })).toHaveAttribute('href', '/posts');
  });
});

describe('Order placed screen', () => {
  const OrderPlaced = require('../components/orders/OrderPlaced').default;

  test('shows the summary and what happens next; refresh without data goes to orders', () => {
    const orders = [{ _id: 'o1', productName: 'Tomato', quantity: 2, unit: 'kg', totalAmount: 40, farmerName: 'Fay', deliveryMethod: 'pickup' }];
    const { unmount } = renderAt(<OrderPlaced />, { user: BUYER, path: '/order-placed', state: { orders } });
    expect(screen.getByText('Order request sent!')).toBeInTheDocument();
    expect(screen.getByText(/Tomato × 2/)).toBeInTheDocument();
    expect(screen.getAllByText('₹40.00').length).toBeGreaterThan(0);
    unmount();

    renderAt(
      <Routes><Route path="/order-placed" element={<OrderPlaced />} /><Route path="/orders" element={<Where />} /></Routes>,
      { user: BUYER, path: '/order-placed' }
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/orders');
  });
});

describe('Bottom tab bar', () => {
  const BottomNav = require('../components/layout/BottomNav').default;

  test('role-specific tabs, nothing when logged out', () => {
    const { container, unmount } = renderAt(<BottomNav />, { user: null });
    expect(container.querySelector('.bottom-nav')).toBeNull();
    unmount();

    renderAt(<BottomNav />, { user: FARMER });
    const bar = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(bar).getByRole('link', { name: /Add/ })).toHaveAttribute('href', '/add-product');
    expect(within(bar).queryByRole('link', { name: /Cart/ })).toBeNull();
  });

  test('buyers get Cart', () => {
    renderAt(<BottomNav />, { user: BUYER });
    expect(screen.getByRole('link', { name: /Cart/ })).toHaveAttribute('href', '/cart');
  });
});

describe('Return to the page you were on after login', () => {
  const PrivateRoute = require('../components/routing/PrivateRoute').default;
  const Login = require('../components/auth/Login').default;

  test('PrivateRoute sends you to login remembering where you were going', () => {
    renderAt(
      <Routes>
        <Route path="/login" element={<Where />} />
        <Route path="/orders" element={<PrivateRoute><div>secret</div></PrivateRoute>} />
      </Routes>,
      { user: null, path: '/orders' }
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });

  test('Login sends a logged-in user back to where they came from', () => {
    renderAt(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/posts" element={<Where />} />
      </Routes>,
      { user: BUYER, path: '/login', state: { from: { pathname: '/posts', search: '?farmer=f1' } } }
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/posts?farmer=f1');
  });
});

afterAll(() => i18n.changeLanguage('en'));

describe('Acting for a farmer', () => {
  const ActingBanner = require('../components/layout/ActingBanner').default;
  afterEach(() => localStorage.clear());

  test('the banner names the farmer, and Stop goes back to your own account and the console', async () => {
    localStorage.setItem('token', 'acting-token');
    localStorage.setItem('adminToken', 'admin-token');
    api.post.mockResolvedValue({ data: {} });
    api.get.mockResolvedValue({ data: { _id: 'a1', name: 'Founder', isAdmin: true } });
    const user = { ...FARMER, acting: { by: 'Founder', until: Date.now() + 60 * 60 * 1000 } };
    renderAt(<><ActingBanner /><Where /></>, { user, path: '/dashboard' });

    expect(screen.getByText(/Acting for Farmer Fay/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(api.post).toHaveBeenCalledWith('/api/auth/stop-acting');
    expect(localStorage.getItem('token')).toBe('admin-token');
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(screen.queryByText(/Acting for/)).not.toBeInTheDocument();  // back as the admin
  });

  test('no banner in your own account', () => {
    renderAt(<ActingBanner />, { user: FARMER });
    expect(screen.queryByText(/Acting for/)).not.toBeInTheDocument();
  });
});
