# Build plan: pilot trust and selling on farmers' behalf

*Plan · 21 November 2026 · For the approved design in [`docs/superpowers/specs/2026-11-21-pilot-trust-and-assisted-selling-design.md`](../specs/2026-11-21-pilot-trust-and-assisted-selling-design.md)*

Step 1 is planned in full: each task lists the files, the code, the tests and the commands to run. Steps 2 to 6 are outlined at the end. Each one gets its own detailed plan when it starts, because it builds on what the step before it adds.

## How to work through this plan

- Work on the `revamp` branch and commit once per task, using the message given in the task. Don't push or deploy until step 1 passes its release checks (Task 8).
- Write the tests first. Each server task starts with tests that fail, then adds the code that makes them pass.
- Run these from the repository root:

| What | Command |
|---|---|
| Server tests | `npm test` |
| App tests | `cd client && CI=true npx react-scripts test --watchAll=false` |
| App build (any lint warning fails it) | `cd client && CI=true npm run build` |

- Put new on-screen words in both `client/src/i18n/en.json` and `client/src/i18n/ta.json`, and follow the wording rules in design section 6.16. The admin console stays English-only, as it is today, because only the founder uses it.
- Server messages that people outside the console can see need a Tamil entry in `serverMsgs`.
- Versions that matter: Express 5 (`req.body` is `undefined` when nothing was sent), Mongoose 9, express-validator 7 (`optional({ values: 'falsy' })`).

---

## Step 1: farmers you run, approval, badges and test accounts

### What step 1 delivers

Step 1 covers these parts of the design:

- 6.1 managed farmers
- 6.2 acting for a farmer
- 6.3 approval and badges
- 6.15 test accounts
- the console's Farmers tab, and the waiting-farmers part of Needs attention (6.9)
- the step 1 parts of the wording (6.16)

When it's done, the founder can:

- Add a farmer who has no smartphone, using their phone number and farm details, and record the phone check and the farm visit.
- Open that farmer's account for up to an hour to add listings and answer orders. A banner shows on every screen, and every change is saved with the founder's name.
- Approve or decline farmers who sign up themselves. Buyers don't see them until they're approved.
- Mark accounts as test accounts. Test accounts only see each other.

### Builder choices this plan makes

Design section 10 left these to the builder.

1. **Managed farmers get a placeholder email.**
   - `email` stays required and unique in the database, so each managed farmer gets `farmer-<id>@managed.invalid` and a random password nobody knows. `.invalid` can never be a real address.
   - Sign-in and password reset refuse managed accounts outright.
   - The console shows no email for them.
2. **Acting uses its own one-hour session.**
   - `POST /api/admin/act-as/:id` returns a sign-in token for the farmer that also carries the admin's id (`actor`).
   - Every request made with that token checks that the admin is still an admin.
   - The app keeps the admin's own sign-in aside and puts it back when acting stops or the hour runs out.
3. **Changes made while acting are recorded before the reply goes out.**
   - A wrapper around `res.send` saves an `Activity` entry, then sends the reply. The entry holds the admin, the farmer, what was done, a copy of what was sent (minus passwords and photos), and the result.
   - The entry is saved first because Vercel stops work once a reply is sent, so recording afterwards could be lost.
   - Viewing screens (GET requests) isn't recorded.
4. **One helper decides which farmers a viewer can see.**
   - `services/visibility.js` applies the rules:
     - Admins see everyone.
     - Nobody else sees farmers who are waiting or declined.
     - Only test accounts see test farmers.
   - Listings, the landing page, single listings, orders and farmer pages all use it.
   - This is fine for a pilot with tens of farmers. With hundreds, the rule should be stored on each listing instead.
5. **No approval status means approved.**
   - Accounts created before approval existed have no status and keep working.
   - These start as waiting: farmers who sign up themselves, and old accounts with no role that choose "farmer".
6. **One helper for the sign-in secret.** The secret lookup is copied in three files today. `utils/jwtSecret.js` replaces all three, so the acting token is signed and checked with the same secret.

### Files

**New:**

- Server: `services/visibility.js`, `utils/badges.js`, `utils/jwtSecret.js`, `models/Activity.js`, `middleware/acting.js`
- Server tests: `tests/farmers.test.js`
- App: `client/src/utils/actingSession.js`, `client/src/actions/acting.js`, `client/src/components/layout/ActingBanner.js`, `client/src/components/farmers/Badges.js`

**Changed:**

- Server:
  - `models/User.js`, `middleware/auth.js`
  - Routes: `routes/api/users.js`, `routes/api/auth.js`, `routes/api/admin.js`, `routes/api/posts.js`, `routes/api/orders.js`, `routes/api/farmerProfile.js`
  - Tests: `tests/orders.test.js`
- App:
  - `client/src/actions/auth.js`, `client/src/App.js`, `client/src/App.css`
  - Screens: `client/src/components/admin/Admin.js`, `client/src/components/posts/PostItem.js`, `client/src/components/farmers/Farmers.js`, `client/src/components/farmers/FarmerPage.js`, `client/src/components/dashboard/FarmerDashboard.js`
  - Translations: `client/src/i18n/en.json`, `client/src/i18n/ta.json`
  - Tests: `client/src/__tests__/screens.test.js`

---

### Task 0: confirm everything passes before starting

- [ ] Run the server tests, the app tests and the app build (commands above). All three must pass.
- [ ] If anything fails, stop and fix or report it first, so later failures are clearly caused by this work.

No commit.

---

### Task 1: approval and test accounts decide who buyers see

Design 6.3 and 6.15. Farmers waiting for approval, declined farmers, test farmers (for non-test viewers), and listings owned by accounts that aren't farmers all disappear from listings, the landing page, single listings, orders and farmer pages.

**1a. Write the failing tests.** Create `tests/farmers.test.js`:

