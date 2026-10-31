// Offline cache + update prompt. CI stamps VERSION on every deploy, which
// changes this file, so phones install the new version in the background and
// the game shows an "update" banner instead of switching mid-fight.
const VERSION = '__VERSION__';
const CACHE = 'pf-' + VERSION;
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('message', (e) => {
  if (e.data === 'update') self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname === '/health') return;
  const key = req.mode === 'navigate' ? './' : url.pathname;
  // the page, code and pictures: always try the network first so a new deploy shows up right away;
  // the cached copy is only used offline. Big audio files stay cache-first.
  if (!/\.mp3$/.test(url.pathname)) {
    e.respondWith(
      fetch(req.mode === 'navigate' ? req : new Request(url.href, { cache: 'no-cache' }))
        .then((res) => { if (res.ok && res.status === 200) { const c = res.clone(); caches.open(CACHE).then((cache) => cache.put(key, c)); } return res; })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(key)))
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(key);
      if (hit) return hit;
      // audio asks for byte ranges; fetch and keep the whole file instead
      const res = await fetch(req.mode === 'navigate' ? req : new Request(url.href, { cache: 'reload' }));
      if (res.ok && res.status === 200) cache.put(key, res.clone());
      return res;
    })
  );
});
