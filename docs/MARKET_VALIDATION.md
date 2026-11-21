# VivasayiMart: Lean Market Validation Plan

*Applies the 10-step "lean market validation" approach to VivasayiMart. Last updated 21 November 2026.*

> **Read this first.** Everything below marked **(H)** is a **hypothesis**, a best guess to be tested with real farmers
> and buyers. No customer interviews have been done yet, so none of this is proven. The article's central rule applies:
> *"Most of what you write down are assumptions."* The goal of this document is to make those assumptions explicit and
> testable, then get out and test them.

---

## 0. Evidence so far (honest baseline)

Read-only check of the production database on 21 Nov 2026 (`node scripts/data-check.js`):

| Measure | Value |
|---|---|
| Listings | 1 |
| Orders | 0 |
| Reviews | 0 |
| Accounts | 8 (7 are old template accounts with no role, 1 buyer, 0 farmers) |

**Meaning:** the product is built but has **no market evidence yet**: no real farmers, no real orders. The next
step is not more features, it is talking to people and getting the first real listings and orders.

---

## 1. Product concept (written down)

**One sentence (H):** VivasayiMart lets farmers in Tamil Nadu list fresh produce in minutes, in Tamil, and lets nearby
buyers send order requests directly, so farmers keep more of the price and buyers get fresher produce from a farmer
they can see and rate.

### 1.1 Who is the customer? (be specific)

Not "everyone". Three segments, **start with one**:

| # | Segment | Who exactly (H) | Decision maker / buyer | Priority |
|---|---|---|---|---|
| A | **Sellers: small and marginal farmers** | Farmers growing vegetables, fruits, milk, eggs or grains on roughly 1 to 10 acres, who today sell to a middleman, a local mandi, or an *Uzhavar Sandhai* stall, and own an Android smartphone | The farmer (or a family member who handles the phone) | **Start here (supply)** |
| B | **Buyers: urban/semi-urban households** | Families in one town or a few apartment communities who want fresher, traceable vegetables, fruit and milk and are used to ordering on WhatsApp or apps | The person who shops for the home (often a woman, age 25 to 55) | **Start here (demand)** |
| C | **Buyers: small food businesses** | Small hotels, tiffin centres, caterers, hostels, and kirana shops that buy vegetables in bulk every day | Owner, cook, or purchase manager | Second wave (bulk pricing already supports this) |

**Pick one place to start (decision needed, see section 2).** A marketplace only works when buyers and sellers are
*close to each other*. Recommended: **one district and its biggest nearby town** (for example the district where you
already have contacts), not the whole state.

### 1.2 What problems are we solving? (problem first, then product)

Written as customer problems to **validate**, not facts.

**Farmers (H)**
1. **Low share of the final price.** Middlemen and commission agents take a large cut and set the price. *(How much? Must be measured, see Q-F4.)*
2. **No idea what a fair price is** on a given day, so they accept the first offer.
3. **Unsold produce spoils.** Perishables with only one or two buyers lose value fast.
4. **Delayed or uncertain payment** when selling on credit to traders.
5. **No way to reach buyers outside their village** and no digital presence.
6. **Technology and language barriers:** forms in English, complicated apps, weak internet.

**Buyers (H)**
1. **Freshness and quality are uncertain** when produce passes through several hands.
2. **Cannot tell where food came from**, or whether a seller is trustworthy.
3. **Price opacity**: they cannot tell if they pay a fair price.
4. **Hard to find a reliable local farmer**; today it is word of mouth.
5. **Convenience:** ordering by phone or in person is slow; existing grocery apps do not feature local farmers.

**The biggest question (the "problem worth solving" test):** *Is any of this painful enough that people will change what
they do today?* Their current alternatives are: the middleman, *Uzhavar Sandhai*, WhatsApp groups, roadside sellers,
and grocery/quick-commerce apps. Our product must be clearly better than **those**, not better than nothing.

### 1.3 How the product solves each problem

