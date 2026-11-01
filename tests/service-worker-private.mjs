// Execute the real worker with isolated caches and synthetic network responses.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
function worker(responseHeaders = {}) {
  const handlers = {}, reads = [], writes = [], network = [];
  const cached = new Response('previous public version');
  const context = {
    self: { addEventListener: (name, fn) => { handlers[name] = fn; } },
    location: { origin: 'https://example.test' },
    caches: {
      match: async request => { reads.push(request.url); return cached; },
      open: async () => ({ put: async request => { writes.push(request.url); } }),
    },
    fetch: async request => { network.push(request.url); return new Response('network response', { headers: responseHeaders }); },
    URL, Response,
    // Resolve the network first; do not leave three-second timers alive in this unit test.
    setTimeout: () => 0,
  };
  vm.runInNewContext(source, context);
  async function request(url, options) {
    let intercepted = false, pending;
    handlers.fetch({ request: new Request(url, options), respondWith: value => { intercepted = true; pending = value; } });
    if (pending) await pending;
    await new Promise(resolve => setImmediate(resolve));
    return intercepted;
  }
  return { request, reads, writes, network };
}

for (const [url, options] of [
  ['https://example.test/camino/private-probe', { headers: { Authorization: 'Bearer synthetic-only' } }],
  ['https://example.test/camino/private-probe', { cache: 'no-store' }],
  ['https://fixture.supabase.co/rest/v1/test', {}],
  ['https://fixture.supabase.in/auth/v1/test', {}],
  ['https://example.test/camino/private-probe', { method: 'POST' }],
]) {
  const w = worker();
  assert.equal(await w.request(url, options), false, 'Private/no-store/backend/mutation request must bypass the worker: ' + url);
  assert.deepEqual(w.reads, [], 'Private request must not read a prior cached response');
  assert.deepEqual(w.writes, [], 'Private request must not write a cached response');
  assert.deepEqual(w.network, [], 'Bypassed request must be left to the browser network');
}
for (const policy of ['private', 'no-store', 'public, no-store', 'max-age=0, private="fixture"']) {
  const w = worker({ 'Cache-Control': policy });
  assert.equal(await w.request('https://example.test/camino/probe'), true);
  assert.equal(w.network.length, 1);
  assert.deepEqual(w.writes, [], 'Response cache policy must be respected: ' + policy);
}
{
  const w = worker({ 'Cache-Control': 'public, max-age=60' });
  assert.equal(await w.request('https://example.test/camino/app.js'), true);
  assert.equal(w.network.length, 1);
  assert.equal(w.writes.length, 1, 'Public assets must retain offline caching');
}
console.log('PASS: private/no-store/backend requests bypass caches; private responses are not stored; public assets remain cacheable');
