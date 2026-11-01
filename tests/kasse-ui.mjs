// Reisekasse 2.0 im echten Browser mit gemocktem Supabase-Client (keine Live-Datenbank, nur Testdaten).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) { try { pw = require(p); break; } catch {} }
if (!pw) { console.error('Playwright nicht gefunden'); process.exit(2); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.gpx': 'application/gpx+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const engineName = process.env.TEST_BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(engineName)) throw new Error('Unbekannter Testbrowser: ' + engineName);
const browser = await pw[engineName].launch();

const MOCK = `(()=>{
  window.__rows=[];window.__fail=false;window.__dialogs=0;
  window.confirm=()=>{window.__dialogs++;return false;};window.prompt=()=>{window.__dialogs++;return null;};window.alert=()=>{window.__dialogs++;};
  const err=()=>({data:null,error:new Error('offline')});
  function builder(name){
    const st={f:{},ids:null};
    const run=()=>{if(window.__fail)return err();
      if(name==='project_members')return {data:[{display_name:'Mike'},{display_name:'Ante'},{display_name:'Kevin'},{display_name:'Luis'}],error:null};
      let rows=window.__rows.filter(r=>r.project_id===st.f.project_id);if(st.ids)rows=rows.filter(r=>st.ids.includes(r.entry_id));
      return {data:rows.map(r=>({...r,payload:JSON.parse(JSON.stringify(r.payload))})),error:null};};
    const b={select(){return b;},eq(k,v){st.f[k]=v;return b;},in(k,v){st.ids=v;return b;},order(){return b;},
      async limit(){return run();},then(res,rej){return Promise.resolve(run()).then(res,rej);},
      async upsert(rows,opts){if(window.__fail)return {error:new Error('offline')};for(const r of [].concat(rows)){const i=window.__rows.findIndex(x=>x.project_id===r.project_id&&x.entry_id===r.entry_id);if(i>=0){if(!(opts&&opts.ignoreDuplicates))window.__rows[i]={...window.__rows[i],...r};}else window.__rows.push({...r});}return {error:null};}};
    return b;}
  window.__client={from:builder};
})()`;

async function page(legacy) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Zurich' });
  await ctx.route('**/*', (r) => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
  await ctx.addInitScript(MOCK);
  if (legacy) await ctx.addInitScript(`localStorage.setItem('camino-expenses-v1',${JSON.stringify(JSON.stringify(legacy))})`);
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto(BASE + 'index.html');
  await p.waitForFunction(() => document.getElementById('expense-auth-status').textContent === '');
  await p.evaluate(async () => {
    await window.initTravelExpenses(window.__client, 'proj', { name: 'Mike', email: 'mike@example.test', userId: 'u1' });
    document.getElementById('expense-auth').hidden = true;
    document.getElementById('expense-private').hidden = false;
    document.getElementById('kosten').scrollIntoView();
  });
  return p;
}
const text = (p, sel) => p.locator(sel).first().innerText();
const rows = (p) => p.evaluate(() => window.__rows.map((r) => r.payload));