| Problem (H) | Feature (built) | Value to measure |
|---|---|---|
| Low share of price | Direct order requests, farmer sets own price, bulk price tiers | Extra rupees per kg vs what the middleman paid |
| Unsure of a fair price | AI price suggestion (per unit) and the Market Price page (government mandi data) | Number of farmers who change their price after seeing it |
| Unsold, spoiling produce | Stock/sold-out control, quick listing from a phone photo, share link on WhatsApp | Time from listing to first order; % of listings that sell out |
| Late or uncertain payment | Buyer pays the farmer directly (cash/UPI) on pickup or delivery | Payment disputes (target: near zero) |
| Cannot reach buyers | Public farm page, search and filters, farmer verification badge | Orders from buyers the farmer did not already know |
| Language and tech barrier | Tamil/English UI, 3-step add-product, installable app/PWA, works on weak networks | % of farmers who list a product **without help** |
| Freshness and trust | Ratings and reviews, verified badge, farmer profile, "report this listing" | Repeat-order rate; average rating |
| Phone numbers misused | Numbers hidden until the farmer confirms the order | Spam/complaint count |

### 1.4 Key features: Minimum Viable Product

**Must have for first customers (all built):** sign-up as farmer or buyer, list a product with photo, price and
stock, browse and filter, order request, farmer accepts or rejects, order status, phone numbers shared after
confirmation, Tamil and English.

**Built, but unproven (test before investing more):** cart with several items, reviews, favourites, bulk pricing,
admin moderation, AI price/photo suggestions, Android and iOS apps.

**Not built (candidates; do not build until interviews say they matter):**
delivery logistics and tracking, online payment, SMS/WhatsApp order alerts, farmer-group (FPO) accounts, subscriptions
("same vegetables every week"), cold-chain or packaging support.

> **MVP discipline:** if the interviews show that *delivery* or *trust* is the real blocker, the next feature is that
> blocker, not another screen.

---

## 2. Decide (the 80% rule)

Make these calls with the information you have, then test them. Suggested defaults:

| Decision | Suggested default | Why / what would change it |
|---|---|---|
| Where to launch | **One district + its main town** | Changes if you find a farmer group (FPO) willing to onboard 20+ farmers elsewhere |
| First segments | **A (farmers) + B (households)** | Switch to C if restaurants show up asking for bulk |
| Payment | **Direct, cash/UPI, no online payment yet** | Add online payment only if buyers say "I will not order without it" |
| Delivery | **Pickup or farmer delivers; we do not run logistics** | Revisit if "no delivery" is the top reason buyers drop off |
| Categories | **Vegetables, fruits, milk/eggs first** | Drop grains from messaging at first (slower-moving, less frequent) |
| Language | **Tamil first, English second** | Confirm with farmers: is voice or photo-based listing needed? |
| Revenue | **Free for now; decide after traction** | Test willingness to pay only after real orders exist |

---

## 3. Assumptions to test (and how)

Most important first. An assumption is **validated** only when real behaviour confirms it, not when someone says it
"sounds great".

| # | Assumption (H) | How to test | "Validated" if... |
|---|---|---|---|
| A1 | Farmers lose a significant share of the price to middlemen | Ask 10 farmers about their last 3 sales: price they got vs the shop price | Most can quantify a gap and are unhappy about it |
| A2 | Farmers will list produce themselves from a phone | Watch 5 farmers add a product with no help | 4 of 5 finish in under 5 minutes |
| A3 | Farmers have a smartphone and use WhatsApp | Ask, and look | 8 of 10 do |
| A4 | Buyers will order from a farmer they do not know | Show 10 households a farm page; ask them to place a real request | 5 of 10 place a real request |
| A5 | Buyers prefer paying the farmer directly | Ask "how would you want to pay?" | Most say cash/UPI is fine |
| A6 | Buyers pay a fair price for freshness | Compare their grocery price with farmer price | They accept the farmer's price |
| A7 | Delivery is solved by farmer or buyer | Ask both "how would this reach you?" | A workable answer for most; otherwise it is the top blocker |
| A8 | Farmers confirm orders quickly | Pilot data: time from request to confirmation | Median under 2 hours |
| A9 | Buyers reorder | Pilot data: second order within 2 weeks | 30% or more reorder |
| A10 | Tamil UI is enough (voice may be needed) | Observe low-literacy users | They complete tasks without reading help |
| A11 | Neighbouring farmers/buyers can be found in numbers | Count real people met in the first week | 20+ farmers and 50+ buyers reachable in one town |

