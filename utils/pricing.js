// Bulk pricing: a listing may offer cheaper unit prices at higher quantities,
// e.g. base ₹20/kg, ₹18/kg from 50 kg. Keep in sync with client/src/utils/pricing.js

// Validate + normalise tiers for a listing with the given base price.
// Returns { tiers } (sorted by minQuantity) or { error }.
const normalizeTiers = (input, basePrice) => {
    if (input === undefined || input === null || input === '') return { tiers: [] };
    if (!Array.isArray(input)) return { error: 'Bulk pricing must be a list' };
    if (input.length > 3) return { error: 'At most 3 bulk price levels are allowed' };

    const tiers = [];
    for (const raw of input) {
        const minQuantity = Number(raw && raw.minQuantity);
        const price = Number(raw && raw.price);
        if (!(minQuantity > 0) || !(price > 0)) {
            return { error: 'Bulk pricing needs a quantity and a price greater than 0' };
        }
        if (price >= basePrice) {
            return { error: 'Bulk price must be lower than the normal price' };
        }
        tiers.push({ minQuantity, price });
    }
    tiers.sort((a, b) => a.minQuantity - b.minQuantity);
    for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].minQuantity === tiers[i - 1].minQuantity) return { error: 'Bulk quantities must be different' };
        if (tiers[i].price >= tiers[i - 1].price) return { error: 'Higher quantities must have lower prices' };
    }
    return { tiers };
};

// Unit price for a quantity: the cheapest tier whose minimum is reached, else the base price.
const unitPriceFor = (basePrice, tiers, quantity) => {
    let price = Number(basePrice);
    (tiers || []).forEach(t => {
        if (quantity >= t.minQuantity && t.price < price) price = t.price;
    });
    return price;
};

module.exports = { normalizeTiers, unitPriceFor };