// ---------- Hauptablauf ----------
{
  const p = await page();
  assert.match(await text(p, '#kx-balance-label'), /ausgeglichen/);
  const emptyHeight = await p.locator('#expense-private').evaluate((e) => e.getBoundingClientRect().height);
  assert.ok(emptyHeight <= 1300, 'Kasse ohne Ausgaben zu lang: ' + Math.round(emptyHeight) + ' px');

  // Reisekurs
  await p.locator('#kx-more summary').click();
  await p.fill('#kx-rate', '0,94');
  await p.locator('#kx-rate-form button').click();
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.kind === 'settings'));
  assert.equal((await rows(p)).find((r) => r.kind === 'settings').chf_per_eur, 0.94);

  // Ausgabe in CHF erfassen
  await p.click('#kx-add');
  assert.ok(await p.locator('#kx-sheet').evaluate((d) => d.open));
  assert.equal(await p.locator('#kx-charge').isDisabled(), true, 'Inaktives Belastungsdatum darf die Formularvalidierung nicht blockieren');
  await p.fill('#kx-amount', '509');
  await p.locator('#kx-currency [data-cur="CHF"]').click();
  await p.fill('#kx-desc', 'Pazo Santa Teresa');
  await p.locator('#kx-cat .kx-chip', { hasText: 'Unterkunft' }).click();
  await p.click('#kx-save');
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.description === 'Pazo Santa Teresa'));
  assert.match(await text(p, '#kx-balance-label'), /du bekommst/);
  assert.equal(await text(p, '#kx-balance-amount'), '381.75 CHF');

  // Ausgabe in EUR von Ante
  await p.click('#kx-add');
  await p.fill('#kx-amount', '84,00');
  await p.fill('#kx-desc', 'Abendessen');
  await p.locator('#kx-payer .kx-chip', { hasText: 'Ante' }).click();
  await p.click('#kx-save');
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.description === 'Abendessen'));
  assert.ok((await text(p, '#kx-days')).includes('≈ 78.96 CHF'));
  const abend = (await rows(p)).find((r) => r.description === 'Abendessen');
  assert.equal(abend.rate_used, 0.94);
  assert.equal(abend.updated_by, 'Mike');

  // Validierung ohne Browser-Dialog
  await p.click('#kx-add');
  await p.fill('#kx-amount', 'abc');
  await p.click('#kx-save');
  assert.match(await text(p, '#kx-form-error'), /gültigen Betrag/);
  await p.click('#kx-cancel');

  // Ausgleich: Bezahlt + Rückgängig
  const before = (await p.locator('#kx-transfers .kx-transfer').count());
  assert.ok(before >= 2);
  await p.locator('#kx-transfers .kx-transfer button').first().click();
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.kind === 'settlement'));
  assert.equal(await p.locator('#kx-transfers .kx-transfer').count(), before - 1);
  assert.equal(await p.locator('#kx-toast').isVisible(), true);
  await p.click('#kx-toast-undo');
  await p.waitForFunction(() => window.__rows.find((r) => r.payload.kind === 'settlement').payload.deleted_at);
  assert.equal(await p.locator('#kx-transfers .kx-transfer').count(), before);

  // Bearbeiten
  await p.locator('#kx-days .kx-entry', { hasText: 'Abendessen' }).click();
  assert.equal(await p.inputValue('#kx-amount'), '84.00');
  await p.fill('#kx-amount', '90');
  await p.click('#kx-save');
  await p.waitForFunction(() => window.__rows.find((r) => r.payload.description === 'Abendessen').payload.cents === 9000);

  // Löschen mit Bestätigung im Blatt, dann Rückgängig
  await p.locator('#kx-days .kx-entry', { hasText: 'Abendessen' }).click();
  await p.click('#kx-delete');
  assert.equal(await text(p, '#kx-delete'), 'Wirklich löschen?');
  await p.click('#kx-delete');
  await p.waitForFunction(() => window.__rows.find((r) => r.payload.description === 'Abendessen').payload.deleted_at);
  assert.equal(await p.locator('#kx-days .kx-entry', { hasText: 'Abendessen' }).count(), 0);
  await p.click('#kx-toast-undo');
  await p.waitForFunction(() => !window.__rows.find((r) => r.payload.description === 'Abendessen').payload.deleted_at);

  // Offener Posten ohne Betrag
  await p.locator('#kx-open .kx-chip', { hasText: 'Translatio-Boot' }).click();
  assert.equal(await p.locator('#kx-status [data-status="offen"]').getAttribute('aria-pressed'), 'true');
  await p.click('#kx-save');
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.status === 'offen'));
  assert.ok((await text(p, '#kx-open')).includes('Betrag fehlt'));


  // Vorgemerkt: zählt nicht im Ausgleich, bis «Abrechnen»
  const balanceBefore = await text(p, '#kx-balance-amount');
  await p.click('#kx-add');
  await p.fill('#kx-amount', '400');
  await p.locator('#kx-currency [data-cur="CHF"]').click();
  await p.fill('#kx-desc', 'Parador Test');
  await p.locator('#kx-status [data-status="vorgemerkt"]').click();
  assert.equal(await p.locator('#kx-charge-field').isVisible(), true);
  assert.equal(await p.locator('#kx-charge').isEnabled(), true, 'Vorgemerkte Buchungen müssen das optionale Belastungsdatum verwenden können');
  await p.fill('#kx-charge', '2026-01-01');
  await p.click('#kx-save');
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.description === 'Parador Test'));
  assert.equal(await text(p, '#kx-balance-amount'), balanceBefore, 'Vorgemerktes darf den Stand nicht ändern');
  assert.match(await text(p, '#kx-planned'), /400\.00 CHF vorgemerkt/);
  assert.match(await text(p, '#kx-open'), /fällig seit/);
  await p.locator('#kx-open .kx-pending', { hasText: 'Parador Test' }).locator('button', { hasText: 'Abrechnen' }).click();
  await p.waitForFunction(() => window.__rows.find((r) => r.payload.description === 'Parador Test').payload.status === 'bezahlt');
  assert.notEqual(await text(p, '#kx-balance-amount'), balanceBefore);
  assert.ok((await text(p, '#kx-days')).includes('Parador Test'));
  await p.click('#kx-toast-undo');
  await p.waitForFunction(() => window.__rows.find((r) => r.payload.description === 'Parador Test').payload.status === 'vorgemerkt');
  assert.equal(await text(p, '#kx-balance-amount'), balanceBefore);

  // Unterkünfte aus dem Reiseplan gesammelt erfassen
  await p.locator('#kx-open .kx-chip', { hasText: 'Unterkünfte erfassen' }).click();
  const hotelInputs = p.locator('#kx-hotels .kx-hotel-amount');
  assert.ok((await hotelInputs.count()) >= 5);
  await hotelInputs.nth(0).fill('656,20');
  await hotelInputs.nth(1).fill('369');
  await p.click('#kx-hotels-save');
  await p.waitForFunction(() => window.__rows.filter((r) => r.payload.category === 'unterkunft' && r.payload.status === 'vorgemerkt').length >= 2);
  const hotelRows = (await rows(p)).filter((r) => r.category === 'unterkunft' && r.status === 'vorgemerkt' && r.description !== 'Parador Test');
  assert.equal(hotelRows.length, 2);
  assert.ok(hotelRows.every((r) => r.spent_on && r.members.length === 4 && r.payer === 'Mike'));
  assert.equal(await text(p, '#kx-balance-amount'), balanceBefore, 'Sammel-Erfassung als vorgemerkt ändert den Stand nicht');

  // Offline erfassen, später hochladen
  // Stored rows can be visible before the previous flush has finished rendering.
  await p.waitForFunction(() => document.getElementById('kx-sync').textContent === '');
  await p.evaluate(() => { window.__fail = true; });
  await p.click('#kx-add');
  await p.fill('#kx-amount', '12');
  await p.fill('#kx-desc', 'Kaffee');
  await p.click('#kx-save');
  try {
    await p.waitForFunction(() => /wartet auf Verbindung/.test(document.getElementById('kx-sync').textContent));
  } catch (error) {
    console.error('Synthetic offline fixture state:', await p.evaluate(() => ({
      sync: document.getElementById('kx-sync').textContent,
      formError: document.getElementById('kx-form-error').textContent,
      open: document.getElementById('kx-sheet').open,
      invalid: [...document.querySelectorAll('#kx-form input:invalid')].map(e => ({ id: e.id, value: e.value, reason: e.validationMessage })),
      pending: Object.keys(localStorage).filter(k => k.startsWith('camino-kasse-outbox-v2:')).map(k => JSON.parse(localStorage.getItem(k)).length),
      saved: window.__rows.some(r => r.payload.description === 'Kaffee'),
    })));
    throw error;
  }
  assert.ok((await text(p, '#kx-days')).includes('wartet auf Verbindung'));
  await p.evaluate(() => { window.__fail = false; window.dispatchEvent(new Event('online')); });
  await p.waitForFunction(() => window.__rows.some((r) => r.payload.description === 'Kaffee'));
  await p.waitForFunction(() => document.getElementById('kx-sync').textContent === '');

  // Kategorien, Heute-Zeile, Touch-Ziele, keine Browser-Dialoge
  assert.ok((await text(p, '#kx-cats')).includes('Unterkunft'));
  assert.match(await text(p, '#kx-today'), /^Kasse: (du bekommst|1 Buchung fällig zum Abrechnen)/);
  const small = await p.evaluate(() => [...document.querySelectorAll('#kosten a, #kosten button, #kosten summary')].filter((e) => { const b = e.getBoundingClientRect(); return e.offsetParent && b.width > 0 && b.height < 44; }).map((e) => e.textContent.trim().slice(0, 25)));
  assert.deepEqual(small, [], 'Touch-Ziele unter 44 px in der Kasse');
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 0), true, 'Horizontaler Überlauf');
  assert.equal(await p.evaluate(() => window.__dialogs), 0, 'Browser-Dialoge verwendet');
  await p.locator('#kosten').screenshot({ path: '/tmp/camino-kasse-390.png' });
  await p.click('#kx-add');
  await p.screenshot({ path: '/tmp/camino-kasse-sheet-390.png' });
  assert.deepEqual(p.errs, []);
  await p.context().close();
}

