# Pilot readiness: trust, clear delivery, and selling on farmers' behalf

*Design · 21 November 2026 · Status: approved by the founder on 21 November 2026*

## 1. Why this exists

VivasayiMart is about to run a two-week pilot in one district (`docs/MARKET_VALIDATION.md`, sections 8 and 9):
onboard five farmers in person, share their pages in local WhatsApp groups, and follow every order by phone.
Production today has one listing and no orders.

A PRD written after reviewing a competitor (Uzhavar Market) argued that the opportunity is a dependable
buying-and-selling workflow, not a better-looking storefront. Buyers should know who is selling, what delivery
costs and when the order will arrive. Problems should be traceable, and seller trust claims should be specific.
The founder chose to take the parts of that PRD that fit VivasayiMart's model (fresh produce, one district,
buyers paying the farmer directly in cash or UPI) and to run the farmer side personally during the pilot.

So this round makes the product trustworthy and workable for that pilot:

- Before sending a request, a buyer can see who grows the food, which checks were actually done, whether the
  farmer delivers to them and for how much, the full amount to pay, and when it will usually happen.
- The founder can list produce and confirm orders on behalf of farmers who never log in. Every such action is
  recorded, and one list shows which orders need a phone call.
- The pilot produces the numbers the go/no-go decision needs.

## 2. What the founder decided

1. **Direction:** stay fresh and local. Add the PRD's trust and reliability pieces and keep cash/UPI paid directly
   to the farmer. No online payment.
2. **Farmer side:** the founder runs it, listing produce and confirming orders on farmers' behalf.
3. **Six PRD items added after the first pass:** search in both languages, the full amount including delivery,
   usual delivery days, reasons for rejecting and cancelling, hiding certificates nobody has reviewed, and pilot
   numbers.
4. **Approach:** an admin console for everything that spans farmers, plus switching into a farmer's account for
   that farmer's own listings and orders (section 5).