---

## 4. Get out and test (field plan)

**Interview types (tip 4):**
- **Farmers:** in person at fields, *Uzhavar Sandhai* stalls, village meetings, farmer-producer-organisation (FPO) offices.
- **Buyers:** apartment association WhatsApp groups, neighbours, colleagues' families, local college staff rooms.
- **Small food businesses:** hotels, tiffin centres, hostels near the chosen town.
- **Experts:** agriculture department officers, *Krishi Vigyan Kendra* (KVK) staff, FPO managers, *Uzhavar Sandhai* managers, a mandi commission agent (to understand how the trade works).
- **Cheap digital tests:** share a farmer page link in 3 local WhatsApp groups and count visits and requests; run a small ad pointing to the landing page and measure sign-ups.

**Targets for the first two weeks (use the 80% rule; stop when answers repeat):**
- 15 farmer interviews, 15 household buyer interviews, 3 food-business interviews, 3 experts.
- Get **5 farmers to list real stock** and **10 buyers to send real order requests**.

### 4.1 Start with your network (tip 5)

Ask friends, family, mentors and colleagues: *"Do you know a farmer, or a family that buys vegetables from one?"*
Bias warning: friendly people over-encourage. Prefer introductions to people who do **not** owe you a favour, and
always look for behaviour (they listed something) rather than praise.

---

## 5. Interview guides (tips 6 and 7: curiosity and "Why?")

Talk like a curious learner, not a salesperson. Do not pitch for the first 10 minutes. Ask about the **past**
("last time…"), not the **future** ("would you…?").

### 5.1 Farmers (about 20 minutes)

1. Tell me about your farm: what do you grow, how much, and how often do you sell?
2. **Walk me through your last sale.** Who did you sell to, at what price, when were you paid? *(Why?)*
3. What price did the final buyer pay, if you know? How do you find out today's price?
4. What happens to produce you cannot sell? How often? How much is lost? *(Why?)*
5. What is the hardest part of selling? *(Ask "why?" up to five times, see below.)*
6. Have you tried another way to sell (WhatsApp, Uzhavar Sandhai, FPO, an app)? What happened? Why did you stop?
7. Which phone do you use? Do you use WhatsApp? Who helps you with apps?
8. *(Show the product)* Try listing something you have today. *(Watch silently; note where they hesitate.)*
9. What would make you not use this?
10. **Commitment test:** "Can we list your real stock now and share it with buyers in your town?"

### 5.2 Household buyers (about 15 minutes)

1. Where do you buy vegetables, fruit and milk now? How often? How much do you spend a week? *(Why that place?)*
2. Last time you were unhappy with something you bought: what happened? *(Why?)*
3. Have you ever bought directly from a farmer? How did you find them? What was good or bad?
4. How much do you trust where your food comes from? What would make you trust a seller?
5. How would you want it to reach you (pickup, delivery)? How much would you pay for delivery?
6. *(Show a farm page)* What do you notice? What is missing? Would you send an order request to this farmer today?
7. What would make you stop using it after the first order?
8. **Commitment test:** "Place a real order request now for something you need this week."

### 5.3 Small food businesses
How do you buy vegetables daily? How much per day? Who delivers? What goes wrong most (quality, price, late delivery)?
What would make you switch a part of your buying to a farmer? What volume and frequency?

### 5.4 The Five Whys, example
*"I sell to the trader even though he pays less."* **Why?** *"He comes to the farm."* **Why does that matter?**
*"I have no vehicle."* **Why not sell in town?** *"Transport costs too much for small quantities."* **Why…?**
→ The real problem is **transport for small quantities**, not "finding buyers". That changes what to build.

