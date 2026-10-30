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

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const nav = html.slice(html.indexOf('<nav id="nav"'), html.indexOf('</nav>') + '</nav>'.length);
for (const [label, target] of [['Entdecken','intro'],['Etappen','reise'],['Heute','heute'],['Karte','karte'],['Genuss','restaurants'],['Infos','infos']]) {
  assert.ok(nav.includes(`href="#${target}">${label}</a>`), `Navigation missing ${label}`);
  assert.ok(html.includes(`id="${target}"`), `Navigation target missing: ${target}`);
}
console.log('PASS: Magazine and Today navigation targets exist');

const chapters = html.slice(html.indexOf('class="stage-chapters"'), html.indexOf('<!-- TAG 1 -->'));
for (let n = 1; n <= 7; n++) {
  assert.ok(chapters.includes('href="#etappe-' + n + '"'), 'Missing chapter link ' + n);
  assert.ok(html.includes('id="etappe-' + n + '"'), 'Missing stage anchor ' + n);
}
console.log('PASS: Seven stage chapter links resolve to existing cards');
