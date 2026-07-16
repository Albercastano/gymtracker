"use strict";
(function(){
  const VERSION="0.1.0";
  const REQUIRED=Object.freeze([
    "--phx-surface-screen","--phx-surface-primary","--phx-surface-raised","--phx-surface-panel","--phx-surface-inset",
    "--phx-edge-primary","--phx-border-subtle","--phx-border-active",
    "--phx-action-primary","--phx-action-primary-hi","--phx-action-primary-low",
    "--phx-text-primary","--phx-text-secondary","--phx-danger","--phx-success",
    "--phx-radius-control","--phx-radius-card","--phx-shadow-card","--phx-shadow-control",
    "--phx-control-min-height","--phx-press-travel","--phx-motion-fast","--phx-motion-panel"
  ]);
  function audit(materialId=document.documentElement.dataset.phxMaterial||"precision"){
    const styles=getComputedStyle(document.documentElement);
    const missing=REQUIRED.filter(token=>!styles.getPropertyValue(token).trim());
    const report=Object.freeze({version:VERSION,materialId,total:REQUIRED.length,passed:REQUIRED.length-missing.length,missing:Object.freeze(missing),valid:missing.length===0,at:new Date().toISOString()});
    document.documentElement.dataset.phxTokenContract=report.valid?"valid":"invalid";
    document.documentElement.dataset.phxTokenCoverage=`${report.passed}/${report.total}`;
    window.dispatchEvent(new CustomEvent("phxtokenaudit",{detail:report}));
    return report;
  }
  window.PhoenixTokenContract=Object.freeze({version:VERSION,required:REQUIRED,audit});
  document.addEventListener("DOMContentLoaded",()=>requestAnimationFrame(()=>audit()),{once:true});
  window.addEventListener("phxmaterialchange",event=>requestAnimationFrame(()=>audit(event.detail?.id)));
})();
