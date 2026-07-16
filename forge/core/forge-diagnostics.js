"use strict";
(function(){
  const VERSION="0.2.0";
  const reports=[];
  function run(app){
    const shapeEngine=window.PhoenixShapeEngine;
    const actionBus=window.PhoenixForgeActionBus;
    const contract=window.PhoenixShapeContract;
    const snapshot=shapeEngine?.snapshot?.(app?.currentScreen||"home",app)||null;
    const lastRender=shapeEngine?.lastRender||null;
    const report=Object.freeze({
      version:VERSION,
      at:new Date().toISOString(),
      build:document.documentElement.dataset.phxBuild||"unknown",
      shape:shapeEngine?.active||"unavailable",
      shapeReady:document.documentElement.dataset.phxShapeReady==="true",
      shapeCertified:document.documentElement.dataset.phxShapeCertified==="true",
      shapeContract:contract?.version||"unavailable",
      actionBus:actionBus?.version||"unavailable",
      coreBound:actionBus?.coreBound===true,
      shapeCoreBound:shapeEngine?.coreBound===true,
      screen:app?.currentScreen||null,
      snapshotAvailable:Boolean(snapshot),
      renderer:window.PhoenixForgeHomeRenderer?.version||"unavailable",
      homeRendered:document.getElementById("home")?.dataset?.forgeRendered==="true",
      renderReady:document.documentElement.dataset.phxShapeRenderReady==="true",
      lastRender,
      material:window.PhoenixMaterialEngine?.active||document.documentElement.dataset.phxMaterial||"unknown"
    });
    reports.unshift(report);if(reports.length>20)reports.length=20;
    window.dispatchEvent(new CustomEvent("phxforgediagnostics",{detail:report}));
    return report
  }
  window.PhoenixForgeDiagnostics=Object.freeze({version:VERSION,run,getReports:()=>reports.map(report=>({...report}))});
})();