```js
// Run with: npm test
process.env.jwtSecret = 'test-secret';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const Post = require('../models/Post');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
require('../models/Review');
require('../models/Favorite');

let mongod;
let app;
let boss, buyer;

const tokenFor = id => jwt.sign({ user: { id: String(id) } }, process.env.jwtSecret);
const as = user => ({ 'x-auth-token': tokenFor(user._id) });
const makeUser = (name, fields = {}) =>
    User.create({ name, email: `${name}@test.com`, password: 'x'.repeat(8), ...fields });
const makeFarmer = (name, fields = {}) => makeUser(name, { userType: 'farmer', ...fields });
const listing = (ownerId, overrides = {}) =>
    Post.create({
        user: ownerId, text: 'fresh', farmerName: 'F', productName: 'Tomato', mobileNumber: '999',
        weight: 10, price: 20, totalAmount: 200, address: 'Madurai', unit: 'kg', quantityAvailable: 10,
        ...overrides
    });
const browse = user => request(app).get('/api/posts').set(as(user));

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    app = express();
    app.use(express.json());
    app.use('/api/users', require('../routes/api/users'));
    app.use('/api/auth', require('../routes/api/auth'));
    app.use('/api/admin', require('../routes/api/admin'));
    app.use('/api/posts', require('../routes/api/posts'));
    app.use('/api/orders', require('../routes/api/orders'));
    app.use('/api/farmer-profile', require('../routes/api/farmerProfile'));
});

after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    process.env.ADMIN_EMAILS = 'boss@test.com';
    await Promise.all([User, Post, Order, FarmerProfile].map(m => m.deleteMany({})));
    boss = await makeUser('boss', { userType: 'consumer' });
    buyer = await makeUser('buyer', { userType: 'consumer' });
});

test('farmers who sign up wait for approval, and buyers cannot see or order from them meanwhile', async () => {
    const signup = await request(app).post('/api/users').send({
        name: 'Kumar', email: 'kumar@test.com', password: 'secret123', userType: 'farmer', acceptedTerms: true
    });
    assert.equal(signup.status, 200);
    const kumar = await User.findOne({ email: 'kumar@test.com' });
    assert.equal(kumar.approval.status, 'pending');

    const post = await listing(kumar._id);
    await FarmerProfile.create({ user: kumar._id, farmName: 'K Farm', location: 'Melur', mobileNumber: '9876543210', farmingSpecializations: ['Vegetables'] });

    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await request(app).get('/api/posts/featured')).body.length, 0);
    assert.equal((await request(app).get(`/api/posts/${post.id}`).set(as(buyer))).status, 404);
    assert.equal((await request(app).post('/api/orders').set(as(buyer)).send({ postId: post.id, quantity: 1 })).status, 404);
    assert.equal((await request(app).get(`/api/farmer-profile/${kumar.id}/public`)).status, 404);
    assert.equal((await request(app).get('/api/farmer-profile')).body.length, 0);

    // the farmer still sees their own listing, and admins see everyone
    assert.equal((await request(app).get(`/api/posts?farmer=${kumar.id}`).set(as(kumar))).body.total, 1);
    assert.equal((await browse(boss)).body.total, 1);

    await User.updateOne({ _id: kumar._id }, { 'approval.status': 'approved' });
    assert.equal((await browse(buyer)).body.total, 1);
    assert.equal((await request(app).get(`/api/farmer-profile/${kumar.id}/public`)).status, 200);
});

test('declined farmers stay hidden; farmers from before approvals existed stay visible', async () => {
    const declined = await makeFarmer('declined', { approval: { status: 'declined', note: 'Not a farmer' } });
    const old = await makeFarmer('old');                                    // no approval status at all
    await listing(declined._id);
    await listing(old._id, { productName: 'Brinjal' });
    const res = await browse(buyer);
    assert.deepEqual(res.body.posts.map(p => p.productName), ['Brinjal']);
});

test('old accounts that choose the farmer role wait for approval too', async () => {
    const legacy = await User.collection.insertOne({ name: 'Old Timer', email: 'oldtimer@test.com', password: 'x', date: new Date() });
    const res = await request(app).put('/api/auth/role').set({ 'x-auth-token': tokenFor(legacy.insertedId) }).send({ userType: 'farmer' });
    assert.equal(res.status, 200);
    assert.equal((await User.findById(legacy.insertedId)).approval.status, 'pending');
});

test('listings owned by an account that is not a farmer never show', async () => {
    const roleless = await User.collection.insertOne({ name: 'Old', email: 'old@test.com', password: 'x', date: new Date() });
    await listing(roleless.insertedId);
    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await request(app).get('/api/posts/featured')).body.length, 0);
});

test('test farmers are seen only by test accounts and admins', async () => {
    const testFarmer = await makeFarmer('testfarmer', { isTest: true });
    const post = await listing(testFarmer._id);
    const tester = await makeUser('tester', { userType: 'consumer', isTest: true });

    assert.equal((await browse(buyer)).body.total, 0);
    assert.equal((await request(app).post('/api/orders').set(as(buyer)).send({ postId: post.id, quantity: 1 })).status, 404);
    assert.equal((await browse(tester)).body.total, 1);
    assert.equal((await browse(boss)).body.total, 1);
});
```

- [ ] Run `npm test`. The new tests fail, and the existing ones still pass.

**1b. Add the new account fields.** In `models/User.js`, add a badge schema above `UserSchema`:

```js
const BadgeSchema = new mongoose.Schema({
    type: { type: String, enum: ['phone', 'visit'], required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    visitedOn: { type: Date }
}, { _id: false });
```

Then add these fields after `isAdmin`. Keep `farmerVerified` for now; Task 2 removes it together with the code that still uses it.

```js
    // Farmers the team runs for people without a smartphone: placeholder email, nobody signs in
    managed: { type: Boolean },
    // No status = an account from before approvals existed, treated as approved
    approval: {
        status: { type: String, enum: ['pending', 'approved', 'declined'] },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date },
        note: { type: String, maxlength: 500 }
    },
    badges: [BadgeSchema],
    isTest: { type: Boolean },
```

**1c. Farmers start as waiting.**

- In `routes/api/users.js`, add this line to the `new User({ ... })` call:

  ```js
  approval: userType === 'farmer' ? { status: 'pending' } : undefined
  ```

- In `routes/api/auth.js`, inside `PUT /role`, change the update to:

  ```js
  { userType: req.body.userType, ...(req.body.userType === 'farmer' ? { approval: { status: 'pending' } } : {}) }
  ```

**1d. Create the visibility helper** in `services/visibility.js`:

```js
const User = require('../models/User');
const { isAdminUser } = require('../middleware/checkRole');

// Farmers whose listings this viewer may see and order from. Accounts with no role are never farmers.
const visibleFarmerIds = async viewerId => {
    const viewer = viewerId ? await User.findById(viewerId).select('email isAdmin isTest') : null;
    const filter = { userType: 'farmer' };
    if (!isAdminUser(viewer)) {
        filter['approval.status'] = { $nin: ['pending', 'declined'] };
        if (!(viewer && viewer.isTest)) filter.isTest = { $ne: true };
    }
    return (await User.find(filter).select('_id')).map(u => u._id);
};

const canSee = (visible, farmerId) => !!farmerId && visible.some(id => id.equals(farmerId));

module.exports = { visibleFarmerIds, canSee };
```

**1e. Use the helper in `routes/api/posts.js`.**

