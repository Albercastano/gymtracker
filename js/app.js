let lookup = {};
let searchIndex = [];

const normalize = value => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

async function init() {
  const status = document.querySelector("#status");
  try {
    const manifest = await PEDB_LOADER.install();
    const [muscles, zones, equipment, patterns, types] = await Promise.all([
      PEDB_DB.getAll("muscles"), PEDB_DB.getAll("zones"), PEDB_DB.getAll("equipment"),
      PEDB_DB.getAll("patterns"), PEDB_DB.getAll("exercise_types")
    ]);
    [muscles,zones,equipment,patterns,types].flat().forEach(x => lookup[x.id] = x.name_es);
    searchIndex = await PEDB_LOADER.json("search_index.json");
    status.textContent = `${manifest.counts.exercises} ejercicios · ${manifest.counts.relations} relaciones · offline`;
    render(searchIndex.slice(0, 30));
  } catch (error) {
    status.textContent = "Error: abre esta carpeta mediante un servidor local.";
    console.error(error);
  }
}

function render(items) {
  const list = document.querySelector("#results");
  list.innerHTML = items.map(x => `
    <button class="exercise-card" data-id="${x.i}">
      <strong>${x.n}</strong>
      <span>${x.m} · ${x.z}</span>
      <small>${x.q.join(" · ")}</small>
    </button>`).join("") || "<p>No hay resultados.</p>";
  document.querySelectorAll(".exercise-card").forEach(btn =>
    btn.addEventListener("click", () => showExercise(btn.dataset.id)));
}

async function showExercise(id) {
  const e = await PEDB_DB.get("exercises", id);
  const modal = document.querySelector("#detail");
  document.querySelector("#detail-title").textContent = e.name_es;
  document.querySelector("#detail-meta").textContent =
    `${lookup[e.muscle_id]} · ${lookup[e.zone_id]} · ${e.equipment_ids.map(i=>lookup[i]).join(", ")}`;
  for (const category of ["occupied","home","different_zone"]) {
    const relations = await PEDB_DB.getRelations(id, category);
    const target = document.querySelector(`#${category}-list`);
    const first = relations.slice(0,3);
    target.innerHTML = first.map((r, index) =>
      `<li><b>${index+1}. ${(searchIndex.find(x=>x.i===r.target_id)||{}).n || r.target_id}</b>
       <small>${r.target_zone ? "Zona: "+r.target_zone+" · " : ""}${r.confidence}</small></li>`
    ).join("") + (relations.length > 3
      ? `<li class="more">Ver más: ${relations.length - 3} alternativas adicionales</li>` : "");
  }
  modal.showModal();
}

document.querySelector("#search").addEventListener("input", event => {
  const q = normalize(event.target.value.trim());
  if (!q) return render(searchIndex.slice(0,30));
  const filtered = searchIndex.filter(x =>
    normalize([x.n,...x.s,x.m,x.z,...x.q].join(" ")).includes(q)
  );
  render(filtered.slice(0,100));
});
document.querySelector("#home-only").addEventListener("change", event => {
  render((event.target.checked ? searchIndex.filter(x=>x.h) : searchIndex).slice(0,100));
});
document.querySelector("#close-detail").addEventListener("click", () =>
  document.querySelector("#detail").close()
);

init();