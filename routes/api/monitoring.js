const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// @route     GET api/health
// @desc      For uptime monitors (UptimeRobot, Better Stack, ...): 200 when the app and database are up
// @access    Public
router.get('/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ ok: dbUp, db: dbUp ? 'up' : 'down', time: new Date().toISOString() });
});

// @route     POST api/client-error
// @desc      The website reports crashes here so they show up in the Vercel logs
//            (or Sentry). Fields are clipped, rate limited in server.js, stored nowhere.
// @access    Public
const clip = (value, max) => String(value == null ? '' : value).slice(0, max);

router.post('/client-error', (req, res) => {
    const { message, stack, url, kind } = req.body || {};
    console.error('[client-error]', JSON.stringify({
        kind: clip(kind, 30),
        message: clip(message, 300),
        stack: clip(stack, 1500),
        url: clip(url, 200),
        ua: clip(req.get('user-agent'), 150)
    }));
    res.status(204).end();
});

module.exports = router;