- **`GET /`.** Replace the "hidden (moderated) listings" block and the later `if (farmer && /^[0-9a-fA-F]{24}$/.test(farmer)) filter.user = farmer;` block with:

  ```js
  if (farmer && farmer === req.user.id) {
      filter.user = farmer;                          // own view: hidden listings too, even while waiting for approval
  } else {
      filter.hidden = { $ne: true };
      const visible = await visibleFarmerIds(req.user.id);
      filter.user = { $in: farmer ? visible.filter(id => id.toString() === farmer) : visible };
  }
  ```

  An invalid `farmer` value now returns no results instead of being ignored. The app only ever sends a real id or nothing, so nothing on screen changes.

- **`GET /featured`.** Add `user: { $in: await visibleFarmerIds(null) }` to the `Post.find` filter.

- **`GET /:id`.** After the existing hidden-listing check, add:

  ```js
  if (post.user.toString() !== req.user.id && !canSee(await visibleFarmerIds(req.user.id), post.user)) {
      return res.status(404).json({ msg: 'Post not found' });
  }
  ```

**1f. Use the helper in `routes/api/orders.js`.**

- `prepareOrder` takes a new `visible` argument. Change its first check to:

  ```js
  if (!post || post.hidden || !canSee(visible, post.user)) return { status: 404, msg: 'Product not found' };
  ```

- `POST /` passes `visible: await visibleFarmerIds(req.user.id)`.
- The cart checkout works it out once before the loop and passes the same list for every line.

**1g. Use the helper in `routes/api/farmerProfile.js`.**

- `GET /` (directory): use `FarmerProfile.find({ user: { $in: await visibleFarmerIds(null) } })`.
- `GET /:user_id/public`: after loading the user, return 404 `Farmer not found` unless `canSee(await visibleFarmerIds(null), user._id)`.
- `GET /:user_id`: return 400 `Profile not found` (the message it already uses) when the farmer isn't visible.

- [ ] Run `npm test`. Everything passes. If an existing test fails because its listing belongs to an account that isn't a farmer, fix that test's fixture, not the rule.
- [ ] Commit: `feat: Hide farmers waiting for approval, declined farmers and test accounts from buyers`

---

### Task 2: admin endpoints for farmers, approval, badges, test accounts and activity

Design 6.1, 6.3, 6.9 (Farmers tab and waiting farmers) and 6.15. The old "verified" switch is replaced by badges.

**2a. Write the failing tests.** Add `require('../models/Activity')` to the top of `tests/farmers.test.js` as `const Activity = ...`, add `Activity` to the `beforeEach` clean-up, then add:

```js
const addFarmer = (fields = {}) => request(app).post('/api/admin/farmers').set(as(boss)).send({
    name: 'Murugan', mobileNumber: '98765 43210', location: 'Melur', farmName: 'Murugan Thottam',
    farmingSpecializations: ['Vegetables'], ...fields
});

test('admin adds a farmer who has no smartphone', async () => {
    const res = await addFarmer({ phoneVerified: true, visitedOn: '2026-11-20' });
    assert.equal(res.status, 200);
    assert.equal(res.body.managed, true);
    assert.equal(res.body.email, null);                                     // no real email to show
    assert.equal(res.body.approval.status, 'approved');
    assert.deepEqual(res.body.badges.map(b => b.type).sort(), ['phone', 'visit']);

    const saved = await User.findById(res.body._id);
    assert.match(saved.email, /^farmer-[0-9a-f]{24}@managed\.invalid$/);
    assert.equal((await FarmerProfile.findOne({ user: saved._id })).mobileNumber, '9876543210');
    assert.equal((await Activity.findOne({ account: saved._id, action: 'farmer.create' })).actor.toString(), boss.id);

    assert.equal((await addFarmer({ mobileNumber: '12345' })).status, 400);
    assert.equal((await request(app).post('/api/admin/farmers').set(as(buyer)).send({})).status, 403);
});

test('approving and declining records who, when and why', async () => {
    const kumar = await makeFarmer('kumar', { approval: { status: 'pending' } });
    const attention = await request(app).get('/api/admin/attention').set(as(boss));
    assert.deepEqual(attention.body.pendingFarmers.map(f => f.name), ['kumar']);

    const decide = body => request(app).put(`/api/admin/farmers/${kumar.id}/approval`).set(as(boss)).send(body);
    assert.equal((await decide({ status: 'declined' })).status, 400);       // declining needs a reason
    const ok = await decide({ status: 'approved', note: 'Called, grows brinjal in Melur' });
    assert.equal(ok.status, 200);

    const saved = await User.findById(kumar._id);
    assert.equal(saved.approval.status, 'approved');
    assert.equal(saved.approval.by.toString(), boss.id);
    assert.ok(saved.approval.at instanceof Date);
    assert.ok(await Activity.findOne({ account: kumar._id, action: 'farmer.approve' }));
    assert.equal((await request(app).get('/api/admin/attention').set(as(boss))).body.pendingFarmers.length, 0);
});

test('badges show on listings and farmer pages without saying who added them', async () => {
    const f = await makeFarmer('f');
    await listing(f._id);
    const setBadge = body => request(app).put(`/api/admin/farmers/${f.id}/badges`).set(as(boss)).send(body);
    assert.equal((await setBadge({ type: 'visit', on: true })).status, 400); // a visit needs its date
    assert.equal((await setBadge({ type: 'phone', on: true })).status, 200);
    assert.equal((await setBadge({ type: 'visit', on: true, visitedOn: '2026-11-19' })).status, 200);

    const card = (await browse(buyer)).body.posts[0];
    assert.deepEqual(card.farmerBadges.map(b => b.type), ['phone', 'visit']);
    assert.equal(card.farmerBadges[0].by, undefined);
    assert.equal(card.farmerVerified, undefined);

    const page = await request(app).get(`/api/farmer-profile/${f.id}/public`);
    assert.deepEqual(page.body.farmer.badges.map(b => b.type), ['phone', 'visit']);

    await setBadge({ type: 'phone', on: false });
    assert.deepEqual((await browse(buyer)).body.posts[0].farmerBadges.map(b => b.type), ['visit']);
});

test('admin marks test accounts', async () => {
    const found = await request(app).get('/api/admin/users?q=buyer').set(as(boss));
    assert.deepEqual(found.body.map(u => u.name), ['buyer']);
    const res = await request(app).put(`/api/admin/users/${buyer.id}/test`).set(as(boss)).send({ isTest: true });
    assert.equal(res.status, 200);
    assert.equal((await User.findById(buyer._id)).isTest, true);
    assert.ok(await Activity.findOne({ account: buyer._id, action: 'account.test' }));
});
```

**Update the existing tests in `tests/orders.test.js`:**

