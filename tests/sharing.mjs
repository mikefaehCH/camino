// Execute the production sharing functions with synthetic trip data and browser capabilities.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const source = app.slice(app.indexOf('function shareText(i)'), app.indexOf('/* ===== Wo bin ich?'));
const day = {
  d: '2027-06-12', stage: 1, title: 'Praça & São + café?', km: 12.5, up: 100, dn: 80,
  hl: ['Fluss & Brücke'], cafe: 'Café São', hotel: 'Hôtel Test', ci: '15:00',
  tel: '+351 000 000', q: 'Hôtel Test, Praça & São + café?', place: 'Test',
};
function setup({ native, clipboard, open } = {}) {
  const calls = [];
  const context = {
    DAYS: [day, { ...day, stage: undefined }],
    SITE_URL: 'https://example.test/camino/',
    dayPlan: () => ({ start: 7.5 }), fmt: date => date,
    restFor: () => ['Restaurant & Bar'], wxFor: () => null,
    navigator: {
      ...(native ? { share: async payload => { calls.push(['native', payload]); await native(); } } : {}),
      ...(clipboard ? { clipboard: { writeText: async text => { calls.push(['copy', text]); await clipboard(); } } } : {}),
    },
    window: {
      open: (...args) => { calls.push(['open', ...args]); return open?.(); },
      prompt: (...args) => { calls.push(['prompt', ...args]); return null; },
    },
    alert: text => calls.push(['alert', text]),
    encodeURIComponent,
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, calls };
}

{
  const { context } = setup();
  const text = context.shareText(0);
  for (const value of ['Praça & São + café?', '12,5 km', '07:30 Uhr', 'Hôtel Test',
    '+351 000 000', 'Restaurant & Bar', '#etappe-1']) assert.ok(text.includes(value), value);
  const map = text.split('\n').find(line => line.startsWith('Karte: ')).slice(7);
  assert.equal(new URL(map).searchParams.get('query'), day.q);
  assert.ok(context.shareText(1).endsWith('#heute'), 'Travel days keep the Today landing link');
}
{
  const { context, calls } = setup({ native: async () => {} });
  await context.shareDay(0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'native');
  assert.equal(calls[0][1].text, context.shareText(0));
}
{
  const { context, calls } = setup({ native: async () => { throw { name: 'AbortError' }; } });
  await context.shareDay(0);
  assert.deepEqual(calls.map(c => c[0]), ['native'], 'Cancellation must not launch or copy anything');
}
for (const native of [undefined, async () => { throw { name: 'NotAllowedError' }; }]) {
  const { context, calls } = setup({ native, clipboard: async () => {}, open: () => null });
  await context.shareDay(0);
  const launch = calls.find(c => c[0] === 'open');
  assert.equal(new URL(launch[1]).origin, 'https://wa.me');
  assert.equal(new URL(launch[1]).searchParams.get('text'), context.shareText(0), 'Unicode/URLs round-trip');
  assert.equal(launch[2], '_blank');
  assert.equal(launch[3], 'noopener');
  assert.equal(calls.filter(c => c[0] === 'copy').length, 0,
    'A null noopener handle must never overwrite the clipboard');
}
{
  const { context, calls } = setup({ clipboard: async () => {} });
  await context.copyDay(0);
  assert.equal(calls[0][1], context.shareText(0));
  assert.deepEqual(calls.map(c => c[0]), ['copy', 'alert']);
}
for (const clipboard of [undefined, async () => { throw { name: 'NotAllowedError' }; }]) {
  const { context, calls } = setup({ clipboard });
  await context.copyDay(0);
  assert.equal(calls.at(-1)[0], 'prompt');
  assert.equal(calls.at(-1)[2], context.shareText(0), 'Manual copy retains the complete text');
  assert.equal(calls.filter(c => c[0] === 'open').length, 0);
}
{
  const { context, calls } = setup({ open: () => { throw Error('Unavailable'); } });
  await context.shareDay(0);
  assert.deepEqual(calls.map(c => c[0]), ['open', 'prompt']);
}
console.log('PASS: native share, cancellation, WhatsApp encoding, noopener and explicit/manual copy fallbacks');
