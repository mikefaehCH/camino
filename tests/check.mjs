// Camino 2027 – Prüfung nach jeder Änderung
// Aufruf:  node tests/check.mjs            (prüfen)
//          node tests/check.mjs --update   (Text-Schnappschuss neu schreiben)
// Braucht nur Node und Playwright (Chromium). Keine Abhängigkeiten im Repo.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPDATE = process.argv.includes('--update');
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) {
  try { pw = require(p); break; } catch (e) {}
}
if (!pw) { console.error('Playwright nicht gefunden (npm i -g playwright oder PLAYWRIGHT_PATH setzen).'); process.exit(2); }

const fails = [], warns = [];
const fail = m => fails.push(m), warn = m => warns.push(m);
const ok = (c, m) => { if (!c) fail(m); };

/* ---------- Statischer Server ---------- */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.gpx': 'application/gpx+xml', '.txt': 'text/plain' };
const missing = new Set();
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { missing.add(p); res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

/* ---------- 1. GPX-Dateien ---------- */
const km = (a, b, c, d) => { const R = 6371, t = Math.PI / 180, x = (c - a) * t, y = (d - b) * t;
  return 2 * R * Math.asin(Math.sqrt(Math.sin(x / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(y / 2) ** 2)); };
const gpxInfo = {};
for (const f of fs.readdirSync(path.join(ROOT, 'routes')).filter(f => f.endsWith('.gpx'))) {
  const s = fs.readFileSync(path.join(ROOT, 'routes', f), 'utf8');
  const pts = [...s.matchAll(/<trkpt lat="([-\d.]+)" lon="([-\d.]+)"/g)].map(m => [+m[1], +m[2]]);
  ok(s.includes('</gpx>') && s.trim().startsWith('<?xml'), `GPX ${f}: kein vollständiges XML`);
  ok(pts.length > 10, `GPX ${f}: zu wenige Punkte (${pts.length})`);
  ok(pts.every(([la, lo]) => la > 41 && la < 43.5 && lo > -9.5 && lo < -8), `GPX ${f}: Koordinaten ausserhalb Galicien/Nordportugal`);
  let len = 0, gap = 0;
  for (let i = 1; i < pts.length; i++) { const d = km(...pts[i - 1], ...pts[i]); len += d; gap = Math.max(gap, d); }
  ok(gap < 1, `GPX ${f}: Sprung von ${gap.toFixed(2)} km`);
  gpxInfo[f] = { len, first: pts[0], last: pts.at(-1) };
}

/* ---------- 2. Seite im Browser ---------- */
const browser = await pw.chromium.launch();
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 390, height: opts.h || 844 } });
  if (opts.date) await ctx.addInitScript(`(()=>{const T=new Date('${opts.date}').getTime();const O=Date;class D extends O{constructor(...a){super(...(a.length?a:[T]));}static now(){return T;}}window.Date=D;})()`);
  await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => { if (!/^Transition was skipped\. New ViewTransition started$/.test(e.message)) p.errs.push(e.message); });
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource|^Transition was skipped\. New ViewTransition started$/.test(m.text())) p.errs.push(m.text()); });
  await p.goto(BASE);
  await p.waitForTimeout(1500);
  return p;
}

