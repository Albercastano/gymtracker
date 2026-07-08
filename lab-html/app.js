const GT={
 init(){
  load();theme();this.render();
  document.getElementById("profileModal").classList.toggle("on",!localStorage.getItem("gt7_user"));document.getElementById("splash")?.classList.toggle("hide",!!localStorage.getItem("gt92_splash_seen"));
 },
 selectUser(u){
  currentUser=u;localStorage.setItem("gt7_user",u);load();theme();this.render();document.getElementById("profileModal").classList.remove("on");
 },
 openUsers(){document.getElementById("profileModal").classList.add("on")},
 closeSplash(){localStorage.setItem("gt92_splash_seen","1");document.getElementById("splash")?.classList.add("hide")},
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
 todayRoutine(){let p=S.plan[today()];if(p?.routineId)return rt(p.routineId);let d=new Date().getDay();let map=["sun","mon","tue","wed","thu","fri","sat"];let rid=S.weekPlan?.[map[d]];if(rid)return rt(rid);return S.routines[0]||null},
 renderHome(){
  let r=this.todayRoutine(),done=S.plan[today()]?.status==="done",active=getActiveWorkout();
  document.getElementById("home").innerHTML=`${active?`<div class="card resumeBanner"><h2>Entrenamiento en curso</h2><p class="muted">Se encontró una sesión sin terminar.</p><div class="row"><button class="wall primary" onclick="resumeActiveWorkout()">Continuar</button><button class="danger" onclick="discardActiveWorkout()">Descartar</button></div></div>`:""}<div class="card profileCard"><h2>Peso corporal</h2><div class="weightBig">${S.profile?.bodyWeight||"—"} <small>kg</small></div><p class="muted">Objetivo: ${S.profile?.targetWeight||"—"} kg · Último: ${(S.weights||[]).at(-1)?.date||"sin datos"}</p><button class="wall primary" onclick="addWeight()">Actualizar peso</button></div><div class="card hero"><div class="muted">Buenos días ${currentUser}</div><h1>${done?"Hoy ya has entrenado":r?"Hoy toca":"Sin rutina"}</h1><p class="muted">${done?"Buen trabajo. Próximo: descanso o siguiente plan.":r?r.name:"Importa o crea una rutina para empezar."}</p>${r?`<div class="routinePreview">${r.items.map(i=>`<div>${ex(i.exerciseId)?.name||"Ejercicio"} · ${i.sets} series · ${i.mode==="time"?(i.repsPlan[0]+"s"):i.mode==="failure"?"fallo":(i.repsPlan[0]+" reps")}</div>`).join("")}</div><button class="wall primary bigAction" onclick="startRoutine('${r.id}')">${done?"Repetir entreno":"Comenzar"}</button>`:`<button class="wall primary" onclick="GT.show('routines')">Ir a rutinas</button>`}</div>`;
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
  let backups=backupList().slice().reverse();let trashR=S.trash?.routines||[],trashB=S.trash?.blocks||[];let weights=S.weights||[];let maxW=Math.max(1,...weights.map(x=>+x.weight||0));let weightChart=weights.slice(-12).map(w=>`<div class="bodyBar" style="height:${Math.max(5,(+w.weight||0)/maxW*110)}px" title="${w.date}: ${w.weight}kg"></div>`).join("");
  document.getElementById("settings").innerHTML=`<div class="card profileCard"><h2>Perfil</h2><div class="profileGrid"><label>Nombre<input value="${S.profile?.name||currentUser}" onchange="S.profile.name=this.value;save();GT.render()"></label><label>Peso actual<input type="number" step=".1" value="${S.profile?.bodyWeight||""}" onchange="S.profile.bodyWeight=+this.value;S.weights.push({date:today(),weight:+this.value});save();GT.render()"></label><label>Peso objetivo<input type="number" step=".1" value="${S.profile?.targetWeight||""}" onchange="S.profile.targetWeight=+this.value;save()"></label><label>Altura cm<input type="number" value="${S.profile?.height||""}" onchange="S.profile.height=+this.value;save()"></label><label>Fecha nacimiento<input type="date" value="${S.profile?.birthDate||""}" onchange="S.profile.birthDate=this.value;save()"></label><label>Sexo<select onchange="S.profile.sex=this.value;save()"><option value="" ${!S.profile?.sex?"selected":""}>No indicar</option><option value="M" ${S.profile?.sex==="M"?"selected":""}>Masculino</option><option value="F" ${S.profile?.sex==="F"?"selected":""}>Femenino</option></select></label></div><h3>Peso corporal</h3><div class="bodyChart">${weightChart||""}</div><button onclick="addWeight()">Registrar peso ahora</button></div>
  <div class="card"><h2>Configuración PRO</h2><div class="profileGrid"><label>Tema<select onchange="S.settings.theme=this.value;save();GT.render()"><option value="luxury" ${S.settings.theme==='luxury'?'selected':''}>Luxury</option><option value="elegance" ${S.settings.theme==='elegance'?'selected':''}>Elegance</option><option value="carbon" ${S.settings.theme==='carbon'?'selected':''}>Carbon</option></select></label><label>Descanso<input type="number" value="${S.settings.rest||120}" onchange="S.settings.rest=+this.value;save()"></label><label>Incremento<input type="number" step=".25" value="${S.settings.inc||2.5}" onchange="S.settings.inc=+this.value;save()"></label><label>Sonido<select onchange="S.settings.sound=this.value==='true';save()"><option value="false" ${!S.settings.sound?"selected":""}>No</option><option value="true" ${S.settings.sound?"selected":""}>Sí</option></select></label><label>Vibración<select onchange="S.settings.vibration=this.value==='true';save()"><option value="false" ${!S.settings.vibration?"selected":""}>No</option><option value="true" ${S.settings.vibration?"selected":""}>Sí</option></select></label></div></div>
  <div class="card"><h2>Ejercicios: pesos por defecto</h2>${S.exercises.map(e=>`<div class="exerciseConfigCard"><div class="exerciseConfigGrid"><strong>${e.name}</strong><label>Peso<input type="number" step=".25" value="${e.defaultWeight||0}" onchange="updateExerciseDefault('${e.id}','defaultWeight',this.value)"></label><label>Último<input type="number" step=".25" value="${e.lastWeight||0}" onchange="updateExerciseDefault('${e.id}','lastWeight',this.value)"></label><label>Inc.<input type="number" step=".25" value="${e.inc||S.settings.inc||2.5}" onchange="updateExerciseDefault('${e.id}','inc',this.value)"></label></div><textarea class="noteArea" placeholder="Notas técnicas permanentes" onchange="updateExerciseDefault('${e.id}','techNotes',this.value)">${e.techNotes||""}</textarea></div>`).join("")||"<p class='muted'>Crea ejercicios desde Rutinas.</p>"}</div>
  <div class="card safePanel"><h2>Seguridad de datos</h2><p class="muted">Backup diario, post-entreno y manual.</p><div class="row"><button class="wall primary" onclick="exportBackup()">Exportar JSON</button><button onclick="exportCSV()">Exportar CSV</button><button onclick="exportExcel()">Exportar Excel</button><button onclick="softBackup('manual');GT.render()">Crear backup interno</button></div><textarea id="restoreText" class="backupText" placeholder="Pega aquí un JSON de backup"></textarea><button class="danger" onclick="importBackupText(document.getElementById('restoreText').value)">Restaurar JSON pegado</button><div class="exportHint">Excel se descarga como .xls compatible con Excel/Google Sheets.</div></div>
  <div class="card"><h2>Backups internos</h2><div class="dataList">${backups.map(b=>`<div class="dataRow"><div><b>${b.reason}</b><br><span class="muted">${b.date}</span></div><div><button class="smallBtn" onclick="restoreBackup('${b.id}')">Restaurar</button><button class="smallBtn danger" onclick="deleteBackup('${b.id}')">Borrar</button></div></div>`).join("")||"<p class='muted'>Aún no hay backups.</p>"}</div></div>
  <div class="card"><h2>Papelera</h2><h3>Rutinas</h3><div class="dataList">${trashR.map(r=>`<div class="dataRow"><div>${r.name}<br><span class="muted">${r.deletedAt}</span></div><button onclick="S.routines.push(r);S.trash.routines=S.trash.routines.filter(x=>x.id!=='${r.id}');save();GT.render()">Restaurar</button></div>`).join("")||"<p class='muted'>Sin rutinas borradas.</p>"}</div><h3>Bloques</h3><div class="dataList">${trashB.map(b=>`<div class="dataRow"><div>${b.name}<br><span class="muted">${b.deletedAt}</span></div><button onclick="S.blocks.push(b);S.trash.blocks=S.trash.blocks.filter(x=>x.id!=='${b.id}');save();GT.render()">Restaurar</button></div>`).join("")||"<p class='muted'>Sin bloques borrados.</p>"}</div></div>`;
 }
};
window.addEventListener("load",()=>GT.init());
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
