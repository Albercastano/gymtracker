"use strict";
(function(){
  const VERSION="0.1.0";
  const allowed=new Set([
    "start-workout","resume-workout","discard-workout","open-home","open-data","open-history","open-weight","open-material-settings","open-library","open-routines","open-blocks","save-set","change-weight","change-reps","pause-timer","resume-timer","skip-rest","change-exercise","finish-workout"
  ]);
  const handlers=new Map();
  const audit=[];
  let coreBound=false;
  function record(entry){audit.push(Object.freeze({...entry,at:new Date().toISOString()}));if(audit.length>100)audit.shift()}
  function register(name,handler,{replace=false}={}){
    if(!allowed.has(name))throw new Error(`Forge Action Bus: acción no autorizada (${name})`);
    if(typeof handler!=="function")throw new TypeError(`Forge Action Bus: handler inválido para ${name}`);
    if(handlers.has(name)&&!replace)throw new Error(`Forge Action Bus: acción ya registrada (${name})`);
    handlers.set(name,handler);return true;
  }
  async function dispatch(name,payload={}){
    if(!allowed.has(name)){record({name,allowed:false,result:"rejected"});throw new Error(`Acción Forge no autorizada: ${name}`)}
    const handler=handlers.get(name);
    if(!handler){record({name,allowed:true,result:"unbound"});throw new Error(`Acción Forge sin enlazar: ${name}`)}
    const safePayload=payload&&typeof payload==="object"?Object.freeze({...payload}):Object.freeze({value:payload});
    try{
      const result=await handler(safePayload);
      record({name,allowed:true,result:"ok"});
      window.dispatchEvent(new CustomEvent("phxforgeaction",{detail:{name,result:"ok"}}));
      return result;
    }catch(error){
      record({name,allowed:true,result:"error",message:String(error?.message||error)});
      window.dispatchEvent(new CustomEvent("phxforgeactionerror",{detail:{name,message:String(error?.message||error)}}));
      throw error;
    }
  }
  function bindCore(app){
    if(!app||typeof app!=="object")throw new TypeError("Forge Action Bus: núcleo Phoenix no disponible");
    const bind=(name,fn)=>register(name,fn,{replace:true});
    bind("start-workout",({routineId})=>app.startWorkout(String(routineId||"")));
    bind("resume-workout",()=>app.resumeWorkout());
    bind("discard-workout",()=>app.discardWorkout());
    bind("open-home",()=>app.renderHome());
    bind("open-data",()=>app.renderData());
    bind("open-history",()=>app.renderHistory());
    bind("open-weight",()=>app.openWeightSheet());
    bind("open-material-settings",()=>app.openMaterialSettings());
    bind("open-library",()=>app.renderLibrary(false));
    bind("open-routines",()=>app.renderRoutines());
    bind("open-blocks",()=>app.renderBlocks());
    bind("save-set",()=>app.finishSet?.());
    bind("change-weight",({delta})=>app.changeWeight?.(Number(delta)||0));
    bind("change-reps",({delta})=>app.adjustExercise?.("reps",Number(delta)||0));
    bind("pause-timer",()=>app.toggleRestPause?.());
    bind("resume-timer",()=>app.toggleRestPause?.());
    bind("skip-rest",()=>app.skipRest?.());
    bind("change-exercise",()=>app.openAlternatives?.("Máquina ocupada"));
    bind("finish-workout",()=>app.finishWorkout?.());
    coreBound=true;
    window.dispatchEvent(new CustomEvent("phxforgecorebound",{detail:{version:VERSION,actions:handlers.size}}));
    return true;
  }
  window.PhoenixForgeActionBus=Object.freeze({
    version:VERSION,
    allowed:Object.freeze([...allowed]),
    register,
    dispatch,
    bindCore,
    isBound:name=>handlers.has(name),
    get coreBound(){return coreBound},
    getAudit:()=>audit.map(entry=>({...entry}))
  });
})();