// 2a. Daten und Konsistenz
{
  const p = await open({ date: '2026-10-18T10:00:00+02:00' });
  const d = await p.evaluate(() => ({
    days: DAYS.map(x => ({ d: x.d, stage: x.stage, km: x.km, up: x.up, dn: x.dn, hotel: x.hotel, addr: x.addr, tel: x.tel, lat: x.lat, lon: x.lon })),
    total: typeof TOTAL_KM !== 'undefined' ? TOTAL_KM : null,
    introKm: (document.querySelector('#intro .facts dd') || {}).textContent,
    gpx: GPX_FILES, extra: typeof GPX_EXTRA !== 'undefined' ? GPX_EXTRA : [],
    heads: STAGES.slice(0, 7).map(s => (s.querySelector('.skm') || {}).textContent),
    facts: [...document.querySelectorAll('.j-facts')].map(e => e.textContent),
  }));
  ok(d.days.length === 10, `DAYS: 10 Tage erwartet, ${d.days.length} gefunden`);
  const walk = d.days.filter(x => x.stage && x.stage <= 7);
  ok(walk.length === 7, 'Genau 7 Etappen erwartet');
  walk.forEach((x, i) => ok(x.d === `2027-06-${12 + i}` && x.stage === i + 1, `Etappe ${i + 1}: Datum/Nummer falsch (${x.d})`));
  d.days.forEach((x, i) => { if (i && x.d <= d.days[i - 1].d) fail(`DAYS nicht chronologisch bei ${x.d}`); });
  d.days.filter(x => x.hotel).forEach(x => {
    ok(x.addr && x.tel, `${x.d} ${x.hotel}: Adresse oder Telefon fehlt`);
    ok(x.lat > 41 && x.lat < 43.6 && x.lon > -9.5 && x.lon < -8, `${x.d} ${x.hotel}: Koordinaten unplausibel`);
  });
  walk.forEach(x => ok(x.km > 0 && x.up >= 0 && x.dn >= 0, `Etappe ${x.stage}: km/↑/↓ fehlen`));
  const sum = Math.round(walk.reduce((a, x) => a + x.km, 0) * 10) / 10;
  ok(Math.abs(sum - d.total) < 0.05, `TOTAL_KM (${d.total}) ≠ Summe der Etappen (${sum})`);
  ok(d.introKm && d.introKm.includes(String(Math.round(sum))), `Intro zeigt «${d.introKm}», Summe ist ${sum} km`);
  walk.forEach((x, i) => {
    const kmTxt = String(x.km).replace('.', ',').replace(/,0$/, '');
    ok((d.heads[i] || '').includes(kmTxt), `Etappe ${x.stage}: Kopf «${d.heads[i]}» passt nicht zu ${x.km} km`);
    ok((d.facts[i] || '').includes(kmTxt), `Etappe ${x.stage}: Reisekarte «${d.facts[i]}» passt nicht zu ${x.km} km`);
  });
  for (const [n, f] of Object.entries(d.gpx)) {
    const g = gpxInfo[path.basename(f)];
    ok(g, `GPX_FILES[${n}] → ${f} fehlt im Ordner routes/`);
    const x = walk.find(y => y.stage === +n);
    if (g && x && n !== '6') ok(Math.abs(g.len - x.km) < 0.6, `Etappe ${n}: GPX ${g.len.toFixed(1)} km ≠ Daten ${x.km} km`);
    if (g && x) { const e = km(...g.last, x.lat, x.lon); if (e > 0.3) warn(`Etappe ${n}: Track endet ${Math.round(e * 1000)} m vor dem Hotel`); }
  }
  d.extra.forEach(f => ok(gpxInfo[path.basename(f)], `GPX_EXTRA ${f} fehlt`));
  ok(p.errs.length === 0, 'Script-Fehler: ' + p.errs.join(' | '));
  await p.context().close();
}

// 2b. Breiten, Links, Bilder
for (const [w, h] of [[375, 812], [390, 844], [430, 932], [768, 1024], [1440, 900]]) {
  const p = await open({ w, h, date: '2027-06-15T08:00:00+02:00' });
  await p.evaluate(() => {
    for (let n = 1; n <= 8; n++) try { openStage(n, false); } catch (e) {}
    document.querySelectorAll('.j-item[data-extra] .j-card, .rest-city-hd, .sec.fold .fold-head').forEach(e => e.click());
  });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({
    hs: document.documentElement.scrollWidth - innerWidth,
    anchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !/[${}]/.test(h) && !document.querySelector(h)),
    broken: [...document.images].filter(i => i.src.startsWith(location.origin) && i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
  }));
  ok(r.hs <= 0, `${w}px: horizontaler Überlauf ${r.hs}px`);
  ok(r.anchors.length === 0, `${w}px: tote Sprunglinks ${r.anchors.join(',')}`);
  ok(r.broken.length === 0, `${w}px: kaputte Bilder ${r.broken.join(',')}`);
  ok(p.errs.length === 0, `${w}px: Script-Fehler ` + p.errs.join(' | '));
  if (w === 390) {
    const q = await p.evaluate(() => {
      const c = {}; document.querySelectorAll('[id]').forEach(e => c[e.id] = (c[e.id] || 0) + 1);
      const small = [...document.querySelectorAll('a,button,summary,[role=button]')].filter(e => { const b = e.getBoundingClientRect();
        return e.offsetParent && b.width > 0 && b.height < 44 && !e.closest('.leaflet-control-attribution') && getComputedStyle(e).display !== 'inline' /* Links im Fliesstext sind nach WCAG 2.5.8 ausgenommen */; })
        .map(e => e.textContent.trim().slice(0, 25));
      const hotels = STAGES.map((s, k) => { const x = SDAYS[k], n = s.querySelector('.dc-name'); return x && n && x.hotel && !n.textContent.includes(x.hotel) ? `Etappe ${k + 1}: «${n.textContent.trim()}» ≠ «${x.hotel}»` : null; }).filter(Boolean);
      return { dup: Object.keys(c).filter(k => c[k] > 1), small, hotels };
    });
    ok(q.dup.length === 0, 'Doppelte IDs: ' + q.dup.join(','));
    ok(q.small.length === 0, 'Touch-Ziele unter 44 px: ' + q.small.join(' | '));
    ok(q.hotels.length === 0, 'Hotel in Etappe ≠ DAYS: ' + q.hotels.join(' | '));
  }
  await p.context().close();
}

