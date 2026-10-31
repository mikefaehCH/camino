// Regression: no GitHub Pages application may delete another application's caches.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const handlers = {};
const deleted = [];
const keys = ['camino-v48', 'camino-v49', 'camino-v50', 'camino-fotos', 'zuerich-v19', 'sommer2027-v23', 'unrelated'];
const self = { addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => {} } };
const caches = { keys: async () => keys, delete: async key => { deleted.push(key); return true; } };
vm.runInNewContext(source, { self, caches, Promise, URL, setTimeout });
assert.equal(typeof handlers.activate, 'function', 'activate handler missing');
let pending;
handlers.activate({ waitUntil: promise => { pending = promise; } });
await pending;
assert.deepEqual(deleted, ['camino-v48', 'camino-v49', 'camino-v50']);
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

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
assert.ok(app.includes("window.addEventListener('hashchange',revealStageHash)"), 'Stage deep links must open on navigation');
assert.ok(app.includes('revealStageHash();'), 'Stage deep links must open on initial load');
console.log('PASS: Deep-linked chapters expand on initial load and navigation');

const todayLinks = html.slice(html.indexOf('class="today-quicklinks"'), html.indexOf('class="today-picker"'));
for (const target of ['karte','etappen','buchungen','restaurants']) {
  assert.ok(todayLinks.includes('href="#' + target + '"'), 'Missing Today quick link: ' + target);
  assert.ok(html.includes('id="' + target + '"'), 'Missing Today quick link target: ' + target);
}
console.log('PASS: Today quick links resolve to existing sections');

assert.ok(html.includes('id="connection-status"'), 'Missing connectivity status');
assert.ok(app.includes("addEventListener('offline',update)"), 'Missing offline event update');
assert.ok(app.includes("addEventListener('online',update)"), 'Missing online event update');
assert.ok(app.includes("navigator.onLine!==false"), 'Missing initial network state');
console.log('PASS: day companion connectivity indicator');

assert.ok(html.includes('id="kx-form"'), 'Expense sheet missing');
assert.ok(html.includes('id="kx-balance-amount"') && html.includes('id="kx-transfers"'), 'Balance view missing');
assert.ok(html.includes('id="kx-export-json"') && html.includes('id="kx-export-csv"'), 'Backup export missing');
assert.ok(app.includes("camino-expenses-v1") && app.includes('camino-kasse-outbox-v2'), 'Legacy import or offline queue missing');
assert.ok(app.includes('L.summarize('), 'Settlement calculation missing');
assert.ok(!html.includes('https://www.splitwise.com/'), 'External Splitwise link should not exist');
console.log('PASS: independent travel expense tracker');

assert.ok(html.includes('id="reminder-download"'), 'Calendar reminder action missing');
assert.ok(app.includes('BEGIN:VALARM'), 'Calendar reminder alarm missing');
assert.ok(app.includes('navigator.share({text})'), 'Native share missing');
assert.ok(app.includes('https://wa.me/?text='), 'WhatsApp fallback missing');
console.log('PASS: calendar and share handoff controls');

assert.ok(app.includes("if(p.start!=null)L.push('Abmarsch:"), 'Day sharing must include departure time');
assert.ok(app.includes("if(x.hl&&x.hl.length)"), 'Highlights should be guarded');
console.log('PASS: daily share text includes departure');

assert.ok(html.includes('data-kind="settlement"'), 'Repayment entry missing');
assert.ok(app.includes("kind:'settlement'"), 'Repayment entries not supported');
const ledgerSrc = fs.readFileSync(new URL('../js/ledger.js', import.meta.url), 'utf8');
assert.ok(ledgerSrc.includes('net[e.from] += chf;') && ledgerSrc.includes('net[e.to] -= chf;'), 'Repayments must affect balances');
console.log('PASS: repayment entries affect balances');

assert.ok(app.includes('openSheet(e)'), 'Expense editing action missing');
assert.ok(app.includes("onConflict:'project_id,entry_id'"), 'Expense editing must update the shared ledger');
assert.ok(app.includes('id:editing?editing.id:uid()'), 'Expense editing must preserve entry identity');
console.log('PASS: existing expenses can be edited');

const authUi = fs.readFileSync(new URL('../js/auth-ui.js', import.meta.url), 'utf8');
assert.ok(html.includes('id="expense-private"') && html.includes('id="expense-auth"'), 'Private expense login gate missing');
assert.ok(html.includes('id="expense-private"') && html.includes('hidden'), 'Private ledger must be hidden before login');
assert.ok(authUi.includes('await auth.membership()'), 'Must verify project membership');
assert.ok(authUi.includes('initPromise=window.initTravelExpenses(auth.client,auth.projectId,') && authUi.includes('await initPromise'), 'Must fetch server ledger before showing private UI');
assert.ok(app.includes("client.from('camino_ledger_entries')"), 'Shared RLS ledger missing');
console.log('PASS: member-only shared Reisekasse');

// PR #21 / 04102f3: Ausgleichsberechnung bleibt vorhanden; Saldo-UI aus #28.
assert.ok(app.includes("'kx-row kx-transfer'"), "Ausgleichszeilen fehlen");
for(const name of ["kx-entry-main","kx-entry-title","kx-entry-meta","kx-entry-amount"]) assert.ok(app.includes(name), name+" fehlt");

const {createHash}=await import('node:crypto');
const sdk=fs.readFileSync(new URL('../vendor/supabase/supabase-js-2.57.0.mjs',import.meta.url));
assert.equal(createHash('sha256').update(sdk).digest('hex'),'d5ae1d6ffd43c1a27e39ed6a731ecf94bf06ff1b357b7812d6e53869a3094173');
assert.ok(authUi.includes('../vendor/supabase/supabase-js-2.57.0.mjs'));
assert.ok(source.includes('./vendor/supabase/supabase-js-2.57.0.mjs'));
const localSdk=await import('../vendor/supabase/supabase-js-2.57.0.mjs');
assert.equal(typeof localSdk.createClient,'function');
console.log('PASS: lokaler, gepinnter Supabase-SDK mit CORE-Cache und geprüften Bytes');
