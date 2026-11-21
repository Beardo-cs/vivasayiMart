// Buyers may see what was checked and when, never who checked it
const publicBadges = badges => (badges || []).map(b => ({ type: b.type, at: b.at, visitedOn: b.visitedOn }));

module.exports = { publicBadges };
