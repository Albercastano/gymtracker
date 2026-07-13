const DB_KEY="gymtracker_phoenix_v8";
const ACTIVE_KEY="gymtracker_phoenix_v8_active";
const PROFILE_REGISTRY_KEY="gymtracker_phoenix_profiles_v1";
const ACTIVE_PROFILE_KEY="gymtracker_phoenix_active_profile_v1";

const App={
  data:null,
  profiles:[],
  activeProfileId:"alberto",
  pendingProfileId:null,
  needsInitialProfileChoice:false,
  currentScreen:"home",
  destination:"Inicio",
  active:null,
  timer:null,
  actionLock:false,
  backLock:false,
  navigationReady:false,
  dataMetric:"volume",
  openRoutineId:null,
  routineAccordionInitialized:false,
  planningWeekStart:null,
  openBlockId:null,
  pedbReady:false,
  pedbManifest:null,
  pedbExercises:[],
  pedbMeta:{muscles:new Map(),zones:new Map(),equipment:new Map(),patterns:new Map(),types:new Map()},
  pedbAltExpanded:false,
  storageHealthy:true,
  lastSaveAt:null,
  phoenixTapTimes:[],


  async init(){
    const origin=document.getElementById("phoenixOrigin");
    if(origin){origin.hidden=true;origin.classList.remove("show");origin.setAttribute("aria-hidden","true")}
    this.load();
    this.applyUiSettings();
    this.updateProfileChrome();
    this.bindPhoenixEasterEgg();
    history.replaceState({phoenix:true,screen:"home",destination:"Inicio"},"","#home");
    this.renderHome(false);
    setTimeout(()=>{
      document.getElementById("splash")?.remove();
      if(this.needsInitialProfileChoice)this.openProfileGate();
    },1200);
    window.addEventListener("popstate",()=>{
      const screen=(location.hash||"#home").slice(1);
      this.renderRoute(screen,false);
    });
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape")this.closePhoenixOrigin();
    });
    this.installPEDB();
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="hidden")this.persistNow();
    });
    window.addEventListener("pagehide",()=>this.persistNow());
    window.addEventListener("beforeunload",()=>this.persistNow());
  },


  bindPhoenixEasterEgg(){
    document.querySelectorAll("[data-phoenix-easter]").forEach(trigger=>{
      if(trigger.dataset.easterBound==="1")return;
      trigger.dataset.easterBound="1";
      trigger.addEventListener("click",event=>this.registerPhoenixTap(event),{passive:false});
      trigger.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" ")this.registerPhoenixTap(event);
      });
    });
  },

  registerPhoenixTap(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const now=Date.now();
    const previous=this.phoenixTapTimes||[];
    this.phoenixTapTimes=previous.filter(time=>now-time<=2400);
    this.phoenixTapTimes.push(now);
    const trigger=event?.currentTarget;
    if(trigger){
      trigger.classList.remove("phoenix-tap-pulse");
      void trigger.offsetWidth;
      trigger.classList.add("phoenix-tap-pulse");
    }
    if(this.phoenixTapTimes.length<3)return;
    this.phoenixTapTimes=[];
    try{navigator.vibrate?.([35,45,70])}catch(e){}
    this.openPhoenixOrigin();
  },

  openPhoenixOrigin(){
    const origin=document.getElementById("phoenixOrigin");
    if(!origin)return;
    origin.hidden=false;
    origin.setAttribute("aria-hidden","false");
    document.body.classList.add("phoenix-origin-open");
    const panel=origin.querySelector(".phoenix-origin__panel");
    if(panel)panel.scrollTop=0;
    requestAnimationFrame(()=>origin.classList.add("show"));
    setTimeout(()=>origin.querySelector(".phoenix-origin__close")?.focus(),120);
  },

  closePhoenixOrigin(){
    const origin=document.getElementById("phoenixOrigin");
    if(!origin)return;
    origin.classList.remove("show");
    origin.setAttribute("aria-hidden","true");
    document.body.classList.remove("phoenix-origin-open");
    setTimeout(()=>{if(!origin.classList.contains("show"))origin.hidden=true},280);
  },

  persistNow(){
    try{this.save();this.saveActive()}catch(error){this.reportError(error)}
  },

  safeAction(fn){
    if(this.actionLock)return;
    this.actionLock=true;
    try{fn()}finally{setTimeout(()=>{this.actionLock=false},220)}
  },

  reportError(error){
    console.error(error);
    try{this.toast("Ha ocurrido un error. Tus datos siguen guardados.")}catch(e){}
  },


  profileDbKey(id){return id==="alberto"?DB_KEY:`${DB_KEY}_profile_${id}`},
  profileActiveKey(id){return id==="alberto"?ACTIVE_KEY:`${ACTIVE_KEY}_profile_${id}`},
  activeProfile(){return this.profiles.find(p=>p.id===this.activeProfileId)||this.profiles[0]},
  loadProfiles(){
    try{this.profiles=JSON.parse(localStorage.getItem(PROFILE_REGISTRY_KEY)||"null")||[]}catch(e){this.profiles=[]}
    if(!Array.isArray(this.profiles)||!this.profiles.length){
      this.profiles=[{id:"alberto",name:"Alberto",createdAt:new Date().toISOString()},{id:"edy",name:"Edy",createdAt:new Date().toISOString()},{id:"churri",name:"Churri",createdAt:new Date().toISOString()},{id:"chino",name:"Chino",createdAt:new Date().toISOString()}];
    }
    if(!this.profiles.some(p=>p.id==="alberto"))this.profiles.unshift({id:"alberto",name:"Alberto",createdAt:new Date().toISOString()});
    if(!this.profiles.some(p=>p.id==="edy"))this.profiles.push({id:"edy",name:"Edy",createdAt:new Date().toISOString()});
    if(!this.profiles.some(p=>p.id==="churri"))this.profiles.push({id:"churri",name:"Churri",createdAt:new Date().toISOString()});
    if(!this.profiles.some(p=>p.id==="chino"))this.profiles.push({id:"chino",name:"Chino",createdAt:new Date().toISOString()});
    const storedActive=localStorage.getItem(ACTIVE_PROFILE_KEY);
    let urlProfile=null;
    try{urlProfile=new URLSearchParams(location.search).get("profile")}catch(e){}
    const requested=this.profiles.some(p=>p.id===urlProfile)?urlProfile:(this.profiles.some(p=>p.id===storedActive)?storedActive:"alberto");
    this.needsInitialProfileChoice=!storedActive&&!urlProfile;
    this.activeProfileId=requested;
    localStorage.setItem(PROFILE_REGISTRY_KEY,JSON.stringify(this.profiles));
    localStorage.setItem(ACTIVE_PROFILE_KEY,this.activeProfileId);
  },
  updateProfileChrome(){
    const profile=this.activeProfile();
    const el=document.getElementById("profileButton");
    const name=document.getElementById("profileButtonName");
    if(name)name.textContent=profile?.name||"Alberto";
    if(el)el.setAttribute("aria-label",`Cambiar perfil. Perfil activo: ${profile?.name||"Alberto"}`);
    document.querySelectorAll("[data-profile]").forEach(btn=>{
      const active=btn.getAttribute("data-profile")===this.activeProfileId;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-current",active?"true":"false");
      const label=btn.querySelector("span");
      const arrow=btn.querySelector("em");
      if(label)label.textContent=active?"PERFIL ACTIVO":"ENTRAR COMO";
      if(arrow)arrow.textContent=active?"✓":"→";
    });
    document.documentElement.dataset.profile=this.activeProfileId;
  },
  openProfileGate(){
    const gate=document.getElementById("profileGate");
    if(!gate)return;
    this.updateProfileChrome();
    gate.classList.add("show");
    gate.setAttribute("aria-hidden","false");
    document.body.classList.add("profile-gate-open");
    document.getElementById("profileButton")?.setAttribute("aria-expanded","true");
  },
  closeProfileGate(){
    const gate=document.getElementById("profileGate");
    if(!gate)return;
    gate.classList.remove("show");
    gate.setAttribute("aria-hidden","true");
    document.body.classList.remove("profile-gate-open");
    document.getElementById("profileButton")?.setAttribute("aria-expanded","false");
  },
  selectProfileAndReload(id){
    if(!this.profiles.some(p=>p.id===id))return;
    try{this.persistNow()}catch(e){}
    try{localStorage.setItem(ACTIVE_PROFILE_KEY,id)}catch(e){}
    const current=this.activeProfileId;
    if(id===current){
      this.closeProfileGate();
      this.toast(`Perfil activo: ${this.activeProfile()?.name||id}`);
      return;
    }
    try{
      location.reload();
    }catch(e){
      this.performProfileSwitch(id);
      this.closeProfileGate();
    }
  },
  profileSelectChanged(id){this.selectProfileAndReload(id)},
  openProfileSheet(){
    const sheet=document.getElementById("profileSheet");
    const list=document.getElementById("profileList");
    if(!sheet||!list)return;
    list.innerHTML=this.profiles.map(p=>`<button type="button" class="profile-choice ${p.id===this.activeProfileId?'active':''}" onclick="App.selectProfileAndReload('${p.id}')"><span>${p.id===this.activeProfileId?'PERFIL ACTIVO':'CAMBIAR A'}</span><b>${this.escape(p.name)}</b><em>${p.id===this.activeProfileId?'✓':'ENTRAR'}</em></button>`).join("");
    sheet.classList.add("show");
    document.body.classList.add("sheet-open");
    document.getElementById("profileButton")?.setAttribute("aria-expanded","true");
  },
  closeProfileSheet(){document.getElementById("profileSheet")?.classList.remove("show");document.body.classList.remove("sheet-open");document.getElementById("profileButton")?.setAttribute("aria-expanded","false")},
  switchProfile(id){
    if(!id)return;
    if(id===this.activeProfileId){
      localStorage.setItem(ACTIVE_PROFILE_KEY,id);
      this.needsInitialProfileChoice=false;
      this.updateProfileChrome();
      this.closeProfileSheet();
      this.toast(`Perfil activo: ${this.activeProfile()?.name||id}`);
      return
    }
    const target=this.profiles.find(p=>p.id===id);
    if(!target)return;
    // Siempre seleccionable. Si hay sesión en curso se guarda y queda pausada en su perfil.
    this.performProfileSwitch(id);
  },
  performProfileSwitch(id){
    if(!id||id===this.activeProfileId)return;
    const target=this.profiles.find(p=>p.id===id);
    if(!target)return;
    this.persistNow();
    if(this.timer){clearInterval(this.timer);this.timer=null}
    this.closeProfileSheet();
    this.closeProfileGate();
    document.getElementById("profileConfirmSheet")?.classList.remove("show");
    document.body.classList.remove("sheet-open");
    this.activeProfileId=id;
    this.needsInitialProfileChoice=false;
    localStorage.setItem(ACTIVE_PROFILE_KEY,id);
    this.loadProfileData();
    this.applyUiSettings();
    this.updateProfileChrome();
    this.pendingProfileId=null;
    this.renderHome(false);
    this.toast(`Perfil activo: ${target.name}`);
  },
  closeProfileConfirm(){
    document.getElementById("profileConfirmSheet")?.classList.remove("show");
    this.pendingProfileId=null;
  },
  confirmProfileSwitch(){
    const id=this.pendingProfileId;
    if(!id||id===this.activeProfileId){this.closeProfileConfirm();return}
    this.performProfileSwitch(id);
  },
  loadProfileData(){
    try{this.data=JSON.parse(localStorage.getItem(this.profileDbKey(this.activeProfileId)))}catch(e){this.data=null}
    if(!this.data)this.data=this.defaults();
    this.normalize();this.save();
    try{this.active=JSON.parse(localStorage.getItem(this.profileActiveKey(this.activeProfileId))||"null")}catch(e){this.active=null}
    if(this.active)this.normalizeActive();
  },

  defaults(){
    return{
      settings:{weightStep:.5,defaultRest:90,sound:true,vibration:true,planningMode:"fixed",fontScale:"normal",timerOrientation:"auto"},
      profile:{bodyWeight:null},
      routines:[
        {id:"r1",name:"Torso A",day:1,items:[
          {id:"i1",name:"Press banca",sets:3,reps:8,weight:80,rest:90,mode:"reps"},
          {id:"i2",name:"Dominadas",sets:3,reps:8,weight:0,rest:90,mode:"reps"},
          {id:"i3",name:"Remo con barra",sets:3,reps:10,weight:60,rest:90,mode:"reps"}
        ]}
      ],
      weekPlan:{1:"r1"},
      baseWeekPlan:{0:"r1"},
      weeklyPlans:{},
      trainingBlocks:[],
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
    this.loadProfiles();
    this.loadProfileData();
  },

  normalize(){
    this.data.settings=this.data.settings||{weightStep:.5,defaultRest:90,sound:true,vibration:true,planningMode:"fixed",fontScale:"normal",timerOrientation:"auto"};
    if(!["fixed","clear"].includes(this.data.settings.planningMode))this.data.settings.planningMode="fixed";
    if(!["normal","large","xl"].includes(this.data.settings.fontScale))this.data.settings.fontScale="normal";
    if(!["auto","portrait","landscape"].includes(this.data.settings.timerOrientation))this.data.settings.timerOrientation="auto";
    this.data.settings.defaultRest=Math.max(0,Number(this.data.settings.defaultRest)||90);
    this.data.settings.sound=this.data.settings.sound!==false;
    this.data.settings.vibration=this.data.settings.vibration!==false;
    this.data.profile=this.data.profile||{bodyWeight:null};
    this.data.routines=Array.isArray(this.data.routines)?this.data.routines:[];
    this.data.weekPlan=this.data.weekPlan||{};
    this.data.weeklyPlans=(this.data.weeklyPlans&&typeof this.data.weeklyPlans==="object")?this.data.weeklyPlans:{};
    if(!this.data.baseWeekPlan||typeof this.data.baseWeekPlan!=="object"){
      const legacy={};
      Object.entries(this.data.weekPlan||{}).forEach(([jsDay,rid])=>{
        const n=Number(jsDay),mondayIndex=n===0?6:n-1;if(rid)legacy[mondayIndex]=rid
      });
      const current=this.data.weeklyPlans[this.weekKey(new Date())]||{};
      this.data.baseWeekPlan=Object.keys(current).length?{...current}:{...legacy};
    }
    this.data.trainingBlocks=Array.isArray(this.data.trainingBlocks)?this.data.trainingBlocks:[];
    this.data.sessions=Array.isArray(this.data.sessions)?this.data.sessions:[];
    this.data.weights=Array.isArray(this.data.weights)?this.data.weights:[];
    this.data.alternatives=this.data.alternatives||{};
    this.data.library=Array.isArray(this.data.library)?this.data.library:this.defaults().library;
    this.data.personalExercises=Array.isArray(this.data.personalExercises)?this.data.personalExercises:[];
    this.data.recentExerciseIds=Array.isArray(this.data.recentExerciseIds)?this.data.recentExerciseIds:[];
    this.data.favoriteExerciseIds=Array.isArray(this.data.favoriteExerciseIds)?this.data.favoriteExerciseIds:[];
    this.data.archiveIndex=Array.isArray(this.data.archiveIndex)?this.data.archiveIndex:[];
    this.data.backupLog=Array.isArray(this.data.backupLog)?this.data.backupLog:[];
    this.data.routines.forEach(r=>{
      r.items=Array.isArray(r.items)?r.items:[];
      r.items.forEach(e=>{
        if(!e.exercise_id&&/^(PEX|USR-EX)-/.test(e.libraryId||""))e.exercise_id=e.libraryId;
        if(!e.exercise_name_snapshot)e.exercise_name_snapshot=e.name||"Ejercicio";
      })
    });
  },

  save(){
    try{
      localStorage.setItem(this.profileDbKey(this.activeProfileId),JSON.stringify(this.data));
      this.storageHealthy=true;this.lastSaveAt=Date.now();return true
    }catch(error){
      this.storageHealthy=false;console.error("Phoenix save error",error);
      try{this.toast("No se pudo guardar. Libera espacio y no cierres la app.")}catch(e){}
      return false
    }
  },
  saveActive(){
    try{
      this.active?localStorage.setItem(this.profileActiveKey(this.activeProfileId),JSON.stringify(this.active)):localStorage.removeItem(this.profileActiveKey(this.activeProfileId));
      this.storageHealthy=true;this.lastSaveAt=Date.now();return true
    }catch(error){
      this.storageHealthy=false;console.error("Phoenix active save error",error);
      try{this.toast("La sesión sigue abierta, pero no pudo guardarse.")}catch(e){}
      return false
    }
  },

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

  isoDate(date){
    const d=new Date(date);
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`
  },

  mondayOf(date=new Date()){
    const d=new Date(date);
    d.setHours(12,0,0,0);
    const jsDay=d.getDay();
    const delta=jsDay===0?-6:1-jsDay;
    d.setDate(d.getDate()+delta);
    return d
  },

  weekKey(date=new Date()){return this.isoDate(this.mondayOf(date))},

  getWeekPlan(date=new Date(),create=false){
    const key=this.weekKey(date);
    if(this.data.settings.planningMode==="clear"){
      if(create&&!this.data.weeklyPlans[key])this.data.weeklyPlans[key]={};
      return {...(this.data.weeklyPlans[key]||{})}
    }
    const result={...(this.data.baseWeekPlan||{})};
    const overrides=this.data.weeklyPlans[key]||{};
    Object.entries(overrides).forEach(([day,rid])=>{
      if(rid===null||rid==="")delete result[day];else result[day]=rid
    });
    return result
  },

  setPlanningDay(day,rid,scope="week"){
    const monday=this.mondayOf(new Date((this.planningWeekStart||this.weekKey(new Date()))+"T12:00:00"));
    const key=this.weekKey(monday);
    if(this.data.settings.planningMode==="clear")scope="week";
    if(scope==="base"){
      if(rid)this.data.baseWeekPlan[day]=rid;else delete this.data.baseWeekPlan[day];
    }else if(scope==="forward"){
      if(rid)this.data.baseWeekPlan[day]=rid;else delete this.data.baseWeekPlan[day];
      Object.keys(this.data.weeklyPlans).filter(k=>k>=key).forEach(k=>{
        if(this.data.weeklyPlans[k])delete this.data.weeklyPlans[k][day]
      });
    }else{
      this.data.weeklyPlans[key]=this.data.weeklyPlans[key]||{};
      this.data.weeklyPlans[key][day]=rid||null;
    }
    this.save()
  },

  todayRoutine(){
    const now=new Date();
    const jsDay=now.getDay();
    const mondayIndex=jsDay===0?6:jsDay-1;
    const plan=this.getWeekPlan(now,true);
    const id=plan[mondayIndex];
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
      blocks:{screen:"routines",destination:"Planificación"},
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
    if(target==="blocks"){this.renderBlocks(withHistory);return}
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

    const storageNotice=this.storageHealthy?"":`<section class="system-alert" role="alert"><strong>GUARDADO EN PAUSA</strong><span>El dispositivo no permite guardar ahora. Libera espacio antes de cerrar GymTracker.</span></section>`;
    document.getElementById("home").innerHTML=`<div class="home-phoenix home-definitive">${storageNotice}
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
        <div class="casio-pro__brand"><span>PHOENIX</span><span>FORGED TIMER</span></div>
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

  buzz(pattern=18){
    if(!this.data?.settings?.vibration)return;
    try{navigator.vibrate?.(pattern)}catch(e){}
  },

  beep(){
    if(!this.data?.settings?.sound)return;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      const ctx=new AudioCtx();
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(880,ctx.currentTime);
      gain.gain.setValueAtTime(.0001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.015);
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.24);
      osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.26);
      osc.onended=()=>ctx.close?.()
    }catch(e){}
  },

  applyUiSettings(){
    const scale=this.data?.settings?.fontScale||"normal";
    document.documentElement.dataset.fontScale=scale;
  },

  requestTimerLandscape(){
    const mode=this.data?.settings?.timerOrientation||"auto";
    document.body.classList.toggle("timer-landscape",mode!=="portrait");
    if(mode==="portrait")return;
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

  detectSessionPRs(session){
    const previous=(this.data.sessions||[]).flatMap(s=>s.exercises||[]);
    const prs=[];
    (session.exercises||[]).forEach((exercise,index)=>{
      const matches=previous.filter(e=>(exercise.exerciseId&&e.exerciseId===exercise.exerciseId)||String(e.name||"").toLowerCase()===String(exercise.name||"").toLowerCase());
      if(!matches.length)return;
      const currentSets=exercise.sets||[];
      const previousSets=matches.flatMap(e=>e.sets||[]);
      if(!currentSets.length||!previousSets.length)return;
      if(exercise.mode==="time"){
        const currentBest=Math.max(0,...currentSets.map(x=>Number(x.reps)||0));
        const previousBest=Math.max(0,...previousSets.map(x=>Number(x.reps)||0));
        if(currentBest>previousBest)prs.push({exerciseIndex:exercise.exerciseIndex??index,name:exercise.name,type:"time",label:`${currentBest} s`,detail:`Nuevo récord de tiempo · antes ${previousBest} s`});
        return;
      }
      const currentMaxWeight=Math.max(0,...currentSets.map(x=>Number(x.weight)||0));
      const previousMaxWeight=Math.max(0,...previousSets.map(x=>Number(x.weight)||0));
      if(currentMaxWeight>previousMaxWeight&&currentMaxWeight>0){
        prs.push({exerciseIndex:exercise.exerciseIndex??index,name:exercise.name,type:"weight",label:`${currentMaxWeight} kg`,detail:`Nueva carga máxima · antes ${previousMaxWeight} kg`});
        return;
      }
      if(currentMaxWeight===0&&previousMaxWeight===0){
        const currentReps=Math.max(0,...currentSets.map(x=>Number(x.reps)||0));
        const previousReps=Math.max(0,...previousSets.map(x=>Number(x.reps)||0));
        if(currentReps>previousReps){
          prs.push({exerciseIndex:exercise.exerciseIndex??index,name:exercise.name,type:"reps",label:`${currentReps} reps`,detail:`Nuevo récord de repeticiones · antes ${previousReps}`});
          return;
        }
      }
      const currentBestVolume=Math.max(0,...currentSets.map(x=>(Number(x.weight)||0)*(Number(x.reps)||0)));
      const previousBestVolume=Math.max(0,...previousSets.map(x=>(Number(x.weight)||0)*(Number(x.reps)||0)));
      if(currentBestVolume>previousBestVolume&&currentBestVolume>0){
        prs.push({exerciseIndex:exercise.exerciseIndex??index,name:exercise.name,type:"set-volume",label:`${Math.round(currentBestVolume)} kg`,detail:`Nuevo récord de volumen en una serie · antes ${Math.round(previousBestVolume)} kg`});
      }
    });
    return prs;
  },

  saveWorkoutNotes(){
    const session=this.lastCompletedSession;if(!session)return;
    const input=document.getElementById("workoutNotes");
    session.notes=String(input?.value||"").trim();
    const stored=(this.data.sessions||[]).find(x=>x.id===session.id);
    if(stored)stored.notes=session.notes;
    this.save();
    const state=document.getElementById("workoutNotesState");
    if(state)state.textContent=session.notes?"Nota guardada":"Sin nota";
    this.toast(session.notes?"Nota guardada":"Nota eliminada")
  },

  async shareLastWorkoutReport(){
    const text=this.workoutReportText();if(!text){this.toast("No hay informe disponible");return}
    if(navigator.share){
      try{await navigator.share({title:`GymTracker Phoenix · ${this.lastCompletedSession?.routineName||"Entrenamiento"}`,text});return}catch(error){if(error?.name==="AbortError")return}
    }
    await this.copyLastWorkoutReport();
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
    session.prs=this.detectSessionPRs(session);
    session.notes="";
    session.progressionSuggestions=this.progressionSuggestionsFor(session,r);
    this.data.sessions.push(session);
    this.save();

    this.active=null;
    this.saveActive();

    const durationMin=Math.max(1,Math.round(session.durationMs/60000));
    const alternatives=exercises.filter(e=>e.plannedName&&e.plannedName!==e.name).length;
    const prReport=(session.prs||[]).map(pr=>`<div class="workout-pr-row"><span>PR</span><div><strong>${pr.name}</strong><small>${pr.detail}</small></div><b>${pr.label}</b></div>`).join("");
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
        <div class="workout-saved-state">✓ SESIÓN GUARDADA</div>
      </section>

      <section class="workout-complete-metrics">
        <div><strong>${exercises.length}</strong><span>ejercicios</span></div>
        <div><strong>${session.totalSets}</strong><span>series</span></div>
        <div><strong>${durationMin}</strong><span>minutos</span></div>
        <div><strong>${Math.round(session.volume)}</strong><span>kg volumen</span></div>
      </section>

      ${alternatives?`<div class="workout-complete-note">${alternatives} ${alternatives===1?"ejercicio adaptado":"ejercicios adaptados"} durante la sesión</div>`:""}

      ${prReport?`<section class="workout-complete-report workout-pr-report"><div class="workout-complete-report__head"><span>NUEVOS RÉCORDS</span><b>${session.prs.length} PR real${session.prs.length===1?"":"es"}</b></div><div class="workout-pr-list">${prReport}</div></section>`:""}

      <section class="workout-complete-report">
        <div class="workout-complete-report__head"><span>INFORME COMPLETO</span><b>${session.totalSets} series guardadas</b></div>
        <div class="workout-complete-list">${exerciseReport||'<div class="muted">No se registraron series.</div>'}</div>
      </section>

      <div id="progressionSummary"></div>

      <section class="workout-complete-report workout-notes-card">
        <div class="workout-complete-report__head"><span>NOTAS DE LA SESIÓN</span><b id="workoutNotesState">Sin nota</b></div>
        <textarea id="workoutNotes" class="workout-notes-input" maxlength="500" placeholder="Sensaciones, molestias, técnica, cambios para la próxima sesión..."></textarea>
        <button class="workout-notes-save" onclick="App.saveWorkoutNotes()">GUARDAR NOTA</button>
      </section>

      <div class="workout-complete-actions">
        <div class="workout-share-grid">
          <button class="workout-complete-copy" onclick="App.copyLastWorkoutReport()">COPIAR PARA ENTRENADOR</button>
          <button class="workout-complete-copy" onclick="App.shareLastWorkoutReport()">COMPARTIR RESUMEN</button>
        </div>
        <button class="workout-complete-home" onclick="App.renderHome()"><span>FINALIZAR Y VOLVER</span><b>✓</b></button>
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
    if((session.prs||[]).length){
      lines.push("",`PR: ${(session.prs||[]).map(x=>`${x.name} · ${x.label}`).join(" | ")}`)
    }
    if(session.notes)lines.push("",`Notas: ${session.notes}`);
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
    if(/^(PEX|USR-EX)-/.test(direct||""))return this.pedbExercise(direct);
    return this.matchPedbByName(item.name||item.exercise_name_snapshot)||null
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
        <button onclick="App.openWeightSheet()"><span>PESO CORPORAL</span><b>${bodyWeight?bodyWeight.toFixed(1)+' kg':'Registrar peso'}</b><em>›</em></button>
        <button onclick="App.renderHistory()"><span>PR REALES</span><b>${allMax?Math.round(allMax)+' kg':'Sin registros'}</b><em>›</em></button>
        <button onclick="App.renderRoutines()"><span>PLANIFICACIÓN</span><b>Semana y rutinas</b><em>›</em></button>
        <button onclick="App.renderBlocks()"><span>BLOQUES</span><b>Progresión por semanas</b><em>›</em></button>
        <button onclick="App.renderLibrary(false)"><span>BIBLIOTECA PEDB</span><b>Ejercicios, búsqueda y favoritos</b><em>›</em></button>
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
    const dayNames=["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"];
    const fullDayNames=["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
    if(!this.planningWeekStart)this.planningWeekStart=this.weekKey(new Date());
    const monday=this.mondayOf(new Date(this.planningWeekStart+"T12:00:00"));
    const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);
    const planData=this.getWeekPlan(monday,true);
    if(!this.routineAccordionInitialized){
      this.openRoutineId=this.data.routines[0]?.id||null;
      this.routineAccordionInitialized=true;
    }

    const sessionForDay=(date)=>this.data.sessions.find(s=>this.isoDate(new Date(s.endedAt||s.date))===this.isoDate(date));
    let plannedCount=0,estimatedMinutes=0,completedCount=0;
    const plan=dayNames.map((name,day)=>{
      const date=new Date(monday);date.setDate(monday.getDate()+day);
      const rid=planData[day];
      const routine=rid?this.getRoutine(rid):null;
      const session=sessionForDay(date);
      if(routine){plannedCount++;estimatedMinutes+=this.estimateRoutineMinutes(routine)}
      if(session)completedCount++;
      const today=this.isoDate(date)===this.isoDate(new Date());
      const state=session?'Completado':today?'Hoy':routine?'Pendiente':'Descanso';
      return `<button class="week-day ${routine?'assigned':'rest'} ${today?'today':''} ${session?'completed':''}" onclick="App.chooseDayRoutine(${day})"><span>${name} · ${date.getDate()}</span><b>${routine?routine.name:'Descanso'}</b><small>${routine?`${this.estimateRoutineMinutes(routine)} min · ${state}`:state}</small></button>`
    }).join("");

    const cards=this.data.routines.map(r=>{
      const isOpen=this.openRoutineId===r.id;
      const assigned=Object.entries(planData).filter(([,id])=>id===r.id).map(([d])=>dayNames[Number(d)]).join(', ');
      const sets=r.items.reduce((sum,e)=>sum+(Number(e.sets)||0),0);
      return `<section class="routine-accordion ${isOpen?'open':''}">
        <button class="routine-summary" onclick="App.toggleRoutine('${r.id}')">
          <div><strong>${r.name}</strong><small>${r.items.length} ejercicios · ${sets} series · ~${this.estimateRoutineMinutes(r)} min${assigned?` · ${assigned}`:''}</small></div><span>${isOpen?'⌃':'⌄'}</span>
        </button>
        ${isOpen?`<div class="routine-body">
          <input class="routine-name" value="${r.name.replaceAll('"','&quot;')}" onchange="App.renameRoutine('${r.id}',this.value)">
          <div class="list routine-editor-list">${r.items.map((e,i)=>`<div class="list-item routine-item-card">
            <div class="routine-item-head"><div><small>EJERCICIO ${i+1}</small><strong>${e.name}</strong>${e.exercise_id?`<em>${e.exercise_id.startsWith('USR-EX-')?'Personal PEDB':'PEDB'}</em>`:''}</div><div class="routine-item-order"><button class="mini" onclick="App.moveRoutineItem('${r.id}','${e.id}',-1)" ${i===0?'disabled':''}>↑</button><button class="mini" onclick="App.moveRoutineItem('${r.id}','${e.id}',1)" ${i===r.items.length-1?'disabled':''}>↓</button></div></div>
            <div class="grid routine-fields"><label><small>Modo</small><select onchange="App.editRoutineItem('${r.id}','${e.id}','mode',this.value)"><option value="reps" ${(e.mode||'reps')==='reps'?'selected':''}>Repeticiones</option><option value="time" ${e.mode==='time'?'selected':''}>Tiempo</option></select></label><label><small>Series</small><input type="number" min="1" value="${e.sets}" onchange="App.editRoutineItem('${r.id}','${e.id}','sets',this.value)"></label><label><small>${e.mode==='time'?'Segundos':'Reps'}</small><input type="number" min="1" value="${e.reps}" onchange="App.editRoutineItem('${r.id}','${e.id}','reps',this.value)"></label><label><small>Peso kg</small><input type="number" step=".5" min="0" value="${e.weight}" onchange="App.editRoutineItem('${r.id}','${e.id}','weight',this.value)"></label><label><small>Descanso s</small><input type="number" min="0" step="5" value="${e.rest}" onchange="App.editRoutineItem('${r.id}','${e.id}','rest',this.value)"></label><label><small>Superserie</small><select onchange="App.editRoutineItem('${r.id}','${e.id}','superset',this.value)"><option value="" ${!e.superset?'selected':''}>No</option><option value="A" ${e.superset==='A'?'selected':''}>Grupo A</option><option value="B" ${e.superset==='B'?'selected':''}>Grupo B</option><option value="C" ${e.superset==='C'?'selected':''}>Grupo C</option></select></label></div>
            <div class="routine-item-actions"><button class="secondary compact" onclick="App.duplicateRoutineItem('${r.id}','${e.id}')">Duplicar</button><button class="danger compact" onclick="App.deleteRoutineItem('${r.id}','${e.id}')">Eliminar ejercicio</button></div>
          </div>`).join("")||`<div class="routine-empty">Todavía no hay ejercicios en esta rutina.</div>`}</div>
          <div class="routine-actions"><button class="secondary" onclick="App.addExercise('${r.id}')">Añadir ejercicio</button><button class="secondary" onclick="App.assignToday('${r.id}')">Asignar a hoy</button><button class="secondary" onclick="App.duplicateRoutine('${r.id}')">Duplicar rutina</button><button class="danger" onclick="App.deleteRoutine('${r.id}')">Eliminar rutina</button></div>
        </div>`:''}
      </section>`
    }).join("");

    const range=`${monday.getDate()} ${monday.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()} – ${sunday.getDate()} ${sunday.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()}`;
    document.getElementById("routines").innerHTML=`<div class="card week-planner"><div class="eyebrow">PLANIFICACIÓN SEMANAL · ${this.data.settings.planningMode==='fixed'?'PLAN FIJO':'SEMANA INDEPENDIENTE'}</div><div class="week-nav"><button onclick="App.shiftPlanningWeek(-1)">‹</button><strong>${range}</strong><button onclick="App.shiftPlanningWeek(1)">›</button></div><div class="week-summary"><span><b>${plannedCount}</b> sesiones</span><span><b>${estimatedMinutes}</b> min</span><span><b>${completedCount}</b> completadas</span></div><div class="week-grid">${plan}</div><div class="week-actions"><button class="secondary" onclick="App.goCurrentWeek()">Semana actual</button><button class="secondary" onclick="App.openPlanningRepeatSheet()">Configurar repetición</button></div><p class="routine-help">Semana de lunes a domingo. ${this.data.settings.planningMode==='fixed'?'La base se repite automáticamente; puedes crear excepciones puntuales.':'Cada lunes comienza en descanso y solo muestra lo que asignes.'}</p></div><div class="card"><div class="eyebrow">RUTINAS</div><div class="grid"><button class="secondary" onclick="App.createRoutine()">＋ Nueva rutina</button><button class="secondary" onclick="App.openRoutineTextImporter()">Importar texto</button><button class="secondary" onclick="App.renderLibrary(false)">Biblioteca PEDB</button><button class="secondary" onclick="App.renderBlocks()">Bloques</button></div></div>${cards}`;
    this.show("routines","Datos",{history:withHistory})
  },

  shiftPlanningWeek(delta){
    const d=this.mondayOf(new Date(this.planningWeekStart+"T12:00:00"));d.setDate(d.getDate()+delta*7);this.planningWeekStart=this.weekKey(d);this.renderRoutines(false)
  },
  goCurrentWeek(){this.planningWeekStart=this.weekKey(new Date());this.renderRoutines(false)},
  copyPreviousWeek(){this.toast("La planificación ya no necesita copiarse.")},

  toggleRoutine(id){this.openRoutineId=this.openRoutineId===id?null:id;this.renderRoutines(false)},
  addExercise(rid){
    const r=this.getRoutine(rid);if(!r)return;
    this.pendingRoutineId=rid;
    this.renderLibrary(true)
  },
  createRoutine(){const name=prompt("Nombre de la rutina","Nueva rutina");if(!name)return;const id="r"+Date.now();this.data.routines.push({id,name,items:[]});this.openRoutineId=id;this.save();this.renderRoutines(false)},
  renameRoutine(id,name){const r=this.getRoutine(id);if(r&&name.trim()){r.name=name.trim();this.save();this.renderRoutines(false)}},
  editRoutineItem(rid,eid,field,value){
    const e=this.getRoutine(rid)?.items.find(x=>x.id===eid);if(!e)return;
    if(["mode","superset"].includes(field))e[field]=String(value||"");
    else e[field]=Number(value);
    this.save();
    if(field==="mode")this.renderRoutines(false)
  },
  moveRoutineItem(rid,eid,delta){
    const r=this.getRoutine(rid);if(!r)return;
    const index=r.items.findIndex(x=>x.id===eid);const next=index+Number(delta);
    if(index<0||next<0||next>=r.items.length)return;
    const [item]=r.items.splice(index,1);r.items.splice(next,0,item);this.save();this.renderRoutines(false)
  },
  duplicateRoutineItem(rid,eid){
    const r=this.getRoutine(rid);const index=r?.items.findIndex(x=>x.id===eid);if(!r||index<0)return;
    const copy={...r.items[index],id:"e"+Date.now(),name:r.items[index].name+" · copia"};
    r.items.splice(index+1,0,copy);this.save();this.renderRoutines(false);this.toast("Ejercicio duplicado.")
  },
  deleteRoutineItem(rid,eid){
    const r=this.getRoutine(rid);const item=r?.items.find(x=>x.id===eid);if(!r||!item)return;
    if(!confirm(`¿Eliminar ${item.name} de esta rutina?`))return;
    r.items=r.items.filter(x=>x.id!==eid);this.save();this.renderRoutines(false)
  },
  duplicateRoutine(id){
    const r=this.getRoutine(id);if(!r)return;
    const now=Date.now();const copy={...r,id:"r"+now,name:r.name+" · copia",items:(r.items||[]).map((item,i)=>({...item,id:`e${now}${i}`}))};
    this.data.routines.push(copy);this.openRoutineId=copy.id;this.save();this.renderRoutines(false);this.toast("Rutina duplicada.")
  },
  assignToday(rid){
    const now=new Date();const jsDay=now.getDay();const day=jsDay===0?6:jsDay-1;
    this.planningWeekStart=this.weekKey(now);this.assignRoutineToDay(rid,day)
  },
  assignRoutineToDay(rid,day){
    if(!this.getRoutine(rid))return;
    this.openPlanningAssignSheet(day,rid)
  },
  chooseDayRoutine(day){
    this.openPlanningAssignSheet(day)
  },
  openPlanningAssignSheet(day,selectedId){
    const monday=this.mondayOf(new Date((this.planningWeekStart||this.weekKey(new Date()))+"T12:00:00"));
    const plan=this.getWeekPlan(monday,true);
    this.pendingPlanningDay=Number(day);
    this.pendingPlanningRoutine=selectedId!==undefined?selectedId:(plan[day]||null);
    this.pendingPlanningScope=this.data.settings.planningMode==="fixed"?"forward":"week";
    const names=["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
    const date=new Date(monday);date.setDate(date.getDate()+Number(day));
    const subtitle=document.getElementById("planningAssignSubtitle");
    if(subtitle)subtitle.textContent=`${names[day][0].toUpperCase()+names[day].slice(1)} · ${date.toLocaleDateString('es-ES',{day:'2-digit',month:'long'})}`;
    const options=[{id:null,name:"Descanso",meta:"Sin entrenamiento asignado"},...this.data.routines.map(r=>({id:r.id,name:r.name,meta:`${this.estimateRoutineMinutes(r)} min estimados`}))];
    document.getElementById("planningAssignOptions").innerHTML=options.map(o=>`<button type="button" class="${this.pendingPlanningRoutine===o.id?'selected':''}" data-routine-id="${o.id||''}" onclick="App.selectPlanningRoutine('${o.id||''}')"><span>${o.id?'RUTINA':'DESCANSO'}</span><b>${o.name}</b><small>${o.meta}</small><em>${this.pendingPlanningRoutine===o.id?'✓':'→'}</em></button>`).join('');
    const scopes=document.getElementById("planningAssignScopes");
    if(scopes){scopes.hidden=this.data.settings.planningMode!=="fixed";scopes.querySelectorAll('[data-scope]').forEach(b=>b.classList.toggle('selected',b.dataset.scope===this.pendingPlanningScope))}
    const sheet=document.getElementById("planningAssignSheet");sheet?.classList.add("show");sheet?.setAttribute("aria-hidden","false")
  },
  selectPlanningRoutine(id){
    this.pendingPlanningRoutine=id||null;
    document.querySelectorAll('#planningAssignOptions [data-routine-id]').forEach(b=>{const active=(b.dataset.routineId||null)===this.pendingPlanningRoutine;b.classList.toggle('selected',active);const em=b.querySelector('em');if(em)em.textContent=active?'✓':'→'})
  },
  selectPlanningAssignScope(scope){
    this.pendingPlanningScope=scope;
    document.querySelectorAll('#planningAssignScopes [data-scope]').forEach(b=>b.classList.toggle('selected',b.dataset.scope===scope))
  },
  savePlanningAssignment(){
    const day=Number(this.pendingPlanningDay);if(!Number.isInteger(day)||day<0||day>6)return;
    const scope=this.data.settings.planningMode==="fixed"?(this.pendingPlanningScope||"forward"):"week";
    const rid=this.pendingPlanningRoutine||null;
    this.setPlanningDay(day,rid,scope);
    this.closePlanningAssignSheet();
    this.renderRoutines(false);
    this.toast(rid?`Rutina asignada al ${["lunes","martes","miércoles","jueves","viernes","sábado","domingo"][day]}`:"Día marcado como descanso.")
  },
  closePlanningAssignSheet(){
    const sheet=document.getElementById("planningAssignSheet");sheet?.classList.remove("show");sheet?.setAttribute("aria-hidden","true")
  },
  deleteRoutine(id){
    const r=this.getRoutine(id);if(!r)return;
    const affected=[];
    Object.entries(this.data.weeklyPlans||{}).forEach(([week,plan])=>Object.entries(plan||{}).forEach(([d,rid])=>{if(rid===id)affected.push(`${week} · ${["L","M","X","J","V","S","D"][Number(d)]}`)}));
    const extra=affected.length?`\nTambién se quitará de ${affected.length} asignación${affected.length>1?'es':''} futura${affected.length>1?'s':''}.`:'';
    if(!confirm(`¿Eliminar ${r.name}?${extra}\nEl historial completado no se modificará.`))return;
    this.data.routines=this.data.routines.filter(x=>x.id!==id);
    Object.values(this.data.weeklyPlans||{}).forEach(plan=>Object.keys(plan||{}).forEach(day=>{if(plan[day]===id)delete plan[day]}));
    Object.keys(this.data.weekPlan||{}).forEach(day=>{if(this.data.weekPlan[day]===id)delete this.data.weekPlan[day]});
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

  allExercises(){
    const pedb=this.pedbReady?this.pedbExercises.map(e=>this.pedbToUi(e)):this.data.library;
    const ids=new Set(pedb.map(e=>e.id));
    return [...pedb,...this.data.personalExercises.filter(e=>!ids.has(e.id))]
  },

  normalizeExerciseName(value){
    return String(value||"")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .toLocaleLowerCase("es")
      .replace(/\b(con|en|de|del|la|el|los|las|a|al)\b/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .trim().replace(/\s+/g," ")
  },

  matchPedbByName(name){
    if(!this.pedbReady||!name)return null;
    const target=this.normalizeExerciseName(name);
    if(!target)return null;
    let exact=this.pedbExercises.find(e=>this.normalizeExerciseName(e.name_es)===target||
      (e.synonyms_es||[]).some(x=>this.normalizeExerciseName(x)===target));
    if(exact)return exact;
    const tokens=target.split(" ").filter(x=>x.length>2);
    if(tokens.length<2)return null;
    const candidates=this.pedbExercises.filter(e=>{
      const hay=[e.name_es,...(e.synonyms_es||[])].map(x=>this.normalizeExerciseName(x)).join(" ");
      return tokens.every(t=>hay.includes(t));
    });
    return candidates.length===1?candidates[0]:null
  },

  linkExistingRoutinesToPEDB(){
    let changed=false;
    (this.data.routines||[]).forEach(r=>(r.items||[]).forEach(item=>{
      if(/^(PEX|USR-EX)-/.test(item.exercise_id||""))return;
      const match=this.matchPedbByName(item.name||item.exercise_name_snapshot);
      if(match){
        item.exercise_id=match.id;
        item.libraryId=match.id;
        item.exercise_name_snapshot=item.exercise_name_snapshot||item.name||match.name_es;
        changed=true
      }
    }));
    if(changed)this.save();
    return changed
  },

  pedbToUi(e){
    const muscle=this.pedbMeta.muscles.get(e.muscle_id)?.name_es||"Otros";
    const typeName=this.pedbMeta.types.get(e.type_id)?.name_es||"Repeticiones";
    const isControl=/control/i.test(typeName);
    return {id:e.id,name:e.name_es,group:muscle,size:e.type_id==="PET-0002"?"large":"small",type:isControl?"time":"reps",sets:e.type_id==="PET-0002"?3:4,reps:isControl?30:(e.type_id==="PET-0002"?8:12),rest:e.type_id==="PET-0002"?90:60,increment:e.bodyweight?0:(e.type_id==="PET-0002"?2.5:.5),official:true,pedb:e}
  },

  async installPEDB(){
    try{
      this.pedbManifest=await PEDB_LOADER.install();
      const [exercises,muscles,zones,equipment,patterns,types]=await Promise.all([
        PEDB_DB.getAll("exercises"),PEDB_DB.getAll("muscles"),PEDB_DB.getAll("zones"),PEDB_DB.getAll("equipment"),PEDB_DB.getAll("patterns"),PEDB_DB.getAll("exercise_types")
      ]);
      this.pedbExercises=exercises;
      this.pedbMeta={muscles:new Map(muscles.map(x=>[x.id,x])),zones:new Map(zones.map(x=>[x.id,x])),equipment:new Map(equipment.map(x=>[x.id,x])),patterns:new Map(patterns.map(x=>[x.id,x])),types:new Map(types.map(x=>[x.id,x]))};
      this.pedbReady=true;
      this.linkExistingRoutinesToPEDB();
      if(this.currentScreen==="library"&&document.getElementById("libraryList"))this.updateLibraryView();
      this.toast(`PEDB · ${exercises.length} ejercicios`)
    }catch(error){
      console.warn("PEDB no disponible",error);
      this.pedbReady=false;
      this.pedbError=String(error?.message||error);
      if(this.currentScreen==="library")this.renderLibrary(this.librarySelectMode);
    }
  },

  renderLibrary(selectMode=false){
    this.librarySelectMode=selectMode;
    document.getElementById("library").innerHTML=`<div class="card"><div class="eyebrow">BIBLIOTECA ${this.pedbReady?`· PEDB ${this.pedbManifest?.version||""}`:this.pedbError?"· ERROR DE CARGA":"· CARGANDO PEDB"}</div><div class="title">EJERCICIOS</div><div class="library-toolbar"><input id="librarySearch" placeholder="Buscar por nombre, sinónimo o etiqueta…" oninput="App.updateLibraryView()"><button class="secondary" onclick="App.openPersonalExercise()">＋ Personal</button><button class="secondary" onclick="App.openPEDBCsvImporter()">Importar CSV</button></div><div id="libraryTabs" class="library-tabs"></div><div id="libraryList" class="list"></div></div>`;
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
    const typeName=e.pedb?this.pedbMeta.types.get(e.pedb.type_id)?.name_es||"Ejercicio":e.size==="large"?"Músculo grande":"Músculo pequeño";
    const detail=e.pedb?`${e.group} · ${typeName}${e.pedb.home_suitable?" · Casa":""}`:`${e.group} · ${typeName}`;
    const code=e.id||"PHX-EX";
    const primaryAction=this.librarySelectMode?`App.addLibraryExerciseToRoutine('${e.id}')`:`App.previewExercise('${e.id}')`;
    const primaryText=this.librarySelectMode?"AÑADIR":"VER FICHA";
    return `<article class="pedb-forged-card">
      <div class="pedb-forged-card__metal" aria-hidden="true"></div>
      <header><div><span>PEDB</span><small>${this.escape(code)}</small></div><button class="pedb-fav ${fav?'active':''}" onclick="App.toggleFavorite('${e.id}')" aria-label="${fav?'Quitar de favoritos':'Añadir a favoritos'}">${fav?'★':'☆'}</button></header>
      <section><h3>${this.escape(e.name)}</h3><p>${this.escape(detail)}</p></section>
      <div class="pedb-forged-card__chips"><span>${e.official?'OFICIAL':'PERSONAL'}</span><span>${e.sets}×${e.reps}</span><span>${e.rest}s</span></div>
      <footer><button class="pedb-btn pedb-btn--graphite" onclick="App.previewExercise('${e.id}')">VER</button><button class="pedb-btn pedb-btn--gold" onclick="${primaryAction}">${primaryText}</button></footer>
    </article>`
  },

  toggleFavorite(id){
    const a=this.data.favoriteExerciseIds;
    this.data.favoriteExerciseIds=a.includes(id)?a.filter(x=>x!==id):[...a,id];
    this.save();this.updateLibraryView()
  },

  previewExercise(id){
    const e=this.allExercises().find(x=>x.id===id);if(!e)return;
    const pedb=e.pedb||{};
    const type=this.pedbMeta?.types?.get?.(pedb.type_id)?.name_es||pedb.exercise_type||"Ejercicio";
    const equipment=(pedb.equipment_ids||pedb.equipment||[]);const equipmentText=Array.isArray(equipment)?equipment.join(" · "):String(equipment||"");
    document.getElementById("exercisePreviewTitle").textContent=e.name;
    document.getElementById("exercisePreviewMeta").textContent=`${e.group||"Sin grupo"} · ${type}`;
    document.getElementById("exercisePreviewStats").innerHTML=`
      <article><span>SERIES</span><b>${e.sets||'—'}</b></article>
      <article><span>REPETICIONES</span><b>${e.reps||'—'}</b></article>
      <article><span>DESCANSO</span><b>${e.rest||0}s</b></article>
      <article><span>ENTORNO</span><b>${pedb.home_suitable?'Casa / Gym':'Gym'}</b></article>`;
    const tags=[...(pedb.tags||[]),...(equipmentText?[equipmentText]:[])].filter(Boolean).slice(0,10);
    document.getElementById("exercisePreviewTags").innerHTML=tags.length?tags.map(t=>`<span>${t}</span>`).join(''):`<span>Ficha oficial Phoenix</span>`;
    const sheet=document.getElementById("exercisePreviewSheet");sheet?.classList.add("show");sheet?.setAttribute("aria-hidden","false")
  },
  closeExercisePreview(){
    const sheet=document.getElementById("exercisePreviewSheet");sheet?.classList.remove("show");sheet?.setAttribute("aria-hidden","true")
  },

  addLibraryExerciseToRoutine(id){
    const e=this.allExercises().find(x=>x.id===id);
    const r=this.getRoutine(this.pendingRoutineId);
    if(!e||!r)return;
    r.items.push({id:"i"+Date.now(),libraryId:e.id,exercise_id:/^(PEX|USR-EX)-/.test(e.id)?e.id:null,exercise_name_snapshot:e.name,name:e.name,sets:e.sets,reps:e.reps,weight:0,rest:e.rest,mode:e.type,increment:e.increment});
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

  openPEDBCsvImporter(){
    const input=document.getElementById("pedbCsvInput");
    if(input){input.value="";input.click()}
  },

  parseCsv(text){
    const rows=[];let row=[],field="",quoted=false;
    for(let i=0;i<String(text||"").length;i++){
      const c=text[i],n=text[i+1];
      if(c==='"'&&quoted&&n==='"'){field+='"';i++;continue}
      if(c==='"'){quoted=!quoted;continue}
      if(c===','&&!quoted){row.push(field);field="";continue}
      if((c==='\n'||c==='\r')&&!quoted){
        if(c==='\r'&&n==='\n')i++;
        row.push(field);field="";
        if(row.some(x=>String(x).trim()))rows.push(row);
        row=[];continue
      }
      field+=c
    }
    row.push(field);if(row.some(x=>String(x).trim()))rows.push(row);
    if(rows.length<2)throw new Error("El CSV no contiene ejercicios");
    const headers=rows[0].map(x=>String(x).trim().replace(/^\ufeff/,""));
    return rows.slice(1).map(values=>Object.fromEntries(headers.map((h,i)=>[h,String(values[i]||"").trim()])))
  },

  catalogIdByName(map,name){
    const target=this.normalizeExerciseName(name);
    if(!target)return null;
    for(const [id,item] of map.entries())if(this.normalizeExerciseName(item.name_es)===target)return id;
    return null
  },

  boolValue(value){return /^(1|true|si|sí|yes)$/i.test(String(value||"").trim())},

  nextUserExerciseId(offset=0){
    const numbers=(this.pedbExercises||[]).map(e=>/^USR-EX-(\d+)$/.exec(e.id||"")).filter(Boolean).map(m=>Number(m[1]));
    return `USR-EX-${String((numbers.length?Math.max(...numbers):0)+1+offset).padStart(6,"0")}`
  },

  personalCsvRowToPedb(row,id){
    for(const key of ["name_es","primary_muscle","target_zone"])if(!row[key])throw new Error(`Falta ${key} en una fila`);
    const muscleId=this.catalogIdByName(this.pedbMeta.muscles,row.primary_muscle);
    const zoneId=this.catalogIdByName(this.pedbMeta.zones,row.target_zone);
    if(!muscleId)throw new Error(`Músculo no reconocido: ${row.primary_muscle}`);
    if(!zoneId)throw new Error(`Zona no reconocida: ${row.target_zone}`);
    const equipmentIds=String(row.equipment||"").split("|").map(x=>x.trim()).filter(Boolean).map(name=>{
      const found=this.catalogIdByName(this.pedbMeta.equipment,name);
      if(!found)throw new Error(`Material no reconocido: ${name}`);
      return found
    });
    const patternId=row.movement_pattern?this.catalogIdByName(this.pedbMeta.patterns,row.movement_pattern):null;
    if(row.movement_pattern&&!patternId)throw new Error(`Patrón no reconocido: ${row.movement_pattern}`);
    const typeId=row.exercise_type?this.catalogIdByName(this.pedbMeta.types,row.exercise_type):"PET-0002";
    if(row.exercise_type&&!typeId)throw new Error(`Tipo no reconocido: ${row.exercise_type}`);
    const equipmentNames=equipmentIds.map(x=>this.pedbMeta.equipment.get(x)?.name_es||"").join(" ");
    return {
      id,name_es:row.name_es,synonyms_es:[],muscle_id:muscleId,zone_id:zoneId,equipment_ids:equipmentIds,
      pattern_id:patternId,type_id:typeId,home_suitable:this.boolValue(row.home_suitable),
      bodyweight:/peso corporal/i.test(equipmentNames),machine_based:/máquina|maquina|polea/i.test(equipmentNames),
      level:row.level||"",parent_exercise_id:row.parent_exercise_id||null,notes:row.notes||"",
      source:"user",read_only:false,tags:[row.primary_muscle,row.target_zone,row.movement_pattern,row.exercise_type,row.level,"personal"].filter(Boolean).map(x=>String(x).toLocaleLowerCase("es"))
    }
  },

  sameEquipment(a,b){
    const aa=new Set(a.equipment_ids||[]),bb=new Set(b.equipment_ids||[]);
    return aa.size===bb.size&&[...aa].every(x=>bb.has(x))
  },

  relationScore(source,target,category,rules){
    let score=0;const w=rules.weights||{};
    if(source.muscle_id&&source.muscle_id===target.muscle_id)score+=w.same_primary_muscle||20;
    if(source.zone_id&&source.zone_id===target.zone_id)score+=w.same_target_zone||45;
    if(source.pattern_id&&source.pattern_id===target.pattern_id)score+=w.same_movement_pattern||35;
    if(source.type_id&&source.type_id===target.type_id)score+=w.same_exercise_type||8;
    if(category==="home"&&target.home_suitable)score+=w.home_candidate||20;
    if(!this.sameEquipment(source,target))score+=w.different_equipment||12;
    if(source.parent_exercise_id===target.id||target.parent_exercise_id===source.id)score+=w.explicit_parent_link||100;
    return score
  },

  relationReason(source,target,category){
    if(category==="home")return target.home_suitable?"alternativa apta para casa":"alternativa compatible";
    if(category==="different_zone")return `trabaja ${this.pedbMeta.zones.get(target.zone_id)?.name_es||"otra zona"}`;
    return "mantiene músculo, patrón o zona con otro material"
  },

  buildUserRelations(userExercises,allExercises,rules){
    const out=[];let seq=1;
    const confidence=rules.confidence||{high_min:90,medium_min:55};
    const add=(source,target,category,score)=>{
      if(source.id===target.id)return;
      const conf=score>=confidence.high_min?"high":score>=confidence.medium_min?"medium":"low";
      out.push({id:`URR-${String(seq++).padStart(7,"0")}`,source_id:source.id,target_id:target.id,category,recommended:score>=confidence.high_min,score,confidence:conf,reason:this.relationReason(source,target,category),target_zone:this.pedbMeta.zones.get(target.zone_id)?.name_es||""})
    };
    const sources=userExercises;
    for(const source of sources){
      const buckets={occupied:[],home:[],different_zone:[]};
      for(const target of allExercises){
        if(source.id===target.id)continue;
        const sameMuscle=source.muscle_id&&source.muscle_id===target.muscle_id;
        const sameZone=source.zone_id&&source.zone_id===target.zone_id;
        const samePattern=source.pattern_id&&source.pattern_id===target.pattern_id;
        if((sameZone||samePattern||source.parent_exercise_id===target.id)&&!this.sameEquipment(source,target))buckets.occupied.push([target,this.relationScore(source,target,"occupied",rules)]);
        if(target.home_suitable&&(sameMuscle||sameZone||samePattern||source.parent_exercise_id===target.id))buckets.home.push([target,this.relationScore(source,target,"home",rules)]);
        if(sameMuscle&&source.zone_id!==target.zone_id)buckets.different_zone.push([target,this.relationScore(source,target,"different_zone",rules)]);
      }
      for(const [category,items] of Object.entries(buckets))items.sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([target,score])=>add(source,target,category,score));
    }
    if(rules.bidirectional_user_relations){
      const forward=[...out];
      for(const rel of forward){
        const source=allExercises.find(e=>e.id===rel.source_id),target=allExercises.find(e=>e.id===rel.target_id);
        if(!source||!target||!/^USR-EX-/.test(rel.source_id))continue;
        if(!out.some(x=>x.source_id===target.id&&x.target_id===source.id&&x.category===rel.category)){
          out.push({...rel,id:`URR-${String(seq++).padStart(7,"0")}`,source_id:target.id,target_id:source.id,reason:`relación bidireccional con ejercicio personal`})
        }
      }
    }
    return out
  },

  async importPersonalExercisesCsv(input){
    const file=input?.files?.[0];if(!file)return;
    try{
      if(!this.pedbReady)throw new Error("PEDB todavía está cargando");
      const rows=this.parseCsv(await file.text());
      const userExercises=rows.map((row,i)=>this.personalCsvRowToPedb(row,this.nextUserExerciseId(i)));
      const rules=await fetch("./data/user_relation_rules.json").then(r=>{if(!r.ok)throw new Error("No se pudieron cargar las reglas");return r.json()});
      const existingExercises=await PEDB_DB.getAll("exercises");
      const existingRelations=await PEDB_DB.getAll("relations");
      const oldUserExercises=existingExercises.filter(e=>/^USR-EX-/.test(e.id));
      const oldUserRelations=existingRelations.filter(r=>/^URR-/.test(r.id)||/^USR-EX-/.test(r.source_id)||/^USR-EX-/.test(r.target_id));
      await PEDB_DB.deleteMany("relations",oldUserRelations.map(r=>r.id));
      await PEDB_DB.deleteMany("exercises",oldUserExercises.map(e=>e.id));
      await PEDB_DB.putMany("exercises",userExercises);
      const official=existingExercises.filter(e=>!/^USR-EX-/.test(e.id));
      const relations=this.buildUserRelations(userExercises,[...official,...userExercises],rules);
      await PEDB_DB.putMany("relations",relations);
      this.pedbExercises=[...official,...userExercises];
      this.linkExistingRoutinesToPEDB();
      this.updateLibraryView();
      this.toast(`${userExercises.length} personales · ${relations.length} relaciones`)
    }catch(error){this.reportError(error);alert(error.message||"No se pudo importar el CSV")}
  },


  blockWeekDate(block,index){
    const d=this.mondayOf(new Date(block.startWeek+"T12:00:00"));
    d.setDate(d.getDate()+(index*7));
    return d
  },

  blockProgress(block){
    const today=this.mondayOf(new Date());
    const start=this.mondayOf(new Date(block.startWeek+"T12:00:00"));
    const weeks=Math.max(1,Number(block.durationWeeks)||8);
    const current=Math.floor((today-start)/(7*86400000))+1;
    return {weeks,current:Math.max(1,Math.min(weeks,current)),raw:current,percent:Math.max(0,Math.min(100,Math.round((current-1)/weeks*100)))}
  },

  createTrainingBlock(){
    if(!this.data.routines.length){this.toast("Crea primero una rutina.");return}
    const sheet=document.getElementById("trainingBlockSheet");
    if(!sheet)return;
    document.getElementById("blockNameInput").value="Bloque de fuerza";
    document.getElementById("blockGoalInput").value="Fuerza";
    document.getElementById("blockWeeksInput").value="8";
    document.getElementById("blockStartInput").value=this.isoDate(this.mondayOf(new Date()));
    document.getElementById("blockCopyPlanInput").checked=true;
    this.updateBlockStartHint();
    sheet.classList.add("show");
    sheet.setAttribute("aria-hidden","false");
    setTimeout(()=>document.getElementById("blockNameInput")?.focus(),80)
  },

  closeTrainingBlockCreator(){
    const sheet=document.getElementById("trainingBlockSheet");
    if(sheet){sheet.classList.remove("show");sheet.setAttribute("aria-hidden","true")}
  },

  updateBlockStartHint(){
    const input=document.getElementById("blockStartInput"),hint=document.getElementById("blockStartHint");
    if(!input||!hint||!input.value)return;
    const chosen=new Date(input.value+"T12:00:00");
    if(Number.isNaN(chosen.getTime()))return;
    const monday=this.mondayOf(chosen);
    hint.textContent=`El bloque comenzará el lunes ${monday.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}.`
  },

  saveTrainingBlock(){
    const name=document.getElementById("blockNameInput")?.value.trim();
    const goal=document.getElementById("blockGoalInput")?.value;
    const weeks=Number(document.getElementById("blockWeeksInput")?.value);
    const dateValue=document.getElementById("blockStartInput")?.value;
    const copy=Boolean(document.getElementById("blockCopyPlanInput")?.checked);
    if(!name){this.toast("Escribe un nombre para el bloque.");return}
    if(!["Fuerza","Hipertrofia","Técnica","Resistencia","Descarga","Personalizado"].includes(goal)){this.toast("Selecciona un objetivo.");return}
    if(![4,6,8,12].includes(weeks)){this.toast("Selecciona una duración válida.");return}
    if(!dateValue){this.toast("Selecciona una fecha de inicio.");return}
    const chosen=new Date(dateValue+"T12:00:00");
    if(Number.isNaN(chosen.getTime())){this.toast("La fecha no es válida.");return}
    const start=this.weekKey(this.mondayOf(chosen));
    const base={...this.getWeekPlan(new Date(),false)};
    const id="b"+Date.now();
    const block={id,name,goal,durationWeeks:weeks,startWeek:start,deloadWeek:weeks,status:"active",createdAt:new Date().toISOString()};
    this.data.trainingBlocks.unshift(block);
    if(copy&&Object.keys(base).length){
      for(let i=0;i<weeks;i++)this.data.weeklyPlans[this.weekKey(this.blockWeekDate(block,i))]={...base};
    }
    this.openBlockId=id;
    this.save();
    this.closeTrainingBlockCreator();
    this.renderBlocks(false);
    this.toast("Bloque creado")
  },

  renderBlocks(withHistory=true){
    const blocks=this.data.trainingBlocks||[];
    const active=blocks.filter(b=>b.status!=="completed");
    const previous=blocks.filter(b=>b.status==="completed");
    if(!this.openBlockId&&blocks.length)this.openBlockId=blocks[0].id;
    const card=(b)=>{
      const prog=this.blockProgress(b),open=this.openBlockId===b.id;
      const start=this.mondayOf(new Date(b.startWeek+"T12:00:00"));
      const end=this.blockWeekDate(b,(Number(b.durationWeeks)||8)-1);end.setDate(end.getDate()+6);
      const weeks=Array.from({length:Number(b.durationWeeks)||8},(_,i)=>{
        const monday=this.blockWeekDate(b,i),plan=this.getWeekPlan(monday,false);
        const planned=Object.values(plan).filter(Boolean).length;
        const sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
        const completed=this.data.sessions.filter(x=>{const d=new Date(x.endedAt||x.date);return d>=monday&&d<=new Date(sunday.getFullYear(),sunday.getMonth(),sunday.getDate(),23,59,59)}).length;
        const nowKey=this.weekKey(new Date()),key=this.weekKey(monday);
        const state=key===nowKey?"En curso":key<nowKey?"Completada":"Pendiente";
        const deload=Number(b.deloadWeek)===i+1;
        return `<div class="block-week ${key===nowKey?'current':''} ${deload?'deload':''}"><button onclick="App.openBlockWeek('${b.id}',${i})"><span>SEMANA ${i+1}${deload?' · DELOAD':''}</span><strong>${monday.getDate()} ${monday.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()} – ${sunday.getDate()} ${sunday.toLocaleDateString('es-ES',{month:'short'}).replace('.','').toUpperCase()}</strong><small>${planned} sesiones · ${completed} completadas · ${state}</small></button><div><button onclick="App.copyBlockWeek('${b.id}',${i})" title="Copiar semana anterior">COPIAR</button><button onclick="App.toggleDeloadWeek('${b.id}',${i+1})">${deload?'QUITAR DELOAD':'DELOAD'}</button></div></div>`
      }).join('');
      return `<section class="block-card ${open?'open':''} ${b.status==='completed'?'completed':''}"><button class="block-head" onclick="App.toggleBlock('${b.id}')"><div><span>${b.status==='completed'?'BLOQUE COMPLETADO':'BLOQUE ACTIVO'}</span><strong>${b.name}</strong><small>${b.goal} · ${b.durationWeeks} semanas · ${start.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} – ${end.toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</small></div><em>${open?'⌃':'⌄'}</em></button>${open?`<div class="block-body"><div class="block-progress"><div><b>${b.status==='completed'?'100':prog.percent}%</b><span>Semana ${Math.min(prog.current,prog.weeks)} de ${prog.weeks}</span></div><i style="--p:${b.status==='completed'?100:prog.percent}%"></i></div><div class="block-weeks">${weeks}</div><div class="block-actions"><button class="secondary" onclick="App.openBlockWeek('${b.id}',${Math.max(0,prog.current-1)})">Ver semana actual</button>${b.status==='completed'?`<button class="secondary" onclick="App.repeatBlock('${b.id}')">Repetir bloque</button>`:`<button class="secondary" onclick="App.finishBlock('${b.id}')">Finalizar bloque</button>`}<button class="danger" onclick="App.deleteBlock('${b.id}')">Eliminar</button></div></div>`:''}</section>`
    };
    document.getElementById("blocks").innerHTML=`<div class="card block-intro"><div class="eyebrow">BLOQUES DE ENTRENAMIENTO</div><h2>Organiza tu progresión</h2><p>Varias semanas, un objetivo. Siempre de lunes a domingo.</p><button class="primary" onclick="App.createTrainingBlock()">＋ NUEVO BLOQUE</button></div>${active.length?`<div class="section-label">ACTIVO</div>${active.map(card).join('')}`:`<div class="card empty-block">No hay un bloque activo.</div>`}${previous.length?`<div class="section-label">ANTERIORES</div>${previous.map(card).join('')}`:''}`;
    this.show("blocks","Planificación",{history:withHistory})
  },

  toggleBlock(id){this.openBlockId=this.openBlockId===id?null:id;this.renderBlocks(false)},
  openBlockWeek(id,index){
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b)return;
    this.planningWeekStart=this.weekKey(this.blockWeekDate(b,index));this.renderRoutines(true)
  },
  copyBlockWeek(id,index){
    if(index<=0){this.toast("La primera semana no tiene anterior.");return}
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b)return;
    const src=this.getWeekPlan(this.blockWeekDate(b,index-1),false);
    if(!Object.keys(src).length){this.toast("La semana anterior está vacía.");return}
    if(!confirm(`¿Copiar la semana ${index} en la semana ${index+1}?`))return;
    this.data.weeklyPlans[this.weekKey(this.blockWeekDate(b,index))]={...src};this.save();this.renderBlocks(false);this.toast("Semana copiada")
  },
  toggleDeloadWeek(id,week){
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b)return;
    b.deloadWeek=Number(b.deloadWeek)===week?null:week;this.save();this.renderBlocks(false)
  },
  finishBlock(id){
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b||!confirm(`¿Finalizar ${b.name}? Las semanas y entrenamientos se conservarán.`))return;
    b.status="completed";b.completedAt=new Date().toISOString();this.save();this.renderBlocks(false);this.toast("Bloque finalizado")
  },
  repeatBlock(id){
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b)return;
    const copy={...b,id:"b"+Date.now(),name:b.name+" · Repetición",startWeek:this.weekKey(new Date()),status:"active",createdAt:new Date().toISOString(),completedAt:null};
    this.data.trainingBlocks.unshift(copy);
    for(let i=0;i<copy.durationWeeks;i++){
      const source=this.getWeekPlan(this.blockWeekDate(b,i),false);
      if(Object.keys(source).length)this.data.weeklyPlans[this.weekKey(this.blockWeekDate(copy,i))]={...source}
    }
    this.openBlockId=copy.id;this.save();this.renderBlocks(false);this.toast("Bloque repetido")
  },
  deleteBlock(id){
    const b=this.data.trainingBlocks.find(x=>x.id===id);if(!b||!confirm(`¿Eliminar ${b.name}? La planificación semanal y el historial no se borrarán.`))return;
    this.data.trainingBlocks=this.data.trainingBlocks.filter(x=>x.id!==id);this.openBlockId=this.data.trainingBlocks[0]?.id||null;this.save();this.renderBlocks(false)
  },

  renderHistory(withHistory=true){
    const sessions=(this.data.sessions||[]).slice().reverse();
    const cards=sessions.map((s,index)=>{
      const date=new Date(s.endedAt||s.date);
      const mins=Math.max(1,Math.round((Number(s.durationMs)||0)/60000));
      const exercises=s.exercises||[];
      const substitutions=exercises.filter(e=>e.plannedName&&e.plannedName!==e.name).length;
      const originalIndex=(this.data.sessions||[]).indexOf(s);
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
          <button class="danger forged-danger history-delete-one" onclick="App.openHistoryDelete('single',${originalIndex})">Eliminar este entrenamiento</button>
        </div>
      </article>`
    }).join('');
    const actions=sessions.length?`<div class="history-manage-actions"><button class="secondary" onclick="App.openHistoryDelete('range')">Borrar por fechas</button><button class="danger forged-danger" onclick="App.openHistoryDelete('all')">Borrar todo el historial</button></div>`:'';
    document.getElementById("history").innerHTML=`<section class="history-header"><div><div class="eyebrow">DATOS</div><h2>Historial</h2><p>${sessions.length?`${sessions.length} entrenamiento${sessions.length===1?'':'s'} guardado${sessions.length===1?'':'s'}`:'Tu progreso aparecerá aquí'}</p></div></section>${actions}${cards||'<div class="phx-card phx-card--base history-empty"><strong>Aún no hay entrenamientos</strong><span>Completa una sesión para empezar tu historial.</span></div>'}`;
    this.show("history","Datos",{history:withHistory})
  },

  toggleHistorySession(id,button){
    const panel=document.getElementById(id);if(!panel)return;
    const opening=panel.hidden;panel.hidden=!opening;button.setAttribute('aria-expanded',String(opening));
    button.closest('.history-session')?.classList.toggle('is-open',opening)
  },

  openHistoryDelete(mode,index=null){
    this.historyDeleteMode=mode;this.historyDeleteIndex=index;
    const sheet=document.getElementById("historyDeleteSheet");
    const title=document.getElementById("historyDeleteTitle");
    const desc=document.getElementById("historyDeleteDescription");
    const range=document.getElementById("historyDeleteRange");
    const input=document.getElementById("historyDeleteConfirmInput");
    if(!sheet)return;
    range.hidden=mode!=="range";
    if(mode==="single"){
      const s=(this.data.sessions||[])[index];const d=new Date(s?.endedAt||s?.date||Date.now());
      title.textContent="Eliminar entrenamiento";
      desc.textContent=`Se eliminará la sesión del ${d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}.`;
    }else if(mode==="range"){
      title.textContent="Borrar parte del historial";
      desc.textContent="Selecciona el intervalo de fechas que deseas eliminar. Las fechas están incluidas.";
      const all=(this.data.sessions||[]).map(x=>this.isoDate(new Date(x.endedAt||x.date))).sort();
      document.getElementById("historyDeleteFrom").value=all[0]||this.isoDate(new Date());
      document.getElementById("historyDeleteTo").value=all[all.length-1]||this.isoDate(new Date());
    }else{
      title.textContent="Borrar todo el historial";
      desc.textContent=`Se eliminarán todos los entrenamientos guardados de ${this.activeProfile()?.name||'este perfil'}.`;
    }
    input.value="";document.getElementById("historyDeleteExecute").disabled=true;
    sheet.classList.add("show");document.body.classList.add("sheet-open");
  },
  closeHistoryDelete(){document.getElementById("historyDeleteSheet")?.classList.remove("show");document.body.classList.remove("sheet-open");this.historyDeleteMode=null;this.historyDeleteIndex=null},
  validateHistoryDeletePhrase(){const ok=document.getElementById("historyDeleteConfirmInput")?.value.trim().toUpperCase()==="BORRAR";document.getElementById("historyDeleteExecute").disabled=!ok},
  executeHistoryDelete(){
    if(document.getElementById("historyDeleteConfirmInput")?.value.trim().toUpperCase()!=="BORRAR")return;
    const sessions=this.data.sessions||[];
    let removed=0;
    if(this.historyDeleteMode==="single"){
      const i=Number(this.historyDeleteIndex);if(Number.isInteger(i)&&i>=0&&i<sessions.length){sessions.splice(i,1);removed=1}
    }else if(this.historyDeleteMode==="range"){
      const from=document.getElementById("historyDeleteFrom")?.value;
      const to=document.getElementById("historyDeleteTo")?.value;
      if(!from||!to||from>to){this.toast("Revisa el intervalo de fechas");return}
      const before=sessions.length;
      this.data.sessions=sessions.filter(s=>{const d=this.isoDate(new Date(s.endedAt||s.date));return d<from||d>to});
      removed=before-this.data.sessions.length;
    }else if(this.historyDeleteMode==="all"){
      removed=sessions.length;this.data.sessions=[];
    }
    this.save();this.closeHistoryDelete();this.renderHistory(false);this.toast(removed?`${removed} entrenamiento${removed===1?'':'s'} eliminado${removed===1?'':'s'}`:"No había entrenamientos en ese intervalo");
  },

  openPlanningRepeatSheet(){
    const sheet=document.getElementById("planningRepeatSheet");
    if(!sheet)return;
    this.pendingPlanningMode=this.data.settings.planningMode||"fixed";
    this.updatePlanningRepeatSheet();
    sheet.classList.add("show");
    sheet.setAttribute("aria-hidden","false");
    document.body.classList.add("sheet-open");
  },
  closePlanningRepeatSheet(){
    const sheet=document.getElementById("planningRepeatSheet");
    if(sheet){sheet.classList.remove("show");sheet.setAttribute("aria-hidden","true")}
    document.body.classList.remove("sheet-open");
    this.pendingPlanningMode=null;
  },
  selectPlanningRepeatMode(mode){
    if(!["fixed","clear"].includes(mode))return;
    this.pendingPlanningMode=mode;
    this.updatePlanningRepeatSheet();
  },
  updatePlanningRepeatSheet(){
    const mode=this.pendingPlanningMode||this.data.settings.planningMode||"fixed";
    document.querySelectorAll("#planningRepeatSheet [data-planning-mode]").forEach(button=>{
      const active=button.dataset.planningMode===mode;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",active?"true":"false");
      const mark=button.querySelector("em");
      if(mark)mark.textContent=active?"✓":"→";
    });
  },
  savePlanningRepeatMode(){
    const mode=this.pendingPlanningMode||this.data.settings.planningMode||"fixed";
    this.data.settings.planningMode=mode;
    this.save();
    this.closePlanningRepeatSheet();
    this.renderRoutines(false);
    this.toast(mode==="fixed"?"Planificación fija activada":"Reinicio semanal activado");
  },

  openWeightSheet(){
    const sheet=document.getElementById("weightSheet");if(!sheet)return;
    const today=new Date();const local=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
    document.getElementById("weightDateInput").value=local;
    document.getElementById("weightValueInput").value=this.data.profile?.bodyWeight||"";
    document.getElementById("weightNoteInput").value="";
    document.getElementById("weightProfileName").textContent=this.activeProfile()?.name||"Perfil";
    const current=Number(this.data.profile?.bodyWeight)||0;
    document.getElementById("weightCurrentValue").textContent=current?`Último registro: ${current.toFixed(1)} kg`:"Sin peso registrado";
    sheet.classList.add("show");sheet.setAttribute("aria-hidden","false");document.body.classList.add("sheet-open");
    setTimeout(()=>document.getElementById("weightValueInput")?.focus(),180)
  },
  closeWeightSheet(){
    const sheet=document.getElementById("weightSheet");sheet?.classList.remove("show");sheet?.setAttribute("aria-hidden","true");document.body.classList.remove("sheet-open")
  },
  saveWeightEntry(){
    const raw=String(document.getElementById("weightValueInput")?.value||"").replace(",",".");
    const weight=Number(raw);const date=document.getElementById("weightDateInput")?.value;const note=(document.getElementById("weightNoteInput")?.value||"").trim();
    if(!(weight>=20&&weight<=400)){this.toast("Introduce un peso válido");return}
    if(!date){this.toast("Selecciona una fecha");return}
    this.data.profile=this.data.profile||{};this.data.weights=Array.isArray(this.data.weights)?this.data.weights:[];
    this.data.profile.bodyWeight=Number(weight.toFixed(1));
    const iso=new Date(`${date}T12:00:00`).toISOString();
    this.data.weights.push({id:`w_${Date.now()}`,date:iso,weight:Number(weight.toFixed(1)),note,profileId:this.activeProfileId});
    this.data.weights.sort((x,y)=>new Date(x.date)-new Date(y.date));
    this.save();this.closeWeightSheet();this.toast(`Peso guardado · ${weight.toFixed(1)} kg`);
    if(this.currentScreen==="data")this.renderData(false);else if(this.currentScreen==="settings")this.renderSettings(false)
  },

  renderSettings(withHistory=true){
    const mode=this.data.settings.planningMode||"fixed";
    const fontScale=this.data.settings.fontScale||"normal";
    const timerOrientation=this.data.settings.timerOrientation||"auto";
    document.getElementById("settings").innerHTML=`<div class="card settings-definitive"><div class="eyebrow">AJUSTES</div>
      <section class="settings-section"><h3>Entrenamiento</h3>
        <label>Descanso predeterminado<input id="defaultRest" type="number" min="0" step="5" value="${this.data.settings.defaultRest}"><small>Segundos usados al crear nuevos ejercicios.</small></label>
        <label>Incremento de peso<input id="weightStep" type="number" min="0.1" step="0.1" value="${this.data.settings.weightStep}"><small>Salto aplicado por los controles rápidos.</small></label>
        <label class="setting-switch"><span><b>Sonido del temporizador</b><small>Aviso al terminar el descanso.</small></span><input id="soundSetting" type="checkbox" ${this.data.settings.sound?'checked':''}></label>
        <label class="setting-switch"><span><b>Vibración</b><small>Confirmaciones y fin del descanso.</small></span><input id="vibrationSetting" type="checkbox" ${this.data.settings.vibration?'checked':''}></label>
      </section>
      <section class="settings-section"><h3>Pantalla</h3>
        <label>Tamaño del texto<select id="fontScale"><option value="normal" ${fontScale==='normal'?'selected':''}>Normal</option><option value="large" ${fontScale==='large'?'selected':''}>Grande</option><option value="xl" ${fontScale==='xl'?'selected':''}>Muy grande</option></select></label>
        <label>Temporizador<select id="timerOrientation"><option value="auto" ${timerOrientation==='auto'?'selected':''}>Automático / apaisado</option><option value="portrait" ${timerOrientation==='portrait'?'selected':''}>Mantener vertical</option><option value="landscape" ${timerOrientation==='landscape'?'selected':''}>Forzar apaisado</option></select></label>
      </section>
      <section class="settings-section"><h3>Peso corporal</h3>
        <label>Peso actual<input id="bodyWeight" type="number" min="1" step=".1" value="${this.data.profile.bodyWeight||''}"></label>
        <button class="secondary forged-weight-launch" onclick="App.openWeightSheet()">ABRIR REGISTRO FORGED</button>
      </section>
      <div class="storage-status ${this.storageHealthy?'ok':'error'}"><span>ALMACENAMIENTO LOCAL</span><b>${this.storageHealthy?'Protegido':'Revisar espacio'}</b><small>${this.lastSaveAt?'Último guardado: '+new Date(this.lastSaveAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'Guardado automático activo'}</small></div>
      <div class="planning-mode-setting"><div class="eyebrow">PLANIFICACIÓN SEMANAL</div><label><input type="radio" name="planningMode" value="fixed" ${mode==="fixed"?'checked':''}> <span><b>Mantener planificación fija</b><small>La semana base se repite hasta que decidas cambiarla.</small></span></label><label><input type="radio" name="planningMode" value="clear" ${mode==="clear"?'checked':''}> <span><b>Vaciar al terminar la semana</b><small>Cada lunes empieza en descanso.</small></span></label></div>
      <section class="settings-section profile-settings-zone"><h3>Cambiar perfil</h3><p>El perfil activo es <b>${this.escape(this.activeProfile()?.name||'Perfil')}</b>. Puedes cambiar en cualquier momento.</p><div class="settings-profile-grid">${this.profiles.map(p=>`<button type="button" class="profile-choice ${p.id===this.activeProfileId?'active':''}" onclick="App.selectProfileAndReload('${p.id}')"><span>${p.id===this.activeProfileId?'ACTIVO':'ENTRAR EN'}</span><b>${this.escape(p.name)}</b><em>${p.id===this.activeProfileId?'✓':'→'}</em></button>`).join('')}</div></section>
      <section class="settings-section danger-zone"><h3>Datos del perfil · ${this.escape(this.activeProfile()?.name||'Perfil')}</h3><p>Estas acciones solo afectan al perfil activo. Alberto, Edy, Churri y Chino permanecen completamente separados.</p><button class="danger forged-danger" onclick="App.openDataDelete('test')">Borrar datos de prueba</button><button class="danger forged-danger forged-danger--full" onclick="App.openDataDelete('full')">Restablecer este perfil</button></section>
      <button class="primary" onclick="App.saveSettings()">Guardar ajustes</button></div>`;
    this.show("settings","Datos",{history:withHistory})
  },
  saveBodyWeight(){
    const w=Number(document.getElementById("bodyWeight")?.value);
    if(!(w>0)){this.toast("Introduce un peso válido");return}
    this.data.profile.bodyWeight=w;
    this.data.weights.push({date:new Date().toISOString(),weight:w});
    this.save();this.toast("Peso guardado")
  },
  saveSettings(){
    const step=Number(document.getElementById("weightStep")?.value);
    const rest=Number(document.getElementById("defaultRest")?.value);
    if(step>0)this.data.settings.weightStep=Number(step.toFixed(2));
    if(rest>=0)this.data.settings.defaultRest=Math.round(rest);
    this.data.settings.sound=Boolean(document.getElementById("soundSetting")?.checked);
    this.data.settings.vibration=Boolean(document.getElementById("vibrationSetting")?.checked);
    this.data.settings.fontScale=document.getElementById("fontScale")?.value||"normal";
    this.data.settings.timerOrientation=document.getElementById("timerOrientation")?.value||"auto";
    this.data.settings.planningMode=document.querySelector('input[name="planningMode"]:checked')?.value||"fixed";
    this.applyUiSettings();this.save();this.toast("Ajustes guardados")
  },


  openDataDelete(mode){
    this.deleteMode=mode;
    const profile=this.activeProfile()?.name||"Perfil";
    const title=document.getElementById("deleteTitle"),desc=document.getElementById("deleteDescription"),summary=document.getElementById("deleteSummary"),input=document.getElementById("deleteConfirmInput");
    if(mode==="test"){
      title.textContent="Borrar datos de prueba";
      desc.textContent=`Se eliminarán los datos registrados de ${profile}, sin tocar sus rutinas ni planificación.`;
      summary.innerHTML="<li>Entrenamientos e historial</li><li>Peso corporal</li><li>Progresiones y estadísticas derivadas</li><li>Sesión activa</li>";
    }else{
      title.textContent="Restablecer este perfil";
      desc.textContent=`${profile} volverá al estado inicial. Los demás perfiles no se modificarán.`;
      summary.innerHTML="<li>Rutinas, planificación y bloques</li><li>Entrenamientos, pesos y progresiones</li><li>Ejercicios personales y ajustes</li><li>Sesión activa</li>";
    }
    input.value="";document.getElementById("deleteExecute").disabled=true;
    document.getElementById("deleteDataSheet")?.classList.add("show");
  },
  closeDataDelete(){document.getElementById("deleteDataSheet")?.classList.remove("show")},
  validateDeletePhrase(){const ok=document.getElementById("deleteConfirmInput")?.value.trim().toUpperCase()==="BORRAR";document.getElementById("deleteExecute").disabled=!ok},
  executeDataDelete(){
    const typed=document.getElementById("deleteConfirmInput")?.value.trim().toUpperCase();if(typed!=="BORRAR")return;
    if(this.deleteMode==="test"){
      this.data.sessions=[];this.data.weights=[];this.data.profile.bodyWeight=null;this.data.backupLog=[];this.data.archiveIndex=[];
      this.data.routines.forEach(r=>r.items.forEach(i=>{delete i.progression;delete i.lastSuggestion}));
    }else{this.data=this.defaults()}
    this.active=null;localStorage.removeItem(this.profileActiveKey(this.activeProfileId));this.save();this.closeDataDelete();this.applyUiSettings();this.renderHome(false);this.toast(this.deleteMode==="test"?"Datos de prueba eliminados":"Perfil restablecido");
  },

  archiveChecksum(text){
    let hash=2166136261;
    for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}
    return (hash>>>0).toString(16).padStart(8,"0")
  },

  downloadFile(name,text,type="application/json"){
    const blob=new Blob([text],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),800)
  },

  sessionDate(session){return new Date(session.endedAt||session.date||Date.now())},

  monthKey(date){
    const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`
  },

  monthLabel(key){
    const [y,m]=key.split("-").map(Number);
    return new Date(y,m-1,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase())
  },

  archiveMonths(){
    const map=new Map();
    (this.data.sessions||[]).forEach(s=>{
      const key=this.monthKey(this.sessionDate(s));
      if(!map.has(key))map.set(key,[]);map.get(key).push(s)
    });
    return [...map.entries()].sort((a,b)=>b[0].localeCompare(a[0]))
  },

  buildBackupPayload(){
    const payload={
      format:"GymTracker Phoenix Backup",
      schema_version:1,
      app_version:"9.9.16",
      profile:{id:this.activeProfileId,name:this.activeProfile()?.name||this.activeProfileId},
      exportedAt:new Date().toISOString(),
      counts:{
        sessions:(this.data.sessions||[]).length,
        routines:(this.data.routines||[]).length,
        weights:(this.data.weights||[]).length,
        personalExercises:(this.data.personalExercises||[]).length
      },
      data:this.data
    };
    const canonical=JSON.stringify(payload);
    payload.verification={algorithm:"FNV-1a",checksum:this.archiveChecksum(canonical)};
    return payload
  },

  createFullBackup(){
    try{
      const payload=this.buildBackupPayload();
      const text=JSON.stringify(payload,null,2);
      const date=new Date().toISOString().slice(0,10);
      this.downloadFile(`GymTracker_${this.activeProfile()?.name||this.activeProfileId}_Backup_${date}.gtb`,text,"application/json");
      this.data.backupLog.unshift({createdAt:new Date().toISOString(),checksum:payload.verification.checksum,counts:payload.counts});
      this.data.backupLog=this.data.backupLog.slice(0,12);this.save();this.renderBackups(false);this.toast("Copia creada y verificada")
    }catch(error){this.reportError(error)}
  },

  exportSessionsCsv(){
    try{
      const rows=[["fecha","rutina","ejercicio","serie","repeticiones","peso_kg","volumen_kg","duracion_min"]];
      (this.data.sessions||[]).forEach(session=>{
        const date=this.sessionDate(session).toISOString();
        (session.exercises||[]).forEach(ex=>{
          (ex.sets||[]).forEach((set,i)=>rows.push([date,session.routineName||"Entrenamiento",ex.name||"Ejercicio",i+1,Number(set.reps)||0,Number(set.weight)||0,(Number(set.reps)||0)*(Number(set.weight)||0),Math.round((Number(session.durationMs)||0)/60000)]))
        })
      });
      const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;
      const csv="\uFEFF"+rows.map(r=>r.map(esc).join(",")).join("\n");
      this.downloadFile(`GymTracker_${this.activeProfile()?.name||this.activeProfileId}_Historial_${new Date().toISOString().slice(0,10)}.csv`,csv,"text/csv;charset=utf-8");
      this.toast("CSV exportado")
    }catch(error){this.reportError(error)}
  },

  exportMonthArchive(key){
    try{
      const sessions=(this.data.sessions||[]).filter(s=>this.monthKey(this.sessionDate(s))===key);
      const setCount=sessions.reduce((n,s)=>n+(s.totalSets||((s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).length,0))),0);
      const payload={format:"GymTracker Phoenix Monthly Archive",schema_version:1,month:key,createdAt:new Date().toISOString(),counts:{sessions:sessions.length,sets:setCount},sessions};
      const canonical=JSON.stringify(payload);payload.verification={algorithm:"FNV-1a",checksum:this.archiveChecksum(canonical)};
      this.downloadFile(`GymTracker_${key}.json`,JSON.stringify(payload,null,2));
      const entry={month:key,sessions:sessions.length,sets:setCount,checksum:payload.verification.checksum,verifiedAt:new Date().toISOString()};
      this.data.archiveIndex=[entry,...(this.data.archiveIndex||[]).filter(x=>x.month!==key)];this.save();this.renderBackups(false);this.toast(`${this.monthLabel(key)} guardado y verificado`)
    }catch(error){this.reportError(error)}
  },

  renderBackups(withHistory=true){
    const months=this.archiveMonths();
    const latest=this.data.backupLog?.[0];
    const activeLimit=new Date(Date.now()-60*86400000);
    const activeSessions=(this.data.sessions||[]).filter(s=>this.sessionDate(s)>=activeLimit).length;
    const archived=(this.data.archiveIndex||[]);
    const totalSets=(this.data.sessions||[]).reduce((n,s)=>n+(Number(s.totalSets)||((s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).length,0))),0);
    document.getElementById("backups").innerHTML=`<div class="archive-phoenix">
      <section class="archive-hero phx-card phx-card--highlight">
        <div class="eyebrow">ARCHIVO PHOENIX</div><h1>Tus datos.<br><em>Siempre contigo.</em></h1>
        <p>Copias locales, verificadas y bajo tu control.</p>
        <div class="archive-last"><span>ÚLTIMA COPIA</span><b>${latest?new Date(latest.createdAt).toLocaleString("es-ES",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Aún no creada"}</b><small>${latest?`${latest.counts.sessions} sesiones · Verificada ${latest.checksum}`:"Crea tu primera copia completa"}</small></div>
        <button class="king archive-primary" onclick="App.createFullBackup()">CREAR COPIA AHORA</button>
      </section>
      <section class="archive-actions">
        <button onclick="document.getElementById('importFile').click()"><span>RESTAURAR</span><b>Abrir copia .gtb o JSON</b><em>›</em></button>
        <button onclick="App.exportSessionsCsv()"><span>EXPORTAR</span><b>Historial CSV</b><em>›</em></button>
      </section>
      <section class="archive-status phx-card"><div><span>BASE ACTIVA</span><strong>60 días</strong><small>${activeSessions} sesiones visibles</small></div><div><span>ARCHIVADOS</span><strong>${archived.length}</strong><small>meses verificados</small></div><div><span>TOTAL</span><strong>${(this.data.sessions||[]).length}</strong><small>${totalSets} series</small></div></section>
      <section class="archive-months"><div class="data-v2__section-title"><div><span>ARCHIVO MENSUAL</span><h2>Meses disponibles</h2></div></div>
      ${months.length?months.map(([key,sessions])=>{const sets=sessions.reduce((n,s)=>n+(Number(s.totalSets)||((s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).length,0))),0);const saved=archived.find(x=>x.month===key);return `<div class="archive-month ${saved?'verified':''}"><div><strong>${this.monthLabel(key)}</strong><small>${sessions.length} sesiones · ${sets} series</small></div><span>${saved?'VERIFICADO':'PENDIENTE'}</span><button onclick="App.exportMonthArchive('${key}')">${saved?'GUARDAR DE NUEVO':'GUARDAR'}</button></div>`}).join(""):`<div class="data-v2__empty">Los meses aparecerán después de tus primeros entrenamientos.</div>`}
      </section>
      <p class="archive-note">Phoenix no elimina datos mientras una copia no pueda verificarse correctamente.</p>
    </div>`;
    this.show("backups","Datos",{history:withHistory})
  },

  importBackupFile(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(reader.result);
        const incoming=parsed.data||parsed;
        if(!incoming||!Array.isArray(incoming.routines)||!Array.isArray(incoming.sessions))throw new Error("Formato incompatible");
        const safety=this.buildBackupPayload();
        localStorage.setItem(`${this.profileDbKey(this.activeProfileId)}_pre_restore_${Date.now()}`,JSON.stringify(safety));
        this.data=incoming;this.normalize();this.save();this.toast("Copia restaurada. Se guardó un punto de seguridad.");this.renderBackups(false)
      }catch(error){console.error(error);this.toast("No se pudo restaurar: archivo incompatible o dañado") }
    };reader.readAsText(file)
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