### 5.5 A few Tamil prompts for field use (please have a native speaker review)
- இப்போது உங்கள் விளைபொருட்களை எப்படி விற்கிறீர்கள்?
- கடைசியாக விற்றபோது என்ன நடந்தது?
- ஏன்?
- இதற்கு முன் வேறு வழியில் விற்க முயன்றீர்களா?
- இன்று உங்களிடம் உள்ள ஒரு பொருளை இங்கேயே பட்டியலிடலாமா?

---

## 6. Value propositions (tip 8): drafts to test

A value proposition is the **gain the customer gets**, tied to a problem, not a feature list.

| Segment | Draft value proposition (H) |
|---|---|
| **Farmer** | *"Sell directly to families near you at your own price, and keep more of what your produce is worth."* |
| **Household** | *"Fresh vegetables and milk from a farmer you can see and rate, at a fair price, with no middlemen."* |
| **Food business** | *"Steady, bulk-priced produce straight from farms, with price breaks for larger orders."* |

Test the **wording** too: put two versions on the landing page or in a WhatsApp message and see which gets more
clicks and sign-ups.

---

## 7. Avoiding false positives (tip 9)

"Sounds great" is not a sale. For every compliment, ask **"why?"** and look for **commitment**.

| Weak signal (do not count) | Strong signal (count it) |
|---|---|
| "Nice idea!" | They list real stock during the interview |
| "I might use it" | They send a real order request |
| "Send me a link" | They install it and use it within 48 hours |
| Praise from friends or relatives | Strangers use it without being asked |
| Likes the design | Orders the same item a second time |
| Says "free is good" | Says what they would pay, or does something costly (travels, gives a deposit, brings a neighbour) |

---

## 8. Go / no-go criteria after the first 2 weeks

Set these **before** you start, so you do not talk yourself into a "yes".

| Result | Decision |
|---|---|
| 5+ farmers list real stock **and** 10+ real order requests **and** at least 3 confirmed orders | **Go:** keep going in this district; add WhatsApp/SMS alerts |
| Farmers list, buyers do not order | Demand problem: interview buyers more, or change the buyer segment (e.g. food businesses) |
| Buyers want it, farmers will not list | Supply problem: onboard through an FPO or a local agent; simplify listing (voice/WhatsApp) |
| Orders placed but never completed | Logistics/trust problem: consider delivery help or pickup points |
| Little interest from either side | **Re-think the problem**, not the features |

---

## 9. Two-week plan

| Days | What |
|---|---|
| 1 | Pick the district/town. Prepare printed one-page demo, QR to the site, and the interview sheets above. |
| 2 to 4 | 8 farmer interviews and 8 buyer interviews (network first). Record answers and quotes (with permission). |
| 5 | Review: update the assumptions table (section 3). Make the 80% decisions. |
| 6 to 9 | Onboard 5 farmers **in person**: list their real stock together. Share their farm pages in local WhatsApp groups. |
| 10 to 12 | Follow every order request by phone. Note: time to confirm, delivery, payment, problems. |
| 13 | Interview the first buyers and farmers again: what went wrong? what would they change? |
| 14 | Apply the go/no-go table. Write down what to build next (and what to stop building). |

---

## 10. What to measure from the product

Already available: the admin screen, `node scripts/data-check.js`, and the farmer dashboard stats. Track weekly:

- New farmers and buyers; **farmers who listed at least one product** (activation).
- Listings with stock; time from sign-up to first listing.
- Order requests; **confirmation rate** and **time to confirm**; completed orders.
- Repeat buyers and average rating.
- Reports and complaints.

---

## 11. Open questions for you (the founder)

1. **Which district/town** do you know best, and who in your network is a farmer or sells to farmers?
2. Do you have **an FPO, a farmers' group or an agriculture officer** you can be introduced to?
3. Will **farmers or a local helper** do the listing in the first month (assisted onboarding)?
4. Who handles **delivery**: the farmer, the buyer, or a local rider?
5. How will you **earn** eventually: a small commission, a subscription, or bulk-buyer fees? (Test after traction.)
6. How much **time per week** can you spend in the field? (This is more important than any feature.)

---

*Next step: take sections 5 and 9 and start the first interviews this week. Update this document with what you learn.
Every time an answer contradicts an assumption, cross it out and write the truth.*
