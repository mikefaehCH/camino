/* Camino 2027 – Offline-Cache */
const CACHE = 'camino-v5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const put = res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };
  // Seite & Wetter & Kartenkacheln: zuerst Netz, sonst Cache
  if (url.origin === location.origin || url.hostname.endsWith('open-meteo.com') || url.hostname.endsWith('tile.openstreetmap.org')) {
    // Netz zuerst, aber nach 3 s auf den Cache ausweichen (schwacher Empfang)
    const net = fetch(req).then(put);
    const fallback = () => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    const timeout = new Promise(res => setTimeout(() => res(fallback()), 3000));
    e.respondWith(Promise.race([net.catch(fallback), timeout.then(r => r || net)]).then(r => r || Response.error()));
    return;
  }
  // Schriften & Bibliotheken: zuerst Cache
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
});
