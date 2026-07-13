const PEDB_LOADER = {
  base: "./data/",
  async json(file) {
    const response = await fetch(this.base + file);
    if (!response.ok) throw new Error(`No se pudo cargar ${file}`);
    return response.json();
  },
  async install() {
    await PEDB_DB.open();
    const manifest = await this.json("manifest.json");
    const installed = await PEDB_DB.get("meta", "version");
    if (installed?.value === manifest.version) return manifest;

    const fileMap = {
      exercises: "exercises.json",
      relations: "relations.json",
      muscles: "muscles.json",
      zones: "zones.json",
      equipment: "equipment.json",
      patterns: "patterns.json",
      exercise_types: "exercise_types.json"
    };
    for (const [store, file] of Object.entries(fileMap)) {
      await PEDB_DB.putMany(store, await this.json(file));
    }
    await PEDB_DB.putMany("meta", [
      {key:"version", value:manifest.version},
      {key:"manifest", value:manifest}
    ]);
    return manifest;
  }
};