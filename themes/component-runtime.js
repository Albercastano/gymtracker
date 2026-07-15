"use strict";
(function(){
  const VERSION="0.1.0";
  const contract=window.PhoenixComponentContract;
  const stats={scans:0,nodes:0,classified:0,byType:{button:0,surface:0,input:0,chip:0,metric:0,progress:0,label:0,timer:0}};
  const selectors=Object.freeze({
    buttons:"button,.primary,.secondary,.danger,.king,.data-king,.material-option,.profile-choice",
    cards:".card,.phx-card,.list-item,.exercise-card,.settings-section,.series-box,.control-box,.routine-card,.routine-item,.week-card,.week-day,.day-card,.block-card,.weight-card,.pedb-forged-card,.forge-lab__sample-card,.forge-lab__metric-card,.forge-lab__state-card,.forge-lab__contract,.forge-lab__certificate,.forge-lab__diagnostics",
    panels:".sheet-panel,.profile-gate__panel,.phoenix-origin__panel,.forged-dialog__panel,.profile-panel,.profile-confirm-panel,.weight-panel,.exercise-detail-panel,[role='dialog']",
    rails:".topbar",
    inputs:"input,select,textarea",
    chips:"[class*='chip'],[class*='badge'],[class*='status']",
    metrics:"[class*='metric']",
    progress:"progress,[class*='progress']",
    labels:".eyebrow",
    timers:".phoenix-timer"
  });
  function add(el,type,variant){
    if(!(el instanceof Element))return;
    const base=contract?.definitions?.[type]?.className||`phx-${type}`;
    const was=el.dataset.phxComponent;
    el.classList.add(base);
    if(variant)el.classList.add(`${base}--${variant}`);
    el.dataset.phxComponent=type;
    if(!was){stats.classified++;stats.byType[type]=(stats.byType[type]||0)+1}
  }
  function classifyButton(el){
    let variant="neutral";
    if(el.classList.contains("danger")||el.classList.contains("forged-danger"))variant="danger";
    else if(el.classList.contains("primary")||el.classList.contains("king")||el.classList.contains("data-king")||el.classList.contains("small-king"))variant="primary";
    else if(el.classList.contains("secondary"))variant="secondary";
    else if(el.classList.contains("material-option")||el.hasAttribute("data-ui-material"))variant="material";
    else if(el.classList.contains("profile-choice")||el.hasAttribute("data-profile"))variant="profile";
    add(el,"button",variant);
    if(el.disabled||el.getAttribute("aria-disabled")==="true")el.classList.add("is-disabled");
  }
  function classifyInput(el){
    let variant=el.tagName==="SELECT"?"select":el.tagName==="TEXTAREA"?"textarea":"text";
    if(el.type==="checkbox"||el.type==="radio")variant="toggle";
    add(el,"input",variant);
  }
  function classifyChip(el){
    let variant="neutral";
    if(el.classList.contains("success"))variant="success";
    else if(el.classList.contains("warning"))variant="warning";
    else if(el.classList.contains("error")||el.classList.contains("danger"))variant="danger";
    else if(el.classList.contains("active"))variant="active";
    add(el,"chip",variant);
  }
  function scan(root=document){
    stats.scans++;
    const scope=root instanceof Element||root instanceof Document||root instanceof DocumentFragment?root:document;
    const query=(selector)=>{
      const found=[];
      if(scope instanceof Element&&scope.matches(selector))found.push(scope);
      scope.querySelectorAll?.(selector).forEach(el=>found.push(el));
      return found;
    };
    const seen=new Set();
    const each=(selector,fn)=>query(selector).forEach(el=>{if(seen.has(el))return;seen.add(el);stats.nodes++;fn(el)});
    each(selectors.buttons,classifyButton);
    each(selectors.cards,el=>add(el,"surface","card"));
    each(selectors.panels,el=>add(el,"surface","panel"));
    each(selectors.rails,el=>add(el,"surface","rail"));
    each(selectors.inputs,classifyInput);
    each(selectors.chips,classifyChip);
    each(selectors.metrics,el=>add(el,"metric",el.classList.contains("hero")?"hero":"standard"));
    each(selectors.progress,el=>add(el,"progress","standard"));
    each(selectors.labels,el=>add(el,"label","eyebrow"));
    each(selectors.timers,el=>add(el,"timer",document.documentElement.dataset.phxMaterial||"precision"));
    document.documentElement.dataset.phxComponentRuntime="ready";
    document.documentElement.dataset.phxComponentContract=contract?.version||"unavailable";
    window.dispatchEvent(new CustomEvent("phxcomponentcoverage",{detail:report()}));
  }
  function report(){
    const total=document.querySelectorAll("[data-phx-component]").length;
    const byType={};
    document.querySelectorAll("[data-phx-component]").forEach(el=>{const type=el.dataset.phxComponent;byType[type]=(byType[type]||0)+1});
    return Object.freeze({version:VERSION,contractVersion:contract?.version||"unavailable",total,byType:Object.freeze(byType)});
  }
  let queued=false;
  function schedule(root){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;scan(root||document)});
  }
  const api=Object.freeze({version:VERSION,scan,report,selectors});
  window.PhoenixComponentRuntime=api;
  document.addEventListener("DOMContentLoaded",()=>{
    scan(document);
    const observer=new MutationObserver(mutations=>{
      const fragment=document.createDocumentFragment();
      let hasNodes=false;
      mutations.forEach(m=>m.addedNodes.forEach(node=>{if(node.nodeType===1){fragment.appendChild(node.cloneNode(false));hasNodes=true}}));
      if(hasNodes)schedule(document);
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("phxmaterialchange",()=>schedule(document));
  },{once:true});
})();
