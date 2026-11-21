import { useEffect, useState } from 'react';
import api from './api';

// Number of orders needing attention (new requests for farmers, updates for buyers).
// Refreshes every minute while logged in.
export default function useOrderBadge(isAuthenticated) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { setCount(0); return undefined; }
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get('/api/orders/badge');
        if (!cancelled) setCount(res.data.count);
      } catch (e) { /* best-effort */ }
    };
    poll();
    const timer = setInterval(poll, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [isAuthenticated]);

  return count;
}
