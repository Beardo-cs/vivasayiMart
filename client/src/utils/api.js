import axios from 'axios';

import { API_BASE } from './native';

// Website: same address in production, local server in development.
// Android/iOS app: absolute address (see utils/native.js).
const API_URL = API_BASE;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;