- **`admin: moderation and farmer verification`:** remove the verify-switch lines (about lines 347–350) and rename the test to `admin: moderation`.
- **`public farmer page`:**
  - Create the farmer with `badges: [{ type: 'phone' }]` instead of `farmerVerified: true`.
  - Check `farmer.badges` instead of `farmer.verified` (about line 444).
  - Check `list.body[0].user.badges` instead of `user.farmerVerified` (about line 456).

- [ ] Run `npm test`. The new tests fail.

**2b. Create the activity model** in `models/Activity.js`:

```js
const mongoose = require('mongoose');

// Admin actions, and everything done while acting for a farmer
const ActivitySchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    params: { type: mongoose.Schema.Types.Mixed },
    details: { type: mongoose.Schema.Types.Mixed },
    status: { type: Number },
    at: { type: Date, default: Date.now }
});
ActivitySchema.index({ account: 1, at: -1 });

module.exports = mongoose.model('activity', ActivitySchema);
```

**2c. Create the badge helper** in `utils/badges.js`:

```js
// Buyers may see what was checked and when, never who checked it
const publicBadges = badges => (badges || []).map(b => ({ type: b.type, at: b.at, visitedOn: b.visitedOn }));

module.exports = { publicBadges };
```

**2d. Add the admin endpoints in `routes/api/admin.js`.**

- **New imports:** `bcrypt`, `crypto`, `gravatar`, `mongoose`, `FarmerProfile`, `Activity`.
- **Shared helpers:**

  ```js
  const record = (req, account, action, details) => Activity.create({ actor: req.user.id, account, action, details });

  const farmerSummary = (user, profile) => ({
      _id: user._id,
      name: user.name,
      email: user.managed ? null : user.email,
      managed: !!user.managed,
      isTest: !!user.isTest,
      approval: user.approval && user.approval.status ? user.approval : { status: 'approved' },
      badges: user.badges || [],
      date: user.date,
      farmName: profile ? profile.farmName : null,
      location: profile ? profile.location : null
  });
  ```

**Routes:**

- **`POST /farmers`: add a managed farmer.**
  - Validation:
    - `name`, `location` and `farmName` are required.
    - `mobileNumber`: remove spaces and dashes with a `customSanitizer`, then require `^(\+91)?[6-9]\d{9}$`.
    - `farmingSpecializations` needs at least one item.
    - `phoneVerified` and `isTest` must be true or false if given.
    - `visitedOn` must be a date if given.
  - Create the user with:
    - `const id = new mongoose.Types.ObjectId()`
    - `email: \`farmer-${id}@managed.invalid\``
    - `password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)`
    - a gravatar default avatar (`d: 'mm'`), `userType: 'farmer'`, `managed: true`
    - `approval: { status: 'approved', by, at, note: 'Added by an admin' }`
    - badges from `phoneVerified` and `visitedOn`
    - `isTest`
  - Create the `FarmerProfile` with the farm details.
  - Record `farmer.create` and return `farmerSummary`.
- **`GET /farmers?q=&status=pending`:** the existing search, plus the status filter, selecting `name email managed isTest approval badges date`. Join the profiles for farm name and location, and return `farmerSummary` for each.
- **`PUT /farmers/:id/approval {status, note}`:**
  - `status` is `approved` or `declined`, and a decline needs a note of up to 500 characters.
  - Set `approval` to `{ status, by: req.user.id, at: new Date(), note }`.
  - Record `farmer.approve` or `farmer.decline` with the note.
- **`PUT /farmers/:id/badges {type, on, visitedOn}`:**
  - `type` is `phone` or `visit`, and turning on a visit needs `visitedOn`.
  - Remove any badge of that type, then add the new one when `on` is true. Save the user.
  - Record `badge.add` or `badge.remove`.
- **`GET /users?q=`:**
  - Search any account by name or email, up to 50 results.
  - Return `_id`, `name`, the email (null for managed accounts), `userType`, `managed` and `isTest`.
- **`PUT /users/:id/test {isTest}`:** set `isTest: true`, or `$unset` it when false. Record `account.test`.
- **`GET /activity?account=`:** the newest 50 entries (`limit` up to 200), with `actor` and `account` filled in with names.
- **`GET /attention`:**
  - Returns `{ pendingFarmers: [{ _id, name, email, waitingSince }] }`, oldest first.
  - Step 3 adds orders and problem reports to this reply.
- **Remove `PUT /farmers/:id/verify`.**

**2e. Return badges instead of "verified".**

- `routes/api/posts.js` `GET /`:
  - Replace the `verifiedFarmers` lookup with `User.find({ _id: { $in: farmerIds } }).select('badges')`.
  - Build a map of `publicBadges` per farmer, and return `farmerBadges` on each listing instead of `farmerVerified`.
- `routes/api/farmerProfile.js`:
  - The directory populates `user` with `name avatar badges` and returns `user: { _id, name, avatar, badges: publicBadges(...) }`.
  - The public page selects `name avatar badges` and returns `farmer: { _id, name, avatar, badges: publicBadges(user.badges) }`.

- [ ] Search for any leftovers with `rg -n "farmerVerified|verified" routes models middleware services`. The only matches should be the unrelated `emailVerified`.
- [ ] Run `npm test`. Everything passes.
- [ ] Commit: `feat: Admin can add farmers, approve sign-ups, set badges and mark test accounts`

---

### Task 3: acting for a farmer (server)

Design 6.2.

**3a. Write the failing tests** in `tests/farmers.test.js`:

