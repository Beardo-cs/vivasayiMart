const Activity = require('../models/Activity');

const LEFT_OUT = new Set(['password', 'productImage', 'profileImage']);

// What was sent, for the activity log: no passwords or photos, long text clipped
const summarise = body => {
    if (!body || typeof body !== 'object') return undefined;
    const out = {};
    for (const [key, value] of Object.entries(body)) {
        if (LEFT_OUT.has(key)) continue;
        out[key] = typeof value === 'string' && value.length > 200 ? `${value.slice(0, 200)}…` : value;
    }
    return out;
};

// Records a change made while acting for a farmer. The entry must be saved before the reply
// goes out: Vercel stops the function once it has replied.
const recordActing = (req, res) => {
    const send = res.send.bind(res);
    let recorded = false;
    res.send = body => {
        if (recorded) return send(body);
        recorded = true;
        const path = req.route
            ? `${req.baseUrl}${req.route.path === '/' ? '' : req.route.path}`
            : req.originalUrl.split('?')[0];
        Activity.create({
            actor: req.actor.id,
            account: req.user.id,
            action: `${req.method} ${path}`,
            params: req.params && Object.keys(req.params).length ? { ...req.params } : undefined,
            details: summarise(req.body),
            status: res.statusCode
        })
            .catch(err => console.error('[activity]', err.message))
            .finally(() => send(body));
        return res;
    };
};

const noActing = (req, res, next) =>
    (req.actor ? res.status(403).json({ msg: 'Not allowed while acting for a farmer' }) : next());

module.exports = { recordActing, noActing };