Anything below marked **(designer's call)** was proposed by the designer. The founder didn't object to it, but
hasn't explicitly agreed to it either.

## 3. Goals, non-goals, anti-goals

**Goals**

- The founder can add a farmer, list their produce, and confirm and complete their orders without the farmer ever
  logging in. Every such action records who did it.
- Before sending a request, buyers see:
  - the farmer's specific badges;
  - whether the farmer delivers to their pincode, the fee, and the usual days;
  - the full amount to pay.
- Every confirmed order has a promised pickup or delivery date that both sides can see.
- Nothing goes wrong silently. Unconfirmed requests, overdue orders, problem reports and farmers waiting for
  approval all show up in one list, and new requests and problems also arrive by email.
- Buyers find produce whether they type English, Tamil script or a common romanised spelling.
- The founder can read the pilot's go/no-go numbers at any time.

**Non-goals (this round)**

- Online payment, refunds, payouts, a settlement ledger, platform fees.
- Courier delivery, packed/dispatched/tracking steps, and packaged-goods data (batch, expiry, ingredients).
- Phone or OTP sign-in, and any flow for a farmer to take over an account created for them.
- SMS or WhatsApp notifications to buyers or farmers. `MARKET_VALIDATION.md` adds those after a "Go".
- Problem reports raised by farmers, reporting a review, bulk stock tools, packing sheets.
- Search analytics (the PRD's "search usefulness" measure) and platform contribution per order.
- More than one district, and work specific to the native apps. The Android and iOS apps get all of this through
  the web build.
- Translating the admin console. It stays English, like today's Admin page.

**Anti-goals (these would make it a failure even if it technically works)**

- A badge that claims more than was checked, or a single "verified" mark that implies product claims were checked.
- The founder acting for a farmer without leaving a trace, or being able to act for a farmer who runs their own
  account.
- A buyer seeing one amount in the app and being asked for another at the door.
- An order request or problem report sitting unnoticed for a day.
- Phone numbers reaching anyone earlier than they do today. The one exception is the admin console (section 6.9).
- Tamil text that breaks the layout on a 360px-wide phone.

## 4. Constraints

**Existing behaviour that stays**

- **Stack:**
  - Express and MongoDB (Mongoose) API in `server.js`, deployed on Vercel as one serverless function.
  - React 18 (Create React App) client in `client/`.
  - JWT in the `x-auth-token` header, with payload `{ user: { id, userType } }` and `expiresIn: 360000` seconds.
  - Android and iOS (Capacitor) reuse the web build.
- **No background jobs or cron.** Anything time-based ("not confirmed after 2 hours", "overdue") is worked out
  when it's read. Emails are sent inside the request.
- **Lint:** Vercel builds with `CI=true`, so lint warnings fail the build.
- **Translations:**
  - Every string buyers or farmers see goes in both `client/src/i18n/en.json` and `ta.json`.
  - The server answers in English. New server messages that users see need entries in `serverMsgs`; see
    `tServer` in `client/src/i18n/index.js`.
- **Orders (`routes/api/orders.js`):**
  - One order per listing; a cart checkout shares a `checkoutId`.
  - Stock is deducted atomically when the farmer confirms and returned when a confirmed order is cancelled.
  - Allowed status changes are listed in `TRANSITIONS`.
  - Phone numbers stay masked until confirmation (`maskContacts`).
- **Reviews** are only for completed orders, one per order.
- **Listings:** each one stores its own `farmerName`, `mobileNumber` and `address` (the pickup place). `PostForm`
  prefills them from the farm profile.
- **Admin access:**
  - An admin is a user with the `isAdmin` flag, or one whose email is in `ADMIN_EMAILS`
    (`middleware/checkRole.js`).
  - `GET /api/auth` returns the computed `isAdmin`.
  - Admin routes use `auth` plus `checkAdmin`, both keyed on `req.user.id`.
- **User accounts:** `User.email` and `User.password` are required, and `email` has a unique index. Farmer accounts
  the founder creates have neither (section 6.1).
- **Email** goes through Resend (`services/email.js`). Without `RESEND_API_KEY`, messages are only printed to the
  log. `sendEmail` throws on provider errors.
- **Tests:** `npm test` runs `tests/*.test.js` with `node:test`, `supertest` and an in-memory MongoDB. Existing
  fixtures assume any farmer's listing is visible.
- **Time zone:** dates users see and every "today" or "overdue" rule use India time (Asia/Kolkata). The server
  runs in UTC.

**Production data (21 Nov 2026)**

- 1 listing, owned by an old account with no role.
- 0 orders.
- 8 accounts: 7 with no role and 1 buyer. There are no farmers.

Migrations are light, but nothing may break the old records.

**Founder's setup before the pilot (Vercel settings, not code)**

- Set `ADMIN_EMAILS`.
- Set `RESEND_API_KEY` and `EMAIL_FROM` (with a verified sending domain).
- Set `APP_URL` to `https://vivasayimart.vercel.app`.
- Preferably set `SENTRY_DSN`.
- Check that the MongoDB Atlas plan includes backups; the free tier doesn't.

## 5. Approaches considered

1. **Switch into the farmer's account only.** Every existing farmer screen gets reused, so each new farmer feature
   is built once. The cost: the founder sees one farmer at a time, which makes following up across five farmers
   slow.
2. **A separate admin console only.** Everything is in one place, but the listing form, order actions and profile
   and delivery settings would each need a second copy, so every farmer feature gets built twice.
3. **Both, split by job (chosen).**
   - The console covers everything that spans farmers: needs attention, farmers and approvals, all orders,
     problem reports, listing reports and pilot numbers.
   - One farmer's own work (listing, editing, confirming with a date, delivery settings) happens by switching
     into that farmer's account from the console.
   - This gives the cross-farmer view the phone follow-ups need without a second copy of any farmer screen.
   - The cost: switching accounts is a powerful permission, and it needs the safeguards in 6.2.

**Dropped early:** putting every listing under the founder's own account. It's the simplest option, but ratings,
badges and orders wouldn't belong to the farmers, so a farmer could never take over their account.

## 6. Design

### 6.1 Farmer accounts the founder creates ("managed farmers")

- The console's Farmers tab gets an **Add farmer** form with these fields:
  - name, phone number, village or town;
  - farm name and what they grow, plus farm size (optional);
  - delivery settings (6.4);
  - which checks the founder has done (6.3).
- It creates a real farmer account and farm profile, approved at creation and marked as managed.
- The account has no email and no password, so nobody can sign in to it. Only an admin can act for it (6.2).
- Listings, orders, ratings and badges belong to that farmer from day one. A later phone sign-in could hand the
  account over without moving any data, but that hand-over isn't part of this round.
- No email is ever sent to a managed farmer.
- The builder chooses how email and password can be absent. Two options:
  - a partial unique index on email, which needs a one-time change to the existing `email_1` index in production;
  - a reserved placeholder address.

  Either way, email login must never match a managed account.

### 6.2 Acting for a farmer

- Any console row about a managed farmer has **Open as ⟨name⟩**. The admin's session switches to that farmer for
  up to 1 hour (designer's call). From Needs attention or Orders it lands on the farmer's Orders screen; from the
  Farmers tab it lands on their listings.
- While acting, every screen shows a banner in both languages:

  ```
  ┌ Acting for Murugan · everything you do is saved with your name ─────── [Stop] ┐
  ```

  **Stop** returns to the admin's own session and the console. When the hour runs out, the app returns to the
  admin's session with a short message.
- Everything works through the existing farmer screens and routes:
  - add, edit and delete listings, and mark them sold out;
  - confirm (with a date, 6.6), reject (with a reason, 6.7), complete and cancel orders;
  - edit the farm profile and delivery settings.
- Every change made while acting is recorded with the admin as the person who did it and the farmer as the
  account: what changed, which record, and when.
  - The console shows it on the order or listing, e.g. "Confirmed by Mahendiran for Murugan · 21 Nov, 4:10 pm".
  - Buyers see the farmer, not who pressed the button. The terms say the team may act for farmers (6.16).
- Safeguards (designer's call):
  - Only admins can start acting, and only for managed farmers, never for farmers who run their own account.
  - Starting and stopping are recorded.
  - While acting there's no access to admin routes. They already check `req.user.id`, which is now the farmer.
  - Also blocked while acting: account deletion, role change, password or email actions, and starting another
    acting session.
  - Each request made while acting re-checks that the person acting is still an admin.
- How the session is carried is left to the builder: the token claim, and where the admin's own session waits.
  `GET /api/auth` should say the session is acting and for whom, so the banner doesn't rely on browser storage
  alone.

### 6.3 Approval and badges

- **Self-signup farmers start as "waiting for approval."**
  - They can fill in their profile and add listings.
  - Until approved, their listings don't appear in browse, search, featured listings or a public farmer page, and
    can't be ordered.
  - Their dashboard says they're waiting, or why they were declined.
- **The console lists waiting farmers.**
  - Approving records who approved, when, and a note (PRD F03).
  - Declining needs a reason, which the farmer sees.
  - Both are recorded.
- **Managed farmers are approved when they're created.**
- **Badges replace the single ✔ Verified, and say only what was checked** (designer's call for the set):
  - **Phone verified:** the founder called this number and the farmer answered.
  - **Farm visited:** the founder visited the farm. The date is recorded.
  - **Certificate reviewed:** see 6.12.
- **Each badge records who set it and when.** Removing a badge is also recorded.
- **Where badges show:**
  - The product card shows them compactly next to the farmer's name.
  - The farmer page shows each one with a one-line explanation, e.g. "Our team visited this farm on 18 Nov 2026".
- **The old flag goes.** The `farmerVerified` flag and the "Verify farmer" button are replaced. Production has no
  farmers, so no existing approvals need migrating.
- **The one production listing stops showing** under this rule, because it belongs to an account with no role.
  That's intended (designer's call): the pilot starts with farmers onboarded in person.

### 6.4 Delivery area, fee and usual days

- Each farm profile gets delivery settings, edited in the farm profile form (so an admin edits them while acting):
  - whether the farmer delivers at all;
  - the pincodes they deliver to (6 digits each);
  - one flat fee in rupees (0 means free delivery);
  - usual days, Monday to Sunday: the days the farmer delivers or hands over pickups.
- Pickup is always offered, at the listing's address (already required on every listing).
- Buyers enter their pincode once. The browse page asks for it, and it's remembered on the device and in their
  buyer profile if they have one. They can change it any time.
- The card gets one line under price and stock:

  ```
  Tomatoes · ₹30/kg                   Murugan  ✔ Phone verified  ✔ Farm visited
  🚚 Delivers to 600042 · ₹30 · usually Tue, Fri
  📍 Pickup only · Ayanavaram · usually Tue, Fri          (doesn't deliver to the buyer's pincode)
  🚚 Delivers to some areas · enter your pincode           (buyer hasn't entered one yet)
  ```

- Browse gets a **Delivers to me** filter.
- The order form offers delivery only when the farmer covers the buyer's pincode. Otherwise it explains why:
  "Murugan doesn't deliver to 600042 · pickup at Ayanavaram."
- The server enforces this. A delivery request needs a pincode the farmer covers. The handover group (6.5) stores
  that pincode and the fee at the time of the request, so later fee changes don't affect existing orders.
- The usual days are the PRD's "delivery estimate before ordering." The promised date (6.6) is the commitment
  made after confirmation. They are separate fields.

### 6.5 The full amount before sending, and a cart that refreshes

- The order form shows the whole amount:

  ```
  5 kg × ₹30              ₹150
  Delivery to 600042       ₹30
  Pay Murugan             ₹180    cash or UPI, after he confirms
  ```

- The cart is grouped by farmer. Each group has its own pickup or delivery choice (delivery only where covered),
  its subtotal, the fee and the amount to pay, followed by the grand total:

  ```
  Murugan                         🚚 Delivery ₹30 ▾
    Tomatoes 5 kg      ₹150
    Brinjal 2 kg        ₹80
    Pay Murugan                   ₹260
  Selvi                           📍 Pickup ▾
    Milk 2 L           ₹120
    Pay Selvi                     ₹120
  Total                           ₹380
  ```

- **One send to one farmer is one handover** (designer's call). Everything a buyer sends to one farmer in one go
  is a *handover group*: all of that farmer's items in a cart checkout, or a single "Send order request". A
  handover group has:
  - one pickup or delivery choice;
  - one promised date (6.6);
  - one fee and one amount to collect;
  - one reference (6.8).

  It's also completed together. This keeps the amount at the door equal to the amount in the app.
- **The delivery fee is charged once per handover group.**
  - If some items in the group are rejected or cancelled, the fee still applies once to what's left.
  - If all of them are, there's no fee.
  - Two separate sends to the same farmer are two groups, each with its own fee, because the farmer may deliver
    them separately.
- **Both sides' Orders screens show one card per handover group,** listing its items with their statuses, the date,
  the reference and the amount to pay or collect. Per-item actions stay: rejecting or cancelling one item, each
  with a reason (6.7). The farmer's card looks like this:

  ```
  Priya · 🚚 Delivery to 600042 · Tue 24 Nov · VM-7K3QX      Collect ₹260
    Tomatoes 5 kg   ₹150   confirmed
    Brinjal 2 kg     ₹80   confirmed
    Delivery         ₹30
  ```
- **The cart refreshes when it opens.**
  - It reloads each item's current price and stock and the farmer's delivery settings.
  - It shows what changed: "Now ₹35/kg, was ₹30", "Only 3 kg left", "Sold out · remove".
  - The server still decides the final price when the request is sent.
  - Cart items will need the farmer's id.

### 6.6 Confirming with a promised date

- **Accept** opens a small step to pick the pickup or delivery date, which is required:
  - The default is the farmer's next usual day, or tomorrow if they haven't set any.
  - The allowed range is today to 14 days ahead, in India time.
  - The date belongs to the handover group (6.5). The first item accepted in a group sets it. Accepting the
    group's other items uses the same date, shown but not editable there.
  - Items can still be rejected one by one, each with a reason (6.7).

  ```
  Confirm Tomatoes 5 kg for Priya
  Delivery on  [ Tue 24 Nov ▾ ]          [Confirm]  [Back]
  ```

- Both sides see the date on the order, e.g. "Delivery on Tue 24 Nov".
- The farmer can change the date while the group has confirmed items. The change applies to the whole group, is
  recorded, and lights up the buyer's unseen-updates badge.
- **Complete** marks every confirmed item in the group completed, because they're handed over together.
- A group is **overdue** when its date has passed (India time) and it still has confirmed items that aren't
  completed.

### 6.7 Reasons for rejecting and cancelling

- Reject and Cancel ask for a reason. "Other" needs a short note. The lists are the designer's call:
  - **Farmer rejects a request:** not enough stock · can't deliver there or then · other.
  - **Farmer cancels a confirmed order:** stock problem (crop damaged or sold elsewhere) · can't deliver · buyer
    unreachable · other.
  - **Buyer cancels:** don't need it now · ordered by mistake · farmer didn't respond · other.
- The other side sees the reason on the order, in their own language.
- The stock reasons feed the stock-accuracy number (6.13).

### 6.8 Order references and problem reports

- **Every handover group (6.5) gets a short reference**, e.g. VM-7K3QX: unique, using only letters and digits that
  can't be confused with each other. The exact format is up to the builder.
  - It shows on order cards, the order-placed screen, the console and emails.
  - It's what everyone quotes on the phone, and it covers every item in that handover.
- **A buyer can report a problem on any of their handover groups,** optionally ticking which items it's about.
  Reasons: not delivered · late · less than ordered · poor quality · wrong item · farmer unreachable · asked to pay
  a different amount · other. The note is optional.
- **What the buyer sees:**
  - Straight away: "Problem reported · reference VM-7K3QX · we'll call you."
  - On the order afterwards: the problem's status (open or resolved), with the founder's resolution note.
- **Limits:** one open problem per handover group at a time. Problem reports are separate from listing reports;
  the existing `Report` model is for moderating listings.
- **The listing's details panel says what to do if something goes wrong:** "Report a problem on your order and
  we'll call you." This stands in for the PRD's "return conditions."
- **Problems go to the founder,** through the console and by email.

### 6.9 Admin console

Today's Admin page (English only) grows into these tabs:

- **Needs attention** is the default tab. The designer's call on what goes in it:
  - handover groups with items still waiting for a reply 2 hours after being sent (assumption A8's target in
    `MARKET_VALIDATION.md`);
  - overdue groups (6.6);
  - open problem reports;
  - farmers waiting for approval.

  Each order row is one handover group. It shows the reference, items, farmer, buyer, how long it's been, why it's
  flagged, and both phone numbers. Its actions are Open as ⟨farmer⟩ (managed farmers only), View or Resolve
  problem, and Review farmer.

  ```
  Needs attention                                                               4
  VM-7K3QX  Tomatoes 5 kg  Murugan → Priya  sent 3h ago  ⚠ not confirmed  📞 📞  [Open as Murugan]
  VM-2HD9P  Milk 2 L       Selvi → Ravi     due 20 Nov   ⚠ overdue        📞 📞  [Open as Selvi]
  VM-9QW4T  Eggs 1 dozen   Murugan → Anu    problem      "less than ordered"     [View problem]
  Kumar (signed up himself)                 waiting 1 day                        [Review]
  ```

- **Farmers:**
  - add a managed farmer;
  - search all farmers, and see each one's approval state, badges (add or remove) and a summary of their delivery
    settings;
  - Open as (managed farmers only);
  - the farmer's recent activity.
- **Orders:** every handover group and its items, filterable by status, farmer and date. Each shows its history:
  who did what, including actions taken while acting. This is how the founder follows every order by phone.
- **Problems:** open and resolved problem reports.
- **Listing reports:** today's Reports tab, unchanged.
- **Pilot numbers:** see 6.13.

The console may show phone numbers before confirmation, because the founder needs them for follow-up calls. Nobody
else's access changes. Lists are limited or paginated because of Vercel's ~4.5 MB response limit.

### 6.10 Email alerts to the founder

- Emails go to every address in `ADMIN_EMAILS` for three events:
  - a new order request: one email per checkout, listing each handover group with its reference and items, and
    a link to the console;
  - a new problem report;
  - a farmer signing up and waiting for approval.
- Emails don't include phone numbers (designer's call); the console has them.
- A failed email never fails the request. It's logged and the request carries on. On Vercel, the email is sent
  before responding, because nothing can run after the response.
- No email is sent for actions an admin takes while acting.

### 6.11 Search in Tamil and English

- **A curated list of common produce names** for the pilot categories: vegetables, greens, fruit, milk and dairy,
  and eggs (rice and millets optional).
  - Each item has its English names, Tamil names and common romanised spellings, e.g. tomato / தக்காளி / thakkali
    / takkali.
  - The builder drafts it (60 to 100 items) and the founder reviews the Tamil before launch.
  - It lives in the repo as data.
- **How search uses it:**
  - Search expands the query through the list, so any name for an item finds listings named with any other name
    for it.
  - Plain matching on the listing name stays for anything not on the list.
  - Matching ignores case, extra spaces and Unicode differences in Tamil.
- **The listing form uses it too.** The product name field suggests names from the list in the current language
  and remembers which item was picked. Free text is still allowed.
- **Empty results are helpful:** "No tomatoes listed right now", with a way to clear filters and a few other items
  from the same category.

### 6.12 Certificates

- The farm profile's free-text "Certifications" field no longer appears on the public farmer page or in any public
  API response. It stays in the farmer's own form as information for the founder.
- After seeing the document, the founder adds a **Certificate reviewed** badge with what the certificate is
  (e.g. "Organic – PGS-India") and the date it's valid until.
- The public page shows "🏅 Certificate reviewed: Organic – PGS-India · valid till Mar 2027".
- Expired badges disappear automatically.

### 6.13 Pilot numbers

Shown in the console with a date range (default: the last 14 days), and printed by `scripts/data-check.js`. Both
use one shared calculation, so they always match.

A **request** is one handover group (6.5): one buyer's send to one farmer, however many items it has. Item counts
are shown alongside. Anything involving a test account (6.15) is left out.

- **Farmers:** approved; with at least one listing in stock; with at least one completed request.
- **Requests:** sent, confirmed (at least one item confirmed), completed, and fully rejected or cancelled.
- **Confirmation:** the rate, and the median time from sending to the first confirmation (assumption A8's target
  is under 2 hours).
- **On time:** requests completed on or before their promised date ÷ completed requests.
- **Stock accuracy:** items the farmer rejected or cancelled for stock reasons ÷ all items requested.
- **Problems:** problems reported per completed request.
- **Repeat buyers:** buyers who sent another request on a later day within 14 days of their first (assumption A9's
  target is 30% or more).
- **The go signals from `MARKET_VALIDATION.md` section 8:** 5 or more farmers listing real stock, 10 or more
  requests, 3 or more confirmed requests. Each shows as met or not met.

"Completed" counts as delivered, since there are no courier statuses.

### 6.14 Buyer phone number

The need comes from the pilot plan; how it's asked for is the designer's call.

- **Why it's needed:**
  - The pilot follows every order by phone.
  - The farmer arranges pickup or delivery by phone after confirming.
  - A problem report promises a call.

  Today the number is optional: an order copies it only from the buyer profile, where it isn't required.
- **What changes:**
  - A buyer needs a phone number to send a request, whether by "Send order request" or from the cart.
  - If they don't have one yet, the order form and the cart ask for it once: a 10-digit Indian mobile number, with
    `+91` allowed.
  - It's saved to their buyer profile, which is created with the account name if they don't have one. Later sends
    don't ask again, and the number can be changed in the profile.
- **On the server:** a request without a buyer phone number is refused.
- **Who can see it doesn't change:** the farmer after confirmation, plus the admin console (6.9).

### 6.15 Test accounts

- **Why:** the run-through in section 8 will most likely happen in production, and the go/no-go thresholds are small
  enough for a few test orders to tip them.
- **Marking:** the founder can mark any account as a test account in the console, and can create a managed farmer
  as a test farmer.
- **Hidden from real buyers:** test farmers and their listings are shown only to admins and test accounts.
- **Left out of the numbers:** pilot numbers skip anything involving a test account (6.13).
- **Still in the founder's views:** Needs attention, the Orders tab and email alerts include test orders, labelled
  TEST, so a run-through exercises them.
- **No deleting:** the mark is enough (designer's call).

### 6.16 Wording that changes

- **Privacy policy and terms (`Legal.js`):** the VivasayiMart team may call buyers and farmers about their orders,
  and may manage listings and orders for farmers who ask it to.
- **Order cards and the order-placed screen:** the reference, and "Report a problem."
- **Badges:** a one-line help text explaining each one.

## 7. What gets stored

This is a plain summary; the exact shapes are the builder's.

- **Any account:** a test mark (6.15).
- **Farmer account:**
  - whether it's managed;
  - approval state, with who, when and the note, or the decline reason;
  - badges, each with who set it, when, and details (visit date, certificate name, valid-until date).
- **Farm profile:** delivery settings (delivers or not, pincodes, fee, usual days). The free-text certifications
  stay, but private.
- **Buyer:** pincode (on the device and in the buyer profile) and phone number (in the buyer profile).
- **Listing:** which item from the word list it is, if one was picked.
- **Handover group:** which orders belong together, plus the group's:
  - reference;
  - pickup or delivery choice;
  - delivery pincode and fee at request time;
  - promised date;
  - problem report: reason, the items it's about, note, status, resolution note, dates.

  These can live on a group record or be repeated on each order; that's the builder's choice.
- **Each order:** reason and note for a rejection or cancellation.
- **Activity log:** who did it, the account it was done for, what was done, which record, when, and details. It
  covers acting, approvals, badges, problem resolution, and starting and stopping an acting session.

## 8. Release checks

**Automated (extend `tests/`)**

- **Acting:**
  - only admins can start it, and only for managed farmers;
  - it expires;
  - it can't reach admin, account deletion, role or password routes, or start another acting session;
  - every change made while acting is logged with the person acting;
  - an acting session stops working once that person stops being an admin.
- **Managed farmers:** created approved; can't be signed into with a password; never emailed.
- **Approval:**
  - a waiting farmer's listings are absent from browse, search, featured listings and public pages, and can't be
    ordered;
  - approving and declining record who, when and why.
- **Delivery and handover groups:**
  - the server refuses delivery to an uncovered pincode;
  - a cart checkout makes one group per farmer;
  - the fee is stored and charged once per group;
  - totals stay correct when some items are rejected or cancelled.
- **Confirming and the needs-attention list:**
  - confirming needs a date in range (India time);
  - the first confirmation in a group sets the date, and the group's other items use it;
  - changing the date changes it for the whole group;
  - Complete completes every confirmed item in the group;
  - overdue groups, and groups still waiting for a reply after 2 hours, show up in Needs attention.
- **Reasons:** rejecting and cancelling need a reason, and "Other" needs a note.
- **Problems:** only that group's buyer can report; one open problem per group; references are unique.
- **Buyer phone number:** a request without one is refused; giving it once saves it to the buyer profile.
- **Test accounts:**
  - test farmers and their listings are hidden from everyone except admins and test accounts;
  - pilot numbers ignore anything involving a test account.
- **Certificates:** the free text never appears in public responses, and expired badges are hidden.
- **Search:** English, Tamil script and romanised spellings find the same listing.
- **Pilot numbers:** correct on a fixed set of groups and items.
- **Existing tests:** the current suite stays green. Update the fixtures so their farmers are approved.

**By hand, before the pilot**

- New screens at 360px wide in Tamil: no sideways scrolling and no overlapping buttons.
- Switching language in the cart keeps the items.
- One full run-through on a low-end Android phone, using test accounts (6.15):
  1. The founder adds a test farmer and lists two items as them.
  2. A test buyer orders both with delivery from the cart.
  3. The founder confirms both with one date.
  4. The buyer reports a problem.
  5. The founder resolves it and completes the handover.

  Check that the emails arrive, and that the pilot numbers don't change.

## 9. Suggested build order

Each step can ship on its own:

1. Managed farmers, acting (with the banner and activity log), approval and badges, test accounts, and the
   console's first two tabs (Farmers, and Needs attention for waiting farmers).
2. Delivery settings, buyer pincode and phone number, the card line, handover groups with their totals in the order
   form, cart and Orders screens, and the cart refresh.
3. References, promised dates, reasons, problem reports, the rest of Needs attention, the Orders tab and email
   alerts.
4. The search word list.
5. Certificates.
6. Pilot numbers.

## 10. Left to the builder

- Data shapes and indexes, and the migration that makes email and password optional for managed farmers.
- How the acting session is carried: the token claim, where the admin's own session waits, and handling expiry.
- The reference format and how references are generated.
- The word list's format and first draft. The founder reviews the Tamil.
- Exact layouts within the sketches above, reusing existing styles (`.order-card`, `.order-actions`,
  `PageHeader`).
- How handover groups are stored, and how the pilot numbers are shared between the console and the script.
- How the tests are organised.

## Appendix: PRD coverage

| PRD item | Where it stands |
|---|---|
| F01 Tamil/English | Built: the cart survives a language switch and server messages are translated. New strings here go in both languages. |
| F02 Phone sign-in | Set aside: the founder runs farmer accounts. Accounts are shaped so phone sign-in can come later. |
| F03 Seller approval | This design, 6.3 |
| F04 Assisted listing with audit trail | This design, 6.1 and 6.2 |
| F05 Product catalogue | Built; this design adds badges and the delivery line |
| F06 Search with Tamil/English names | This design, 6.11 |
| F07 Delivery eligibility | This design, 6.4 |
| F08 Single-seller cart | Not needed: each listing becomes its own order, and the cart groups by farmer (6.5) |
| F09 Transparent total | This design, 6.5 (no platform charge) |
| F10 Payment reconciliation | Set aside: no online payment |
| F11 Stock reservation | Built: stock is deducted atomically on confirm, with tests for the last unit |
| F12 Order management | Built; this design adds the promised date (6.6). Courier steps not needed. |
| F13 Cancellation and refunds | Reasons in this design (6.7); refunds set aside |
| F14 Settlement ledger | Set aside |
| F15 Order-linked support with reference | This design, 6.8 |
| F16 Verified-purchase reviews | Built (completed orders only); reporting a review is later |
| F17 Reorder | Built: "Order again" on finished orders, at today's price and stock |
| F18 Bulk tools and packing sheets | Later |
| Trust: specific badges, evidence for claims | This design, 6.3 and 6.12 |
| Admin: approvals, orders needing action, complaints, audit history | This design, 6.9 |
| Pilot metrics | This design, 6.13 (search usefulness and contribution per order left out) |
| Non-functional checks (phones, Tamil, access, privacy, alerts, backups) | Section 8, plus the founder's setup in section 4 |