```js
const withToken = token => ({ 'x-auth-token': token });
const actAs = async farmerId => (await request(app).post(`/api/admin/act-as/${farmerId}`).set(as(boss))).body.token;

test('admins act only for farmers they added, for at most an hour', async () => {
    const managed = (await addFarmer()).body;
    const selfSignup = await makeFarmer('self');

    assert.equal((await request(app).post(`/api/admin/act-as/${selfSignup.id}`).set(as(boss))).status, 400);
    assert.equal((await request(app).post(`/api/admin/act-as/${managed._id}`).set(as(buyer))).status, 403);

    const res = await request(app).post(`/api/admin/act-as/${managed._id}`).set(as(boss));
    assert.equal(res.status, 200);
    const decoded = jwt.decode(res.body.token);
    assert.equal(decoded.user.id, String(managed._id));
    assert.equal(decoded.actor.id, boss.id);
    assert.ok(decoded.exp - decoded.iat <= 3600);

    const me = await request(app).get('/api/auth').set(withToken(res.body.token));
    assert.equal(me.body.name, 'Murugan');
    assert.equal(me.body.acting.by, 'boss');
    assert.equal(me.body.isAdmin, false);                                  // the console stays closed while acting
    assert.ok(await Activity.findOne({ account: managed._id, action: 'act-as.start' }));
});

test('everything changed while acting is saved with the admin\'s name', async () => {
    const managed = (await addFarmer()).body;
    const token = await actAs(managed._id);

    const added = await request(app).post('/api/posts').set(withToken(token)).send({
        text: 'Fresh brinjal', productName: 'Brinjal', category: 'Vegetables', price: 30, unit: 'kg',
        quantityAvailable: 20, weight: 20, totalAmount: 600, address: 'Melur', mobileNumber: '9876543210'
    });
    assert.equal(added.status, 200);

    const order = await request(app).post('/api/orders').set(as(buyer)).send({ postId: added.body._id, quantity: 2 });
    const confirmed = await request(app).put(`/api/orders/${order.body._id}/status`).set(withToken(token)).send({ status: 'confirmed' });
    assert.equal(confirmed.status, 200);

    const log = await Activity.find({ account: managed._id, actor: boss._id }).sort({ at: 1 });
    const actions = log.map(e => e.action);
    assert.ok(actions.includes('POST /api/posts'));
    const confirm = log.find(e => e.action === 'PUT /api/orders/:id/status');
    assert.equal(confirm.details.status, 'confirmed');
    assert.equal(confirm.params.id, String(order.body._id));
    assert.equal(confirm.status, 200);
});

test('account, role and admin actions are blocked while acting', async () => {
    const managed = (await addFarmer()).body;
    const token = await actAs(managed._id);
    assert.equal((await request(app).get('/api/admin/farmers').set(withToken(token))).status, 403);
    assert.equal((await request(app).post(`/api/admin/act-as/${managed._id}`).set(withToken(token))).status, 403);
    assert.equal((await request(app).put('/api/auth/role').set(withToken(token)).send({ userType: 'consumer' })).status, 403);
    assert.equal((await request(app).delete('/api/auth/account').set(withToken(token)).send({ password: 'x' })).status, 403);
    assert.equal((await request(app).post('/api/auth/resend-verification').set(withToken(token))).status, 403);
});

test('acting ends when the admin is no longer an admin, when the hour is up, or on stop', async () => {
    const managed = (await addFarmer()).body;
    const token = await actAs(managed._id);

    const stop = await request(app).post('/api/auth/stop-acting').set(withToken(token));
    assert.equal(stop.status, 200);
    assert.ok(await Activity.findOne({ account: managed._id, action: 'POST /api/auth/stop-acting' }));

    const expired = jwt.sign({ user: { id: String(managed._id) }, actor: { id: boss.id } }, process.env.jwtSecret, { expiresIn: -10 });
    assert.equal((await request(app).get('/api/auth').set(withToken(expired))).status, 401);

    process.env.ADMIN_EMAILS = '';
    assert.equal((await request(app).get('/api/auth').set(withToken(token))).status, 401);
});

test('nobody can sign in to a managed farmer or reset its password', async () => {
    const managed = await User.findById((await addFarmer()).body._id);
    assert.equal((await request(app).post('/api/auth').send({ email: managed.email, password: 'anything' })).status, 400);
    assert.equal((await request(app).post('/api/auth/forgot').send({ email: managed.email })).status, 200);
    assert.equal((await User.findById(managed._id).select('+resetTokenHash')).resetTokenHash, undefined);
});
```

Before relying on the listing body in the second test, check it against the existing `POST /api/posts` validation and add any required fields it's missing.

- [ ] Run `npm test`. The new tests fail.

**3b. Create the sign-in secret helper** in `utils/jwtSecret.js`, and use it in `middleware/auth.js`, `routes/api/auth.js` and `routes/api/users.js` in place of their copies:

```js
let jwtSecret = process.env.jwtSecret || process.env.JWT_SECRET;
if (!jwtSecret) {
    try {
        jwtSecret = require('config').get('jwtSecret');
    } catch (err) {
        console.error('JWT Secret not found in environment variables or config');
    }
}

module.exports = jwtSecret;
```

**3c. Create the acting middleware** in `middleware/acting.js`:

```js
const Activity = require('../models/Activity');

const LEFT_OUT = new Set(['password', 'productImage', 'profileImage']);

const summarise = body => {
    if (!body || typeof body !== 'object') return undefined;
    const out = {};
    for (const [key, value] of Object.entries(body)) {
        if (LEFT_OUT.has(key)) continue;
        out[key] = typeof value === 'string' && value.length > 200 ? `${value.slice(0, 200)}…` : value;
    }
    return out;
};

// The entry must be saved before the reply goes out: Vercel stops the function once it has replied
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
```

**3d. Make `middleware/auth.js` async.**

- Keep the existing no-token and missing-secret replies.
- After verifying the token, set `req.user = decoded.user`. If there's no `decoded.actor`, call `next()`.
- If there is an actor:
  - Load the actor with `User.findById(decoded.actor.id).select('name email isAdmin')`.
  - If `!isAdminUser(actor)`, reply 401 `Token is not valid`.
  - Otherwise set `req.actor = { id: actor.id, name: actor.name }` and `req.actingUntil = decoded.exp * 1000`.
  - Call `recordActing(req, res)` when `req.method !== 'GET'`, then `next()`.
- A database error replies 500 `Server Error`. An invalid token still replies 401 `Token is not valid`.

**3e. Add the act-as route** in `routes/api/admin.js`:

- Change the router guard to `router.use(auth, noActing, checkAdmin)`.
- Add `POST /act-as/:id`:
  - Reply 404 unless the id is a farmer.
  - Reply 400 `You can only act for farmers you added` unless the farmer is managed.
  - Sign `{ user: { id, userType: 'farmer' }, actor: { id: req.user.id } }` with `{ expiresIn: 3600 }`.
  - Record `act-as.start`.
  - Return `{ token, farmer: { _id, name }, until }`.

**3f. Change `routes/api/auth.js`.**

- **`GET /`:** add `acting: req.actor ? { by: req.actor.name, until: req.actingUntil } : undefined`.
- **New `POST /stop-acting` (auth):**
  - Reply 400 `You are not acting for a farmer` when `!req.actor`. Otherwise reply `{ msg: 'Stopped acting' }`.
  - The middleware's wrapper records it.
- **`PUT /role`, `DELETE /account` and `POST /resend-verification`:** add `noActing` straight after `auth`.
- **Sign-in:** treat `user.managed` like a wrong password (`Invalid Credentials`).
- **`POST /forgot`:** do nothing for managed accounts, and keep the same generic reply.

**3g.** Add the Tamil `serverMsgs` entry for `Not allowed while acting for a farmer`: `விவசாயி சார்பாகச் செயல்படும்போது இது அனுமதிக்கப்படாது`.

- [ ] Run `npm test`. Everything passes.
- [ ] Commit: `feat: Admins can act for farmers they added, for up to an hour, with every change recorded`

---

### Task 4: acting for a farmer (app)

Design 6.2: the banner, stopping, and the hour running out.

