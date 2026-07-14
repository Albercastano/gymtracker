"use strict";
(function(){
  const nativeFetch=window.fetch.bind(window);
  const allowedExtensions=/\.(?:json|css|js|png|webp|svg|csv|txt|md|webmanifest)$/i;
  const allowedRoots=['/data/','/js/','/themes/','/templates/','/docs/'];
  function isLocalAsset(url,method){
    if(method!=='GET'||url.origin!==location.origin)return false;
    const path=url.pathname;
    if(path.endsWith('/')||path.endsWith('/index.html'))return true;
    return allowedRoots.some(root=>path.includes(root))&&allowedExtensions.test(path);
  }
  const audit=[];
  function record(entry){audit.push({...entry,at:new Date().toISOString()});if(audit.length>50)audit.shift()}
  window.fetch=function(input,init={}){
    const request=input instanceof Request?input:null;
    const method=String(init.method||request?.method||'GET').toUpperCase();
    const url=new URL(request?.url||String(input),location.href);
    if(isLocalAsset(url,method)){
      record({allowed:true,method,url:url.pathname});
      return nativeFetch(input,init);
    }
    record({allowed:false,method,url:url.origin+url.pathname});
    return Promise.reject(new TypeError('Phoenix Network Gate: conexión bloqueada por política local-first'));
  };
  window.PhoenixNetworkGate=Object.freeze({
    mode:'local-only',syncEnabled:false,getAudit:()=>audit.map(x=>({...x})),
    canConnect:()=>false,
    describe:()=>({mode:'local-only',externalConnections:false,syncProvider:'none'})
  });
})();
