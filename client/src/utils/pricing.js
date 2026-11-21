// Keep in sync with utils/pricing.js on the server.
// Unit price for a quantity: cheapest bulk tier whose minimum is reached, else the base price.
export const unitPriceFor = (basePrice, tiers, quantity) => {
    let price = Number(basePrice);
    (tiers || []).forEach(t => {
        if (quantity >= t.minQuantity && t.price < price) price = t.price;
    });
    return price;
};
