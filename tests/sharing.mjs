// Execute the production sharing functions with synthetic trip data and browser capabilities.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const source = app.slice(app.indexOf('function dayRoutes(stage)'), app.indexOf('/* ===== Wo bin ich?'));
const day = {
  d: '2027-06-12', stage: 1, title: 'Praça & São + café?', km: 12.5, up: 100, dn: 80,
  hl: ['Fluss & Brücke'], cafe: 'Café São', hotel: 'Hôtel Test', ci: '15:00',
  tel: '+351 000 000', q: 'Hôtel Test, Praça & São + café?', place: 'Test',
};
function setup({ native, clipboard, open } = {}) {
  const calls = [];
  const nodes=[];
  const previousFocus = {focus(){calls.push(['restore-focus']);}};
  const document={activeElement:previousFocus,body:{appendChild(){}},createElement(tag){const node={tag,children:[],attrs:{},listeners:{},append(...children){this.children.push(...children);},appendChild(child){this.append(child);},setAttribute(name,value){this.attrs[name]=value;},addEventListener(name,fn){this.listeners[name]=fn;},showModal(){calls.push(['dialog']);},focus(){calls.push(['focus',tag]);},select(){this.selected=true;},close(){this.listeners.close?.();},remove(){calls.push(['remove-dialog']);}};nodes.push(node);return node;}};
  const context = {
    document,
    DAYS: [day, { ...day, stage: undefined }],
    SITE_URL: 'https://example.test/camino/',
    GPX_FILES: { 1: 'routes/etappe-1.gpx', 6: 'routes/etappe-6b.gpx' },
    GPX_EXTRA: ['routes/etappe-6a.gpx'],
    URL,
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
  return { context, calls, nodes };
}

{
  const { context } = setup();
  const text = context.shareText(0);
  for (const value of ['Praça & São + café?', '12,5 km', '07:30 Uhr', 'Hôtel Test',
    '+351 000 000', 'Restaurant & Bar', '#etappe-1']) assert.ok(text.includes(value), value);
  const map = text.split('\n').find(line => line.startsWith('Karte: ')).slice(7);
  assert.equal(new URL(map).searchParams.get('query'), day.q);
  assert.ok(text.includes('GPX: https://example.test/camino/routes/etappe-1.gpx'));
  assert.ok(context.shareText(1).endsWith('#heute'), 'Travel days keep the Today landing link');
  assert.ok(!context.shareText(1).includes('GPX:'), 'Non-stage days do not get a route link');
  context.DAYS.push({ ...day, stage: 6 });
  const splitRoute = context.shareText(2);
  assert.ok(splitRoute.includes('GPX 6a: https://example.test/camino/routes/etappe-6a.gpx'));
  assert.ok(splitRoute.includes('GPX 6b: https://example.test/camino/routes/etappe-6b.gpx'));
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
  assert.ok(calls.some(c=>c[0]==='alert'&&c[1]==='Falls WhatsApp nicht geöffnet wurde: Text kopieren'));
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
  const { context, calls, nodes } = setup({ clipboard });
  await context.copyDay(0);
  assert.ok(calls.some(c => c[0] === 'dialog'));
  const field=nodes.find(n=>n.tag==='textarea');
  assert.equal(field.value,context.shareText(0));assert.equal(field.readOnly,true);assert.equal(field.selected,true);assert.ok(field.value.includes('\n'));
  assert.equal(calls.filter(c => c[0] === 'open').length, 0);
}
{
  const { context, calls } = setup({ open: () => { throw Error('Unavailable'); } });
  await context.shareDay(0);
  assert.deepEqual(calls.map(c => c[0]), ['open', 'dialog', 'focus']);
}
// A browser without Clipboard API must offer a labelled, closable manual copy dialog.
{
  const { context, calls, nodes } = setup();
  await context.copyDay(0);
  const dialog = nodes.find(n => n.tag === 'dialog');
  const heading = nodes.find(n => n.tag === 'h2');
  const label = nodes.find(n => n.tag === 'label');
  const textarea = nodes.find(n => n.tag === 'textarea');
  const close = nodes.find(n => n.tag === 'button');
  assert.equal(dialog.attrs['aria-labelledby'], heading.id);
  assert.equal(heading.textContent, 'Tagesprogramm kopieren');
  assert.ok(label.children.includes(textarea), 'Textarea must have a visible label');
  assert.equal(textarea.readOnly, true);
  assert.equal(textarea.selected, true);
  assert.equal(close.type, 'button');
  assert.equal(close.textContent, 'Schliessen');
  close.listeners.click();
  assert.deepEqual(calls.slice(-2).map(c => c[0]), ['remove-dialog', 'restore-focus'],
    'Closing restores focus to the previously active element');
}
// Browser-native sharing failure (not cancellation) must use a reversible WhatsApp handoff.
{
  const { context, calls } = setup({ native: async () => { throw { name: 'NotAllowedError' }; } });
  await context.shareDay(0);
  assert.deepEqual(calls.map(c => c[0]), ['native', 'open', 'alert']);
  assert.equal(new URL(calls[1][1]).searchParams.get('text'), context.shareText(0));
}
console.log('PASS: native share, cancellation, WhatsApp encoding, noopener, accessible manual copy and focus restoration');