**4a. Create `client/src/utils/actingSession.js`:**

```js
// While an admin acts for a farmer, the admin's own sign-in waits here
export const ADMIN_TOKEN_KEY = 'adminToken';
```

**4b. Create `client/src/actions/acting.js`.** Each switch clears the offline API cache and the profile, as sign-in already does, so the two accounts' data never mix:

```js
import api from '../utils/api';
import setAuthToken from '../utils/setAuthToken';
import { clearApiCache } from '../utils/offline';
import { ADMIN_TOKEN_KEY } from '../utils/actingSession';
import { loadUser } from './auth';
import { CLEAR_PROFILE } from './types';

const switchTo = async (dispatch, token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    await clearApiCache();
    dispatch({ type: CLEAR_PROFILE });
    await dispatch(loadUser());
};

export const startActing = farmerId => async dispatch => {
    const res = await api.post(`/api/admin/act-as/${farmerId}`);
    localStorage.setItem(ADMIN_TOKEN_KEY, localStorage.getItem('token'));
    await switchTo(dispatch, res.data.token);
};

export const stopActing = () => async dispatch => {
    try {
        await api.post('/api/auth/stop-acting');
    } catch (err) {
        // the hour already ran out: nothing left to stop
    }
    const own = localStorage.getItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    if (own) await switchTo(dispatch, own);
};
```

**4c. Change `client/src/actions/auth.js`.**

- In `loadUser`'s `catch`, if the status is 401 and `localStorage.getItem(ADMIN_TOKEN_KEY)` is set, the acting hour ran out:
  1. Move the admin token back into `token` and call `setAuthToken`.
  2. Remove the saved admin token.
  3. Show `setAlert(i18n.t('acting.ended'), 'success')`.
  4. Return `dispatch(loadUser())`.
- `logout` also removes `ADMIN_TOKEN_KEY`.

**4d. Create `client/src/components/layout/ActingBanner.js`.**

- **When it shows:** whenever `state.auth.user.acting` is set.
- **What it shows:** `t('acting.banner', { name: user.name })` and a Stop button.
- **Stop:** calls `stopActing()`, then `navigate('/admin')`.
- **When the hour runs out:**
  - A `setTimeout` runs at `acting.until`. It calls `stopActing()`, shows `acting.ended` and navigates to `/admin`.
  - Clear the timer when `until` changes or the banner unmounts.
- Use `role='status'`.
- Render it in `client/src/App.js` straight after `<Navbar />`.

**4e. Add the banner style** in `client/src/App.css`:

- Add `.acting-banner`, sticky under the top bar so it stays visible while scrolling.
- Use the warm yellow of `.status-banner.offline` with a stronger border and bold text.
- The text wraps and the Stop button stays reachable at 360px wide.

**4f. Translations** (`en.json`, `ta.json`):

| Key | English | Tamil |
|---|---|---|
| `acting.banner` | Acting for {{name}} · everything you do is saved with your name | {{name}} சார்பாகச் செயல்படுகிறீர்கள் · நீங்கள் செய்யும் அனைத்தும் உங்கள் பெயருடன் பதிவாகும் |
| `acting.stop` | Stop | நிறுத்து |
| `acting.ended` | Your time acting for the farmer ended. You're back in your own account. | விவசாயி சார்பாகச் செயல்படும் நேரம் முடிந்தது. மீண்டும் உங்கள் கணக்கில் இருக்கிறீர்கள். |

**4g. App tests.** In `client/src/__tests__/screens.test.js`, first give the fake API a `defaults: { headers: { common: {} } }` entry, because switching accounts calls `setAuthToken`, which writes to it. Then add:

```js
describe('Acting for a farmer', () => {
  const ActingBanner = require('../components/layout/ActingBanner').default;
  afterEach(() => localStorage.clear());

  test('the banner names the farmer, and Stop goes back to your own account and the console', async () => {
    localStorage.setItem('adminToken', 'admin-token');
    api.post.mockResolvedValue({ data: {} });
    api.get.mockResolvedValue({ data: { _id: 'a1', name: 'Founder', isAdmin: true } });
    const user = { ...FARMER, acting: { by: 'Founder', until: Date.now() + 60 * 60 * 1000 } };
    renderAt(<><ActingBanner /><Where /></>, { user, path: '/dashboard' });

    expect(screen.getByText(/Acting for Farmer Fay/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/admin'));
    expect(api.post).toHaveBeenCalledWith('/api/auth/stop-acting');
    expect(localStorage.getItem('token')).toBe('admin-token');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  test('no banner in your own account', () => {
    renderAt(<ActingBanner />, { user: FARMER });
    expect(screen.queryByText(/Acting for/)).not.toBeInTheDocument();
  });
});
```

- [ ] Run the app tests and the app build. Both pass.
- [ ] Commit: `feat: Banner and automatic stop while acting for a farmer`

---

### Task 5: admin console tabs

Design 6.9, step 1 part. Replace the tabs in `client/src/components/admin/Admin.js` with **Needs attention**, **Farmers**, **Accounts** and **Listing reports**. Needs attention is the default tab.

- **Needs attention:**
  - `GET /api/admin/attention`.
  - Each waiting farmer shows their name, email and how long they've waited.
  - **Approve** asks for an optional note using `window.prompt`.
  - **Decline** asks for a required reason and does nothing if it's left empty.
  - Both call `PUT /api/admin/farmers/:id/approval` and remove the row when it succeeds.
  - When nothing is waiting, show "Nothing needs you right now".
- **Farmers:**
  - The search box (`GET /api/admin/farmers?q=`) stays.
  - A filter shows only waiting farmers.
  - An **Add a farmer** form has these fields:
    - name
    - mobile number
    - village or town
    - farm name
    - what they grow (comma separated, sent as a list)
    - farm size (optional)
    - "I called this number and they answered" (phone check)
    - "Visited the farm on" (date)
    - "Test farmer"
  - After saving, the new farmer goes to the top of the list.
  - Each farmer row shows:
    - Name, farm name and place.
    - "Added by you" or "Signed up themselves", and the approval status (with Approve and Decline while waiting).
    - The badges with switches. Turning on Farm visited asks for the date.
    - A Test account switch (`PUT /api/admin/users/:id/test`).
    - For managed farmers, **Open as {name}**: `dispatch(startActing(id))`, then `navigate('/dashboard')`.
    - An **Activity** toggle that loads `GET /api/admin/activity?account=id`. Each entry reads, for example, "21 Nov, 4:10 pm · Founder · Order confirmed".
- **Accounts:**
  - Searches `GET /api/admin/users?q=`.
  - Each row shows the name, the email (or "Added by you" for managed accounts), the role and a Test account switch.
- **Listing reports:** the existing reports view, unchanged.

