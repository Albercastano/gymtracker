const DB_KEY="gymtracker_phoenix_v8";
const ACTIVE_KEY="gymtracker_phoenix_v8_active";

const App={
  data:null,
  currentScreen:"home",
  destination:"Inicio",
  active:null,
  timer:null,
  actionLock:false,
  backLock:false,
  navigationReady:false,

  safeAction(fn){
    if(this.actionLock)return;
    this.actionLock=true;
    try{fn()}finally{setTimeout(()=>{this.actionLock=false},220)}
  },

  reportError(error){
    console.error(error);
    try{this.toast("Ha ocurrido un error. Tus datos siguen guardados.")}catch(e){}
  },

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
      },
      library:[
        {id:"press_banca",name:"Press banca",group:"Pecho",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"press_inclinado",name:"Press inclinado",group:"Pecho",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"press_mancuernas",name:"Press con mancuernas",group:"Pecho",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:1,official:true},
        {id:"flexiones",name:"Flexiones",group:"Pecho",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:0,official:true},
        {id:"dominadas",name:"Dominadas",group:"Espalda",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:1,official:true},
        {id:"jalon_pecho",name:"Jalón al pecho",group:"Espalda",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"remo_barra",name:"Remo con barra",group:"Espalda",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"sentadilla",name:"Sentadilla",group:"Pierna",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"prensa",name:"Prensa",group:"Pierna",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:5,official:true},
        {id:"peso_muerto_rumano",name:"Peso muerto rumano",group:"Pierna",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:2.5,official:true},
        {id:"press_militar",name:"Press militar",group:"Hombro",size:"large",type:"reps",sets:3,reps:8,rest:90,increment:1,official:true},
        {id:"elevaciones_laterales",name:"Elevaciones laterales",group:"Hombro",size:"small",type:"reps",sets:4,reps:12,rest:60,increment:.5,official:true},
        {id:"curl_biceps",name:"Curl de bíceps",group:"Bíceps",size:"small",type:"reps",sets:4,reps:12,rest:60,increment:.5,official:true},
        {id:"extension_triceps",name:"Extensión de tríceps",group:"Tríceps",size:"small",type:"reps",sets:4,reps:12,rest:60,increment:.5,official:true},
        {id:"fondos",name:"Fondos",group:"Tríceps",size:"small",type:"reps",sets:4,reps:12,rest:60,increment:1,official:true},
        {id:"plancha",name:"Plancha",group:"Core",size:"small",type:"time",sets:4,reps:30,rest:60,increment:5,official:true},
        {id:"l_sit",name:"L-Sit",group:"Core",size:"small",type:"time",sets:4,reps:20,rest:60,increment:5,official:true}
      ],
      personalExercises:[],
      recentExerciseIds:[],
      favoriteExerciseIds:[]
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
    this.data.library=Array.isArray(this.data.library)?this.data.library:this.defaults().library;
    this.data.personalExercises=Array.isArray(this.data.personalExercises)?this.data.personalExercises:[];
    this.data.recentExerciseIds=Array.isArray(this.data.recentExerciseIds)?this.data.recentExerciseIds:[];
    this.data.favoriteExerciseIds=Array.isArray(this.data.favoriteExerciseIds)?this.data.favoriteExerciseIds:[];
  },

  save(){localStorage.setItem(DB_KEY,JSON.stringify(this.data))},
  saveActive(){this.active?localStorage.setItem(ACTIVE_KEY,JSON.stringify(this.active)):localStorage.removeItem(ACTIVE_KEY)},

  normalizeActive(){
    if(!this.active||typeof this.active!=="object"){this.active=null;this.saveActive();return}
    const r=this.getRoutine(this.active.routineId);
    if(!r||!Array.isArray(r.items)||!r.items.length){this.active=null;this.saveActive();return}

    let exerciseIndex=Number(this.active.exerciseIndex);
    if(!Number.isInteger(exerciseIndex)||exerciseIndex<0||exerciseIndex>=r.items.length)exerciseIndex=0;
    this.active.exerciseIndex=exerciseIndex;

    const e=r.items[exerciseIndex];
    let setIndex=Number(this.active.setIndex);
    if(!Number.isInteger(setIndex)||setIndex<0||setIndex>e.sets)setIndex=0;
    this.active.setIndex=setIndex;

    this.active.currentSets=Array.isArray(this.active.currentSets)?this.active.currentSets:[];
    this.active.currentSets=this.active.currentSets.slice(0,e.sets).map((s,i)=>({
      set:i+1,
      reps:Number.isFinite(Number(s.reps))?Number(s.reps):e.reps,
      weight:Number.isFinite(Number(s.weight))?Number(s.weight):e.weight,
      mode:s.mode||e.mode||"reps"
    }));
    if(this.active.currentSets.length!==this.active.setIndex){
      this.active.setIndex=Math.min(this.active.currentSets.length,e.sets);
    }

    this.active.completedExercises=Array.isArray(this.active.completedExercises)?this.active.completedExercises:[];
    this.active.exerciseProgress=(this.active.exerciseProgress&&typeof this.active.exerciseProgress==="object")
      ?this.active.exerciseProgress:{};
    this.active.phase=["gym","series","rest","summary"].includes(this.active.phase)?this.active.phase:"gym";

    if(this.active.phase==="rest" && Number(this.active.restEndsAt)>0){
      this.active.restLeft=Math.max(0,Math.ceil((Number(this.active.restEndsAt)-Date.now())/1000));
      if(this.active.restLeft<=0)this.active.phase="series";
    }
    this.saveActive();
  },

  todayRoutine(){
    const day=new Date().getDay();
    const id=this.data.weekPlan[day]||this.data.routines[0]?.id;
    return this.getRoutine(id)
  },
  getRoutine(id){return this.data.routines.find(r=>r.id===id)},

  show(id,destination="Inicio",options={}){
    const el=document.getElementById(id);
    if(!el)return;

    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    el.classList.add("active");
    this.currentScreen=id;
    this.destination=destination;

    const btn=document.getElementById("destButton");
    btn.textContent=destination;
    btn.style.visibility=id==="home"?"hidden":"visible";

    const state={phoenix:true,screen:id,destination};
    if(options.history===false){
      history.replaceState(state,"","#"+id);
    }else if(options.replace===true){
      history.replaceState(state,"","#"+id);
    }else{
      history.pushState(state,"","#"+id);
    }
  },

  getParentRoute(screen=this.currentScreen){
    const routes={
      home:{screen:null,destination:"Inicio"},
      data:{screen:"home",destination:"Inicio"},
      library:{screen:this.librarySelectMode?"routines":"data",destination:this.librarySelectMode?"Rutinas":"Datos"},
      routines:{screen:"data",destination:"Datos"},
      history:{screen:"data",destination:"Datos"},
      settings:{screen:"data",destination:"Datos"},
      backups:{screen:"data",destination:"Datos"},
      gym:{screen:"home",destination:"Inicio"},
      series:{screen:"gym",destination:"Ejercicio"},
      rest:{screen:"series",destination:"Ejercicio"},
      exerciseSummary:{screen:"gym",destination:"Ejercicio"},
      workoutSummary:{screen:"home",destination:"Inicio"}
    };
    return routes[screen]||{screen:"home",destination:"Inicio"}
  },

  goDestination(){
    const parent=this.getParentRoute();
    if(!parent.screen){this.renderHome();return}
    this.renderRoute(parent.screen,true)
  },

  renderRoute(target,withHistory=true){
    if(target==="home"){this.renderHome(withHistory);return}
    if(target==="data"){this.renderData(withHistory);return}
    if(target==="library"){this.renderLibrary(this.librarySelectMode);return}
    if(target==="routines"){this.renderRoutines(withHistory);return}
    if(target==="history"){this.renderHistory(withHistory);return}
    if(target==="settings"){this.renderSettings(withHistory);return}
    if(target==="backups"){this.renderBackups(withHistory);return}
    if(target==="gym"){this.renderGym(withHistory);return}
    if(target==="series"){this.beginSet();return}
    this.renderHome(withHistory)
  },

  estimateRoutineMinutes(routine){
    if(!routine||!Array.isArray(routine.items)||!routine.items.length)return 0;

    const workSeconds=routine.items.reduce((total,item)=>{
      const sets=Math.max(1,Number(item.sets)||1);
      const mode=item.mode||"reps";
      const perSet=mode==="time"
        ?Math.max(15,Number(item.reps)||30)
        :35;
      return total+(sets*perSet)
    },0);

    const restSeconds=routine.items.reduce((total,item)=>{
      const sets=Math.max(1,Number(item.sets)||1);
      const rest=Math.max(0,Number(item.rest)||0);
      return total+(Math.max(0,sets-1)*rest)
    },0);

    const exerciseTransitions=Math.max(0,routine.items.length-1)*40;
    const preparation=routine.items.length*20;

    return Math.max(
      1,
      Math.round((workSeconds+restSeconds+exerciseTransitions+preparation)/60)
    )
  },

  renderHome(withHistory=true){
    const r=this.todayRoutine();
    const active=this.active;
    const totalExercises=r?.items?.length||0;
    const totalSets=r?.items?.reduce((a,x)=>a+(Number(x.sets)||0),0)||0;
    const estimatedMinutes=this.estimateRoutineMinutes(r);

    document.getElementById("home").innerHTML=`<div class="focus">
      ${active?`<div class="card"><div class="eyebrow">ENTRENAMIENTO EN CURSO</div><div class="title">${this.getRoutine(active.routineId)?.name||"Rutina"}</div><button class="king small-king" onclick="App.resumeWorkout()">CONTINUAR</button><button class="danger" onclick="App.discardWorkout()">Descartar</button></div>`:""}

      <div class="card home-today-card">
        <div class="eyebrow">HOY TOCA</div>
        <div class="title">${r?r.name:"DESCANSO"}</div>

        <div class="home-summary">
          ${r?`
            <span>${totalExercises} ejercicios</span>
            <span>${totalSets} series</span>
            <span class="estimated-time">~${estimatedMinutes} min</span>
          `:`<span>Sin rutina asignada</span>`}
        </div>

        <div class="two-actions">
          <button class="king" onclick="App.startWorkout('${r?.id||""}')">GYM</button>
          <button class="data-king" onclick="App.renderData()">DATOS</button>
        </div>
      </div>
    </div>`;

    this.show("home","Inicio",{history:withHistory})
  },

  startWorkout(routineId){
    const r=this.getRoutine(routineId);
    if(!r||!r.items.length){alert("No hay una rutina válida para hoy.");return}
    this.active={id:"s"+Date.now(),routineId:r.id,date:new Date().toISOString(),exerciseIndex:0,setIndex:0,currentSets:[],completedExercises:[],exerciseProgress:{},startedAt:Date.now(),phase:"gym",restEndsAt:null,restLeft:0};
    this.saveActive();
    this.renderGym()
  },

  resumeWorkout(){
    this.normalizeActive();
    if(!this.active){this.renderHome();return}
    if(this.active.phase==="rest"){this.resumeRest();return}
    if(this.active.phase==="series"){this.beginSet();return}
    if(this.active.phase==="summary"){this.renderExerciseSummary();return}
    this.renderGym()
  },
  discardWorkout(){if(confirm("¿Descartar el entrenamiento en curso?")){this.active=null;this.saveActive();this.renderHome()}},

  currentRoutine(){return this.active?this.getRoutine(this.active.routineId):null},
  currentExercise(){return this.currentRoutine()?.items[this.active.exerciseIndex]},

  renderGym(withHistory=true){
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
    this.show("gym","Inicio",{history:withHistory})
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
    this.active.phase="series";this.active.restEndsAt=null;this.active.restLeft=0;this.saveActive();
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
    if(this.actionLock)return;
    this.actionLock=true;
    setTimeout(()=>{this.actionLock=false},300);
    this.normalizeActive();
    const e=this.currentExercise();
    if(!e||!this.active)return;
    if(this.active.setIndex>=e.sets){this.renderExerciseSummary();return}

    const completedSet={
      set:this.active.setIndex+1,
      reps:Number(e.reps)||0,
      weight:Number(e.weight)||0,
      mode:e.mode||"reps",
      completedAt:new Date().toISOString()
    };

    this.active.currentSets.push(completedSet);
    this.active.setIndex=this.active.currentSets.length;

    // Guardado duradero por ejercicio. No depende del peso externo ni de pulsar
    // correctamente la transición al ejercicio siguiente.
    const progressKey=String(this.active.exerciseIndex);
    this.active.exerciseProgress[progressKey]={
      plannedName:e.originalName||e.name,
      name:e.name,
      exerciseId:e.libraryId||null,
      mode:e.mode||"reps",
      sets:this.active.currentSets.map(x=>({...x}))
    };

    this.active.phase=this.active.setIndex>=e.sets?"summary":"rest";
    this.saveActive(); // guardado inmediatamente después de cada serie

    if(this.active.setIndex>=e.sets){
      this.renderExerciseSummary();
      return;
    }
    this.startRest(Number(e.rest)||0)
  },

  startRest(seconds){
    clearInterval(this.timer);
    const safeSeconds=Math.max(0,Number(seconds)||0);
    this.active.phase="rest";
    this.active.restLeft=safeSeconds;
    this.active.restEndsAt=Date.now()+(safeSeconds*1000);
    this.saveActive();
    this.renderRest();
    this.runRestTimer()
  },

  resumeRest(){
    clearInterval(this.timer);
    const remaining=Math.max(0,Math.ceil((Number(this.active.restEndsAt||Date.now())-Date.now())/1000));
    this.active.restLeft=remaining;
    if(remaining<=0){
      this.active.phase="series";
      this.saveActive();
      this.beginSet();
      return
    }
    this.renderRest();
    this.runRestTimer()
  },

  runRestTimer(){
    clearInterval(this.timer);
    this.timer=setInterval(()=>{
      if(!this.active){clearInterval(this.timer);return}
      const remaining=Math.max(0,Math.ceil((Number(this.active.restEndsAt||Date.now())-Date.now())/1000));
      this.active.restLeft=remaining;
      this.updateRestDisplay();
      if(remaining<=0){
        clearInterval(this.timer);
        this.active.phase="series";
        this.active.restEndsAt=null;
        this.saveActive();
        this.beep();
        this.buzz([120,60,120]);
        this.beginSet()
      }else if(remaining%5===0){
        this.saveActive()
      }
    },250)
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
  skipRest(){clearInterval(this.timer);this.active.phase="series";this.active.restEndsAt=null;this.active.restLeft=0;this.saveActive();this.beginSet()},

  renderExerciseSummary(){
    clearInterval(this.timer);
    if(this.active){this.active.phase="summary";this.saveActive()}
    const e=this.currentExercise();
    document.getElementById("exerciseSummary").innerHTML=`<div class="focus">
      <div class="eyebrow">EJERCICIO COMPLETADO</div>
      <div class="title">${e.name.toUpperCase()}</div>
      <div class="card"><div class="inline-edit-note">Puedes corregir aquí reps y peso antes de continuar.</div>
        ${this.active.currentSets.map((s,i)=>`<div class="summary-row"><strong>Serie ${i+1}</strong><input type="number" value="${s.reps}" onchange="App.editCurrentSet(${i},'reps',this.value)"><input type="number" step=".5" value="${s.weight}" onchange="App.editCurrentSet(${i},'weight',this.value)"></div>`).join("")}
      </div>
      <button class="king small-king" onclick="App.completeExercise()">SIGUIENTE EJERCICIO</button>
    </div>`;
    this.show("exerciseSummary","Ejercicio")
  },

  editCurrentSet(index,field,value){
    if(!this.active?.currentSets?.[index])return;
    const n=Number(value);
    if(Number.isFinite(n))this.active.currentSets[index][field]=n;
    this.saveActive()
  },

  completeExercise(){
    if(this.actionLock)return;
    this.actionLock=true;
    setTimeout(()=>{this.actionLock=false},500);
    const e=this.currentExercise();
    if(!e||!this.active)return;

    const completedEntry={
      plannedName:e.originalName||e.name,
      name:e.name,
      exerciseId:e.libraryId||null,
      mode:e.mode||"reps",
      sets:this.active.currentSets.map(x=>({...x}))
    };

    const existingIndex=this.active.completedExercises.findIndex(
      x=>x.exerciseIndex===this.active.exerciseIndex
    );
    completedEntry.exerciseIndex=this.active.exerciseIndex;

    if(existingIndex>=0){
      this.active.completedExercises[existingIndex]=completedEntry;
    }else{
      this.active.completedExercises.push(completedEntry);
    }

    this.active.exerciseProgress[String(this.active.exerciseIndex)]={
      ...completedEntry,
      sets:completedEntry.sets.map(x=>({...x}))
    };

    if(this.active.exerciseIndex>=this.currentRoutine().items.length-1){
      this.saveActive();
      this.finishWorkout();
      return
    }

    const next=this.currentRoutine().items[this.active.exerciseIndex+1];
    document.getElementById("completedExerciseName").textContent=e.name.toUpperCase()+" COMPLETADO";
    document.getElementById("floatingNextName").textContent=next.name.toUpperCase();
    document.getElementById("floatingNextMeta").textContent=`${next.sets} × ${next.reps} · ${next.weight} kg · ${next.rest} s`;

    this.active.exerciseIndex++;
    this.active.setIndex=0;
    this.active.currentSets=[];
    this.active.phase="gym";
    this.active.restEndsAt=null;
    this.active.restLeft=0;
    this.saveActive();

    const overlay=document.getElementById("nextExerciseOverlay");
    overlay.classList.remove("closing");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden","false");

    setTimeout(()=>overlay.classList.add("closing"),2350);

    setTimeout(()=>{
      overlay.classList.remove("show","closing");
      overlay.setAttribute("aria-hidden","true");
      this.renderGym()
    },2800)
  },

  buildSessionExercises(){
    if(!this.active)return[];
    const routine=this.currentRoutine();
    const byIndex=new Map();

    // Datos consolidados al terminar cada ejercicio.
    (this.active.completedExercises||[]).forEach((entry,fallbackIndex)=>{
      const index=Number.isInteger(entry.exerciseIndex)?entry.exerciseIndex:fallbackIndex;
      if(Array.isArray(entry.sets)&&entry.sets.length){
        byIndex.set(index,{
          ...entry,
          exerciseIndex:index,
          sets:entry.sets.map(s=>({...s,weight:Number(s.weight)||0,reps:Number(s.reps)||0}))
        })
      }
    });

    // Datos guardados inmediatamente después de cada serie.
    Object.entries(this.active.exerciseProgress||{}).forEach(([key,entry])=>{
      const index=Number(key);
      if(Number.isInteger(index)&&Array.isArray(entry.sets)&&entry.sets.length){
        byIndex.set(index,{
          ...entry,
          exerciseIndex:index,
          sets:entry.sets.map(s=>({...s,weight:Number(s.weight)||0,reps:Number(s.reps)||0}))
        })
      }
    });

    // Incluye también el ejercicio actual si tiene series realizadas.
    if(Array.isArray(this.active.currentSets)&&this.active.currentSets.length){
      const e=this.currentExercise();
      byIndex.set(this.active.exerciseIndex,{
        exerciseIndex:this.active.exerciseIndex,
        plannedName:e?.originalName||e?.name||"Ejercicio",
        name:e?.name||"Ejercicio",
        exerciseId:e?.libraryId||null,
        mode:e?.mode||"reps",
        sets:this.active.currentSets.map(s=>({
          ...s,
          weight:Number(s.weight)||0,
          reps:Number(s.reps)||0
        }))
      })
    }

    return [...byIndex.values()]
      .sort((a,b)=>a.exerciseIndex-b.exerciseIndex)
      .map(entry=>({
        ...entry,
        plannedName:entry.plannedName||routine?.items?.[entry.exerciseIndex]?.name||entry.name,
        name:entry.name||routine?.items?.[entry.exerciseIndex]?.name||"Ejercicio"
      }))
  },

  finishWorkout(){
    const r=this.currentRoutine();
    if(!r||!this.active)return;

    const exercises=this.buildSessionExercises();
    const session={
      id:this.active.id,
      date:this.active.date,
      routineId:r.id,
      routineName:r.name,
      startedAt:this.active.startedAt,
      endedAt:Date.now(),
      exercises
    };

    session.totalSets=exercises.reduce((total,e)=>total+e.sets.length,0);

    // El volumen es una métrica independiente. Peso 0 nunca elimina la serie.
    session.volume=exercises.reduce(
      (total,e)=>total+e.sets.reduce(
        (sum,s)=>sum+((Number(s.weight)||0)*(Number(s.reps)||0)),
        0
      ),
      0
    );

    session.reportedExerciseCount=exercises.length;
    this.data.sessions.push(session);
    this.save();

    this.active=null;
    this.saveActive();

    const exerciseReport=exercises.map(e=>{
      const series=e.sets.map(s=>{
        const repsLabel=e.mode==="time"
          ?`${s.reps} s`
          :`${s.reps} reps`;
        const weightLabel=(Number(s.weight)||0)>0
          ?` · ${Number(s.weight)} kg`
          :` · peso corporal / sin carga externa`;
        return `${repsLabel}${weightLabel}`
      }).join("<br>");

      return `<div class="list-item"><strong>${e.name}</strong><br>${series}</div>`
    }).join("");

    document.getElementById("workoutSummary").innerHTML=
      `<div class="focus">
        <div class="eyebrow">ENTRENAMIENTO COMPLETADO</div>
        <div class="title">${r.name.toUpperCase()}</div>
        <div class="grid">
          <div class="card"><div class="title">${exercises.length}</div><div>ejercicios</div></div>
          <div class="card"><div class="title">${session.totalSets}</div><div>series</div></div>
          <div class="card"><div class="title">${Math.round(session.volume)}</div><div>kg volumen externo</div></div>
        </div>
        <div class="card">
          <div class="eyebrow">INFORME COMPLETO</div>
          <div class="list">${exerciseReport||'<div class="muted">No se registraron series.</div>'}</div>
        </div>
        <button class="king small-king" onclick="App.renderHome()">VOLVER AL INICIO</button>
      </div>`;

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
  useAlternative(name){
    const e=this.currentExercise();
    if(!e)return;
    if(!e.originalName)e.originalName=e.name;
    e.name=name;
    this.save();this.saveActive();this.closeAlternatives();this.renderGym()
  },

  renderData(withHistory=true){
    document.getElementById("data").innerHTML=`<div class="data-hub">
      <div class="eyebrow">MODO</div>
      <div class="title">DATOS</div>
      <p class="data-hub-copy">Todo lo que no necesitas durante una serie vive aquí.</p>

      <div class="data-grid">
        <button class="data-tile" onclick="App.renderRoutines()">
          <span class="data-icon">R</span>
          <span>Rutinas</span>
          <small>Crear y planificar</small>
        </button>

        <button class="data-tile" onclick="App.renderHistory()">
          <span class="data-icon">H</span>
          <span>Historial</span>
          <small>Sesiones guardadas</small>
        </button>

        <button class="data-tile" onclick="App.renderLibrary()">
          <span class="data-icon">B</span>
          <span>Biblioteca</span>
          <small>Ejercicios Phoenix</small>
        </button>

        <button class="data-tile" onclick="App.renderBackups()">
          <span class="data-icon">↥</span>
          <span>Backups</span>
          <small>Tus datos contigo</small>
        </button>

        <button class="data-tile" onclick="App.renderSettings()">
          <span class="data-icon">⚙</span>
          <span>Ajustes</span>
          <small>Configurar Phoenix</small>
        </button>
      </div>

      <div class="data-footer-note">Offline · Sin publicidad · Datos exportables</div>
    </div>`;
    this.show("data","Inicio",{history:withHistory})
  },

  renderRoutines(withHistory=true){
    document.getElementById("routines").innerHTML=`<div class="card"><div class="eyebrow">RUTINAS</div><button class="secondary" onclick="App.createRoutine()">＋ Nueva rutina</button></div>${this.data.routines.map(r=>`<div class="card"><input value="${r.name}" onchange="App.renameRoutine('${r.id}',this.value)"><div class="list">${r.items.map((e,i)=>`<div class="list-item"><strong>${i+1}. ${e.name}</strong><div class="grid"><input type="number" value="${e.sets}" onchange="App.editRoutineItem('${r.id}','${e.id}','sets',this.value)"><input type="number" value="${e.reps}" onchange="App.editRoutineItem('${r.id}','${e.id}','reps',this.value)"><input type="number" step=".5" value="${e.weight}" onchange="App.editRoutineItem('${r.id}','${e.id}','weight',this.value)"><input type="number" value="${e.rest}" onchange="App.editRoutineItem('${r.id}','${e.id}','rest',this.value)"></div></div>`).join("")}</div><button class="secondary" onclick="App.addExercise('${r.id}')">Añadir ejercicio</button><button class="secondary" onclick="App.assignToday('${r.id}')">Asignar a hoy</button></div>`).join("")}`;
    this.show("routines","Datos",{history:withHistory})
  },

  createRoutine(){const name=prompt("Nombre de la rutina","Nueva rutina");if(!name)return;this.data.routines.push({id:"r"+Date.now(),name,items:[]});this.save();this.renderRoutines()},
  renameRoutine(id,name){const r=this.getRoutine(id);if(r){r.name=name;this.save()}},
  addExercise(rid){this.pendingRoutineId=rid;this.renderLibrary(true)},
  editRoutineItem(rid,iid,field,value){const r=this.getRoutine(rid),e=r?.items.find(x=>x.id===iid);if(e){e[field]=Number(value)||0;this.save()}},
  assignToday(rid){this.data.weekPlan[new Date().getDay()]=rid;this.save();alert("Rutina asignada a hoy");this.renderHome()},


  allExercises(){return [...this.data.library,...this.data.personalExercises]},

  renderLibrary(selectMode=false){
    this.librarySelectMode=selectMode;
    document.getElementById("library").innerHTML=`<div class="card"><div class="eyebrow">BIBLIOTECA</div><div class="title">EJERCICIOS</div><div class="library-toolbar"><input id="librarySearch" placeholder="Buscar..." oninput="App.updateLibraryView()"><button class="secondary" onclick="App.openPersonalExercise()">＋ Personal</button></div><div id="libraryTabs" class="library-tabs"></div><div id="libraryList" class="list"></div></div>`;
    this.libraryGroup="Todos";
    this.updateLibraryView();
    this.show("library",selectMode?"Rutinas":"Datos")
  },

  updateLibraryView(){
    const search=(document.getElementById("librarySearch")?.value||"").toLowerCase();
    const groups=["Todos","Favoritos","Recientes",...new Set(this.allExercises().map(e=>e.group))];
    document.getElementById("libraryTabs").innerHTML=groups.map(g=>`<button class="${g===this.libraryGroup?"active":""}" onclick="App.setLibraryGroup('${g}')">${g}</button>`).join("");
    let list=this.allExercises();
    if(this.libraryGroup==="Favoritos")list=list.filter(e=>this.data.favoriteExerciseIds.includes(e.id));
    else if(this.libraryGroup==="Recientes")list=this.data.recentExerciseIds.map(id=>list.find(e=>e.id===id)).filter(Boolean);
    else if(this.libraryGroup!=="Todos")list=list.filter(e=>e.group===this.libraryGroup);
    if(search)list=list.filter(e=>e.name.toLowerCase().includes(search)||e.group.toLowerCase().includes(search));
    document.getElementById("libraryList").innerHTML=list.length?list.map(e=>this.exerciseLibraryCard(e)).join(""):`<div class="muted">Sin resultados.</div>`
  },

  setLibraryGroup(group){this.libraryGroup=group;this.updateLibraryView()},

  exerciseLibraryCard(e){
    const fav=this.data.favoriteExerciseIds.includes(e.id);
    return `<div class="exercise-card"><div><strong>${e.name}</strong><small>${e.group} · ${e.size==="large"?"Músculo grande":"Músculo pequeño"} · ${e.type==="time"?"Tiempo":e.type==="failure"?"Al fallo":"Repeticiones"}</small><div class="exercise-badges"><span class="badge ${e.official?"official":"personal"}">${e.official?"Phoenix":"Personal"}</span><span class="badge">${e.sets}×${e.reps}</span><span class="badge">${e.rest}s</span><span class="badge">+${e.increment}kg</span></div><button class="secondary" style="margin-top:10px" onclick="App.toggleFavorite('${e.id}')">${fav?"★ Favorito":"☆ Favorito"}</button></div><button onclick="${this.librarySelectMode?`App.addLibraryExerciseToRoutine('${e.id}')`:`App.previewExercise('${e.id}')`}">${this.librarySelectMode?"Añadir":"Ver"}</button></div>`
  },

  toggleFavorite(id){
    const a=this.data.favoriteExerciseIds;
    this.data.favoriteExerciseIds=a.includes(id)?a.filter(x=>x!==id):[...a,id];
    this.save();this.updateLibraryView()
  },

  previewExercise(id){
    const e=this.allExercises().find(x=>x.id===id);if(!e)return;
    alert(`${e.name}\n${e.sets}×${e.reps}\nDescanso ${e.rest}s\nIncremento ${e.increment}kg`)
  },

  addLibraryExerciseToRoutine(id){
    const e=this.allExercises().find(x=>x.id===id);
    const r=this.getRoutine(this.pendingRoutineId);
    if(!e||!r)return;
    r.items.push({id:"i"+Date.now(),libraryId:e.id,name:e.name,sets:e.sets,reps:e.reps,weight:0,rest:e.rest,mode:e.type,increment:e.increment});
    this.data.recentExerciseIds=[e.id,...this.data.recentExerciseIds.filter(x=>x!==e.id)].slice(0,12);
    this.save();this.renderRoutines()
  },

  openPersonalExercise(){document.getElementById("personalExerciseSheet").classList.add("show")},
  closePersonalExercise(){document.getElementById("personalExerciseSheet").classList.remove("show")},
  savePersonalExercise(){
    const name=document.getElementById("personalName").value.trim();
    const group=document.getElementById("personalGroup").value;
    const size=document.getElementById("personalSize").value;
    const type=document.getElementById("personalType").value;
    if(!name){alert("Escribe un nombre");return}
    const large=size==="large";
    this.data.personalExercises.push({id:"p"+Date.now(),name,group,size,type,sets:large?3:4,reps:type==="time"?(large?30:20):(large?8:12),rest:large?90:60,increment:large?2.5:.5,official:false});
    this.save();this.closePersonalExercise();document.getElementById("personalName").value="";this.updateLibraryView()
  },

  renderHistory(withHistory=true){
    document.getElementById("history").innerHTML=`<div class="card"><div class="eyebrow">HISTORIAL</div></div>${this.data.sessions.slice().reverse().map(s=>`<details class="card"><summary><strong>${s.routineName}</strong> · ${new Date(s.date).toLocaleDateString()}</summary><p>${s.totalSets} series · ${Math.round(s.volume)} kg</p>${s.exercises.map(e=>`<div class="list-item"><strong>${e.name}</strong><br>${e.sets.map(x=>{
  const w=(Number(x.weight)||0)>0?`${Number(x.weight)}kg`:"Peso corporal / 0kg";
  const unit=e.mode==="time"?"s":"reps";
  return `${w} × ${Number(x.reps)||0} ${unit}`
}).join(" · ")}</div>`).join("")}</details>`).join("")||'<div class="card muted">Todavía no hay entrenamientos guardados.</div>'}`;
    this.show("history","Datos",{history:withHistory})
  },

  renderSettings(withHistory=true){
    document.getElementById("settings").innerHTML=`<div class="card"><div class="eyebrow">AJUSTES</div><label>Peso corporal<input id="bodyWeight" type="number" step=".1" value="${this.data.profile.bodyWeight||""}"></label><button class="secondary" onclick="App.saveBodyWeight()">Guardar peso</button><label>Incremento de peso<input id="weightStep" type="number" step=".5" value="${this.data.settings.weightStep}"></label><button class="secondary" onclick="App.saveSettings()">Guardar ajustes</button></div>`;
    this.show("settings","Datos",{history:withHistory})
  },
  saveBodyWeight(){const w=Number(document.getElementById("bodyWeight").value);if(w>0){this.data.profile.bodyWeight=w;this.data.weights.push({date:new Date().toISOString(),weight:w});this.save();alert("Peso guardado")}},
  saveSettings(){const x=Number(document.getElementById("weightStep").value);if(x>0)this.data.settings.weightStep=x;this.save();alert("Ajustes guardados")},

  renderBackups(withHistory=true){
    document.getElementById("backups").innerHTML=`<div class="focus"><div class="eyebrow">BACKUPS</div><div class="title">TUS DATOS</div><button class="secondary" onclick="App.exportBackup()">Exportar JSON</button><button class="secondary" onclick="document.getElementById('importFile').click()">Importar JSON</button></div>`;
    this.show("backups","Datos",{history:withHistory})
  },
  exportBackup(){const blob=new Blob([JSON.stringify({version:7,exportedAt:new Date().toISOString(),data:this.data},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GymTracker_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)},
  importBackupFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);const data=obj.data||obj;if(!Array.isArray(data.routines)||!Array.isArray(data.sessions))throw new Error("Backup no válido");localStorage.setItem(DB_KEY,JSON.stringify(data));this.load();alert("Backup restaurado");this.renderHome()}catch(e){alert(e.message)}};r.readAsText(file)},

  beep(){try{if(!this.data.settings.sound)return;const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},180)}catch(e){}},
  buzz(v){try{if(this.data.settings.vibration&&navigator.vibrate)navigator.vibrate(v)}catch(e){}},

  init(){
    this.load();

    history.replaceState(
      {phoenix:true,screen:"home",destination:"Inicio"},
      "",
      "#home"
    );

    window.addEventListener("popstate",event=>{
      if(!this.navigationReady||this.backLock)return;
      this.backLock=true;

      const parent=this.getParentRoute();
      if(parent.screen){
        this.renderRoute(parent.screen,false);
      }else{
        // En Inicio evitamos volver accidentalmente a la web anterior.
        history.replaceState(
          {phoenix:true,screen:"home",destination:"Inicio"},
          "",
          "#home"
        );
        this.toast("Inicio")
      }

      setTimeout(()=>{this.backLock=false},80)
    });

    window.addEventListener("pagehide",()=>this.saveActive());
    window.addEventListener("beforeunload",()=>this.saveActive());

    window.addEventListener("error",event=>this.reportError(event.error||event.message));
    window.addEventListener("unhandledrejection",event=>this.reportError(event.reason));

    document.addEventListener("visibilitychange",()=>{
      if(document.hidden){
        this.saveActive()
      }else if(this.active?.phase==="rest"){
        this.resumeRest()
      }
    });

    this.renderHome(false);
    this.navigationReady=true;
    setTimeout(()=>document.getElementById("splash")?.remove(),2100)
  },

  toast(message){
    let el=document.getElementById("phoenixToast");
    if(!el){
      el=document.createElement("div");
      el.id="phoenixToast";
      el.style.cssText="position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));z-index:1000;transform:translateX(-50%);padding:12px 18px;border-radius:999px;background:#18191e;color:#fff0b8;border:1px solid rgba(255,240,184,.2);font-weight:900;box-shadow:0 14px 38px rgba(0,0,0,.5)";
      document.body.appendChild(el)
    }
    el.textContent=message;
    el.style.display="block";
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>el.style.display="none",1400)
  }
};

window.addEventListener("load",()=>App.init());
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
