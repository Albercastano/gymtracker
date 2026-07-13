const CACHE="gymtracker-phoenix-lab-9-8-0-pedb";
const ASSETS=["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icon.svg", "./favicon-32.png", "./favicon-48.png", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./js/pedb-db.js", "./js/pedb-loader.js", "./data/muscles.json", "./data/zones.json", "./data/equipment.json", "./data/patterns.json", "./data/exercise_types.json", "./data/exercises.json", "./data/relations.json", "./data/manifest.json", "./data/search_index.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