Activity labels live in one map in the file. Unknown actions show as stored, and a result of 400 or more adds "(failed)".

```js
const ACTIVITY_LABELS = {
  'farmer.create': () => 'Added this farmer',
  'farmer.approve': e => `Approved${e.details && e.details.note ? `: ${e.details.note}` : ''}`,
  'farmer.decline': e => `Declined: ${e.details && e.details.note}`,
  'badge.add': e => `Badge added: ${e.details.type}`,
  'badge.remove': e => `Badge removed: ${e.details.type}`,
  'account.test': e => (e.details.isTest ? 'Marked as a test account' : 'No longer a test account'),
  'act-as.start': () => 'Started acting for this farmer',
  'POST /api/auth/stop-acting': () => 'Stopped acting',
  'POST /api/posts': e => `Added listing: ${e.details && e.details.productName}`,
  'PUT /api/posts/:id': () => 'Edited a listing',
  'DELETE /api/posts/:id': () => 'Deleted a listing',
  'PUT /api/orders/:id/status': e => `Order ${e.details && e.details.status}`,
  'POST /api/farmer-profile': () => 'Updated the farm profile'
};
```

Add an app test:

```js
describe('Admin console', () => {
  const Admin = require('../components/admin/Admin').default;
  const ADMIN = { _id: 'a1', name: 'Founder', userType: 'consumer', isAdmin: true };

  test('Needs attention lists farmers waiting for approval; approving removes them', async () => {
    api.get.mockImplementation(url => Promise.resolve({
      data: url === '/api/admin/attention'
        ? { pendingFarmers: [{ _id: 'f9', name: 'Kumar', email: 'kumar@x.com', waitingSince: new Date().toISOString() }] }
        : []
    }));
    api.put.mockResolvedValue({ data: {} });
    jest.spyOn(window, 'prompt').mockReturnValueOnce('');
    renderAt(<Admin />, { user: ADMIN, path: '/admin' });

    expect(await screen.findByText('Kumar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/admin/farmers/f9/approval', { status: 'approved', note: '' }));
    await waitFor(() => expect(screen.queryByText('Kumar')).not.toBeInTheDocument());
  });
});
```

- [ ] Run the app tests and the app build. Both pass.
- [ ] Commit: `feat: Console tabs for waiting farmers, adding and running farmers, and test accounts`

---

### Task 6: badges and the approval notice in the app

Design 6.3 and 6.16.

**6a. Create `client/src/components/farmers/Badges.js`.**

- Props: `badges` and `compact`.
- Only known types show: `phone` with 📞 and `visit` with 🏡. Step 5 adds certificates.
- **Compact:** small chips next to a name.
- **Full:** a list in which each badge has one line of explanation, using `badges.phoneHelp` / `badges.visitHelp` with a date in the user's language (`ta-IN` or `en-IN`). Use `visitedOn` for visits and `at` for the phone check.
- If there are no badges, render nothing.

**6b. Use the badges.**

| File | Change |
|---|---|
| `PostItem.js` line 51 | `<Badges badges={post.farmerBadges} compact />` |
| `Farmers.js` line 41 | `<Badges badges={p.user.badges} compact />` |
| `FarmerPage.js` line 70 | Drop the ✔ from the title |
| `FarmerPage.js` line 78 | Full `<Badges badges={farmer.badges} />` |

- [ ] Run `rg -n "farmerVerified|\.verified" client/src`. There should be no matches.

**6c. Approval notice.** Show it on `FarmerDashboard.js` under the page header, using the existing `alert` styles:

- `approval.pending` when the status is `pending`
- `approval.declined` (with the note) when the status is `declined`

**6d. Translations:**

| Key | English | Tamil |
|---|---|---|
| `badges.phone` | Phone verified | தொலைபேசி சரிபார்க்கப்பட்டது |
| `badges.visit` | Farm visited | பண்ணை பார்வையிடப்பட்டது |
| `badges.phoneHelp` | Our team called this number and the farmer answered ({{date}}) | எங்கள் குழு இந்த எண்ணை அழைத்தது, விவசாயி பதிலளித்தார் ({{date}}) |
| `badges.visitHelp` | Someone from our team visited this farm on {{date}} | எங்கள் குழுவைச் சேர்ந்த ஒருவர் {{date}} அன்று இந்தப் பண்ணையைப் பார்வையிட்டார் |
| `approval.pending` | Thanks for joining. Our team will call you to check your details. Buyers can see your products once you're approved. | சேர்ந்ததற்கு நன்றி. உங்கள் விவரங்களைச் சரிபார்க்க எங்கள் குழு உங்களை அழைக்கும். ஒப்புதல் கிடைத்ததும் வாங்குபவர்கள் உங்கள் பொருட்களைப் பார்க்கலாம். |
| `approval.declined` | We couldn't approve your account: {{reason}}. Contact us if you think this is a mistake. | உங்கள் கணக்கை ஒப்புக்கொள்ள முடியவில்லை: {{reason}}. இது தவறு என்று நினைத்தால் எங்களைத் தொடர்பு கொள்ளுங்கள். |

**6e. App test.** Add this to the `PostItem` group:

```js
  test('badges show the checks our team did', () => {
    renderAt(<PostItem post={{ ...post, farmerBadges: [{ type: 'phone' }, { type: 'visit', visitedOn: '2026-11-20' }] }} />, { user: BUYER });
    expect(screen.getByText(/Phone verified/)).toBeInTheDocument();
    expect(screen.getByText(/Farm visited/)).toBeInTheDocument();
  });
```

- [ ] Run the app tests and the app build. Both pass.
- [ ] Commit: `feat: Show phone and farm-visit badges, and tell new farmers they are waiting for approval`

---

### Task 7: privacy policy and terms

Design 6.16. Make these changes in `legal` in both `en.json` and `ta.json`.

**Privacy, "Who can see what": replace the administrators line.**

- English: "Our team (administrators) can see reports, listings and orders, including the buyer's and farmer's phone numbers, so they can keep the marketplace safe and call either side about an order."
- Tamil: "சந்தையைப் பாதுகாப்பாக வைத்திருக்கவும், ஆர்டர் பற்றி இரு தரப்பினரையும் அழைக்கவும், எங்கள் குழு (நிர்வாகிகள்) புகார்கள், பட்டியல்கள் மற்றும் ஆர்டர்களை, வாங்குபவர் மற்றும் விவசாயியின் தொலைபேசி எண்கள் உட்பட, பார்க்க முடியும்."

**Privacy, "Who can see what": add a line about running accounts.**