// ---------- Übernahme alter lokaler Einträge (nur mit Zustimmung im Layout) ----------
{
  const legacy = [{ id: 'legacy-1', description: 'Test', cents: 100, currency: 'EUR', payer: 'Mike', members: ['Mike'] }];
  const p = await page(legacy);
  assert.equal(await p.locator('#kx-migrate').isVisible(), true);
  await p.evaluate(() => { window.__fail = true; });
  await p.locator('#kx-migrate button', { hasText: 'Übernehmen' }).click();
  assert.ok(await p.evaluate(() => localStorage.getItem('camino-expenses-v1')), 'Fehlgeschlagene Übernahme darf lokale Daten nicht löschen');
  await p.evaluate(() => { window.__fail = false; });
  await p.locator('#kx-migrate button', { hasText: 'Übernehmen' }).click();
  await p.waitForFunction(() => window.__rows.some((r) => r.entry_id === 'legacy-1'));
  assert.equal(await p.evaluate(() => localStorage.getItem('camino-expenses-v1')), null);
  assert.equal(await p.evaluate(() => window.__dialogs), 0);
  await p.context().close();
}
{
  const p = await page();
  assert.equal(await p.locator('#kx-migrate').isVisible(), false);
  assert.equal((await rows(p)).length, 0, 'Keine Seed-Daten');
  await p.context().close();
}

await browser.close();
server.close();
console.log('PASS: Reisekasse 2.0 (Erfassen, CHF-Ausgleich, Bezahlt/Rückgängig, Bearbeiten, Löschen, offene/vorgemerkte Posten, Abrechnen, Unterkünfte gesammelt, Offline-Warteschlange, Übernahme, keine Browser-Dialoge, 44-px-Ziele)');