// 2c. Tagesansicht vor, während und nach der Reise
for (const [date, chip] of [['2026-10-18T10:00:00+02:00', 'Vorschau'], ['2027-06-16T08:00:00+02:00', 'Heute'], ['2027-06-25T10:00:00+02:00', 'Rückblick']]) {
  const p = await open({ date });
  const t = await p.evaluate(() => ({ chip: document.getElementById('heute-chip')?.textContent, title: document.querySelector('#today-card .tc-title')?.textContent, img: !!document.querySelector('#today-card img') }));
  ok(t.chip === chip, `Tagesansicht ${date}: «${t.chip}» statt «${chip}»`);
  ok(t.title && t.img, `Tagesansicht ${date}: Titel oder Bild fehlt`);
  await p.context().close();
}

// 2d. Offline (Service Worker)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
  const p = await ctx.newPage();
  await p.goto(BASE);
  const sw = await p.evaluate(() => navigator.serviceWorker.register('sw.js').then(() => Promise.race([navigator.serviceWorker.ready.then(() => 'ok'), new Promise(r => setTimeout(() => r('timeout'), 10000))])).catch(e => 'Fehler: ' + e.message));
  ok(sw === 'ok', 'Service Worker: ' + sw);
  await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(1000);
  const foto = await p.evaluate(async () => { const b = [...document.querySelectorAll('#offline-tip .btn')][0]; if (!b) return null; b.click();
    for (let i = 0; i < 100 && !b.disabled; i++) await new Promise(r => setTimeout(r, 50));
    for (let i = 0; i < 200 && !/gespeichert$/.test(b.textContent.trim()); i++) await new Promise(r => setTimeout(r, 100));
    return { txt: b.textContent.trim(), src: Object.values(IMAGE_MAP.chapters).map(c => c.hero).find(g => g && g.src)?.src }; });
  ok(foto && /offline gespeichert/.test(foto.txt), 'Fotos offline speichern: ' + (foto && foto.txt));
  await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
  if (foto && foto.src) { const st = await p.evaluate(s => fetch(s).then(r => r.status).catch(() => 0), foto.src); ok(st === 200, 'Offline: gespeichertes Foto fehlt'); }
  const o = await p.evaluate(async () => ({ title: document.querySelector('#today-card .tc-title')?.textContent, gpx: (await fetch('routes/etappe-7.gpx').then(r => r.status).catch(() => 0)) }));
  ok(o.title, 'Offline: Tagesansicht fehlt');
  ok(o.gpx === 200, 'Offline: GPX nicht im Cache');
  await ctx.close();
}

// 2e. Text-Schnappschuss (erkennt ungewollte Inhaltsänderungen)
{
  const p = await open({ date: '2027-06-16T08:00:00+02:00' });
  await p.evaluate(() => { for (let n = 1; n <= 8; n++) try { openStage(n, false); } catch (e) {}
    document.querySelectorAll('details').forEach(d => d.open = true);
    document.querySelectorAll('.j-item[data-extra] .j-card, .rest-city-hd, .sec.fold .fold-head').forEach(e => e.click()); });
  await p.waitForTimeout(800);
  const snap = await p.evaluate(() => ['#heute', '#reise', '#buchungen', '#restaurants', '#infos', '#compostela', '#wetter']
    .map(id => `### ${id}\n` + (document.querySelector(id)?.innerText || '(fehlt)').replace(/Stand \d+\.\d+\. \d+:\d+/g, 'Stand X').replace(/\n{2,}/g, '\n')).join('\n'));
  const f = path.join(ROOT, 'tests', 'snapshot.txt');
  if (UPDATE || !fs.existsSync(f)) { fs.writeFileSync(f, snap); console.log('Schnappschuss geschrieben: tests/snapshot.txt'); }
  else if (fs.readFileSync(f, 'utf8') !== snap) {
    const a = fs.readFileSync(f, 'utf8').split('\n'), b = snap.split('\n');
    const diff = b.filter(l => !a.includes(l)).slice(0, 8), gone = a.filter(l => !b.includes(l)).slice(0, 8);
    warn('Text hat sich geändert (gewollt? dann --update):\n   + ' + diff.join('\n   + ') + '\n   - ' + gone.join('\n   - '));
  }
  await p.context().close();
}

await browser.close();
server.close();
if (missing.size) [...missing].filter(m => !/favicon|robots/.test(m)).forEach(m => fail('Datei fehlt (404): ' + m));
warns.forEach(w => console.log('Hinweis: ' + w));
if (fails.length) { fails.forEach(f => console.log('FEHLER: ' + f)); console.log(`\n${fails.length} Fehler`); process.exit(1); }
console.log('\nAlles in Ordnung.');