- English: "Some farmers ask our team to run their account for them. Our team then adds their products and answers their orders, and every change is saved with the team member's name."
- Tamil: "சில விவசாயிகள் தங்கள் கணக்கை நடத்தும்படி எங்கள் குழுவைக் கேட்கிறார்கள். அப்போது எங்கள் குழு அவர்களுக்காகப் பொருட்களைச் சேர்த்து ஆர்டர்களுக்குப் பதிலளிக்கும்; ஒவ்வொரு மாற்றமும் குழு உறுப்பினரின் பெயருடன் பதிவாகும்."

**Terms, "Listings": add a line about approval and badges.**

- English: "Farmers are approved by our team before buyers can see them. Badges show checks our team did, such as a phone call or a farm visit. They are not a promise about quality."
- Tamil: "வாங்குபவர்கள் பார்ப்பதற்கு முன் விவசாயிகளை எங்கள் குழு ஒப்புக்கொள்கிறது. தொலைபேசி அழைப்பு, பண்ணை வருகை போன்ற எங்கள் குழு செய்த சரிபார்ப்புகளை அடையாளங்கள் காட்டுகின்றன. அவை தரத்திற்கான உத்தரவாதம் அல்ல."

The `legal.date` stays "21 November 2026".

- [ ] Run the app build. It passes.
- [ ] Commit: `docs: Privacy and terms explain approval, badges and running accounts for farmers`

---

### Task 8: release checks for step 1

- [ ] Run the server tests, the app tests and the app build. All three pass.
- [ ] Do a manual run at 360px wide, once in Tamil. `config/default.json` points at the live database, so never run this against it: start a local or in-memory MongoDB and pass it with `mongoURI=...` in the environment, together with `ADMIN_EMAILS=<your test email>`:
  1. A farmer signs up and sees the waiting notice. A buyer can't find them. You approve them in Needs attention, and the buyer now sees their products.
  2. You add a managed farmer with the phone check and a visit date. The badges show on the farmer's cards and page.
  3. **Open as** the managed farmer. The banner shows on every screen and stays visible while scrolling.
  4. While acting, add a listing. As a buyer in another browser, send an order request. Back as the farmer, confirm it. The farmer's Activity in the console shows all three steps with your name.
  5. While acting, try the account page actions. They're refused with the Tamil message.
  6. Press Stop. You're back in the console as yourself, and the orders screen shows none of the farmer's data.
  7. Start acting again and let it run out (temporarily set `expiresIn: 60` locally). You're returned to your own account with the "time ended" message. Undo the temporary change.
  8. Mark a buyer as a test account. They now see test farmers, and a normal buyer doesn't.
- [ ] Check that the one existing listing in production, owned by an account with no role, will stop showing once deployed. This is expected (design 6.3).

### Built differently from the plan

What step 1 ended up doing where it differs from the tasks above:

- Product cards and the directory show badges as icons only (📞 🏡), with the name as the accessible label and tooltip. The farmer's page shows the full explanations.
- The acting banner is fixed at the bottom, above the tab bar: the farmer's name, a smaller "Changes are saved under your name" line, and Stop on the right. While acting, pages get extra room at the bottom (`body.is-acting`) so their last buttons can scroll clear of it.
- Banners sit above the tab bar wherever the tab bar shows (up to 900px wide), not only below 700px.
- **Open as** takes you to the farmer's dashboard.
- Resend verification refuses farmers we run ("This account has no email address"), and their Account page shows no placeholder email.
- The console's activity list has readable names for the background requests and refused actions recorded while acting: opening new orders, photo help, price suggestions, and the refused account actions.
- The manual run was scripted: headless Chrome at 360px against an in-memory database. The hour running out was checked with short-lived tokens instead of editing `expiresIn`.

### Ship step 1

When the founder says so:

1. Check that Atlas backups are on.
2. Make sure `ADMIN_EMAILS` is set on Vercel. Without it, nobody can open the console.
3. Run `git push origin revamp` and `vercel --prod`.
4. After deploying, mark your own test accounts in the Accounts tab, then add the first managed farmer.

---

## Steps 2 to 6 (outline)

Each step gets a detailed plan like step 1 when it starts. Section numbers refer to the design.

### Step 2: delivery, the buyer's pincode and phone number, handover groups and totals (6.4, 6.5, 6.14)

- **Farmer delivery settings.**
  - The farmer profile gets `delivery: { pincodes, fee, days }`.
  - Farmers set it on their profile form. The founder sets it in the console's add and edit farmer forms, or while acting.
  - Pickup is always offered.
- **Buyer details.**
  - The buyer profile gets a pincode.
  - The phone number is required for ordering. It's asked once, saved to the profile, and enforced by the server.
- **Delivery coverage.**
  - A "Delivers to me" filter on listings uses the buyer's pincode.
  - The server refuses delivery to a pincode the farmer doesn't cover.
  - Each order stores the pincode and the fee.
- **Handover groups.**
  - A group is everything one buyer sends to one farmer in one checkout.
  - The fee is charged once per group.
  - Both Orders screens show group cards with the delivery choice and the total to collect.
- **Cart.** The cart refreshes prices and stock when it opens and shows what changed.
- **No data migration.** Production has no orders yet.

### Step 3: references, promised dates, reasons, problem reports, the rest of Needs attention, the Orders tab and emails (6.6–6.10)

- **References.** Each group gets a reference such as `VM-7K3QX`.
- **Promised dates.**
  - The first confirm sets the date for the whole group. The default is the next usual day, or tomorrow, and the range is today to 14 days ahead, in India time.
  - A date change applies to the whole group, and Complete finishes the whole group.
  - A group is overdue when its date has passed with items still confirmed.
- **Reasons.** Reason lists for a farmer rejecting, a farmer cancelling and a buyer cancelling. "Other" needs a note.
- **Problem reports.** One open problem per group, with a reason list.
- **Needs attention** adds:
  - requests unanswered for 2 hours
  - overdue groups
  - open problems
- **New console tabs.** Orders and Problems, with both phone numbers visible to admins.
- **Emails to `ADMIN_EMAILS`.**
  - Sent for a new request (one per checkout), a problem report, and a farmer signing up. They contain no phone numbers.
  - They're sent before the reply, and a failure is logged but never stops the request.
  - Needs `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL` on Vercel.

### Step 4: search word list (6.11)

- A list of Tamil and English names, spellings and transliterations for common produce.
- Listing search matches any word in the same group.

### Step 5: certificates (6.12)

- A farmer (or the founder, while acting) uploads a certificate photo.
- The founder reviews it in the console. Approving it adds a `certificate` badge (the enum is extended) with its own explanation line.

### Step 6: pilot numbers (6.13)

- A console tab with these numbers per week, counting groups as requests and leaving out test accounts:
  - requests
  - confirmed and completed
  - cancellations by reason
  - time to first answer
  - repeat buyers
  - active farmers
