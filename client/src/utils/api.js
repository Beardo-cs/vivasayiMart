import axios from 'axios';

// Set base URL for API requests
// In production (Vercel), use relative URLs so API calls go to the same domain
// In development, use the local backend server
const API_URL = process.env.NODE_ENV === 'production'
  ? '' // Empty string for relative URLs in production
  : (process.env.REACT_APP_API_URL || 'http://192.168.0.103:4000');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

