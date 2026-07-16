"use strict";
(function(){
  const VERSION="0.5.0";
  const FALLBACK="precision";
  const contract=window.PhoenixShapeContract;
  const registry=Object.freeze({
    precision:Object.freeze({id:"precision",name:"Precision",manifest:"forge/shapes/precision/manifest.json",shape:"forge/shapes/precision/shape.json",status:"stable",fallback:true})
  });
  const cache=new Map();
  const certificates=new Map();
  let active=FALLBACK;
  let generation=0;
  let lastSnapshot=null;
  let lastRender=null;
  let core=null;
  const embeddedPrecision=Object.freeze({
    schemaVersion:1,id:"precision",name:"Precision",engine:"0.2.x",
    screens:{home:{layout:"stack",slots:[
      {id:"brand",component:"app-brand",variant:"precision-brand",order:10,span:12},
      {id:"storage",component:"storage-status",variant:"precision-alert",order:15,span:12},
      {id:"today",component:"workout-today",variant:"precision-hero",order:20,span:12,required:true},
      {id:"gym",component:"start-workout-action",variant:"precision-king",order:30,span:6,required:true,minTouch:56},
      {id:"data",component:"open-data-action",variant:"precision-secondary",order:40,span:6,required:true,minTouch:56},
      {id:"weekly",component:"weekly-progress",variant:"precision-cards",order:50,span:12},
      {id:"last",component:"last-workout",variant:"precision-card",order:60,span:12}
    ],regions:[
      {id:"brand-region",variant:"precision-flow",order:10,slots:["brand"]},
      {id:"alert-region",variant:"precision-flow",order:15,slots:["storage"]},
      {id:"hero-region",variant:"precision-flow",order:20,slots:["today"]},
      {id:"action-region",variant:"precision-actions",order:30,slots:["gym","data"]},
      {id:"metric-region",variant:"precision-metrics",order:50,slots:["weekly"]},
      {id:"history-region",variant:"precision-flow",order:60,slots:["last"]}
    ]},gym:{layout:"stack",slots:[
      {id:"session",component:"session-progress",instrument:"precision-session-strip",order:10,span:12,required:true},
      {id:"exercise",component:"exercise-stage",instrument:"precision-exercise-stage",order:20,span:12,required:true},
      {id:"target",component:"target-instrument",instrument:"precision-target-grid",order:30,span:12,required:true},
      {id:"context",component:"workout-context",instrument:"precision-context-pair",order:40,span:12},
      {id:"begin",component:"begin-set-action",instrument:"precision-king-action",order:50,span:12,required:true,minTouch:56},
      {id:"pause",component:"pause-workout-action",instrument:"precision-quiet-action",order:60,span:12,minTouch:44}
    ]},series:{layout:"instrument",slots:[
      {id:"set-head",component:"set-header",instrument:"precision-set-header",order:10,span:12,required:true},
      {id:"set-console",component:"set-console",instrument:"precision-set-console",order:20,span:12,required:true},
      {id:"set-save",component:"save-set-action",instrument:"precision-set-finish",order:30,span:12,required:true,minTouch:56},
      {id:"set-change",component:"change-exercise-action",instrument:"precision-set-alternative",order:40,span:12,minTouch:44},
      {id:"set-back",component:"return-workout-action",instrument:"precision-set-back",order:50,span:12,minTouch:44}
    ]},rest:{layout:"instrument",slots:[
      {id:"timer-head",component:"timer-header",instrument:"precision-timer-header",order:10,span:12,required:true},
      {id:"timer-core",component:"timer-core",instrument:"precision-timer-core",order:20,span:12,required:true},
      {id:"timer-controls",component:"timer-controls",instrument:"precision-timer-controls",order:30,span:12,required:true,minTouch:54},
      {id:"timer-skip",component:"timer-skip",instrument:"precision-timer-skip",order:40,span:12,minTouch:44},
      {id:"timer-settings",component:"timer-settings",instrument:"precision-timer-settings",order:50,span:12,minTouch:44}
    ]}},
    responsive:{"360":{columns:4,gap:12},"390":{columns:4,gap:14},"430":{columns:4,gap:16}}
  });
  const supported=id=>Object.prototype.hasOwnProperty.call(registry,id);
  function setAttributes(id){
    document.documentElement.dataset.phxShape=id;
    document.documentElement.dataset.shape=id;
    if(document.body){document.body.dataset.phxShape=id;document.body.dataset.shape=id}
  }
  function embeddedLoaded(error=null){
    const certificate=contract?.validate?.(embeddedPrecision)||Object.freeze({valid:false,errors:Object.freeze(["Contrato de forma no disponible"]),warnings:Object.freeze([])});
    return Object.freeze({manifest:Object.freeze({id:FALLBACK,name:"Precision",version:"0.2.0",embedded:true,fallback:true}),shape:embeddedPrecision,certificate,error:error?String(error?.message||error):null});
  }
  cache.set(FALLBACK,embeddedLoaded());
  certificates.set(FALLBACK,cache.get(FALLBACK).certificate);

  async function load(id,{refresh=false}={}){
    const safe=supported(id)?id:FALLBACK;
    if(cache.has(safe)&&!refresh)return cache.get(safe);
    const entry=registry[safe];
    try{
      const [manifestResponse,shapeResponse]=await Promise.all([fetch(entry.manifest),fetch(entry.shape)]);
      if(!manifestResponse.ok||!shapeResponse.ok)throw new Error(`No se pudo cargar la forma ${safe}`);
      const manifest=await manifestResponse.json();
      const shape=await shapeResponse.json();
      const certificate=contract?.validate?.(shape)||Object.freeze({valid:false,errors:Object.freeze(["Contrato de forma no disponible"]),warnings:Object.freeze([])});
      if(!certificate.valid)throw new Error(certificate.errors.join(" · "));
      const loaded=Object.freeze({manifest:Object.freeze(manifest),shape:Object.freeze(shape),certificate});
      cache.set(safe,loaded);certificates.set(safe,certificate);return loaded;
    }catch(error){
      if(safe!==FALLBACK)return load(FALLBACK);
      const loaded=embeddedLoaded(error);cache.set(FALLBACK,loaded);certificates.set(FALLBACK,loaded.certificate);return loaded;
    }
  }
  async function apply(requested,options={}){
    const id=supported(requested)?requested:FALLBACK;
    const token=++generation;
    document.documentElement.dataset.phxShapeReady="false";
    const loaded=await load(id,{refresh:options.refresh===true});
    if(token!==generation)return active;
    const resolved=loaded.certificate?.valid?id:FALLBACK;
    active=resolved;setAttributes(resolved);
    document.documentElement.dataset.phxShapeReady="true";
    document.documentElement.dataset.phxShapeCertified=String(loaded.certificate?.valid===true);
    document.documentElement.dataset.phxShapeMode="renderer-home-workout-set-rest";
    window.dispatchEvent(new CustomEvent("phxshapechange",{detail:{id:resolved,shape:loaded.shape,manifest:loaded.manifest,certificate:loaded.certificate,engine:VERSION,mode:"renderer-home-workout-set-rest",source:options.source||"unknown"}}));
    return resolved;
  }
  function storedShape(){
    try{
      const activeProfile=localStorage.getItem("gymtracker_phoenix_active_profile_v1")||"alberto";
      const key=activeProfile==="alberto"?"gymtracker_phoenix_v8":`gymtracker_phoenix_v8_profile_${activeProfile}`;
      const data=JSON.parse(localStorage.getItem(key)||"null");
      return supported(data?.settings?.uiShape)?data.settings.uiShape:FALLBACK;
    }catch(_){return FALLBACK}
  }
  function bindCore(app){
    if(!app||typeof app!=="object")throw new TypeError("Forge Shape Engine: núcleo Phoenix no disponible");
    core=app;
    window.dispatchEvent(new CustomEvent("phxshapecorebound",{detail:{version:VERSION}}));
    return true
  }
  function snapshot(screen,app=core){
    if(!app)return null;
    lastSnapshot=window.PhoenixForgeViewModel?.get?.(screen||app?.currentScreen||"home",app)||null;
    return lastSnapshot
  }
  function observeScreen(screen,app=core){
    if(app&&app!==core)core=app;
    const current=snapshot(screen,app);
    window.dispatchEvent(new CustomEvent("phxshapesnapshot",{detail:{shape:active,screen,snapshot:current}}));
    return current
  }
  function getLoaded(id=active){return cache.get(supported(id)?id:FALLBACK)||cache.get(FALLBACK)}
  function getShape(id=active){return getLoaded(id)?.shape||embeddedPrecision}
  function getManifest(id=active){return getLoaded(id)?.manifest||registry[supported(id)?id:FALLBACK]}
  function render(screen,target,app=core,options={}){
    if(app&&app!==core)core=app;
    const shape=getShape(active);
    const current=snapshot(screen,app);
    const context=Object.freeze({
      materialId:window.PhoenixMaterialEngine?.active||document.documentElement.dataset.phxMaterial||"precision",
      shapeId:active,
      source:options.source||"app"
    });
    try{
      let report=null;
      if(screen==="home")report=window.PhoenixForgeHomeRenderer?.render?.({target,shape,snapshot:current,context});
      if(screen==="gym")report=window.PhoenixForgeWorkoutRenderer?.render?.({target,shape,snapshot:current,context});
      if(screen==="series")report=window.PhoenixForgeSetRenderer?.render?.({target,shape,snapshot:current,context});
      if(screen==="rest")report=window.PhoenixForgeRestRenderer?.render?.({target,shape,snapshot:current,context});
      if(!report)throw new Error(`No existe renderer declarativo para ${screen}`);
      lastRender=Object.freeze({...report,at:new Date().toISOString(),fallback:false});
      document.documentElement.dataset.phxShapeRenderer=screen;
      document.documentElement.dataset.phxShapeRenderReady="true";
      window.dispatchEvent(new CustomEvent("phxshaperender",{detail:lastRender}));
      return true;
    }catch(error){
      lastRender=Object.freeze({ok:false,screen,shape:active,at:new Date().toISOString(),fallback:true,message:String(error?.message||error)});
      document.documentElement.dataset.phxShapeRenderReady="false";
      window.dispatchEvent(new CustomEvent("phxshaperendererror",{detail:lastRender}));
      console.warn("Phoenix Shape Engine renderer fallback",lastRender);
      return false;
    }
  }
  const api=Object.freeze({
    version:VERSION,
    fallback:FALLBACK,
    registry,
    isSupported:supported,
    get active(){return active},
    get lastSnapshot(){return lastSnapshot},
    get lastRender(){return lastRender},
    apply,
    load,
    bindCore,
    get coreBound(){return core!==null},
    snapshot,
    observeScreen,
    render,
    getShape,
    getManifest,
    getCertificate:id=>certificates.get(supported(id)?id:FALLBACK)||null,
    validate:shape=>contract?.validate?.(shape)||Object.freeze({valid:false,errors:["Contrato no disponible"],warnings:[]})
  });
  window.PhoenixShapeEngine=api;
  setAttributes(storedShape());
  document.addEventListener("DOMContentLoaded",()=>apply(storedShape(),{source:"boot",refresh:true}),{once:true});
})();
