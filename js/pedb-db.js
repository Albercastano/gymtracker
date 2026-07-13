const PEDB_DB = {
  name: "pedb_html_v1",
  version: 2,
  db: null,

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
        if (!db.objectStoreNames.contains("exercises")) {
          const s = db.createObjectStore("exercises", { keyPath: "id" });
          s.createIndex("name_es", "name_es");
          s.createIndex("muscle_id", "muscle_id");
          s.createIndex("zone_id", "zone_id");
          s.createIndex("home_suitable", "home_suitable");
        }
        if (!db.objectStoreNames.contains("relations")) {
          const s = db.createObjectStore("relations", { keyPath: "id" });
          s.createIndex("source_id", "source_id");
          s.createIndex("category", "category");
          s.createIndex("source_category", ["source_id", "category"]);
        }
        for (const store of ["muscles", "zones", "equipment", "patterns", "exercise_types", "families"]) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
        }
      };
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onerror = () => reject(request.error);
    });
  },

  tx(store, mode = "readonly") {
    return this.db.transaction(store, mode).objectStore(store);
  },

  putMany(store, items) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readwrite");
      const s = tx.objectStore(store);
      items.forEach(item => s.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getAll(store) {
    return new Promise((resolve, reject) => {
      const req = this.tx(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  clear(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readwrite");
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  deleteMany(store, keys) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readwrite");
      const s = tx.objectStore(store);
      keys.forEach(key => s.delete(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  get(store, key) {
    return new Promise((resolve, reject) => {
      const req = this.tx(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  getRelations(sourceId, category) {
    return new Promise((resolve, reject) => {
      const idx = this.tx("relations").index("source_category");
      const req = idx.getAll([sourceId, category]);
      req.onsuccess = () => resolve(req.result.sort((a,b) =>
        Number(b.recommended) - Number(a.recommended) || b.score - a.score
      ));
      req.onerror = () => reject(req.error);
    });
  }
};