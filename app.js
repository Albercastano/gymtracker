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
  dataMetric:"volume",
  openRoutineId:null,
  pedbReady:false,
  pedbManifest:null,
  pedbExercises:[],
  pedbMeta:{muscles:new Map(),zones:new Map(),equipment:new Map(),types:new Map()},
  pedbAltExpanded:false,

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
    this.data.routines.forEach(r=>{
      r.items=Array.isArray(r.items)?r.items:[];
      r.items.forEach(e=>{
        if(!e.exercise_id&&e.libraryId?.startsWith("PEX-"))e.exercise_id=e.libraryId;
        if(!e.exercise_name_snapshot)e.exercise_name_snapshot=e.name||"Ejercicio";
      })
    });
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
    this.active.exerciseOverrides=(this.active.exerciseOverrides&&typeof this.active.exerciseOverrides==="object")
      ?this.active.exerciseOverrides:{};
    this.active.restPaused=Boolean(this.active.restPaused);
    this.active.restPausedLeft=Math.max(0,Number(this.active.restPausedLeft)||0);
    this.active.phase=["gym","series","rest","summary"].includes(this.active.phase)?this.active.phase:"gym";

    if(this.active.phase==="rest" && Number(this.active.restEndsAt)>0){
      this.active.restLeft=Math.max(0,Math.ceil((Number(this.active.restEndsAt)-Date.now())/1000));
      if(this.active.restLeft<=0)this.active.phase="series";
    }
    this.saveActive();
  },

  todayRoutine(){
    const day=new Date().getDay();
    const id=this.data.weekPlan[day];
    return id?this.getRoutine(id):null
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
    const sessions=this.data.sessions||[];
    const lastSession=sessions.length?sessions[sessions.length-1]:null;
    const now=Date.now();
    const weekStart=now-(6*24*60*60*1000);
    const weekSessions=sessions.filter(s=>new Date(s.date).getTime()>=weekStart);
    const weekVolume=weekSessions.reduce((sum,s)=>sum+(Number(s.volume)||0),0);
    const bodyWeight=Number(this.data.profile?.bodyWeight)||0;
    const activeRoutine=active?this.getRoutine(active.routineId):null;
    const activeExercise=active?this.currentExercise():null;

    const lastWorkoutCard=lastSession?`
      <button class="phx-card phx-card--base phx-card--interactive home-last-card" onclick="App.renderHistory()" aria-label="Abrir historial del último entrenamiento">
        <div class="phx-card__header">
          <div>
            <div class="phx-card__eyebrow">ÚLTIMO ENTRENAMIENTO</div>
            <div class="phx-card__title">${lastSession.routineName||"Rutina"}</div>
          </div>
          <span class="phx-card__chevron" aria-hidden="true">›</span>
        </div>
        <div class="phx-card__meta">
          <span>${new Date(lastSession.date).toLocaleDateString()}</span>
          <span>${Number(lastSession.totalSets)||0} series</span>
          <span>${Math.round(Number(lastSession.volume)||0)} kg</span>
        </div>
      </button>`:`
      <div class="phx-card phx-card--base home-last-card">
        <div class="phx-card__eyebrow">ÚLTIMO ENTRENAMIENTO</div>
        <div class="phx-card__title">Aún no hay sesiones</div>
        <div class="phx-card__copy">Completa tu primer entrenamiento para ver aquí el resumen.</div>
      </div>`;

    const todayEyebrow=active?"ENTRENAMIENTO EN CURSO":"HOY TOCA";
    const todayTitle=active?(activeRoutine?.name||"Rutina"):(r?r.name:"DESCANSO");
    const todayMeta=active
      ? `<span>${Math.min((active.exerciseIndex||0)+1,activeRoutine?.items?.length||1)}/${activeRoutine?.items?.length||1} ejercicios</span><span>${activeExercise?.name||"Sesión activa"}</span><span class="estimated-time">Toca para continuar</span>`
      : r
        ? `<span>${totalExercises} ejercicios</span><span>${totalSets} series</span><span class="estimated-time">~${estimatedMinutes} min</span>`
        : `<span>Sin rutina asignada</span>`;

    document.getElementById("home").innerHTML=`<div class="home-phoenix home-definitive">
      <section class="home-brand home-brand--forged" aria-label="GymTracker Phoenix">
        <div class="home-brand__plate"><img src="icon-512.png" alt="" aria-hidden="true"></div>
        <div><div class="home-brand__name">GYMTRACKER</div><div class="home-brand__sub">PHOENIX · FORGED</div></div>
      </section>

      <section class="phx-card phx-card--highlight home-today-card home-today-card--definitive ${active?'is-active':''}" aria-labelledby="today-title">
        <div class="phx-card__eyebrow">${todayEyebrow}</div>
        <div id="today-title" class="phx-card__hero-title">${todayTitle}</div>
        <div class="home-summary">${todayMeta}</div>
        ${active?`<div class="home-active-actions"><button class="home-continue" onclick="App.resumeWorkout()">CONTINUAR</button><button class="home-discard" onclick="App.discardWorkout()">Descartar</button></div>`:""}
      </section>

      <section class="home-mode-switch" aria-label="Acciones principales">
        <button class="home-mode home-mode--gym ${active?'has-active':''}" onclick="${active?'App.resumeWorkout()':`App.startWorkout('${r?.id||""}')`}">
          <span class="home-mode__kicker">${active?'SESIÓN ACTIVA':'ENTRENAR'}</span>
          <strong>GYM</strong>
          <small>${active?'Continuar ahora':r?'Comenzar entrenamiento':'Seleccionar rutina'}</small>
        </button>
        <button class="home-mode home-mode--data" onclick="App.renderData()">
          <span class="home-mode__kicker">PROGRESO</span>
          <strong>DATOS</strong>
          <small>Historial y métricas</small>
        </button>
      </section>

      <section class="home-metrics" aria-label="Resumen rápido">
        <button class="phx-card phx-card--compact phx-card--interactive" onclick="App.renderHistory()">
          <span class="phx-card__eyebrow">7 DÍAS</span>
          <strong class="phx-metric">${weekSessions.length}</strong>
          <span class="phx-metric-label">entrenamientos</span>
        </button>
        <button class="phx-card phx-card--compact phx-card--interactive" onclick="App.renderHistory()">
          <span class="phx-card__eyebrow">VOLUMEN</span>
          <strong class="phx-metric">${Math.round(weekVolume).toLocaleString('es-ES')}</strong>
          <span class="phx-metric-label">kg · 7 días</span>
        </button>
        <button class="phx-card phx-card--compact phx-card--interactive" onclick="App.renderSettings()">
          <span class="phx-card__eyebrow">PESO</span>
          <strong class="phx-metric">${bodyWeight?bodyWeight.toFixed(1):"—"}</strong>
          <span class="phx-metric-label">${bodyWeight?"kg":"sin registrar"}</span>
        </button>
      </section>

      ${lastWorkoutCard}
    </div>`;

    this.show("home","Inicio",{history:withHistory})
  },

  startWorkout(routineId){
    const r=this.getRoutine(routineId);
    if(!r||!r.items.length){alert("No hay una rutina válida para hoy.");return}
    this.active={id:"s"+Date.now(),routineId:r.id,date:new Date().toISOString(),exerciseIndex:0,setIndex:0,currentSets:[],completedExercises:[],exerciseProgress:{},exerciseOverrides:{},startedAt:Date.now(),phase:"gym",restEndsAt:null,restLeft:0,restPaused:false,restPausedLeft:0};
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
  currentPlannedExercise(){return this.currentRoutine()?.items[this.active.exerciseIndex]},
  currentOverride(){return this.active?.exerciseOverrides?.[String(this.active.exerciseIndex)]||null},
  currentExercise(){
    const base=this.currentPlannedExercise();
    if(!base)return null;
    const override=this.currentOverride();
    return override?{...base,name:override.name,libraryId:override.exerciseId||base.libraryId,exercise_id:override.exerciseId||base.exercise_id,exercise_name_snapshot:override.name,originalName:base.name,alternativeReason:override.reason||"Alternativa"}:base
  },
  completedSeriesForCurrent(){return Math.min(Number(this.active?.setIndex)||0,Number(this.currentExercise()?.sets)||0)},

  renderGym(withHistory=true){
    if(!this.active){this.renderHome();return}
    this.normalizeActive();
    const r=this.currentRoutine(),e=this.currentExercise(),override=this.currentOverride();
    const completed=this.completedSeriesForCurrent();
    const progress=Math.max(0,Math.min(100,Math.round(((this.active.exerciseIndex+(completed/Math.max(1,e.sets)))/Math.max(1,r.items.length))*100)));
    const previous=this.active.currentSets?.[this.active.currentSets.length-1]||null;
    const remaining=Math.max(0,e.sets-completed);
    document.getElementById("gym").innerHTML=`<div class="focus gym-complete-screen">
      <section class="gym-status-strip">
        <div><span>SESIÓN</span><strong>${r.name}</strong></div>
        <div class="gym-status-strip__progress"><i style="width:${progress}%"></i></div>
        <div><span>PROGRESO</span><strong>${progress}%</strong></div>
      </section>

      <section class="exercise-stage ${override?"is-alternative":""}">
        <div class="exercise-stage__head">
          <div class="exercise-stage__index">${String(this.active.exerciseIndex+1).padStart(2,"0")}<small>/${String(r.items.length).padStart(2,"0")}</small></div>
          <div class="exercise-stage__copy">
            <div class="eyebrow">EJERCICIO ACTUAL</div>
            <h1>${e.name.toUpperCase()}</h1>
            ${override?`<div class="alternative-note">Sustituye a ${e.originalName} · ${override.reason}</div>`:""}
          </div>
          <button class="exercise-stage__alt" onclick="App.openAlternatives()" aria-label="Abrir alternativas"><b>⇄</b><span>${override?"CAMBIAR":"ALTERNATIVA"}</span></button>
        </div>

        <div class="exercise-stage__progress">
          ${Array.from({length:e.sets},(_,i)=>`<span class="${i<completed?"done":i===completed?"current":""}">${i+1}</span>`).join("")}
        </div>
      </section>

      <section class="gym-target-card">
        <div class="gym-target-card__label">OBJETIVO DE LA SIGUIENTE SERIE</div>
        <div class="gym-target-grid">
          <div><span>${e.mode==="time"?"TIEMPO":"REPS"}</span><strong>${e.reps}</strong><small>${e.mode==="time"?"segundos":"repeticiones"}</small></div>
          <div><span>PESO</span><strong>${Number(e.weight)||0}</strong><small>kg</small></div>
          <div><span>DESCANSO</span><strong>${this.formatDuration(e.rest)}</strong><small>entre series</small></div>
        </div>
      </section>

      <section class="gym-context-row">
        <div class="gym-context-card">
          <span>COMPLETADAS</span>
          <strong>${completed}/${e.sets}</strong>
          <small>${remaining} restantes</small>
        </div>
        <div class="gym-context-card">
          <span>ÚLTIMA SERIE</span>
          <strong>${previous?`${previous.reps} × ${previous.weight}`:"—"}</strong>
          <small>${previous?"reps · kg":"sin registrar"}</small>
        </div>
      </section>

      <button class="gym-primary-action" onclick="App.beginSet()"><span>${completed?"CONTINUAR":"INICIAR"} SERIE</span><b>›</b></button>
      <button class="gym-exit-action" onclick="App.pauseWorkout()">Salir sin terminar</button>
    </div>`;
    this.show("gym","Inicio",{history:withHistory})
  },

  formatDuration(seconds){
    const total=Math.max(0,Number(seconds)||0),m=Math.floor(total/60),sec=total%60;
    return m?`${m}:${String(sec).padStart(2,"0")}`:`${sec}s`
  },

  controlBox(label,field,value,step,unit=""){
    if(field==="weight"){
      return `<div class="control-box">
        <div class="control-label">${label}</div>
        <button type="button" class="arrow" aria-label="Subir peso" onclick="App.changeWeight(1)">▲</button>
        <div class="control-value">${value}${unit?`<small>${unit}</small>`:""}</div>
        <button type="button" class="arrow" aria-label="Bajar peso" onclick="App.changeWeight(-1)">▼</button>
      </div>`
    }

    return `<div class="control-box">
      <div class="control-label">${label}</div>
      <button type="button" class="arrow" onclick="App.adjustExercise('${field}',${Number(step)||1})">▲</button>
      <div class="control-value">${value}${unit?`<small>${unit}</small>`:""}</div>
      <button type="button" class="arrow" onclick="App.adjustExercise('${field}',${-(Number(step)||1)})">▼</button>
    </div>`
  },

  changeWeight(direction){
    const e=this.currentPlannedExercise();
    if(!e)return;

    const dir=Number(direction)<0?-1:1;
    let step=Number(this.data.settings?.weightStep);

    if(!Number.isFinite(step)||step<=0){
      step=0.5;
    }

    // Phoenix trabaja como mínimo en pasos de medio kilo.
    step=Math.max(0.5,step);

    const current=Number(e.weight);
    const safeCurrent=Number.isFinite(current)?current:0;
    const next=Math.max(0,safeCurrent+(dir*step));

    e.weight=Number(next.toFixed(2));

    this.save();
    this.saveActive();
    this.renderGym(false);
    this.buzz(18)
  },

  adjustExercise(field,delta){
    const e=this.currentPlannedExercise();
    if(!e)return;

    const current=Number(e[field])||0;
    const change=Number(delta)||0;

    if(field==="sets")e.sets=Math.max(1,Math.round(current+change));
    if(field==="reps")e.reps=Math.max(1,Math.round(current+change));

    if(field==="weight"){
      const step=Math.max(0.5,Number(this.data.settings.weightStep)||0.5);
      const raw=Math.max(0,current+change);
      e.weight=Math.round(raw/step)*step;
      e.weight=Number(e.weight.toFixed(2));
    }

    if(field==="rest")e.rest=Math.max(0,Math.round(current+change));

    this.save();
    this.saveActive();
    this.renderGym();
    this.buzz(18)
  },

  beginSet(){
    this.releaseTimerOrientation();
    this.normalizeActive();
    const e=this.currentExercise(),r=this.currentRoutine(),override=this.currentOverride();
    if(this.active.setIndex>=e.sets){this.renderExerciseSummary();return}
    this.active.phase="series";this.active.restEndsAt=null;this.active.restLeft=0;this.saveActive();
    const previous=this.active.currentSets?.[this.active.currentSets.length-1]||null;
    document.getElementById("series").innerHTML=`<div class="focus set-forged">
      <section class="set-header ${override?"is-alternative":""}">
        <div>
          <div class="eyebrow">${r.name} · EJERCICIO ${this.active.exerciseIndex+1}/${r.items.length}</div>
          <div class="set-header__name">${e.name.toUpperCase()}</div>
          ${override?`<div class="alternative-note">Sustituye a ${e.originalName}</div>`:""}
        </div>
        <div class="set-header__badge">SERIE<br><b>${this.active.setIndex+1}/${e.sets}</b></div>
      </section>

      <section class="set-card" aria-label="Serie actual">
        <div class="set-card__eyebrow">SERIE ACTUAL</div>
        <div class="set-card__values">
          <div class="set-value">
            <span>${e.mode==="time"?"TIEMPO":"REPETICIONES"}</span>
            <div class="set-stepper">
              <button type="button" aria-label="Reducir repeticiones" onclick="App.adjustExercise('reps',-1);App.beginSet()">−</button>
              <strong>${e.reps}</strong>
              <button type="button" aria-label="Aumentar repeticiones" onclick="App.adjustExercise('reps',1);App.beginSet()">＋</button>
            </div>
            <small>${e.mode==="time"?"segundos":"reps"}</small>
          </div>
          <div class="set-value">
            <span>PESO</span>
            <div class="set-stepper">
              <button type="button" aria-label="Reducir peso" onclick="App.changeWeight(-1);App.beginSet()">−</button>
              <strong class="weight-number" data-digits="${String(Number(e.weight)||0).length}">${this.formatLoad(e.weight)}</strong>
              <button type="button" aria-label="Aumentar peso" onclick="App.changeWeight(1);App.beginSet()">＋</button>
            </div>
            <small>kg</small>
          </div>
        </div>
        ${previous?`<div class="set-previous">Anterior · ${previous.reps} reps × ${previous.weight} kg</div>`:`<div class="set-previous">Objetivo · ${e.reps} ${e.mode==="time"?"s":"reps"} × ${this.formatLoad(e.weight)} kg</div>`}
      </section>

      <button class="set-finish" onclick="App.finishSet()"><span>TERMINAR SERIE</span><b>✓</b></button>
      <button class="set-back" onclick="App.renderGym()">Volver al ejercicio</button>
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
      alternativeReason:e.alternativeReason||null,
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
    this.active.restPaused=false;
    this.active.restPausedLeft=0;
    this.saveActive();
    this.renderRest();
    this.runRestTimer()
  },

  resumeRest(){
    clearInterval(this.timer);
    if(this.active.restPaused){this.active.restLeft=this.active.restPausedLeft;this.renderRest();return}
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
      if(this.active.restPaused){clearInterval(this.timer);return}
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
        this.updateRestDisplay();
        setTimeout(()=>this.beginSet(),650)
      }else if(remaining%5===0){
        this.saveActive()
      }
    },250)
  },

  renderRest(){
    this.requestTimerLandscape();
    const e=this.currentExercise();
    document.getElementById("rest").innerHTML=`<div class="focus casio-screen">
      <div id="casioTimer" class="casio-pro">
        <span class="casio-pro__screw casio-pro__screw--tl" aria-hidden="true"></span>
        <span class="casio-pro__screw casio-pro__screw--tr" aria-hidden="true"></span>
        <span class="casio-pro__screw casio-pro__screw--bl" aria-hidden="true"></span>
        <span class="casio-pro__screw casio-pro__screw--br" aria-hidden="true"></span>
        <div class="casio-pro__brand"><span>CASIO</span><span>PHOENIX TIMER</span></div>
        <div class="casio-pro__lcd">
          <div class="casio-pro__lcd-top"><div class="label">REST</div><div class="casio-pro__series">SET ${this.active.setIndex+1}/${e.sets}</div></div>
          <div id="restTime" class="time"></div>
          <div class="casio-pro__next">SIGUIENTE · SERIE ${this.active.setIndex+1}/${e.sets}</div>
        </div>
        <div class="casio-pro__micro"><span>ADJUST</span><span>MODE</span><span>START/STOP</span></div>
        <div class="casio-pro__controls"><button onclick="App.adjustRest(-30)">−30</button><button id="restPauseButton" onclick="App.toggleRestPause()">${this.active.restPaused?"▶":"Ⅱ"}</button><button onclick="App.adjustRest(30)">+30</button></div>
      </div>
      <button class="rest-skip" onclick="App.skipRest()">Saltar descanso</button>
    </div>`;
    this.updateRestDisplay();
    this.show("rest","Ejercicio")
  },

  updateRestDisplay(){
    const t=Math.max(0,this.active?.restLeft||0),m=Math.floor(t/60),sec=t%60;
    const el=document.getElementById("restTime");if(el)el.textContent=`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    const timer=document.getElementById("casioTimer");if(timer){timer.classList.toggle("is-warning",t>0&&t<=10);timer.classList.toggle("is-finished",t===0);timer.classList.toggle("is-paused",Boolean(this.active?.restPaused))}
  },

  adjustRest(delta){
    if(!this.active||this.active.phase!=="rest")return;
    const next=Math.max(0,(Number(this.active.restLeft)||0)+(Number(delta)||0));
    this.active.restLeft=next;
    if(this.active.restPaused)this.active.restPausedLeft=next;else this.active.restEndsAt=Date.now()+(next*1000);
    this.saveActive();this.updateRestDisplay();this.buzz(18)
  },

  toggleRestPause(){
    if(!this.active||this.active.phase!=="rest")return;
    if(this.active.restPaused){this.active.restPaused=false;this.active.restLeft=this.active.restPausedLeft;this.active.restEndsAt=Date.now()+(this.active.restLeft*1000);this.saveActive();this.renderRest();this.runRestTimer()}
    else{clearInterval(this.timer);this.active.restPaused=true;this.active.restPausedLeft=Math.max(0,Number(this.active.restLeft)||0);this.saveActive();this.renderRest()}
  },
  skipRest(){this.releaseTimerOrientation();clearInterval(this.timer);this.active.phase="series";this.active.restEndsAt=null;this.active.restLeft=0;this.active.restPaused=false;this.active.restPausedLeft=0;this.saveActive();this.beginSet()},

  formatLoad(value){
    const n=Number(value)||0;
    return Number.isInteger(n)?String(n):String(Number(n.toFixed(2))).replace('.',',')
  },

  requestTimerLandscape(){
    document.body.classList.add("timer-landscape");
    try{
      const lock=screen.orientation?.lock?.("landscape");
      if(lock&&typeof lock.catch==="function")lock.catch(()=>{});
    }catch(e){}
  },

  releaseTimerOrientation(){
    document.body.classList.remove("timer-landscape");
    try{screen.orientation?.unlock?.()}catch(e){}
  },

  renderExerciseSummary(){
    clearInterval(this.timer);
    if(this.active){this.active.phase="summary";this.saveActive()}
    const e=this.currentExercise();
    const sets=this.active?.currentSets||[];
    const totalReps=sets.reduce((a,s)=>a+(Number(s.reps)||0),0);
    const volume=sets.reduce((a,s)=>a+((Number(s.weight)||0)*(Number(s.reps)||0)),0);
    const best=sets.reduce((top,s)=>((Number(s.weight)||0)>(Number(top?.weight)||0)?s:top),sets[0]||null);
    document.getElementById("exerciseSummary").innerHTML=`<div class="focus exercise-complete-forged">
      <section class="exercise-complete-hero">
        <div>
          <div class="eyebrow">EJERCICIO COMPLETADO</div>
          <div class="exercise-complete-title">${e.name.toUpperCase()}</div>
          ${e.originalName&&e.originalName!==e.name?`<div class="exercise-complete-alt">Sustituye a ${e.originalName}${e.alternativeReason?` · ${e.alternativeReason}`:""}</div>`:""}
        </div>
        <div class="exercise-complete-check">✓</div>
      </section>

      <section class="exercise-complete-metrics">
        <div><strong>${sets.length}</strong><span>series</span></div>
        <div><strong>${totalReps}</strong><span>${e.mode==="time"?"segundos":"reps"}</span></div>
        <div><strong>${Math.round(volume)}</strong><span>kg volumen</span></div>
      </section>

      <section class="exercise-complete-card">
        <div class="exercise-complete-card__head">
          <span>REVISA ANTES DE CONTINUAR</span>
          ${best?`<b>Mejor carga · ${Number(best.weight)||0} kg</b>`:""}
        </div>
        <div class="exercise-complete-list">
          ${sets.map((s,i)=>`<div class="exercise-complete-row">
            <span>Serie ${i+1}</span>
            <label><input type="number" step=".5" value="${s.weight}" onchange="App.editCurrentSet(${i},'weight',this.value)"><small>kg</small></label>
            <label><input type="number" value="${s.reps}" onchange="App.editCurrentSet(${i},'reps',this.value)"><small>${e.mode==="time"?"s":"reps"}</small></label>
          </div>`).join("")}
        </div>
      </section>

      <button class="exercise-complete-next" onclick="App.completeExercise()"><span>${this.active.exerciseIndex>=this.currentRoutine().items.length-1?"FINALIZAR ENTRENAMIENTO":"SIGUIENTE EJERCICIO"}</span><b>→</b></button>
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
      alternativeReason:e.alternativeReason||null,
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
        alternativeReason:e?.alternativeReason||null,
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

  progressionSuggestionsFor(session,routine){
    const previousSessions=(this.data.sessions||[]).slice().reverse();
    return (session.exercises||[]).map((exercise,index)=>{
      const item=routine?.items?.[exercise.exerciseIndex??index];if(!item)return null;
      const sets=exercise.sets||[];if(!sets.length)return null;
      const targetSets=Number(item.sets)||sets.length,targetReps=Number(item.reps)||0;
      const allComplete=sets.length>=targetSets&&sets.every(x=>Number(x.reps)>=targetReps);
      const maxWeight=Math.max(0,...sets.map(x=>Number(x.weight)||0));
      const prior=previousSessions.flatMap(s=>s.exercises||[]).find(e=>(exercise.exerciseId&&e.exerciseId===exercise.exerciseId)||e.name===exercise.name);
      const priorComplete=prior&&(prior.sets||[]).length>=targetSets&&(prior.sets||[]).every(x=>Number(x.reps)>=targetReps);
      const failed=sets.filter(x=>Number(x.reps)<Math.max(1,targetReps-1)).length;
      let action="maintain",title="Mantener",reason="Consolida el rendimiento antes de subir.",nextWeight=Number(item.weight)||maxWeight,nextReps=targetReps;
      if(allComplete&&priorComplete){
        const step=Number(item.increment)||Number(this.data.settings.weightStep)||.5;
        if(step>0){action="weight";nextWeight=Math.round((Math.max(maxWeight,Number(item.weight)||0)+step)*100)/100;title=`Subir a ${nextWeight} kg`;reason="Completaste el objetivo en dos sesiones consecutivas."}
        else{action="reps";nextReps=targetReps+1;title=`Subir a ${nextReps} reps`;reason="Completaste todas las series; progresa con repeticiones."}
      }else if(allComplete){action="repeat";title="Repetir carga";reason="Primera sesión completada con este objetivo."}
      else if(failed>=2&&prior){action="reduce";nextWeight=Math.max(0,Math.round(maxWeight*.95*2)/2);title=nextWeight?`Bajar a ${nextWeight} kg`:"Reducir dificultad";reason="Dos o más series quedaron por debajo del objetivo."}
      return {id:`${session.id}-${index}`,routineId:routine.id,itemId:item.id,exerciseId:exercise.exerciseId||item.exercise_id||item.libraryId||null,name:exercise.name,action,title,reason,nextWeight,nextReps,status:"pending"}
    }).filter(Boolean)
  },

  applyProgression(id){
    const suggestion=this.lastCompletedSession?.progressionSuggestions?.find(x=>x.id===id);if(!suggestion)return;
    const item=this.getRoutine(suggestion.routineId)?.items.find(x=>x.id===suggestion.itemId);if(!item)return;
    if(["weight","reduce"].includes(suggestion.action))item.weight=suggestion.nextWeight;
    if(suggestion.action==="reps")item.reps=suggestion.nextReps;
    suggestion.status="accepted";this.save();this.toast("Progresión aplicada");this.renderProgressionSummary()
  },

  rejectProgression(id){
    const suggestion=this.lastCompletedSession?.progressionSuggestions?.find(x=>x.id===id);if(!suggestion)return;
    suggestion.status="rejected";this.save();this.toast("Se mantiene el objetivo anterior");this.renderProgressionSummary()
  },

  renderProgressionSummary(){
    const host=document.getElementById("progressionSummary");if(!host||!this.lastCompletedSession)return;
    const suggestions=this.lastCompletedSession.progressionSuggestions||[];
    host.innerHTML=suggestions.length?`<section class="workout-complete-report progression-summary"><div class="workout-complete-report__head"><span>PRÓXIMA SESIÓN</span><b>Phoenix propone · Tú decides</b></div>${suggestions.map(x=>`<div class="progression-row ${x.status}"><div><strong>${x.name}</strong><span>${x.title}</span><small>${x.reason}</small></div>${x.status==="pending"?`<div class="progression-actions"><button class="secondary" onclick="App.rejectProgression('${x.id}')">Mantener</button><button onclick="App.applyProgression('${x.id}')">Aceptar</button></div>`:`<em>${x.status==="accepted"?"Aplicada":"Rechazada"}</em>`}</div>`).join("")}</section>`:""
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
    session.volume=exercises.reduce((total,e)=>total+e.sets.reduce((sum,s)=>sum+((Number(s.weight)||0)*(Number(s.reps)||0)),0),0);
    session.reportedExerciseCount=exercises.length;
    session.durationMs=Math.max(0,session.endedAt-(Number(session.startedAt)||session.endedAt));
    session.progressionSuggestions=this.progressionSuggestionsFor(session,r);
    this.data.sessions.push(session);
    this.save();

    this.active=null;
    this.saveActive();

    const durationMin=Math.max(1,Math.round(session.durationMs/60000));
    const alternatives=exercises.filter(e=>e.plannedName&&e.plannedName!==e.name).length;
    const exerciseReport=exercises.map((e,idx)=>{
      const series=e.sets.map((s,i)=>{
        const repsLabel=e.mode==="time"?`${s.reps} s`:`${s.reps} reps`;
        const weightLabel=(Number(s.weight)||0)>0?`${Number(s.weight)} kg`:`Peso corporal`;
        return `<div class="workout-complete-set"><span>S${i+1}</span><b>${weightLabel}</b><em>${repsLabel}</em></div>`
      }).join("");
      return `<section class="workout-complete-exercise">
        <div class="workout-complete-exercise__head"><span>${String(idx+1).padStart(2,"0")}</span><div><strong>${e.name}</strong>${e.plannedName&&e.plannedName!==e.name?`<small>Sustituye a ${e.plannedName}${e.alternativeReason?` · ${e.alternativeReason}`:""}</small>`:""}</div></div>
        <div class="workout-complete-sets">${series}</div>
      </section>`
    }).join("");

    this.lastCompletedSession=session;
    document.getElementById("workoutSummary").innerHTML=`<div class="focus workout-complete-forged">
      <section class="workout-complete-hero">
        <div class="workout-complete-phoenix"><img src="icon-512.png" alt="" aria-hidden="true"></div>
        <div class="eyebrow">ENTRENAMIENTO COMPLETADO</div>
        <div class="workout-complete-title">${r.name.toUpperCase()}</div>
        <div class="workout-complete-date">${new Date(session.endedAt).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</div>
      </section>

      <section class="workout-complete-metrics">
        <div><strong>${exercises.length}</strong><span>ejercicios</span></div>
        <div><strong>${session.totalSets}</strong><span>series</span></div>
        <div><strong>${durationMin}</strong><span>minutos</span></div>
        <div><strong>${Math.round(session.volume)}</strong><span>kg volumen</span></div>
      </section>

      ${alternatives?`<div class="workout-complete-note">${alternatives} ${alternatives===1?"ejercicio adaptado":"ejercicios adaptados"} durante la sesión</div>`:""}

      <section class="workout-complete-report">
        <div class="workout-complete-report__head"><span>INFORME COMPLETO</span><b>${session.totalSets} series guardadas</b></div>
        <div class="workout-complete-list">${exerciseReport||'<div class="muted">No se registraron series.</div>'}</div>
      </section>

      <div id="progressionSummary"></div>

      <div class="workout-complete-actions">
        <button class="workout-complete-copy" onclick="App.copyLastWorkoutReport()">COPIAR PARA ENTRENADOR</button>
        <button class="workout-complete-home" onclick="App.renderHome()"><span>VOLVER AL INICIO</span><b>✓</b></button>
      </div>
    </div>`;

    this.renderProgressionSummary();
    this.show("workoutSummary","Inicio")
  },

  workoutReportText(session=this.lastCompletedSession){
    if(!session)return"";
    const mins=Math.max(1,Math.round((Number(session.durationMs)||0)/60000));
    const lines=[
      "GYMTRACKER PHOENIX",
      `Entrenamiento: ${session.routineName}`,
      `Fecha: ${new Date(session.endedAt||session.date).toLocaleString('es-ES')}`,
      `Duración: ${mins} min`,
      `Ejercicios: ${session.exercises.length} · Series: ${session.totalSets} · Volumen: ${Math.round(session.volume)} kg`,
      ""
    ];
    session.exercises.forEach((e,idx)=>{
      lines.push(`${idx+1}. ${e.name}`);
      if(e.plannedName&&e.plannedName!==e.name){
        lines.push(`   Sustituye a ${e.plannedName}${e.alternativeReason?` (${e.alternativeReason})`:""}`)
      }
      e.sets.forEach((s,i)=>{
        const weight=(Number(s.weight)||0)>0?`${Number(s.weight)} kg`:"Peso corporal";
        const unit=e.mode==="time"?" s":" reps";
        lines.push(`   S${i+1}: ${weight} × ${Number(s.reps)||0}${unit}`)
      })
    });
    return lines.join("\n")
  },

  async copyLastWorkoutReport(){
    const text=this.workoutReportText();if(!text){this.toast("No hay informe disponible");return}
    try{await navigator.clipboard.writeText(text);this.toast("Informe copiado")}
    catch(_){const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();this.toast("Informe copiado")}
  },

  pauseWorkout(){clearInterval(this.timer);this.saveActive();this.renderHome()},

  pedbCategoryForReason(reason){return reason==="En casa"?"home":reason==="Otra zona"?"different_zone":"occupied"},

  async pedbExercise(id){
    if(!id||!this.pedbReady)return null;
    return PEDB_DB.get("exercises",id)
  },

  async findPedbExerciseForItem(item){
    if(!this.pedbReady||!item)return null;
    const direct=item.exercise_id||item.libraryId;
    if(direct?.startsWith("PEX-"))return this.pedbExercise(direct);
    const target=(item.name||"").trim().toLocaleLowerCase("es");
    return this.pedbExercises.find(e=>e.name_es.toLocaleLowerCase("es")===target||
      (e.synonyms_es||[]).some(x=>x.toLocaleLowerCase("es")===target))||null
  },

  async alternativeOptions(reason="Máquina ocupada",expanded=false){
    const planned=this.currentPlannedExercise();if(!planned)return[];
    if(this.pedbReady){
      const source=await this.findPedbExerciseForItem(planned);
      if(source){
        const relations=await PEDB_DB.getRelations(source.id,this.pedbCategoryForReason(reason));
        const chosen=expanded?relations:relations.filter(r=>r.recommended);
        const limited=(chosen.length?chosen:relations).slice(0,expanded?12:3);
        const rows=await Promise.all(limited.map(async rel=>({rel,exercise:await this.pedbExercise(rel.target_id)})));
        return rows.filter(x=>x.exercise).map(({rel,exercise})=>({
          id:exercise.id,name:exercise.name_es,reason:rel.reason,recommended:Boolean(rel.recommended),score:Number(rel.score)||0
        }))
      }
    }
    const configured=this.data.alternatives[planned.name]||[];
    return configured.slice(0,expanded?12:3).map((name,i)=>({id:null,name,reason:"Mantiene el patrón",recommended:i===0,score:0}))
  },

  async openAlternatives(reason="Máquina ocupada",expanded=false){
    const planned=this.currentPlannedExercise();if(!planned)return;
    this.altReason=reason;this.pedbAltExpanded=expanded;
    document.getElementById("altCurrent").innerHTML=`<strong>${planned.name}</strong><span>${reason}${this.pedbReady?" · PEDB":""}</span>`;
    document.querySelectorAll("[data-alt-reason]").forEach(btn=>btn.classList.toggle("active",btn.dataset.altReason===reason));
    document.getElementById("altList").innerHTML=`<div class="muted">Buscando alternativas…</div>`;
    document.getElementById("alternativesSheet").classList.add("show");
    try{
      const list=await this.alternativeOptions(reason,expanded);
      document.getElementById("altList").innerHTML=list.length?list.map((item,i)=>`<button class="alt-option" onclick="App.useAlternativeEncoded('${encodeURIComponent(item.name)}','${reason}','${item.id||""}')"><span><b>${item.name}</b><small>${item.reason||"Alternativa compatible"}</small></span><em>${item.recommended?"Recomendada":"Similar"}</em></button>`).join("")+(!expanded&&this.pedbReady?`<button class="secondary" onclick="App.openAlternatives('${reason}',true)">Ver más</button>`:""):`<div class="muted">Sin alternativas configuradas para este caso.</div>`
    }catch(error){this.reportError(error);document.getElementById("altList").innerHTML=`<div class="muted">No se pudieron cargar las alternativas.</div>`}
  },
  selectAlternativeReason(reason){this.openAlternatives(reason,false)},
  closeAlternatives(){document.getElementById("alternativesSheet").classList.remove("show")},
  useAlternativeEncoded(encodedName,reason,exerciseId=""){this.useAlternative(decodeURIComponent(encodedName),reason,exerciseId)},
  useAlternative(name,reason,exerciseId=""){
    const planned=this.currentPlannedExercise();if(!planned||!this.active)return;
    this.active.exerciseOverrides[String(this.active.exerciseIndex)]={name,reason,exerciseId:exerciseId||null,originalName:planned.name,selectedAt:new Date().toISOString()};
    this.saveActive();this.closeAlternatives();this.renderGym(false);this.toast(`${name} activo`)
  },
  restorePlannedExercise(){if(!this.active)return;delete this.active.exerciseOverrides[String(this.active.exerciseIndex)];this.saveActive();this.closeAlternatives();this.renderGym(false)},

  setDataMetric(metric){
    this.dataMetric=metric;
    this.renderData(false)
  },

  renderData(withHistory=true){
    const sessions=(this.data.sessions||[]).slice().sort((a,b)=>new Date(a.endedAt||a.date)-new Date(b.endedAt||b.date));
    const now=Date.now(), weekAgo=now-(7*24*60*60*1000);
    const weekSessions=sessions.filter(s=>new Date(s.endedAt||s.date).getTime()>=weekAgo);
    const sessionSets=s=>Number(s.totalSets)||((s.exercises||[]).reduce((n,e)=>n+(e.sets||[]).length,0));
    const maxLoad=s=>Math.max(0,...(s.exercises||[]).flatMap(e=>(e.sets||[]).map(x=>Number(x.weight)||0)));
    const weekSets=weekSessions.reduce((sum,s)=>sum+sessionSets(s),0);
    const weekVolume=weekSessions.reduce((sum,s)=>sum+(Number(s.volume)||0),0);
    const weekMinutes=Math.round(weekSessions.reduce((sum,s)=>sum+(Number(s.durationMs)||0),0)/60000);
    const bodyWeight=Number(this.data.profile?.bodyWeight)||0;
    const allMax=Math.max(0,...sessions.map(maxLoad));
    const relative=bodyWeight&&allMax?allMax/bodyWeight:0;
    const latest=sessions[sessions.length-1];
    const latestName=latest?.routineName||"Sin sesiones";
    const latestDate=latest?new Date(latest.endedAt||latest.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}):"—";
    const metric=this.dataMetric||"volume";
    const labels={volume:"Volumen",load:"Carga",relative:"Fuerza relativa",weight:"Peso corporal"};
    let source=[];
    if(metric==="weight") source=(this.data.weights||[]).map(x=>({date:new Date(x.date),value:Number(x.weight)||0}));
    else source=sessions.map(s=>({
      date:new Date(s.endedAt||s.date),
      value:metric==="load"?maxLoad(s):metric==="relative"?(bodyWeight?maxLoad(s)/bodyWeight:0):(Number(s.volume)||0)
    }));
    source=source.filter(x=>Number.isFinite(x.value)&&x.value>0).slice(-8);
    const values=source.map(x=>x.value);
    const min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):1,span=Math.max(1,max-min);
    const points=values.map((v,i)=>`${10+(i*(80/Math.max(1,values.length-1)))},${82-((v-min)/span)*58}`).join(' ');
    const endValue=values.length?values[values.length-1]:0;
    const formatValue=v=>metric==="relative"?`${v.toFixed(2)}×`:metric==="weight"?`${v.toFixed(1)} kg`:metric==="load"?`${Math.round(v)} kg`:`${Math.round(v).toLocaleString('es-ES')} kg`;
    const recent=sessions.slice(-3).reverse();
    document.getElementById("data").innerHTML=`<div class="data-v2">
      <section class="data-v2__head phx-card phx-card--highlight">
        <div class="data-v2__brand"><span class="data-v2__plate"><img src="icon-512.png" alt=""></span><div><small>GYMTRACKER</small><b>PHOENIX · DATA</b></div></div>
        <div class="eyebrow">DATOS</div>
        <h1>Tu progreso,<br><em>sin ruido.</em></h1>
        <p>Lo que has hecho. Lo que estás mejorando.</p>
        <div class="data-v2__latest"><span>ÚLTIMO</span><b>${latestName}</b><small>${latestDate}</small></div>
      </section>

      <section class="data-v2__metrics" aria-label="Últimos 7 días">
        <div class="data-v2__metric"><span>SESIONES</span><strong>${weekSessions.length}</strong><small>últimos 7 días</small></div>
        <div class="data-v2__metric"><span>SERIES</span><strong>${weekSets}</strong><small>completadas</small></div>
        <div class="data-v2__metric data-v2__metric--gold"><span>VOLUMEN</span><strong>${Math.round(weekVolume).toLocaleString('es-ES')}</strong><small>kg · 7 días</small></div>
        <div class="data-v2__metric"><span>TIEMPO</span><strong>${weekMinutes}</strong><small>minutos</small></div>
      </section>

      <section class="data-v2__chart phx-card">
        <div class="data-v2__chart-head"><div><span>PROGRESO</span><h2>${labels[metric]}</h2></div><strong>${endValue?formatValue(endValue):'—'}</strong></div>
        <div class="data-v2__tabs" role="tablist">
          <button class="${metric==='load'?'active':''}" onclick="App.setDataMetric('load')">CARGA</button>
          <button class="${metric==='relative'?'active':''}" onclick="App.setDataMetric('relative')">RELATIVA</button>
          <button class="${metric==='volume'?'active':''}" onclick="App.setDataMetric('volume')">VOLUMEN</button>
          <button class="${metric==='weight'?'active':''}" onclick="App.setDataMetric('weight')">PESO</button>
        </div>
        <div class="data-v2__graph ${values.length?'':'is-empty'}">
          ${values.length?`<svg viewBox="0 0 100 92" preserveAspectRatio="none" aria-label="Gráfica de ${labels[metric]}"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8b35e" stop-opacity=".32"/><stop offset="1" stop-color="#d8b35e" stop-opacity="0"/></linearGradient></defs><path d="M10 82 L ${points.replaceAll(' ',', L ')} L90 88 L10 88 Z" fill="url(#chartFill)"/><polyline points="${points}" fill="none" stroke="#f0cc78" stroke-width="2.2" vector-effect="non-scaling-stroke"/><circle cx="${points.split(' ').at(-1).split(',')[0]}" cy="${points.split(' ').at(-1).split(',')[1]}" r="2.7" fill="#fff0b8" stroke="#7a4c0e" stroke-width="1.2"/></svg>`:`<div><b>Aún no hay datos suficientes</b><span>Completa sesiones para ver la evolución.</span></div>`}
        </div>
        <div class="data-v2__range"><button class="active">4S</button><button>3M</button><button>6M</button><button>1A</button></div>
      </section>

      <section class="data-v2__insights">
        <button onclick="App.renderHistory()"><span>HISTORIAL</span><b>Sesiones y detalle</b><em>›</em></button>
        <button onclick="App.setDataMetric('relative')"><span>FUERZA RELATIVA</span><b>${relative?relative.toFixed(2)+'×':'Sin peso corporal'}</b><em>›</em></button>
        <button onclick="App.renderSettings()"><span>PESO CORPORAL</span><b>${bodyWeight?bodyWeight.toFixed(1)+' kg':'Registrar peso'}</b><em>›</em></button>
        <button onclick="App.renderHistory()"><span>PR REALES</span><b>${allMax?Math.round(allMax)+' kg':'Sin registros'}</b><em>›</em></button>
        <button onclick="App.renderRoutines()"><span>PLANIFICACIÓN</span><b>Semana y rutinas</b><em>›</em></button>
        <button onclick="App.renderBackups()"><span>BACKUP</span><b>Tus datos contigo</b><em>›</em></button>
      </section>

      <section class="data-v2__recent">
        <div class="data-v2__section-title"><div><span>HISTORIAL RECIENTE</span><h2>Últimas sesiones</h2></div><button onclick="App.renderHistory()">VER TODO</button></div>
        ${recent.length?recent.map(s=>{const d=new Date(s.endedAt||s.date);const ex=(s.exercises||[]);const substitutions=ex.filter(e=>e.plannedName&&e.plannedName!==e.name).length;return `<button class="data-v2__session" onclick="App.renderHistory()"><time><b>${d.toLocaleDateString('es-ES',{day:'2-digit'})}</b><span>${d.toLocaleDateString('es-ES',{month:'short'}).replace('.','')}</span></time><div><strong>${s.routineName||'Entrenamiento'}</strong><small>${sessionSets(s)} series · ${Math.round((Number(s.durationMs)||0)/60000)} min${substitutions?` · ${substitutions} cambio${substitutions>1?'s':''}`:''}</small></div><em>${Math.round(Number(s.volume)||0).toLocaleString('es-ES')} kg</em></button>`}).join(''):`<div class="data-v2__empty">Tu historial aparecerá aquí después del primer entrenamiento.</div>`}
      </section>
      <div class="data-footer-note">Offline · Sin publicidad · Datos exportables</div>
    </div>`;
    this.show("data","Inicio",{history:withHistory})
  },

  renderRoutines(withHistory=true){
    const days=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    if(!this.openRoutineId&&this.data.routines.length)this.openRoutineId=this.data.routines[0].id;
    const plan=days.map((name,day)=>{
      const rid=this.data.weekPlan[day];
      const routine=rid?this.getRoutine(rid):null;
      return `<button class="week-day ${routine?'assigned':'rest'}" onclick="App.chooseDayRoutine(${day})"><span>${name}</span><b>${routine?routine.name:'Descanso'}</b><small>${routine?`${this.estimateRoutineMinutes(routine)} min`:'Toca para asignar'}</small></button>`
    }).join("");
    const cards=this.data.routines.map(r=>{
      const isOpen=this.openRoutineId===r.id;
      const assigned=Object.entries(this.data.weekPlan).filter(([,id])=>id===r.id).map(([d])=>days[Number(d)]).join(', ');
      const sets=r.items.reduce((sum,e)=>sum+(Number(e.sets)||0),0);
      return `<section class="routine-accordion ${isOpen?'open':''}">
        <button class="routine-summary" onclick="App.toggleRoutine('${r.id}')">
          <div><strong>${r.name}</strong><small>${r.items.length} ejercicios · ${sets} series · ~${this.estimateRoutineMinutes(r)} min${assigned?` · ${assigned}`:''}</small></div><span>${isOpen?'⌃':'⌄'}</span>
        </button>
        ${isOpen?`<div class="routine-body">
          <input class="routine-name" value="${r.name.replaceAll('"','&quot;')}" onchange="App.renameRoutine('${r.id}',this.value)">
          <div class="list">${r.items.map((e,i)=>`<div class="list-item"><strong>${i+1}. ${e.name}</strong><div class="grid"><label><small>Series</small><input type="number" value="${e.sets}" onchange="App.editRoutineItem('${r.id}','${e.id}','sets',this.value)"></label><label><small>Reps</small><input type="number" value="${e.reps}" onchange="App.editRoutineItem('${r.id}','${e.id}','reps',this.value)"></label><label><small>Peso</small><input type="number" step=".5" value="${e.weight}" onchange="App.editRoutineItem('${r.id}','${e.id}','weight',this.value)"></label><label><small>Descanso</small><input type="number" value="${e.rest}" onchange="App.editRoutineItem('${r.id}','${e.id}','rest',this.value)"></label></div></div>`).join("")}</div>
          <div class="routine-actions"><button class="secondary" onclick="App.addExercise('${r.id}')">Añadir ejercicio</button><button class="secondary" onclick="App.assignToday('${r.id}')">Asignar a hoy</button><button class="danger" onclick="App.deleteRoutine('${r.id}')">Eliminar rutina</button></div>
        </div>`:''}
      </section>`
    }).join("");
    document.getElementById("routines").innerHTML=`<div class="card week-planner"><div class="eyebrow">PLANIFICACIÓN SEMANAL</div><div class="week-grid">${plan}</div><p class="routine-help">Toca un día para asignar una rutina o marcar descanso.</p></div><div class="card"><div class="eyebrow">RUTINAS</div><div class="grid"><button class="secondary" onclick="App.createRoutine()">＋ Nueva rutina</button><button class="secondary" onclick="App.openRoutineTextImporter()">Importar texto</button></div></div>${cards}`;
    this.show("routines","Datos",{history:withHistory})
  },

  toggleRoutine(id){this.openRoutineId=this.openRoutineId===id?null:id;this.renderRoutines(false)},
  createRoutine(){const name=prompt("Nombre de la rutina","Nueva rutina");if(!name)return;const id="r"+Date.now();this.data.routines.push({id,name,items:[]});this.openRoutineId=id;this.save();this.renderRoutines(false)},
  renameRoutine(id,name){const r=this.getRoutine(id);if(r&&name.trim()){r.name=name.trim();this.save();this.renderRoutines(false)}},
  editRoutineItem(rid,eid,field,value){const e=this.getRoutine(rid)?.items.find(x=>x.id===eid);if(!e)return;e[field]=Number(value);this.save()},
  assignToday(rid){const day=new Date().getDay();this.assignRoutineToDay(rid,day)},
  assignRoutineToDay(rid,day){if(!this.getRoutine(rid))return;this.data.weekPlan[day]=rid;this.save();this.toast(`Rutina asignada a ${["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][day]}`);this.renderRoutines(false)},
  chooseDayRoutine(day){
    const options=this.data.routines.map((r,i)=>`${i+1}. ${r.name}`).join('\n');
    const current=this.data.weekPlan[day];
    const currentIndex=this.data.routines.findIndex(r=>r.id===current)+1;
    const answer=prompt(`Asignar ${["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][day]}:\n0. Descanso\n${options}`,String(currentIndex>0?currentIndex:0));
    if(answer===null)return;
    const n=Number(answer);
    if(n===0){delete this.data.weekPlan[day];this.save();this.renderRoutines(false);return}
    const r=this.data.routines[n-1];
    if(!r){alert('Opción no válida');return}
    this.assignRoutineToDay(r.id,day)
  },
  deleteRoutine(id){
    const r=this.getRoutine(id);if(!r)return;
    const assignedDays=Object.entries(this.data.weekPlan).filter(([,rid])=>rid===id).map(([d])=>["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][Number(d)]);
    const extra=assignedDays.length?`\nTambién se quitará de: ${assignedDays.join(', ')}.`:'';
    if(!confirm(`¿Eliminar ${r.name}?${extra}\nEl historial completado no se modificará.`))return;
    this.data.routines=this.data.routines.filter(x=>x.id!==id);
    Object.keys(this.data.weekPlan).forEach(day=>{if(this.data.weekPlan[day]===id)delete this.data.weekPlan[day]});
    if(this.openRoutineId===id)this.openRoutineId=this.data.routines[0]?.id||null;
    this.save();this.renderRoutines(false)
  },

  openRoutineTextImporter(){
    const sheet=document.getElementById("routineTextSheet");
    const input=document.getElementById("routineTextInput");
    const preview=document.getElementById("routineImportPreview");
    if(preview){preview.classList.remove("show");preview.innerHTML=""}
    if(input&&!input.value.trim())input.value="";
    sheet?.classList.add("show")
  },

  closeRoutineTextImporter(){
    document.getElementById("routineTextSheet")?.classList.remove("show")
  },

  parseRoutineText(rawText){
    const text=String(rawText||"").replace(/\r/g,"").trim();
    if(!text)throw new Error("Pega primero una rutina.");

    const lines=text.split("\n")
      .map(x=>x.trim())
      .filter(Boolean)
      .filter(x=>!/^[-=_]{3,}$/.test(x));

    if(!lines.length)throw new Error("No se encontró contenido.");

    const looksLikeExercise=line=>{
      return /(\d+)\s*[x×]\s*(\d+)/i.test(line)
        || /\b\d+\s*(?:series?|sets?)\b/i.test(line)
        || /\b\d+\s*(?:reps?|repeticiones?)\b/i.test(line);
    };

    let routineName="Rutina importada";
    let startIndex=0;

    const first=lines[0]
      .replace(/^(rutina|entrenamiento|plan)\s*[:\-]\s*/i,"")
      .trim();

    if(!looksLikeExercise(lines[0])){
      routineName=first||routineName;
      startIndex=1;
    }

    const items=[];

    for(let i=startIndex;i<lines.length;i++){
      let line=lines[i]
        .replace(/^[•·*\-–—]\s*/,"")
        .replace(/^\d+[\.\)]\s*/,"")
        .trim();

      if(!line)continue;

      const compact=line.replace(/\s+/g," ");

      let sets=null,reps=null,weight=null,rest=null,mode="reps";

      const sr=compact.match(/(\d+)\s*[x×]\s*(\d+)/i);
      if(sr){
        sets=Number(sr[1]);
        reps=Number(sr[2]);
      }else{
        const setsMatch=compact.match(/(\d+)\s*(?:series?|sets?)/i);
        const repsMatch=compact.match(/(\d+)\s*(?:reps?|repeticiones?)/i);
        if(setsMatch)sets=Number(setsMatch[1]);
        if(repsMatch)reps=Number(repsMatch[1]);
      }

      const timeMatch=compact.match(/(\d+)\s*(?:segundos?|secs?|s)\b/i);
      const restMatch=compact.match(/(?:descanso|rest)\s*[:\-]?\s*(\d+)\s*(?:segundos?|secs?|s)?/i);
      const kgMatch=compact.match(/(-?\d+(?:[.,]\d+)?)\s*kg\b/i);

      if(kgMatch)weight=Number(kgMatch[1].replace(",","."));
      if(restMatch)rest=Number(restMatch[1]);

      // Si hay más de una cifra con "s", la última suele ser el descanso.
      const allSeconds=[...compact.matchAll(/(\d+)\s*(?:segundos?|secs?|s)\b/ig)];
      if(rest===null&&allSeconds.length)rest=Number(allSeconds[allSeconds.length-1][1]);

      if(/\b(al fallo|fallo|failure)\b/i.test(compact)){
        mode="failure";
        if(reps===null)reps=0;
      }else if(/\b(tiempo|isométric|isometric|plancha|l-sit)\b/i.test(compact)&&!sr){
        mode="time";
        if(reps===null&&timeMatch)reps=Number(timeMatch[1]);
      }

      // Elimina parámetros para obtener el nombre del ejercicio.
      let name=compact
        .replace(/(\d+)\s*[x×]\s*(\d+)/ig,"")
        .replace(/\b\d+\s*(?:series?|sets?)\b/ig,"")
        .replace(/\b\d+\s*(?:reps?|repeticiones?)\b/ig,"")
        .replace(/-?\d+(?:[.,]\d+)?\s*kg\b/ig,"")
        .replace(/(?:descanso|rest)\s*[:\-]?\s*\d+\s*(?:segundos?|secs?|s)?/ig,"")
        .replace(/\b\d+\s*(?:segundos?|secs?|s)\b/ig,"")
        .replace(/\b(al fallo|fallo|failure|tiempo)\b/ig,"")
        .replace(/[|;,]+/g," ")
        .replace(/\s{2,}/g," ")
        .replace(/^[\s\-:]+|[\s\-:]+$/g,"")
        .trim();

      if(!name)continue;

      const libraryMatch=this.allExercises().find(
        e=>e.name.toLowerCase()===name.toLowerCase()
      );

      const isSmall=libraryMatch?.size==="small";
      const defaults={
        sets:libraryMatch?.sets??(isSmall?4:3),
        reps:libraryMatch?.reps??(isSmall?12:8),
        rest:libraryMatch?.rest??(isSmall?60:90),
        weight:0
      };

      items.push({
        id:"i"+Date.now()+"_"+i,
        libraryId:libraryMatch?.id||null,
        name:libraryMatch?.name||name,
        sets:Math.max(1,sets??defaults.sets),
        reps:Math.max(0,reps??defaults.reps),
        weight:Math.max(0,weight??defaults.weight),
        rest:Math.max(0,rest??defaults.rest),
        mode,
        increment:libraryMatch?.increment??0.5
      })
    }

    if(!items.length){
      throw new Error("No he podido detectar ejercicios. Usa líneas como: Press banca 3x8 80kg 90s")
    }

    return {name:routineName,items}
  },

  previewRoutineText(){
    const input=document.getElementById("routineTextInput");
    const preview=document.getElementById("routineImportPreview");
    try{
      const parsed=this.parseRoutineText(input?.value);
      preview.innerHTML=`<strong>${parsed.name}</strong><br>${parsed.items.map(
        e=>`${e.name} · ${e.sets}×${e.reps} · ${e.weight} kg · ${e.rest}s`
      ).join("<br>")}`;
      preview.classList.add("show")
    }catch(error){
      preview.innerHTML=`<span class="muted">${error.message}</span>`;
      preview.classList.add("show")
    }
  },

  importRoutineText(){
    const input=document.getElementById("routineTextInput");
    try{
      const parsed=this.parseRoutineText(input?.value);
      this.data.routines.push({
        id:"r"+Date.now(),
        name:parsed.name,
        items:parsed.items
      });
      this.save();
      this.closeRoutineTextImporter();
      if(input)input.value="";
      this.toast("Rutina importada");
      this.renderRoutines()
    }catch(error){
      alert(error.message)
    }
  },

  allExercises(){return [...(this.pedbReady?this.pedbExercises.map(e=>this.pedbToUi(e)):this.data.library),...this.data.personalExercises]},

  pedbToUi(e){
    const muscle=this.pedbMeta.muscles.get(e.muscle_id)?.name_es||"Otros";
    const typeName=this.pedbMeta.types.get(e.type_id)?.name_es||"Repeticiones";
    const isControl=/control/i.test(typeName);
    return {id:e.id,name:e.name_es,group:muscle,size:e.type_id==="PET-0002"?"large":"small",type:isControl?"time":"reps",sets:e.type_id==="PET-0002"?3:4,reps:isControl?30:(e.type_id==="PET-0002"?8:12),rest:e.type_id==="PET-0002"?90:60,increment:e.bodyweight?0:(e.type_id==="PET-0002"?2.5:.5),official:true,pedb:e}
  },

  async installPEDB(){
    try{
      this.pedbManifest=await PEDB_LOADER.install();
      const [exercises,muscles,zones,equipment,types]=await Promise.all([
        PEDB_DB.getAll("exercises"),PEDB_DB.getAll("muscles"),PEDB_DB.getAll("zones"),PEDB_DB.getAll("equipment"),PEDB_DB.getAll("exercise_types")
      ]);
      this.pedbExercises=exercises;
      this.pedbMeta={muscles:new Map(muscles.map(x=>[x.id,x])),zones:new Map(zones.map(x=>[x.id,x])),equipment:new Map(equipment.map(x=>[x.id,x])),types:new Map(types.map(x=>[x.id,x]))};
      this.pedbReady=true;
      if(this.currentScreen==="library")this.updateLibraryView();
      this.toast(`PEDB · ${exercises.length} ejercicios`)
    }catch(error){console.warn("PEDB no disponible",error);this.pedbReady=false}
  },

  renderLibrary(selectMode=false){
    this.librarySelectMode=selectMode;
    document.getElementById("library").innerHTML=`<div class="card"><div class="eyebrow">BIBLIOTECA ${this.pedbReady?`· PEDB ${this.pedbManifest?.version||""}`:""}</div><div class="title">EJERCICIOS</div><div class="library-toolbar"><input id="librarySearch" placeholder="Buscar por nombre, sinónimo o etiqueta…" oninput="App.updateLibraryView()"><button class="secondary" onclick="App.openPersonalExercise()">＋ Personal</button></div><div id="libraryTabs" class="library-tabs"></div><div id="libraryList" class="list"></div></div>`;
    this.libraryGroup="Todos";
    this.updateLibraryView();
    this.show("library",selectMode?"Rutinas":"Datos")
  },

  updateLibraryView(){
    const input=(document.getElementById("librarySearch")?.value||"").trim().toLocaleLowerCase("es");
    const all=this.allExercises();
    const groups=["Todos","Favoritos","Recientes",...new Set(all.map(e=>e.group))];
    document.getElementById("libraryTabs").innerHTML=groups.map(g=>`<button class="${g===this.libraryGroup?"active":""}" onclick="App.setLibraryGroup('${g.replaceAll("'","\'")}')">${g}</button>`).join("");
    let list=all;
    if(this.libraryGroup==="Favoritos")list=list.filter(e=>this.data.favoriteExerciseIds.includes(e.id));
    else if(this.libraryGroup==="Recientes")list=this.data.recentExerciseIds.map(id=>all.find(e=>e.id===id)).filter(Boolean);
    else if(this.libraryGroup!=="Todos")list=list.filter(e=>e.group===this.libraryGroup);
    if(input)list=list.filter(e=>{
      const p=e.pedb;return e.name.toLocaleLowerCase("es").includes(input)||e.group.toLocaleLowerCase("es").includes(input)||
      (p?.synonyms_es||[]).some(x=>x.toLocaleLowerCase("es").includes(input))||(p?.tags||[]).some(x=>x.toLocaleLowerCase("es").includes(input))
    });
    list=list.slice(0,80);
    document.getElementById("libraryList").innerHTML=list.length?list.map(e=>this.exerciseLibraryCard(e)).join(""):`<div class="muted">Sin resultados.</div>`
  },

  setLibraryGroup(group){this.libraryGroup=group;this.updateLibraryView()},

  exerciseLibraryCard(e){
    const fav=this.data.favoriteExerciseIds.includes(e.id);
    const detail=e.pedb?`${e.group} · ${this.pedbMeta.types.get(e.pedb.type_id)?.name_es||"Ejercicio"}${e.pedb.home_suitable?" · Casa":""}`:`${e.group} · ${e.size==="large"?"Músculo grande":"Músculo pequeño"}`;
    return `<div class="exercise-card"><div><strong>${e.name}</strong><small>${detail}</small><div class="exercise-badges"><span class="badge ${e.official?"official":"personal"}">${e.pedb?"PEDB":e.official?"Phoenix":"Personal"}</span><span class="badge">${e.sets}×${e.reps}</span><span class="badge">${e.rest}s</span></div><button class="secondary" style="margin-top:10px" onclick="App.toggleFavorite('${e.id}')">${fav?"★ Favorito":"☆ Favorito"}</button></div><button onclick="${this.librarySelectMode?`App.addLibraryExerciseToRoutine('${e.id}')`:`App.previewExercise('${e.id}')`}">${this.librarySelectMode?"Añadir":"Ver"}</button></div>`
  },

  toggleFavorite(id){
    const a=this.data.favoriteExerciseIds;
    this.data.favoriteExerciseIds=a.includes(id)?a.filter(x=>x!==id):[...a,id];
    this.save();this.updateLibraryView()
  },

  previewExercise(id){
    const e=this.allExercises().find(x=>x.id===id);if(!e)return;
    const meta=e.pedb?`\n${(e.pedb.tags||[]).slice(0,6).join(" · ")}`:"";
    alert(`${e.name}\n${e.sets}×${e.reps}\nDescanso ${e.rest}s${meta}`)
  },

  addLibraryExerciseToRoutine(id){
    const e=this.allExercises().find(x=>x.id===id);
    const r=this.getRoutine(this.pendingRoutineId);
    if(!e||!r)return;
    r.items.push({id:"i"+Date.now(),libraryId:e.id,exercise_id:e.id.startsWith("PEX-")?e.id:null,exercise_name_snapshot:e.name,name:e.name,sets:e.sets,reps:e.reps,weight:0,rest:e.rest,mode:e.type,increment:e.increment});
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
    const sessions=(this.data.sessions||[]).slice().reverse();
    const cards=sessions.map((s,index)=>{
      const date=new Date(s.endedAt||s.date);
      const mins=Math.max(1,Math.round((Number(s.durationMs)||0)/60000));
      const exercises=s.exercises||[];
      const substitutions=exercises.filter(e=>e.plannedName&&e.plannedName!==e.name).length;
      const id=`history-session-${index}`;
      return `<article class="history-session phx-card phx-card--base">
        <button class="history-session-head" onclick="App.toggleHistorySession('${id}',this)" aria-expanded="false">
          <div class="history-date"><span>${date.toLocaleDateString('es-ES',{weekday:'short'}).replace('.','').toUpperCase()}</span><strong>${String(date.getDate()).padStart(2,'0')}</strong><small>${date.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()}</small></div>
          <div class="history-main"><span class="eyebrow">ENTRENAMIENTO</span><h3>${s.routineName||'Sesión'}</h3><p>${exercises.length} ejercicios · ${mins} min${substitutions?` · ${substitutions} sustitución${substitutions>1?'es':''}`:''}</p></div>
          <div class="history-chevron">⌄</div>
        </button>
        <div class="history-kpis"><div><span>SERIES</span><strong>${Number(s.totalSets)||0}</strong></div><div><span>VOLUMEN</span><strong>${Math.round(Number(s.volume)||0).toLocaleString('es-ES')}</strong><small>kg</small></div><div><span>DURACIÓN</span><strong>${mins}</strong><small>min</small></div></div>
        <div id="${id}" class="history-detail" hidden>
          ${exercises.map((e,ei)=>`<section class="history-exercise"><div class="history-exercise-title"><span>${ei+1}</span><div><strong>${e.name}</strong>${e.plannedName&&e.plannedName!==e.name?`<small>Sustituye a ${e.plannedName}${e.alternativeReason?` · ${e.alternativeReason}`:''}</small>`:''}</div></div><div class="history-sets">${(e.sets||[]).map((x,si)=>{const w=(Number(x.weight)||0)>0?`${Number(x.weight)} kg`:'Peso corporal';const unit=e.mode==='time'?'s':'reps';return `<div><span>S${si+1}</span><strong>${w}</strong><em>× ${Number(x.reps)||0} ${unit}</em></div>`}).join('')}</div></section>`).join('')}
        </div>
      </article>`
    }).join('');
    document.getElementById("history").innerHTML=`<section class="history-header"><div><div class="eyebrow">DATOS</div><h2>Historial</h2><p>${sessions.length?`${sessions.length} entrenamiento${sessions.length===1?'':'s'} guardado${sessions.length===1?'':'s'}`:'Tu progreso aparecerá aquí'}</p></div></section>${cards||'<div class="phx-card phx-card--base history-empty"><strong>Aún no hay entrenamientos</strong><span>Completa una sesión para empezar tu historial.</span></div>'}`;
    this.show("history","Datos",{history:withHistory})
  },

  toggleHistorySession(id,button){
    const panel=document.getElementById(id);if(!panel)return;
    const opening=panel.hidden;panel.hidden=!opening;button.setAttribute('aria-expanded',String(opening));
    button.closest('.history-session')?.classList.toggle('is-open',opening)
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
  exportBackup(){const blob=new Blob([JSON.stringify({version:9.6,exportedAt:new Date().toISOString(),data:this.data},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GymTracker_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)},
  importBackupFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);const data=obj.data||obj;if(!Array.isArray(data.routines)||!Array.isArray(data.sessions))throw new Error("Backup no válido");localStorage.setItem(DB_KEY,JSON.stringify(data));this.load();alert("Backup restaurado");this.renderHome()}catch(e){alert(e.message)}};r.readAsText(file)},

  beep(){try{if(!this.data.settings.sound)return;const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close()},180)}catch(e){}},
  buzz(v){try{if(this.data.settings.vibration&&navigator.vibrate)navigator.vibrate(v)}catch(e){}},

  init(){
    this.load();
    this.installPEDB();

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
