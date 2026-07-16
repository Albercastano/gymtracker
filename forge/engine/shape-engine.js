"use strict";
(function(){
  const VERSION="0.1.0";
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
  let core=null;
  const embeddedPrecision=Object.freeze({
    schemaVersion:1,id:"precision",name:"Precision",engine:"0.1.x",
    screens:{home:{layout:"stack",slots:[
      {id:"brand",component:"app-brand",variant:"precision-brand",order:10,span:12},
      {id:"storage",component:"storage-status",variant:"precision-alert",order:15,span:12},
      {id:"today",component:"workout-today",variant:"precision-hero",order:20,span:12,required:true},
      {id:"gym",component:"start-workout-action",variant:"precision-king",order:30,span:6,required:true,minTouch:56},
      {id:"data",component:"open-data-action",variant:"precision-secondary",order:40,span:6,required:true,minTouch:56},
      {id:"weekly",component:"weekly-progress",variant:"precision-cards",order:50,span:12},
      {id:"last",component:"last-workout",variant:"precision-card",order:60,span:12}
    ]}},
    responsive:{"360":{columns:4,gap:12},"390":{columns:4,gap:14},"430":{columns:4,gap:16}}
  });
  const supported=id=>Object.prototype.hasOwnProperty.call(registry,id);
  function setAttributes(id){
    document.documentElement.dataset.phxShape=id;
    document.documentElement.dataset.shape=id;
    if(document.body){document.body.dataset.phxShape=id;document.body.dataset.shape=id}
  }
  async function load(id){
    const safe=supported(id)?id:FALLBACK;
    if(cache.has(safe))return cache.get(safe);
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
      const certificate=contract?.validate?.(embeddedPrecision)||Object.freeze({valid:false,errors:Object.freeze([String(error?.message||error)]),warnings:Object.freeze([])});
      const loaded=Object.freeze({manifest:Object.freeze({id:FALLBACK,name:"Precision",version:"1.0.0",embedded:true,fallback:true}),shape:embeddedPrecision,certificate,error:String(error?.message||error)});
      cache.set(FALLBACK,loaded);certificates.set(FALLBACK,certificate);return loaded;
    }
  }
  async function apply(requested,options={}){
    const id=supported(requested)?requested:FALLBACK;
    const token=++generation;
    document.documentElement.dataset.phxShapeReady="false";
    const loaded=await load(id);
    if(token!==generation)return active;
    const resolved=loaded.certificate?.valid?id:FALLBACK;
    active=resolved;setAttributes(resolved);
    document.documentElement.dataset.phxShapeReady="true";
    document.documentElement.dataset.phxShapeCertified=String(loaded.certificate?.valid===true);
    document.documentElement.dataset.phxShapeMode="foundation";
    window.dispatchEvent(new CustomEvent("phxshapechange",{detail:{id:resolved,shape:loaded.shape,manifest:loaded.manifest,certificate:loaded.certificate,engine:VERSION,mode:"foundation",source:options.source||"unknown"}}));
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
  function getShape(id=active){return cache.get(supported(id)?id:FALLBACK)?.shape||null}
  function getManifest(id=active){return cache.get(supported(id)?id:FALLBACK)?.manifest||registry[supported(id)?id:FALLBACK]}
  const api=Object.freeze({
    version:VERSION,
    fallback:FALLBACK,
    registry,
    isSupported:supported,
    get active(){return active},
    get lastSnapshot(){return lastSnapshot},
    apply,
    load,
    bindCore,
    get coreBound(){return core!==null},
    snapshot,
    observeScreen,
    getShape,
    getManifest,
    getCertificate:id=>certificates.get(supported(id)?id:FALLBACK)||null,
    validate:shape=>contract?.validate?.(shape)||Object.freeze({valid:false,errors:["Contrato no disponible"],warnings:[]})
  });
  window.PhoenixShapeEngine=api;
  setAttributes(storedShape());
  document.addEventListener("DOMContentLoaded",()=>apply(storedShape(),{source:"boot"}),{once:true});
})();
