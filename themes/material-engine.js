"use strict";
(function(){
  const ENGINE_VERSION="0.1.0";
  const FALLBACK="precision";
  const registry=Object.freeze({
    precision:Object.freeze({id:"precision",name:"FORGED Precision",version:"1.0.0",status:"stable",styles:["tokens.css","components.css","timer.css"]}),
    foundry:Object.freeze({id:"foundry",name:"FORGED Foundry",version:"0.3.0-beta",status:"beta",styles:["tokens.css","components.css","timer.css"]})
  });
  let active=FALLBACK;
  let generation=0;

  function safeId(value){return typeof value==="string"&&/^[a-z0-9-]{1,40}$/.test(value)&&Object.hasOwn(registry,value)}
  function safeStyle(value){return typeof value==="string"&&/^[a-z0-9-]+\.css$/.test(value)}
  function getManifest(id){return registry[safeId(id)?id:FALLBACK]}
  function setAttributes(id){
    document.documentElement.dataset.phxMaterial=id;
    document.documentElement.dataset.material=id; // backwards compatibility during Alpha
    if(document.body){document.body.dataset.phxMaterial=id;document.body.dataset.material=id}
  }
  function removeOldLinks(){document.querySelectorAll('link[data-phx-material-style]').forEach(el=>el.remove())}
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
    const token=++generation;
    active=id;setAttributes(id);removeOldLinks();
    try{
      await Promise.all(manifest.styles.map(file=>linkFor(id,file,token)));
      if(token!==generation)return active;
      document.documentElement.dataset.phxMaterialReady='true';
      refreshControls();
      window.dispatchEvent(new CustomEvent('phxmaterialchange',{detail:{id,manifest,engine:ENGINE_VERSION}}));
      return id;
    }catch(error){
      console.error('[PHX Skin Engine]',error);
      if(id!==FALLBACK)return apply(FALLBACK,{...options,fallback:true});
      document.documentElement.dataset.phxMaterialReady='false';
      refreshControls();
      return FALLBACK;
    }
  }
  function storedMaterial(){
    try{
      const activeProfile=localStorage.getItem('gymtracker_phoenix_active_profile_v1')||'alberto';
      const key=activeProfile==='alberto'?'gymtracker_phoenix_v8':`gymtracker_phoenix_v8_profile_${activeProfile}`;
      const data=JSON.parse(localStorage.getItem(key)||'null');
      return safeId(data?.settings?.uiMaterial)?data.settings.uiMaterial:FALLBACK;
    }catch(_){return FALLBACK}
  }
  const api=Object.freeze({version:ENGINE_VERSION,fallback:FALLBACK,registry,isSupported:safeId,get active(){return active},getManifest,apply,refreshControls});
  window.PhoenixMaterialEngine=api;
  setAttributes(storedMaterial());
  document.addEventListener('DOMContentLoaded',()=>apply(storedMaterial(),{boot:true}),{once:true});
})();
