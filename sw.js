// Offline cache so the sandbox works without signal once it has been opened.
const CACHE = 'sandbox-v18';
const FILES = [
  './',
  'index.html',
  'help.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'css/style.css',
  'js/castle.js',
  'js/core.js',
  'js/dig.js',
  'js/dye.js',
  'js/fan.js',
  'js/hose.js',
  'js/input.js',
  'js/keepers.js',
  'js/main.js',
  'js/motion.js',
  'js/mould.js',
  'js/particles.js',
  'js/prints.js',
  'js/rain.js',
  'js/render.js',
  'js/shovel.js',
  'js/sound.js',
  'js/stamps.js',
  'js/treasure.js',
  'js/truck.js',
  'js/ui.js',
  'js/water.js',
  'js/wave.js',
  'help/bigcastle.png',
  'help/bucket.png',
  'help/castle.png',
  'help/dye.png',
  'help/fan.png',
  'help/footprints.png',
  'help/hand.png',
  'help/hose.png',
  'help/rain.png',
  'help/shovel.png',
  'help/stamp.png',
  'help/toy-ammonite.png',
  'help/toy-bone.png',
  'help/toy-chest.png',
  'help/toy-egg.png',
  'help/toy-gem.png',
  'help/toy-longneck.png',
  'help/toy-ptero.png',
  'help/toy-stego.png',
  'help/toy-trex.png',
  'help/toy-trike.png',
  'help/truck.png',
  'help/wave.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  // network first (so updates arrive), cache as fallback
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
