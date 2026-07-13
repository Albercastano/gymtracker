const PEDB_LOADER = {
  base: "./data/",
  async json(file) {
    if (window.PEDB_BUNDLE && Object.prototype.hasOwnProperty.call(window.PEDB_BUNDLE, file)) {
      return window.PEDB_BUNDLE[file];
    }
    const response = await fetch(this.base + file);
    if (!response.ok) throw new Error(`No se pudo cargar ${file}`);
    return response.json();
  },
  expandRelation(row) {
    if (row.source_id) return row;
    const confidenceMap = {h:"high",m:"medium",l:"low"};
    return {
      id: row.i,
      source_id: row.s,
      target_id: row.t,
      category: row.c,
      recommended: Boolean(row.r),
      score: Number(row.p || 0),
      confidence: confidenceMap[row.f] || row.f || "medium",
      reason: "relación compacta PEDB"
    };
  },
  async install() {
    await PEDB_DB.open();
    const manifest = await this.json("manifest.json");
    const installed = await PEDB_DB.get("meta", "version");
    if (installed?.value === manifest.version) return manifest;

    const existingExercises = await PEDB_DB.getAll("exercises");
    const existingRelations = await PEDB_DB.getAll("relations");
    const personalExercises = existingExercises.filter(x => String(x.id || "").startsWith("USR-EX-"));
    const personalIds = new Set(personalExercises.map(x => x.id));
    const personalRelations = existingRelations.filter(x =>
      String(x.id || "").startsWith("URR-") || personalIds.has(x.source_id) || personalIds.has(x.target_id)
    );

    const catalogs = ["exercises","relations","muscles","zones","equipment","patterns","exercise_types","families"];
    for (const store of catalogs) await PEDB_DB.clear(store);

    const fileMap = {
      exercises: "exercises.json",
      relations: "relations.json",
      muscles: "muscles.json",
      zones: "zones.json",
      equipment: "equipment.json",
      patterns: "patterns.json",
      exercise_types: "exercise_types.json",
      families: "families.json"
    };
    for (const [store, file] of Object.entries(fileMap)) {
      let rows = await this.json(file);
      if (store === "relations") rows = rows.map(row => this.expandRelation(row));
      await PEDB_DB.putMany(store, rows);
    }
    if (personalExercises.length) await PEDB_DB.putMany("exercises", personalExercises);
    if (personalRelations.length) await PEDB_DB.putMany("relations", personalRelations);

    await PEDB_DB.putMany("meta", [
      {key:"version", value:manifest.version},
      {key:"manifest", value:manifest}
    ]);
    return manifest;
  }
};
