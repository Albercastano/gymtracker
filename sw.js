const CACHE="gymtracker-phoenix-11-alpha-build-016-apex-beta-freeze";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./favicon-32.png","./favicon-48.png","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./phoenix-master-1024.png","./core/network-gate.js","./core/sync-provider.js","./themes/material-contract.js","./themes/component-contract.js","./themes/material-engine.js","./themes/component-runtime.js","./themes/precision/manifest.json","./themes/precision/tokens.css","./themes/precision/components.css","./themes/precision/timer.css","./themes/apex/manifest.json","./themes/apex/apex.css","./js/pedb-bundle.js","./js/pedb-db.js","./js/pedb-loader.js","./data/muscles.json","./data/zones.json","./data/equipment.json","./data/patterns.json","./data/exercise_types.json","./data/families.json","./data/exercises.json","./data/relations.json","./data/manifest.json","./data/search_index.json","./data/user_relation_rules.json","./data/family_knowledge.json","./data/equipment_profiles_schema.json","./data/reason_templates.json","./data/tags.json","./data/packs.json","./data/equipment_meta.json","./data/anatomy.json","./data/functions.json","./templates/PEDB_Ejercicios_Manuales.csv","./templates/PEDB_Ejercicios_Manuales.json","./audio/phoenix-apex-ready.wav"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(!response||response.status!==200||response.type==="opaque")return response;
    const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response
  })))
});
