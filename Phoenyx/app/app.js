const Phoenix={
routine:{name:"TORSO A",exercises:[{name:"PRESS BANCA",sets:3,reps:8,weight:80,rest:90},{name:"DOMINADAS",sets:3,reps:8,weight:0,rest:90},{name:"REMO CON BARRA",sets:3,reps:10,weight:60,rest:90}]},
state:{exerciseIndex:0,setIndex:0,completed:[],currentExerciseSets:[],timer:null,timerLeft:90,editing:false},
show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active")},
goHome(){this.stopTimer();this.show("home")},showDataHub(){this.show("data")},
current(){return this.routine.exercises[this.state.exerciseIndex]},
save(){localStorage.setItem("phoenix_v6_workout",JSON.stringify({...this.state,timer:null}))},
enterGym(){let x=localStorage.getItem("phoenix_v6_workout");if(x){try{this.state={...this.state,...JSON.parse(x),timer:null}}catch(e){}}this.showGym()},
pauseWorkout(){this.save();this.goHome()},
showGym(){let e=this.current();document.querySelector("#gym .routine-name").textContent=this.routine.name;document.querySelector("#gym h2").textContent=e.name;let rail=document.getElementById("gymExerciseRail");if(rail)rail.innerHTML=this.routine.exercises.map((x,i)=>`<div class="exercise-rail-item ${i===this.state.exerciseIndex?"active":""}"><div class="index">${i+1}</div><div><strong>${x.name}</strong><small>${x.sets}×${x.reps} · ${x.weight}kg</small></div><span>${i===this.state.exerciseIndex?"ACTUAL":""}</span></div>`).join("");repsValue.textContent=e.reps;weightValue.textContent=e.weight;restValue.textContent=e.rest;this.show("gym")},
adjust(t,d){let e=this.current();if(t==="reps")e.reps=Math.max(1,e.reps+d);if(t==="weight")e.weight=Math.max(0,+(e.weight+d).toFixed(2));if(t==="rest")e.rest=Math.max(0,e.rest+d);if(navigator.vibrate)navigator.vibrate(18);this.showGym();this.save()},
startSeries(){let e=this.current();seriesExerciseName.textContent=e.name;seriesNumber.textContent=`SERIE ${this.state.setIndex+1} / ${e.sets}`;seriesReps.textContent=e.reps;seriesWeight.textContent=e.weight;this.show("series")},
finishSeries(){let e=this.current();this.state.currentExerciseSets.push({set:this.state.setIndex+1,reps:e.reps,weight:e.weight});this.state.setIndex++;this.save();if(this.state.setIndex>=e.sets){this.showExerciseSummary();return}this.state.timerLeft=e.rest;this.startRest()},
startRest(){this.stopTimer();this.renderRest();this.show("rest");this.state.timer=setInterval(()=>{this.state.timerLeft--;this.renderRest();if(this.state.timerLeft<=0){this.stopTimer();this.startSeries()}},1000)},
renderRest(){let m=Math.floor(this.state.timerLeft/60),s=this.state.timerLeft%60;restTime.textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;let e=this.current();nextLabel.textContent=`SERIE ${Math.min(this.state.setIndex+1,e.sets)} / ${e.sets}`},
skipRest(){this.stopTimer();this.startSeries()},stopTimer(){if(this.state.timer){clearInterval(this.state.timer);this.state.timer=null}},
showExerciseSummary(){this.stopTimer();summaryExerciseName.textContent=this.current().name;this.state.editing=false;this.renderSummary();this.show("exerciseSummary")},
renderSummary(){summaryRows.innerHTML=this.state.currentExerciseSets.map((s,i)=>this.state.editing?`<div class="summary-edit-row"><span>Serie ${s.set}</span><input type="number" value="${s.reps}" onchange="Phoenix.edit(${i},'reps',this.value)"><input type="number" step=".25" value="${s.weight}" onchange="Phoenix.edit(${i},'weight',this.value)"></div>`:`<div>Serie ${s.set} · ${s.reps} × ${s.weight} kg</div>`).join("")},
toggleEditSummary(){this.state.editing=!this.state.editing;this.renderSummary()},edit(i,f,v){this.state.currentExerciseSets[i][f]=+v||0;this.save()},
nextExercise(){let e=this.current();this.state.completed.push({name:e.name,sets:this.state.currentExerciseSets.map(x=>({...x}))});if(this.state.exerciseIndex>=this.routine.exercises.length-1){this.showWorkoutSummary();return}let next=this.routine.exercises[this.state.exerciseIndex+1];nextDoneExercise.textContent=e.name;nextExerciseName.textContent=next.name;nextExerciseMeta.textContent=`${next.sets} × ${next.reps} · ${next.weight} kg · ${next.rest} s`;nextExerciseOverlay.classList.add("show");setTimeout(()=>{nextExerciseOverlay.classList.remove("show");this.state.exerciseIndex++;this.state.setIndex=0;this.state.currentExerciseSets=[];this.save();this.showGym()},1100)},
showWorkoutSummary(){let c=this.state.completed,sets=c.reduce((n,e)=>n+e.sets.length,0),vol=c.reduce((a,e)=>a+e.sets.reduce((s,x)=>s+x.weight*x.reps,0),0);doneExercises.textContent=c.length;doneSets.textContent=sets;doneVolume.textContent=Math.round(vol);coachReport.innerHTML=c.map(e=>`<div><b>${e.name}</b><br><span>${e.sets.map(s=>`${s.reps}×${s.weight}kg`).join(" · ")}</span></div>`).join("<hr>");this.show("workoutSummary")},
finishWorkout(){localStorage.removeItem("phoenix_v6_workout");this.state={exerciseIndex:0,setIndex:0,completed:[],currentExerciseSets:[],timer:null,timerLeft:90,editing:false};this.goHome()}
,
season:{
  name:"Temporada 2026",
  objective:"Fuerza relativa y calistenia",
  start:"2026-01-01",
  blocks:[
    {id:"b1",name:"Base técnica",weeks:8,days:4,type:"Técnica"},
    {id:"b2",name:"Fuerza",weeks:8,days:4,type:"Fuerza"},
    {id:"b3",name:"Deload",weeks:1,days:3,type:"Deload"},
    {id:"b4",name:"Calistenia",weeks:8,days:4,type:"Calistenia"}
  ],
  selected:[]
},
showSeasonBuilder(){
  this.show("season");
  this.setSeasonStep(1);
},
showDataStub(title){
  document.getElementById("dataStubTitle").textContent=title.toUpperCase();
  this.show("dataStub");
},
setSeasonStep(step){
  document.querySelectorAll(".season-step").forEach(b=>b.classList.toggle("active",+b.dataset.step===step));
  const box=document.getElementById("seasonStepContent");
  if(step===1){
    box.innerHTML=`<div class="season-form">
      <label>Nombre de temporada<input id="seasonName" value="${this.season.name}" onchange="Phoenix.season.name=this.value;Phoenix.saveSeason()"></label>
      <label>Fecha de inicio<input type="date" id="seasonStart" value="${this.season.start}" onchange="Phoenix.season.start=this.value;Phoenix.saveSeason()"></label>
    </div>`;
  }
  if(step===2){
    box.innerHTML=`<div class="season-form">
      <label>Objetivo principal<textarea id="seasonObjective" onchange="Phoenix.season.objective=this.value;Phoenix.saveSeason()">${this.season.objective}</textarea></label>
      <label>Días por semana<select><option>3 días</option><option selected>4 días</option><option>5 días</option></select></label>
    </div>`;
  }
  if(step===3){
    box.innerHTML=`<div class="block-library">${this.season.blocks.map(b=>`
      <div class="block-card">
        <h3>${b.name}</h3>
        <p>${b.type} · ${b.weeks} semanas · ${b.days} días/sem</p>
        <div class="row"><button onclick="Phoenix.addSeasonBlock('${b.id}')">Añadir al año</button><button onclick="Phoenix.duplicateSeasonBlock('${b.id}')">Duplicar</button></div>
      </div>`).join("")}</div>`;
  }
  if(step===4){
    box.innerHTML=this.renderSeasonBuild();
  }
  if(step===5){
    box.innerHTML=this.renderSeasonYear();
  }
},
addSeasonBlock(id){
  const b=this.season.blocks.find(x=>x.id===id);
  if(!b)return;
  this.season.selected.push({...b,instanceId:"i"+Date.now()+Math.random().toString(36).slice(2)});
  this.saveSeason();
  this.setSeasonStep(4);
},
duplicateSeasonBlock(id){
  const b=this.season.blocks.find(x=>x.id===id);
  if(!b)return;
  const copy={...b,id:"b"+Date.now(),name:b.name+" copia"};
  this.season.blocks.push(copy);
  this.saveSeason();
  this.setSeasonStep(3);
},
removeSeasonBlock(instanceId){
  this.season.selected=this.season.selected.filter(x=>x.instanceId!==instanceId);
  this.saveSeason();
  this.setSeasonStep(4);
},
moveSeasonBlock(instanceId,dir){
  const i=this.season.selected.findIndex(x=>x.instanceId===instanceId);
  const j=i+dir;
  if(i<0||j<0||j>=this.season.selected.length)return;
  [this.season.selected[i],this.season.selected[j]]=[this.season.selected[j],this.season.selected[i]];
  this.saveSeason();
  this.setSeasonStep(4);
},
renderSeasonBuild(){
  const items=this.season.selected;
  return `<div class="season-summary">
    <div><b>${items.length}</b><span>bloques</span></div>
    <div><b>${items.reduce((a,b)=>a+b.weeks,0)}</b><span>semanas</span></div>
    <div><b>${items.filter(b=>b.type==="Deload").length}</b><span>deloads</span></div>
  </div>
  <div class="year-track">${items.length?items.map((b,i)=>`
    <div class="year-block">
      <div class="weeks">${b.weeks}<br><small>sem</small></div>
      <div><strong>${i+1}. ${b.name}</strong><small>${b.type} · ${b.days}d/sem</small><div class="row"><button onclick="Phoenix.moveSeasonBlock('${b.instanceId}',-1)">↑</button><button onclick="Phoenix.moveSeasonBlock('${b.instanceId}',1)">↓</button></div></div>
      <button onclick="Phoenix.removeSeasonBlock('${b.instanceId}')">Eliminar</button>
    </div>`).join(""):`<p class="soft-note">Añade bloques desde el paso 3.</p>`}</div>`;
},
renderSeasonYear(){
  const items=this.season.selected;
  let week=1;
  return `<div class="year-track">${items.length?items.map(b=>{
    const start=week,end=week+b.weeks-1;week=end+1;
    return `<div class="year-block"><div class="weeks">${start}-${end}</div><div><strong>${b.name}</strong><small>${b.type} · ${b.weeks} semanas</small></div><span></span></div>`;
  }).join(""):`<p class="soft-note">Construye primero la temporada.</p>`}</div>`;
},
saveSeason(){
  localStorage.setItem("phoenix_v4_season",JSON.stringify(this.season));
},
loadSeason(){
  try{
    const saved=localStorage.getItem("phoenix_v4_season");
    if(saved)this.season={...this.season,...JSON.parse(saved)};
  }catch(e){}
}

,
exerciseLibrary:[
  {id:"e1",name:"Press banca",category:"Pecho",defaultSets:3,defaultReps:8,defaultWeight:80,defaultRest:90},
  {id:"e2",name:"Press inclinado",category:"Pecho",defaultSets:3,defaultReps:10,defaultWeight:60,defaultRest:90},
  {id:"e3",name:"Dominadas",category:"Espalda",defaultSets:4,defaultReps:8,defaultWeight:0,defaultRest:120},
  {id:"e4",name:"Remo con barra",category:"Espalda",defaultSets:4,defaultReps:10,defaultWeight:60,defaultRest:90},
  {id:"e5",name:"Sentadilla",category:"Pierna",defaultSets:4,defaultReps:6,defaultWeight:100,defaultRest:150},
  {id:"e6",name:"Peso muerto rumano",category:"Pierna",defaultSets:3,defaultReps:8,defaultWeight:80,defaultRest:120},
  {id:"e7",name:"Press militar",category:"Hombro",defaultSets:4,defaultReps:6,defaultWeight:40,defaultRest:120},
  {id:"e8",name:"Curl bíceps",category:"Bíceps",defaultSets:3,defaultReps:12,defaultWeight:14,defaultRest:60},
  {id:"e9",name:"Fondos",category:"Tríceps",defaultSets:4,defaultReps:10,defaultWeight:0,defaultRest:90},
  {id:"e10",name:"L-Sit",category:"Core",defaultSets:4,defaultReps:20,defaultWeight:0,defaultRest:60,mode:"time"}
],
routinesData:[
  {id:"r1",name:"Torso A",day:"Lunes",block:"Fuerza",items:[
    {id:"ri1",exerciseId:"e1",sets:3,reps:8,weight:80,rest:90,mode:"reps"},
    {id:"ri2",exerciseId:"e3",sets:3,reps:8,weight:0,rest:90,mode:"reps"},
    {id:"ri3",exerciseId:"e4",sets:3,reps:10,weight:60,rest:90,mode:"reps"}
  ]}
],
activeRoutineId:"r1",
activeCategory:"Todos",
showRoutineBuilder(){
  this.loadRoutines();
  this.renderRoutineBuilder();
  this.show("routines");
},
renderRoutineBuilder(){
  const select=document.getElementById("routineSelect");
  if(!select)return;
  select.innerHTML=this.routinesData.map(r=>`<option value="${r.id}" ${r.id===this.activeRoutineId?"selected":""}>${r.name}</option>`).join("");
  const routine=this.routinesData.find(r=>r.id===this.activeRoutineId)||this.routinesData[0];
  if(!routine)return;
  document.getElementById("routineNameInput").value=routine.name;
  const list=document.getElementById("routineExerciseList");
  list.innerHTML=routine.items.map((item,index)=>{
    const e=this.exerciseLibrary.find(x=>x.id===item.exerciseId);
    return `<div class="routine-exercise-card" id="card_${item.id}">
      <div class="routine-exercise-head">
        <div><h3>${index+1}. ${e?.name||"Ejercicio"}</h3><small>${e?.category||""}</small></div>
        <button class="exercise-kebab" onclick="Phoenix.toggleRoutineCard('${item.id}')">⋮</button>
      </div>
      <div class="exercise-settings">
        <label>Series<input type="number" value="${item.sets}" onchange="Phoenix.updateRoutineItem('${item.id}','sets',this.value)"></label>
        <label>${item.mode==="time"?"Segundos":"Reps"}<input type="number" value="${item.reps}" onchange="Phoenix.updateRoutineItem('${item.id}','reps',this.value)"></label>
        <label>Peso<input type="number" step=".25" value="${item.weight}" onchange="Phoenix.updateRoutineItem('${item.id}','weight',this.value)"></label>
        <label>Descanso<input type="number" value="${item.rest}" onchange="Phoenix.updateRoutineItem('${item.id}','rest',this.value)"></label>
      </div>
      <div class="exercise-card-actions">
        <button onclick="Phoenix.moveRoutineItem('${item.id}',-1)">↑ Subir</button>
        <button onclick="Phoenix.moveRoutineItem('${item.id}',1)">↓ Bajar</button>
        <button onclick="Phoenix.duplicateRoutineItem('${item.id}')">Duplicar</button>
        <button class="danger" onclick="Phoenix.deleteRoutineItem('${item.id}')">Eliminar</button>
      </div>
    </div>`;
  }).join("")||`<p class="soft-note">Añade ejercicios desde la biblioteca.</p>`;
},
toggleRoutineCard(id){
  document.getElementById("card_"+id)?.classList.toggle("open");
},
selectRoutine(id){
  this.activeRoutineId=id;
  this.renderRoutineBuilder();
},
newRoutine(){
  const id="r"+Date.now();
  this.routinesData.push({id,name:"Nueva rutina",day:"",block:"",items:[]});
  this.activeRoutineId=id;
  this.saveRoutines();
  this.renderRoutineBuilder();
},
renameActiveRoutine(name){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  if(r){r.name=name||"Rutina";this.saveRoutines();this.renderRoutineBuilder()}
},
duplicateActiveRoutine(){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  if(!r)return;
  const copy=JSON.parse(JSON.stringify(r));
  copy.id="r"+Date.now();
  copy.name=r.name+" copia";
  copy.items=copy.items.map(x=>({...x,id:"ri"+Date.now()+Math.random().toString(36).slice(2)}));
  this.routinesData.push(copy);
  this.activeRoutineId=copy.id;
  this.saveRoutines();
  this.renderRoutineBuilder();
},
assignRoutineToday(){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  if(!r)return;
  localStorage.setItem("phoenix_v5_today_routine",r.id);
  document.getElementById("todayRoutine").textContent=r.name.toUpperCase();
  alert("Rutina asignada a hoy");
},
openExerciseLibrary(){
  this.activeCategory="Todos";
  this.renderExerciseLibrary();
  this.show("exerciseLibrary");
},
renderExerciseLibrary(){
  const categories=["Todos",...new Set(this.exerciseLibrary.map(e=>e.category))];
  const catBox=document.getElementById("exerciseCategories");
  const query=(document.getElementById("exerciseSearch")?.value||"").toLowerCase();
  catBox.innerHTML=categories.map(c=>`<button class="${c===this.activeCategory?"active":""}" onclick="Phoenix.setExerciseCategory('${c}')">${c}</button>`).join("");
  const list=this.exerciseLibrary.filter(e=>(this.activeCategory==="Todos"||e.category===this.activeCategory)&&e.name.toLowerCase().includes(query));
  document.getElementById("exerciseLibraryList").innerHTML=list.map(e=>`<div class="library-item"><div><strong>${e.name}</strong><small>${e.category} · ${e.defaultSets}×${e.defaultReps}${e.mode==="time"?"s":""}</small></div><button onclick="Phoenix.addExerciseToRoutine('${e.id}')">Añadir</button></div>`).join("")||`<p class="soft-note">Sin resultados.</p>`;
},
setExerciseCategory(category){
  this.activeCategory=category;
  this.renderExerciseLibrary();
},
addExerciseToRoutine(exerciseId){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  const e=this.exerciseLibrary.find(x=>x.id===exerciseId);
  if(!r||!e)return;
  r.items.push({id:"ri"+Date.now()+Math.random().toString(36).slice(2),exerciseId:e.id,sets:e.defaultSets,reps:e.defaultReps,weight:e.defaultWeight,rest:e.defaultRest,mode:e.mode||"reps"});
  this.saveRoutines();
  this.showRoutineBuilder();
},
updateRoutineItem(id,field,value){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  const item=r?.items.find(x=>x.id===id);
  if(item){item[field]=+value||0;this.saveRoutines()}
},
moveRoutineItem(id,dir){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  if(!r)return;
  const i=r.items.findIndex(x=>x.id===id),j=i+dir;
  if(i<0||j<0||j>=r.items.length)return;
  [r.items[i],r.items[j]]=[r.items[j],r.items[i]];
  this.saveRoutines();
  this.renderRoutineBuilder();
},
duplicateRoutineItem(id){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  const item=r?.items.find(x=>x.id===id);
  if(!r||!item)return;
  const i=r.items.findIndex(x=>x.id===id);
  r.items.splice(i+1,0,{...item,id:"ri"+Date.now()+Math.random().toString(36).slice(2)});
  this.saveRoutines();
  this.renderRoutineBuilder();
},
deleteRoutineItem(id){
  const r=this.routinesData.find(x=>x.id===this.activeRoutineId);
  if(!r)return;
  r.items=r.items.filter(x=>x.id!==id);
  this.saveRoutines();
  this.renderRoutineBuilder();
},
saveRoutines(){
  localStorage.setItem("phoenix_v5_routines",JSON.stringify(this.routinesData));
  localStorage.setItem("phoenix_v5_active_routine",this.activeRoutineId);
},
loadRoutines(){
  try{
    const saved=localStorage.getItem("phoenix_v5_routines");
    if(saved)this.routinesData=JSON.parse(saved);
    this.activeRoutineId=localStorage.getItem("phoenix_v5_active_routine")||this.routinesData[0]?.id;
  }catch(e){}
}

};
window.addEventListener("load",()=>{Phoenix.loadSeason();Phoenix.loadRoutines();const d=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];todayDay.textContent=d[new Date().getDay()];setTimeout(()=>document.getElementById("splash")?.remove(),2300)});
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
