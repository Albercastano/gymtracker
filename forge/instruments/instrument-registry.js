"use strict";
(function(){
  const VERSION="0.4.0";
  const registry=new Map();
  const allowed=new Set(["precision-session-strip","precision-exercise-stage","precision-target-grid","precision-context-pair","precision-king-action","precision-quiet-action","precision-set-header","precision-set-console","precision-set-finish","precision-set-alternative","precision-set-back","precision-timer-header","precision-timer-core","precision-timer-controls","precision-timer-skip","precision-timer-settings","precision-exercise-summary-hero","precision-exercise-summary-metrics","precision-exercise-summary-sets","precision-exercise-summary-next","precision-workout-summary-hero","precision-workout-summary-metrics","precision-workout-summary-report","precision-workout-summary-notes","precision-workout-summary-actions"]);
  function register(id,definition){if(!allowed.has(id))throw new Error(`Instrumento Forge no autorizado: ${id}`);if(!definition||typeof definition.render!=="function")throw new TypeError(`Instrumento Forge inválido: ${id}`);registry.set(id,Object.freeze({...definition,id}));return true}
  function resolve(id){return registry.get(id)||null}
  function render(id,payload){const instrument=resolve(id);if(!instrument)throw new Error(`Instrumento Forge no registrado: ${id}`);return instrument.render(payload)}
  window.PhoenixForgeInstruments=Object.freeze({version:VERSION,allowed:Object.freeze([...allowed]),register,resolve,render,list:()=>[...registry.keys()]});
})();
