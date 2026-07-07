const GT={
 init(){
  load();theme();this.render();
  document.getElementById("profileModal").classList.toggle("on",!localStorage.getItem("gt7_user"));
 },
 selectUser(u){
  currentUser=u;localStorage.setItem("gt7_user",u);load();theme();this.render();document.getElementById("profileModal").classList.remove("on");
 },
 openUsers(){document.getElementById("profileModal").classList.add("on")},
 show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));
  document.getElementById(id).classList.add("on");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.nav===id));
  if(id==="data")document.getElementById("data").innerHTML=renderStats();
  if(id==="plan")document.getElementById("plan").innerHTML=renderPlan();
  if(id==="routines")this.renderRoutines();
  if(id==="settings")this.renderSettings();
 },
 render(){
  theme();
  document.getElementById("todayLabel").textContent=today();
  let meta=USERS[currentUser];
  document.getElementById("userChip").textContent=`${meta.icon} ${currentUser}`;
  this.renderHome();
  this.renderRoutines();
  if(document.getElementById("data").classList.contains("on"))document.getElementById("data").innerHTML=renderStats();
  if(document.getElementById("plan").classList.contains("on"))document.getElementById("plan").innerHTML=renderPlan();
  if(document.getElementById("settings").classList.contains("on"))this.renderSettings();
 },
 todayRoutine(){let p=S.plan[today()];if(p?.routineId)return rt(p.routineId);return S.routines[0]||null},
 renderHome(){
  let r=this.todayRoutine(),done=S.plan[today()]?.status==="done",active=getActiveWorkout();
  document.getElementById("home").innerHTML=`${active?`<div class="card resumeBanner"><h2>Entrenamiento en curso</h2><p class="muted">Se encontró una sesión sin terminar.</p><div class="row"><button class="wall primary" onclick="resumeActiveWorkout()">Continuar</button><button class="danger" onclick="discardActiveWorkout()">Descartar</button></div></div>`:""}<div class="card hero"><div class="muted">Buenos días ${currentUser}</div><h1>${done?"Hoy ya has entrenado":r?"Hoy toca":"Sin rutina"}</h1><p class="muted">${done?"Buen trabajo. Próximo: descanso o siguiente plan.":r?r.name:"Importa o crea una rutina para empezar."}</p>${r?`<div class="routinePreview">${r.items.map(i=>`<div>${ex(i.exerciseId)?.name||"Ejercicio"} · ${i.sets} series · ${i.mode==="time"?(i.repsPlan[0]+"s"):i.mode==="failure"?"fallo":(i.repsPlan[0]+" reps")}</div>`).join("")}</div><button class="wall primary bigAction" onclick="startRoutine('${r.id}')">${done?"Repetir entreno":"Comenzar"}</button>`:`<button class="wall primary" onclick="GT.show('routines')">Ir a rutinas</button>`}</div>`;
 },
 renderRoutines(){
  let el=document.getElementById("routines");if(!el)return;
  el.innerHTML=`<div class="card importBox"><div class="builderHeader"><h2>Constructor PRO</h2><span class="pill">Lab 8.0</span></div><div class="helpBox">Importa, crea y edita sin ventanas emergentes. Los cambios se guardan solos.</div><pre>Press banca 4x8 80kg descanso 180
Dominadas 4x fallo descanso 180
L-Sit 4x20s descanso 90</pre><input id="importName" placeholder="Nombre de rutina"><textarea id="importText" placeholder="Pega aquí la rutina"></textarea><div class="row"><button class="wall primary" onclick="importRoutine()">Importar rutina</button><button onclick="exampleImport()">Ejemplo</button></div></div>
  <div class="card"><h2>Nueva rutina</h2><div class="row"><input id="newRoutineName" placeholder="Nombre, ej: Torso A"><button onclick="createRoutine()">Crear</button></div></div>
  <div class="card"><h2>Mis rutinas</h2>${S.routines.map(r=>renderRoutineBuilder(r)).join("")||"<p class='muted'>No hay rutinas.</p>"}</div>`;
 },
 renderSettings(){
  let backups=backupList().slice().reverse();
  let trashR=S.trash?.routines||[],trashB=S.trash?.blocks||[];
  document.getElementById("settings").innerHTML=`<div class="card safePanel"><h2>Seguridad de datos</h2><p class="muted">Autoguardado activo. Hay backup automático diario y backups internos.</p><div class="row"><button class="wall primary" onclick="exportBackup()">Exportar JSON</button><button onclick="exportCSV()">Exportar CSV</button><button onclick="softBackup('manual');GT.render()">Crear backup interno</button></div><textarea id="restoreText" class="backupText" placeholder="Pega aquí un JSON de backup para restaurar"></textarea><button class="danger" onclick="importBackupText(document.getElementById('restoreText').value)">Restaurar JSON pegado</button></div>
  <div class="card"><h2>Ajustes</h2><div class="grid"><label>Tema<select onchange="S.settings.theme=this.value;save();GT.render()"><option value="luxury" ${S.settings.theme==='luxury'?'selected':''}>Luxury</option><option value="elegance" ${S.settings.theme==='elegance'?'selected':''}>Elegance</option><option value="carbon" ${S.settings.theme==='carbon'?'selected':''}>Carbon</option></select></label><label>Descanso<input type="number" value="${S.settings.rest||120}" onchange="S.settings.rest=+this.value;save()"></label><label>Incremento<input type="number" step=".25" value="${S.settings.inc||2.5}" onchange="S.settings.inc=+this.value;save()"></label></div></div>
  <div class="card"><h2>Backups internos</h2><div class="dataList">${backups.map(b=>`<div class="dataRow"><div><b>${b.reason}</b><br><span class="muted">${b.date}</span></div><div><button class="smallBtn" onclick="restoreBackup('${b.id}')">Restaurar</button><button class="smallBtn danger" onclick="deleteBackup('${b.id}')">Borrar</button></div></div>`).join("")||"<p class='muted'>Aún no hay backups.</p>"}</div></div>
  <div class="card"><h2>Papelera</h2><h3>Rutinas</h3><div class="dataList">${trashR.map(r=>`<div class="dataRow"><div>${r.name}<br><span class="muted">${r.deletedAt}</span></div><button onclick="S.routines.push(r);S.trash.routines=S.trash.routines.filter(x=>x.id!=='${r.id}');save();GT.render()">Restaurar</button></div>`).join("")||"<p class='muted'>Sin rutinas borradas.</p>"}</div><h3>Bloques</h3><div class="dataList">${trashB.map(b=>`<div class="dataRow"><div>${b.name}<br><span class="muted">${b.deletedAt}</span></div><button onclick="S.blocks.push(b);S.trash.blocks=S.trash.blocks.filter(x=>x.id!=='${b.id}');save();GT.render()">Restaurar</button></div>`).join("")||"<p class='muted'>Sin bloques borrados.</p>"}</div></div>`;
 }
};
window.addEventListener("load",()=>GT.init());
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
