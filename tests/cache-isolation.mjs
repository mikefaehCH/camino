// Regression: no GitHub Pages application may delete another application's caches.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const handlers = {};
const deleted = [];
const keys = ['camino-v48', 'camino-v49', 'camino-fotos', 'zuerich-v19', 'sommer2027-v23', 'unrelated'];
const self = { addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => {} } };
const caches = { keys: async () => keys, delete: async key => { deleted.push(key); return true; } };
vm.runInNewContext(source, { self, caches, Promise, URL, setTimeout });
assert.equal(typeof handlers.activate, 'function', 'activate handler missing');
let pending;
handlers.activate({ waitUntil: promise => { pending = promise; } });
await pending;
assert.deepEqual(deleted, ['camino-v48']);
console.log('PASS: Camino only removes its obsolete own cache');
