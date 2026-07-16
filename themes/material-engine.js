"use strict";
(function(){
  const ENGINE_VERSION="0.5.1";
  const BOOT_DEFAULT="apex";
  const FALLBACK="precision";
  const registry=Object.freeze({
    precision:Object.freeze({
      schemaVersion:1,id:"precision",name:"FORGED Precision",author:"Phoenix Forge",version:"1.2.0",engine:"0.3.x",componentContract:"0.1.x",status:"stable",fallback:true,
      styles:Object.freeze(["tokens.css","components.css","timer.css"]),assetsBudgetKb:28,
      capabilities:Object.freeze(["visual-tokens","components","timer","component-contract"]),network:"forbidden",scripts:"forbidden"
    }),
    apex:Object.freeze({
      schemaVersion:1,id:"apex",name:"FORGED Apex",author:"Phoenix Forge",version:"1.0.0-beta",engine:"0.3.x",componentContract:"0.1.x",status:"beta",fallback:false,
      styles:Object.freeze(["apex.css"]),assetsBudgetKb:96,
      capabilities:Object.freeze(["visual-tokens","components","timer","motion","component-contract"]),network:"forbidden",scripts:"forbidden"
    })
  });
  const contract=window.PhoenixMaterialContract;
  const certificates=contract?.certifyRegistry?.(registry)||Object.freeze({});
  let active=FALLBACK;
  let generation=0;

  function validCertificate(id){return certificates?.[id]?.valid===true}
  function safeId(value){return typeof value==="string"&&/^[a-z0-9-]{1,40}$/.test(value)&&Object.hasOwn(registry,value)&&validCertificate(value)}
  function safeStyle(value){return typeof value==="string"&&/^[a-z0-9-]+\.css$/.test(value)}
  function getManifest(id){return registry[safeId(id)?id:FALLBACK]}
  function getCertificate(id){return certificates[safeId(id)?id:FALLBACK]||null}
  function setAttributes(id){
    document.documentElement.dataset.phxMaterial=id;
    document.documentElement.dataset.material=id;
    if(document.body){document.body.dataset.phxMaterial=id;document.body.dataset.material=id}
  }
  function removeOldLinks(){document.querySelectorAll('link[data-phx-material-style]').forEach(el=>el.remove());document.querySelectorAll('link[href*="/foundry/"],link[data-phx-material-style="foundry"]').forEach(el=>el.remove())}
  function refreshControls(){
    document.querySelectorAll('[data-ui-material]').forEach(button=>{
      const selected=button.dataset.uiMaterial===active;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
      const state=button.querySelector('.material-state');
      if(state)state.textContent=selected?'MATERIAL ACTIVO':'APLICAR MATERIAL';
    });
    document.querySelectorAll('[data-material-current]').forEach(el=>el.textContent=getManifest(active).name);
  }
  function linkFor(id,file,token){
    return new Promise((resolve,reject)=>{
      if(!safeStyle(file))return reject(new Error('Unsafe material stylesheet'));
      const bootstrap=id==='apex'&&file==='apex.css'?document.querySelector('link[data-phx-apex-bootstrap]'):null;
      if(bootstrap)return resolve(bootstrap);
      const link=document.createElement('link');
      link.rel='stylesheet';link.href=`themes/${id}/${file}`;link.dataset.phxMaterialStyle=id;
      link.onload=()=>token===generation?resolve(link):resolve(link);
      link.onerror=()=>reject(new Error(`Material asset failed: ${file}`));
      document.head.appendChild(link);
    });
  }
  async function apply(requested,options={}){
    const id=safeId(requested)?requested:FALLBACK;
    const manifest=getManifest(id);
    const certificate=getCertificate(id);
    if(!certificate?.valid&&id!==FALLBACK)return apply(FALLBACK,{...options,fallback:true,reason:'contract'});
    const token=++generation;
    active=id;setAttributes(id);removeOldLinks();
    try{
      await Promise.all(manifest.styles.map(file=>linkFor(id,file,token)));
      if(token!==generation)return active;
      document.documentElement.dataset.phxMaterialReady='true';
      document.documentElement.dataset.phxMaterialCertified=String(certificate?.valid===true);
      refreshControls();
      window.dispatchEvent(new CustomEvent('phxmaterialchange',{detail:{id,manifest,certificate,engine:ENGINE_VERSION}}));
      return id;
    }catch(error){
      console.error('[PHX Skin Engine]',error);
      if(id!==FALLBACK)return apply(FALLBACK,{...options,fallback:true,reason:'asset'});
      document.documentElement.dataset.phxMaterialReady='false';
      document.documentElement.dataset.phxMaterialCertified='false';
      refreshControls();
      return FALLBACK;
    }
  }
  function storedMaterial(){
    try{
      const activeProfile=localStorage.getItem('gymtracker_phoenix_active_profile_v1')||'alberto';
      const key=activeProfile==='alberto'?'gymtracker_phoenix_v8':`gymtracker_phoenix_v8_profile_${activeProfile}`;
      const data=JSON.parse(localStorage.getItem(key)||'null');
      const stored=data?.settings?.uiMaterial;
      if(stored==='foundry')return BOOT_DEFAULT;
      return safeId(stored)?stored:BOOT_DEFAULT;
    }catch(_){return BOOT_DEFAULT}
  }
  const api=Object.freeze({
    version:ENGINE_VERSION,contractVersion:contract?.version||'unavailable',fallback:FALLBACK,registry,certificates,
    isSupported:safeId,get active(){return active},getManifest,getCertificate,apply,refreshControls,
    validate:(id)=>contract?.validateManifest?.(registry[id])||Object.freeze({valid:false,errors:['Contrato no disponible'],warnings:[]})
  });
  window.PhoenixMaterialEngine=api;
  setAttributes(storedMaterial());
  document.addEventListener('DOMContentLoaded',()=>apply(storedMaterial(),{boot:true}),{once:true});
})();
