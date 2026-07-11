const DB_KEY="gymtracker_phoenix_v7";
const ACTIVE_KEY="gymtracker_phoenix_v7_active";

const App={
  data:null,
  currentScreen:"home",
  destination:"Inicio",
  active:null,
  timer:null,

  defaults(){
    return{
      settings:{weightStep:.5,defaultRest:90,sound:true,vibration:true},
      profile:{bodyWeight:null},
      routines:[
        {id:"r1",name:"Torso A",day:1,items:[
          {id:"i1",name:"Press banca",sets:3,reps:8,weight:80,rest:90,mode:"reps"},
          {id:"i2",name:"Dominadas",sets:3,reps:8,weight:0,rest:90,mode:"reps"},
          {id:"i3",name:"Remo con barra",sets:3,reps:10,weight:60,rest:90,mode:"reps"}
        ]}
      ],
      weekPlan:{1:"r1"},
      sessions:[],
      weights:[],
      alternatives:{
        "Press banca":["Press con mancuernas","Flexiones","Press inclinado"],
        "Dominadas":["Jalón al pecho","Dominadas asistidas","Remo invertido"],
        "Remo con barra":["Remo con mancuerna","Remo en polea","Remo invertido"]
      }
    }
  },

  load(){
    try{this.data=JSON.parse(localStorage.getItem(DB_KEY))}catch(e){this.data=null}
    if(!this.data)this.data=this.defaults();
    this.normalize();
    this.save();
    try{this.active=JSON.parse(localStorage.getItem(ACTIVE_KEY)||"null")}catch(e){this.active=null}
    if(this.active)this.normalizeActive();
  },

  normalize(){
    this.data.settings=this.data.settings||{weightStep:.5,defaultRest:90,sound:true,vibration:true};
    this.data.profile=this.data.profile||{bodyWeight:null};
    this.data.routines=Array.isArray(this.data.routines)?this.data.routines:[];
    this.data.weekPlan=this.data.weekPlan||{};
    this.data.sessions=Array.isArray(this.data.sessions)?this.data.sessions:[];
    this.data.weights=Array.isArray(this.data.weights)?this.data.weights:[];
    this.data.alternatives=this.data.alternatives||{};
  },

  save(){localStorage.setItem(DB_KEY,JSON.stringify(this.data))},
  saveActive(){this.active?localStorage.setItem(ACTIVE_KEY,JSON.stringify(this.active)):localStorage.removeItem(ACTIVE_KEY)},

  normalizeActive(){
    const r=this.getRoutine(this.active.routineId);
    if(!r){this.active=null;this.saveActive();return}
    this.active.exerciseIndex=Math.max(0,Math.min(Number(this.active.exerciseIndex)||0,r.items.length-1));
    const e=r.items[this.active.exerciseIndex];
    this.active.setIndex=Math.max(0,Math.min(Number(this.active.setIndex)||0,e.sets));
    this.active.currentSets=Array.isArray(this.active.currentSets)?this.active.currentSets:[];
    this.active.completedExercises=Array.isArray(this.active.completedExercises)?this.active.completedExercises:[];
  },

  todayRoutine(){
    const day=new Date().getDay();
    const id=this.data.weekPlan[day]||this.data.routines[0]?.id;
    return this.getRoutine(id)
  },
  getRoutine(id){return this.data.routines.find(r=>r.id===id)},

  show(id,destination="Inicio"){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const el=document.getElementById(id); if(!el)return;
    el.classList.add("active");
    this.currentScreen=id;
    this.destination=destination;
    const btn=document.getElementById("destButton");
    btn.textContent=destination;
    btn.style.visibility=id==="home"?"hidden":"visible";
    history.replaceState({phoenix:true,screen:id},"","#"+id);
  },

  goDestination(){
    const map={Inicio:"home",Datos:"data",Rutinas:"routines",Ejercicio:"gym"};
    const target=map[this.destination]||"home";
    if(target==="home")this.renderHome();
    if(target==="data")this.renderData();
    if(target==="routines")this.renderRoutines();
    if(target==="gym")this.renderGym();
  },

  renderHome(){
    const r=this.todayRoutine();
    const active=this.active;
    document.getElementById("home").innerHTML=`<div class="focus">
      ${active?`<div class="card"><div class="eyebrow">ENTRENAMIENTO EN CURSO</div><div class="title">${this.getRoutine(active.routineId)?.name||"Rutina"}</div><button class="king small-king" onclick="App.resumeWorkout()">CONTINUAR</button><button class="danger" onclick="App.discardWorkout()">Descartar</button></div>`:""}
      <div class="card">
        <div class="eyebrow">HOY TOCA</div>
        <div class="title">${r?r.name:"DESCANSO"}</div>
        <div class="meta">${r?`<span>${r.items.length} ejercicios</span><span>${r.items.reduce((a,x)=>a+x.sets,0)} series</span>`:"<span>Sin rutina asignada</span>"}</div>
        <div class="two-actions">
          <button class="king" onclick="App.startWorkout('${r?.id||""}')">GYM</button>
          <button class="data-king" onclick="App.renderData()">DATOS</button>
        </div>
      </div>
    </div>`;
    this.show("home","Inicio")
  },

  startWorkout(routineId){
    const r=this.getRoutine(routineId);
    if(!r||!r.items.length){alert("No hay una rutina válida para hoy.");return}
    this.active={id:"s"+Date.now(),routineId:r.id,date:new Date().toISOString(),exerciseIndex:0,setIndex:0,currentSets:[],completedExercises:[],startedAt:Date.now()};
    this.saveActive();
    this.renderGym()
  },

  resumeWorkout(){this.normalizeActive();this.renderGym()},
  discardWorkout(){if(confirm("¿Descartar el entrenamiento en curso?")){this.active=null;this.saveActive();this.renderHome()}},

  currentRoutine(){return this.active?this.getRoutine(this.active.routineId):null},
  currentExercise(){return this.currentRoutine()?.items[this.active.exerciseIndex]},

  renderGym(){
    if(!this.active){this.renderHome();return}
    this.normalizeActive();
    const r=this.currentRoutine(),e=this.currentExercise();
    document.getElementById("gym").innerHTML=`<div class="focus">
      <div class="eyebrow">${r.name} · EJERCICIO ${this.active.exerciseIndex+1}/${r.items.length}</div>
      <div class="title">${e.name.toUpperCase()}</div>
      <button class="secondary" onclick="App.openAlternatives()">🔥 Alternativas</button>
      <div class="control-panel">
        ${this.controlBox("SERIES","sets",e.sets,1)}
        ${this.controlBox("REPS","reps",e.reps,1)}
        ${this.controlBox("PESO","weight",e.weight,this.data.settings.weightStep,"kg")}
      </div>
      <div class="rest-dial">
        <div class="control-label">DESCANSO</div>
        <button onclick="App.adjustExercise('rest',5)">＋</button>
        <div class="value">${e.rest}<small>s</small></div>
        <button onclick="App.adjustExercise('rest',-5)">−</button>
      </div>
      <button class="king small-king" onclick="App.beginSet()">INICIAR SERIE</button>
      <button class="secondary" onclick="App.pauseWorkout()">Salir sin terminar</button>
    </div>`;
    this.show("gym","Inicio")
  },

  controlBox(label,field,value,step,unit=""){
    return `<div class="control-box"><div class="control-label">${label}</div><button class="arrow" onclick="App.adjustExercise('${field}',${step})">▲</button><div class="control-value">${value}${unit?`<small>${unit}</small>`:""}</div><button class="arrow" onclick="App.adjustExercise('${field}',${-step})">▼</button></div>`
  },

  adjustExercise(field,delta){
    const e=this.currentExercise(); if(!e)return;
    if(field==="sets")e.sets=Math.max(1,e.sets+delta);
    if(field==="reps")e.reps=Math.max(1,e.reps+delta);
    if(field==="weight")e.weight=Math.max(0,Math.round((e.weight+delta)*2)/2);
    if(field==="rest")e.rest=Math.max(0,e.rest+delta);
    this.save();this.saveActive();this.renderGym();this.buzz(18)
  },

  beginSet(){
    this.normalizeActive();
    const e=this.currentExercise();
    if(this.active.setIndex>=e.sets){this.renderExerciseSummary();return}
    document.getElementById("series").innerHTML=`<div class="focus">
      <div class="eyebrow">${e.name.toUpperCase()}</div>
      <div class="title">SERIE ${this.active.setIndex+1} / ${e.sets}</div>
      <div class="series-focus">
        <div class="series-box"><b>${e.reps}</b><small>${e.mode==="time"?"segundos":"reps"}</small></div>
        <div class="series-box"><b>${e.weight}</b><small>kg</small></div>
      </div>
      <button class="king small-king" onclick="App.finishSet()">FINALIZAR SERIE</button>
    </div>`;
    this.show("series","Ejercicio")
  },

  finishSet(){
    const e=this.currentExercise(); if(!e)return;
    const reps=Number(prompt(e.mode==="time"?"Segundos realizados":"Repeticiones realizadas",String(e.reps)));
    if(!Number.isFinite(reps)){return}
    const weight=Number(prompt("Peso utilizado",String(e.weight)));
    if(!Number.isFinite(weight)){return}
    this.active.currentSets.push({set:this.active.setIndex+1,reps,weight,mode:e.mode||"reps"});
    this.active.setIndex++;
    this.saveActive();

    if(this.active.setIndex>=e.sets){this.renderExerciseSummary();return}
    this.startRest(e.rest)
  },

  startRest(seconds){
    clearInterval(this.timer);
    this.active.restLeft=seconds;
    this.saveActive();
    this.renderRest();
    this.timer=setInterval(()=>{
      if(!this.active)return clearInterval(this.timer);
      this.active.restLeft=Math.max(0,(this.active.restLeft||0)-1);
      this.saveActive();
      this.updateRestDisplay();
      if(this.active.restLeft<=0){clearInterval(this.timer);this.beep();this.buzz([120,60,120]);this.beginSet()}
    },1000)
  },

  renderRest(){
    const e=this.currentExercise();
    document.getElementById("rest").innerHTML=`<div class="focus">
      <div class="casio"><div class="lcd"><div class="label">DESCANSO</div><div id="restTime" class="time"></div><div>Siguiente: SERIE ${this.active.setIndex+1}/${e.sets}</div></div></div>
      <button class="king small-king" onclick="App.skipRest()">SALTAR DESCANSO</button>
    </div>`;
    this.updateRestDisplay();
    this.show("rest","Ejercicio")
  },

  updateRestDisplay(){
    const t=Math.max(0,this.active?.restLeft||0),m=Math.floor(t/60),s=t%60;
    const el=document.getElementById("restTime");if(el)el.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
  },
  skipRest(){clearInterval(this.timer);this.beginSet()},

  renderExerciseSummary(){
    clearInterval(this.timer);
    const e=this.currentExercise();
    document.getElementById("exerciseSummary").innerHTML=`<div class="focus">
      <div class="eyebrow">EJERCICIO COMPLETADO</div>
      <div class="title">${e.name.toUpperCase()}</div>
      <div class="card">
        ${this.active.currentSets.map((s,i)=>`<div class="summary-row"><strong>Serie ${i+1}</strong><input type="number" value="${s.reps}" onchange="App.editCurrentSet(${i},'reps',this.value)"><input type="number" step=".5" value="${s.weight}" onchange="App.editCurrentSet(${i},'weight',this.value)"></div>`).join("")}
      </div>
      <button class="king small-king" onclick="App.completeExercise()">SIGUIENTE EJERCICIO</button>
    </div>`;
    this.show("exerciseSummary","Ejercicio")
  },

  editCurrentSet(index,field,value){this.active.currentSets[index][field]=Number(value)||0;this.saveActive()},

  completeExercise(){
    const e=this.currentExercise();
    this.active.completedExercises.push({name:e.name,sets:this.active.currentSets.map(x=>({...x}))});
    if(this.active.exerciseIndex>=this.currentRoutine().items.length-1){this.finishWorkout();return}
    const next=this.currentRoutine().items[this.active.exerciseIndex+1];
    document.getElementById("exerciseSummary").innerHTML=`<div class="focus"><div class="eyebrow">SIGUIENTE</div><div class="title">${next.name.toUpperCase()}</div><div class="meta"><span>${next.sets}×${next.reps}</span><span>${next.weight} kg</span><span>${next.rest} s</span></div></div>`;
    this.active.exerciseIndex++;this.active.setIndex=0;this.active.currentSets=[];this.saveActive();
    setTimeout(()=>this.renderGym(),900)
  },

  finishWorkout(){
    const r=this.currentRoutine();
    const session={id:this.active.id,date:this.active.date,routineId:r.id,routineName:r.name,startedAt:this.active.startedAt,endedAt:Date.now(),exercises:this.active.completedExercises};
    session.totalSets=session.exercises.reduce((a,e)=>a+e.sets.length,0);
    session.volume=session.exercises.reduce((a,e)=>a+e.sets.reduce((s,x)=>s+x.weight*x.reps,0),0);
    this.data.sessions.push(session);this.save();
    this.active=null;this.saveActive();
    document.getElementById("workoutSummary").innerHTML=`<div class="focus"><div class="eyebrow">ENTRENAMIENTO COMPLETADO</div><div class="title">${r.name.toUpperCase()}</div><div class="grid"><div class="card"><div class="title">${session.exercises.length}</div><div>ejercicios</div></div><div class="card"><div class="title">${session.totalSets}</div><div>series</div></div><div class="card"><div class="title">${Math.round(session.volume)}</div><div>kg volumen</div></div></div><button class="king small-king" onclick="App.renderHome()">VOLVER AL INICIO</button></div>`;
    this.show("workoutSummary","Inicio")
  },

  pauseWorkout(){clearInterval(this.timer);this.saveActive();this.renderHome()},

  openAlternatives(){
    const e=this.currentExercise();
    document.getElementById("altCurrent").textContent=e.name;
    const list=this.data.alternatives[e.name]||[];
    document.getElementById("altList").innerHTML=list.length?list.map(name=>`<div class="list-item"><strong>${name}</strong><button class="secondary" onclick="App.useAlternative('${name.replaceAll("'","\\'")}')">Usar</button></div>`).join(""):`<div class="muted">Sin alternativas configuradas.</div>`;
    document.getElementById("alternativesSheet").classList.add("show")
  },
  closeAlternatives(){document.getElementById("alternativesSheet").classList.remove("show")},
  useAlternative(name){this.currentExercise().name=name;this.save();this.saveActive();this.closeAlternatives();this.renderGym()},

  renderData(){
    document.getElementById("data").innerHTML=`<div class="focus"><div class="eyebrow">MODO</div><div class="title">DATOS</div><div class="grid"><button class="secondary" onclick="App.renderRoutines()">Rutinas</button><button class="secondary" onclick="App.renderHistory()">Historial</button><button class="secondary" onclick="App.renderSettings()">Ajustes</button><button class="secondary" onclick="App.renderBackups()">Backups</button></div></div>`;
    this.show("data","Inicio")
  },

  renderRoutines(){
    document.getElementById("routines").innerHTML=`<div class="card"><div class="eyebrow">RUTINAS</div><button class="secondary" onclick="App.createRoutine()">＋ Nueva rutina</button></div>${this.data.routines.map(r=>`<div class="card"><input value="${r.name}" onchange="App.renameRoutine('${r.id}',this.value)"><div class="list">${r.items.map((e,i)=>`<div class="list-item"><strong>${i+1}. ${e.name}</strong><div class="grid"><input type="number" value="${e.sets}" onchange="App.editRoutineItem('${r.id}','${e.id}','sets',this.value)"><input type="number" value="${e.reps}" onchange="App.editRoutineItem('${r.id}','${e.id}','reps',this.value)"><input type="number" step=".5" value="${e.weight}" onchange="App.editRoutineItem('${r.id}','${e.id}','weight',this.value)"><input type="number" value="${e.rest}" onchange="App.editRoutineItem('${r.id}','${e.id}','rest',this.value)"></div></div>`).join("")}</div><button class="secondary" onclick="App.addExercise('${r.id}')">Añadir ejercicio</button><button class="secondary" onclick="App.assignToday('${r.id}')">Asignar a hoy</button></div>`).join("")}`;
    this.show("routines","Datos")
  },

  createRoutine(){const name=prompt("Nombre de la rutina","Nueva rutina");if(!name)return;this.data.routines.push({id:"r"+Date.now(),name,items:[]});this.save();this.renderRoutines()},
  renameRoutine(id,name){const r=this.getRoutine(id);if(r){r.name=name;this.save()}},
  addExercise(rid){const r=this.getRoutine(rid);if(!r)return;const name=prompt("Nombre del ejercicio");if(!name)return;const large=confirm("¿Músculo grande? Aceptar = 3×8/90 s. Cancelar = 4×12/60 s.");r.items.push({id:"i"+Date.now(),name,sets:large?3:4,reps:large?8:12,weight:0,rest:large?90:60,mode:"reps"});this.save();this.renderRoutines()},
  editRoutineItem(rid,iid,field,value){const r=this.getRoutine(rid),e=r?.items.find(x=>x.id===iid);if(e){e[field]=Number(value)||0;this.save()}},
  assignToday(rid){this.data.weekPlan[new Date().getDay()]=rid;this.save();alert("Rutina asignada a hoy");this.renderHome()},

  renderHistory(){
    document.getElementById("history").innerHTML=`<div class="card"><div class="eyebrow">HISTORIAL</div></div>${this.data.sessions.slice().reverse().map(s=>`<details class="card"><summary><strong>${s.routineName}</strong> · ${new Date(s.date).toLocaleDateString()}</summary><p>${s.totalSets} series · ${Math.round(s.volume)} kg</p>${s.exercises.map(e=>`<div class="list-item"><strong>${e.name}</strong><br>${e.sets.map(x=>`${x.weight}kg × ${x.reps}`).join(" · ")}</div>`).join("")}</details>`).join("")||'<div class="card muted">Todavía no hay entrenamientos guardados.</div>'}`;
    this.show("history","Datos")
  },

  renderSettings(){
    document.getElementById("settings").innerHTML=`<div class="card"><div class="eyebrow">AJUSTES</div><label>Peso corporal<input id="bodyWeight" type="number" step=".1" value="${this.data.profile.bodyWeight||""}"></label><button class="secondary" onclick="App.saveBodyWeight()">Guardar peso</button><label>Incremento de peso<input id="weightStep" type="number" step=".5" value="${this.data.settings.weightStep}"></label><button class="secondary" onclick="App.saveSettings()">Guardar ajustes</button></div>`;
    this.show("settings","Datos")
  },
  saveBodyWeight(){const w=Number(document.getElementById("bodyWeight").value);if(w>0){this.data.profile.bodyWeight=w;this.data.weights.push({date:new Date().toISOString(),weight:w});this.save();alert("Peso guardado")}},
  saveSettings(){const x=Number(document.getElementById("weightStep").value);if(x>0)this.data.settings.weightStep=x;this.save();alert("Ajustes guardados")},

  renderBackups(){
    document.getElementById("backups").innerHTML=`<div class="focus"><div class="eyebrow">BACKUPS</div><div class="title">TUS DATOS</div><button class="secondary" onclick="App.exportBackup()">Exportar JSON</button><button class="secondary" onclick="document.getElementById('importFile').click()">Importar JSON</button></div>`;
    this.show("backups","Datos")
  },
  exportBackup(){const blob=new Blob([JSON.stringify({version:7,exportedAt:new Date().toISOString(),data:this.data},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GymTracker_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)},
  importBackupFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);const data=obj.data||obj;if(!Array.isArray(data.routines)||!Array.isArray(data.sessions))throw new Error("Backup no válido");localStorage.setItem(DB_KEY,JSON.stringify(data));this.load();alert("Backup restaurado");this.renderHome()}catch(e){alert(e.message)}};r.readAsText(file)},

  beep(){try{if(!this.data.settings.sound)return;const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},180)}catch(e){}},
  buzz(v){try{if(this.data.settings.vibration&&navigator.vibrate)navigator.vibrate(v)}catch(e){}},

  init(){
    this.load();
    this.renderHome();
    window.addEventListener("popstate",()=>{if(this.currentScreen!=="home")this.goDestination()});
    setTimeout(()=>document.getElementById("splash")?.remove(),2100)
  }
};

window.addEventListener("load",()=>App.init());
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
