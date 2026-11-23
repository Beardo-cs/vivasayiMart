// Crop checks and the draft stay on this phone (IndexedDB), kept apart per account.
// Where IndexedDB is unavailable they last until the page is closed.
const DB = 'vivasayi-ai';
const STORE = 'records';
const KEEP = 20;

const memory = new Map();
const memoryBackend = {
  get: async key => memory.get(key),
  put: async record => { memory.set(record.key, record); },
  del: async key => { memory.delete(key); },
  list: async prefix => [...memory.values()].filter(r => r.key.startsWith(prefix))
};

const request = (db, mode, op) => new Promise((resolve, reject) => {
  const tx = db.transaction(STORE, mode);
  const req = op(tx.objectStore(STORE));
  tx.oncomplete = () => resolve(req.result);
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error);
});

const idbBackend = db => ({
  get: key => request(db, 'readonly', s => s.get(key)),
  put: record => request(db, 'readwrite', s => s.put(record)),
  del: key => request(db, 'readwrite', s => s.delete(key)),
  list: prefix => request(db, 'readonly', s => s.getAll(IDBKeyRange.bound(prefix, `${prefix}\uffff`)))
});

const open = () => new Promise(resolve => {
  if (typeof indexedDB === 'undefined') return resolve(memoryBackend);
  try {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close(); // let logout delete the database
      resolve(idbBackend(db));
    };
    req.onerror = () => resolve(memoryBackend);
    req.onblocked = () => resolve(memoryBackend);
  } catch (e) {
    resolve(memoryBackend);
  }
});

let backend;
const store = () => backend || (backend = open());

const checkKey = (userId, id) => `${userId}:check:${id}`;
const draftKey = userId => `${userId}:draft`;

export const listChecks = async userId =>
  (await (await store()).list(`${userId}:check:`)).sort((a, b) => b.createdAt - a.createdAt);

export const getCheck = async (userId, id) => (await store()).get(checkKey(userId, id));

export const saveCheck = async (userId, check) => {
  const s = await store();
  await s.put({ ...check, key: checkKey(userId, check.id) });
  const older = (await listChecks(userId)).slice(KEEP);
  await Promise.all(older.map(c => s.del(c.key)));
};

export const deleteCheck = async (userId, id) => (await store()).del(checkKey(userId, id));

export const getDraft = async userId => (await store()).get(draftKey(userId));
export const saveDraft = async (userId, draft) => (await store()).put({ ...draft, key: draftKey(userId) });
export const clearDraft = async userId => (await store()).del(draftKey(userId));

// On logout, like the rest of what the app keeps on the phone.
export const clearAllChecks = () => {
  memory.clear();
  backend = undefined;
  try {
    if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase(DB);
  } catch (e) { /* nothing stored */ }
};
