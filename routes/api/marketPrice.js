const express = require('express');
const router = express.Router();

// Proxy for the data.gov.in mandi price API so the API key stays on the server
// (it used to be bundled into the website, where anyone could read it).
// Env: DATA_GOV_API_KEY  (or "dataGovApiKey" in config for local development)
const RESOURCE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const FILTERS = ['state.keyword', 'district', 'market', 'commodity', 'variety', 'grade'];

const getApiKey = () => {
    if (process.env.DATA_GOV_API_KEY) return process.env.DATA_GOV_API_KEY;
    try {
        return require('config').get('dataGovApiKey');
    } catch (err) {
        return null;
    }
};

// Prices change once a day, so answers are reused for 30 minutes (saves the free-tier quota)
const cache = new Map();
const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 200;

// @route     GET api/market-price?limit=&offset=&filters[state.keyword]=&filters[district]=...
// @desc      Mandi prices, only whitelisted filters are forwarded
// @access    Public (rate limited in server.js)
router.get('/', async (req, res) => {
    const key = getApiKey();
    if (!key) {
        return res.status(503).json({ msg: 'Market prices are not configured on the server' });
    }

    const params = new URLSearchParams({ 'api-key': key, format: 'json' });
    params.set('limit', String(Math.min(Math.max(parseInt(req.query.limit, 10) || 1000, 1), 1000)));
    params.set('offset', String(Math.max(parseInt(req.query.offset, 10) || 0, 0)));
    FILTERS.forEach(name => {
        const value = req.query[`filters[${name}]`];
        if (typeof value === 'string' && value.trim() && value.length <= 100) {
            params.set(`filters[${name}]`, value.trim());
        }
    });

    // cache key must not contain the API key
    const publicParams = new URLSearchParams(params);
    publicParams.delete('api-key');
    const cacheKey = publicParams.toString();
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return res.json(hit.data);

    try {
        const upstream = await fetch(`${RESOURCE_URL}?${params.toString()}`, {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(15000)
        });
        const data = await upstream.json();
        if (!upstream.ok) {
            console.error('market-price upstream error', upstream.status);
            return res.status(502).json({ msg: 'Market price service is unavailable right now' });
        }
        if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { data, expires: Date.now() + TTL_MS });
        res.json(data);
    } catch (err) {
        console.error('market-price error:', err.name === 'TimeoutError' ? 'timeout' : err.message);
        res.status(502).json({ msg: 'Market price service is unavailable right now' });
    }
});

router._cache = cache; // exposed for tests
module.exports = router;
