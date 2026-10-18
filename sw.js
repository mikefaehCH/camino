/* Camino 2027 – Offline-Cache */
const CACHE = 'camino-v47';
const FOTOS = 'camino-fotos'; // vom Knopf «Fotos offline speichern», bleibt über Updates erhalten
const CORE = ['./', './index.html', './css/site.css', './js/app.js', './data/trip.js', './manifest.webmanifest', './icon.svg', './icon-192.png',
  './images/start/pilger-nebelwald-800.webp', './images/porto/porto-douro-sonnenuntergang-800.webp', './images/porto/porto-ponte-luis-blaue-stunde-800.webp',
  './images/porto/porto-ribeira-800.webp', './images/porto/porto-pasteis-de-nata-800.webp',
  './routes/etappe-1.gpx','./routes/etappe-2.gpx','./routes/etappe-3.gpx','./routes/etappe-4.gpx','./routes/etappe-5.gpx','./routes/etappe-6a.gpx','./routes/etappe-6b.gpx','./routes/etappe-7.gpx', './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css', './vendor/leaflet/images/layers.png', './vendor/leaflet/images/layers-2x.png',
  './vendor/fonts/fraunces-latin-400-normal.woff2', './vendor/fonts/fraunces-latin-500-normal.woff2', './vendor/fonts/fraunces-latin-600-normal.woff2', './vendor/fonts/fraunces-latin-400-italic.woff2',
  './vendor/fonts/dm-sans-latin-400-normal.woff2', './vendor/fonts/dm-sans-latin-500-normal.woff2', './vendor/fonts/dm-sans-latin-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const put = res => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  // Seite & Wetter & Kartenkacheln: zuerst Netz, sonst Cache
  if (url.origin === location.origin || url.hostname.endsWith('open-meteo.com') || url.hostname.endsWith('tile.openstreetmap.org')) {
    // Netz zuerst, aber nach 3 s auf den Cache ausweichen (schwacher Empfang)
    const net = (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') ? fetch(req, { cache: 'no-cache' }) : fetch(req)).then(put);
    const fallback = () => caches.match(req).then(r => r || (url.pathname.endsWith('-1600.webp') || url.pathname.endsWith('-2000.webp') ? caches.match(url.pathname.replace(/-(1600|2000)\.webp$/, '-800.webp')) : r) || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    const timeout = new Promise(res => setTimeout(() => res(fallback()), 3000));
    e.respondWith(Promise.race([net.catch(fallback), timeout.then(r => r || net)]).then(r => r || Response.error()));
    return;
  }
  // Übrige externe Dateien: zuerst Cache
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
});
