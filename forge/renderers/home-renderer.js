"use strict";
(function(){
  const VERSION="0.5.0";
  const ACTION_ATTRIBUTE="data-forge-action";
  const REGION_VARIANTS=new Set(["precision-flow","precision-actions","precision-metrics"]);

  function escapeHtml(value){
    return String(value??"").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
  }
  function number(value){return Number.isFinite(Number(value))?Number(value):0}
  function localeNumber(value){return Math.round(number(value)).toLocaleString("es-ES")}
  function action(name,label,extra=""){
    return `${ACTION_ATTRIBUTE}="${escapeHtml(name)}" ${extra} aria-label="${escapeHtml(label)}"`;
  }
  function materialContext(context={}){
    const id=String(context.materialId||"precision");
    return {
      id,
      short:id==="apex"?"APEX":id==="vektor"?"VEKTOR":"PRECISION",
      subtitle:id==="apex"?"PHOENIX · APEX":id==="vektor"?"PHOENIX · VEKTOR":"PHOENIX · FORGED"
    };
  }

  const components=Object.freeze({
    "app-brand":({data,context})=>{
      const material=materialContext(context);
      return `<section class="home-brand home-brand--forged" aria-label="GymTracker Phoenix" data-forge-component="app-brand">
        <div class="home-brand__plate"><img src="icon-512.png" alt="" aria-hidden="true"></div>
        <div class="home-brand__copy"><div class="home-brand__name">${escapeHtml(data?.name||"GYMTRACKER")}</div><div class="home-brand__sub">${escapeHtml(material.subtitle)}</div></div>
        <button type="button" class="home-material-access" ${action("open-material-settings","Cambiar material visual")}>
          <span>APARIENCIA</span><b data-material-short>${escapeHtml(material.short)}</b><em aria-hidden="true">›</em>
        </button>
      </section>`;
    },
    "storage-status":({data})=>data?.healthy===false
      ?`<section class="system-alert" role="alert" data-forge-component="storage-status"><strong>GUARDADO EN PAUSA</strong><span>El dispositivo no permite guardar ahora. Libera espacio antes de cerrar GymTracker.</span></section>`
      :"",
    "workout-today":({data})=>{
      const active=data?.status==="active",ready=data?.status==="ready";
      const eyebrow=active?"ENTRENAMIENTO EN CURSO":"HOY TOCA";
      const title=escapeHtml(data?.title||(ready?"Rutina":"DESCANSO"));
      const c=data?.continuity||{},environment=c.environment||"gym",plan=c.plan||null;
      const changed=plan?.items?.filter?.(x=>x.changed)?.length||0,unresolved=plan?.items?.filter?.(x=>x.unresolved)?.length||0;
      const envLabel=environment==="home"?"CASA":environment==="street"?"CALLE":"GIMNASIO";
      const meta=active?`<span>${number(data?.currentExercise)}/${Math.max(1,number(data?.totalExercises))} ejercicios</span><span>${escapeHtml(data?.exerciseName||"Sesión activa")}</span><span class="estimated-time">Toca para continuar</span>`:ready?`<span>${number(data?.totalExercises)} ejercicios</span><span>${number(data?.totalSets)} series</span><span class="estimated-time">~${number(data?.estimatedMinutes)} min</span>`:`<span>Sin rutina asignada</span>`;
      const continuity=(!active&&ready)?`<div class="home-continuity" data-continuity-environment="${environment}">
        <div class="home-continuity__question">¿Dónde entrenas hoy?</div>
        <div class="home-continuity__choices" role="group" aria-label="Entorno de entrenamiento">
          ${[["gym","GIMNASIO"],["home","CASA"],["street","CALLE"]].map(([id,label])=>`<button type="button" class="${environment===id?"active":""}" ${action("select-home-environment",`Entrenar en ${label.toLowerCase()}`,`data-environment="${id}"`)}>${label}</button>`).join("")}
        </div>
        <div class="home-continuity__status ${c.busy?"is-busy":""} ${unresolved?"has-pending":""}">${c.busy?`<strong>PREPARANDO ${envLabel}</strong><span>PEDB está conservando la intención de la sesión…</span>`:plan?`<strong>${envLabel} SELECCIONADA</strong><span>${changed} ejercicio${changed===1?"":"s"} adaptado${changed===1?"":"s"} · Objetivo conservado ${number(plan.objectiveScore)}% · ${number(plan.estimatedMinutes)} min${unresolved?` · ${unresolved} pendiente${unresolved===1?"":"s"}`:""}</span>`:`<strong>GIMNASIO SELECCIONADO</strong><span>Rutina prevista · Objetivo original conservado</span>`}</div>
        ${plan&&(changed||unresolved)?`<button type="button" class="home-continuity__review" ${action("review-continuity-plan","Revisar cambios de adaptación")}>REVISAR CAMBIOS</button>`:""}
      </div>`:"";
      return `<section class="phx-card phx-card--highlight home-today-card home-today-card--definitive ${active?"is-active":""}" aria-labelledby="today-title" data-forge-component="workout-today"><div class="phx-card__eyebrow">${eyebrow}</div><div id="today-title" class="phx-card__hero-title">${title}</div><div class="home-summary">${meta}</div>${continuity}${active?`<div class="home-active-actions"><button class="home-continue" ${action("resume-workout","Continuar entrenamiento")}>CONTINUAR</button><button class="home-discard" ${action("discard-workout","Descartar entrenamiento")}>Descartar</button></div>`:""}</section>`;
    },
    "start-workout-action":({data})=>{
      const active=data?.mode==="resume";
      const ready=Boolean(data?.routineId);
      const environment=data?.environment||"gym";
      const environmentLabel=environment==="home"?"Casa":environment==="street"?"Calle":"Gimnasio";
      const unresolved=number(data?.unresolved),busy=Boolean(data?.busy);
      const actionName=active?"resume-workout":ready?(unresolved?"review-continuity-plan":"start-continuity-workout"):"open-routines";
      const routineId=escapeHtml(data?.routineId||"");
      const title=active?"CONTINUAR":"ENTRENO";
      const context=active?"Sesión activa":ready?(busy?"Preparando adaptación":unresolved?`${unresolved} ejercicio${unresolved===1?"":"s"} pendiente${unresolved===1?"":"s"}`:`${environmentLabel} seleccionado`):"Sin rutina prevista";
      const prompt=active?"Continuar ahora":ready?(busy?"PREPARANDO":unresolved?"REVISAR":"FOCUS"):"ELEGIR RUTINA";
      return `<button class="home-mode home-mode--gym ${active?"has-active":""} ${ready?"has-routine":"is-empty"} ${unresolved?"has-pending":""} ${busy?"is-busy":""}" ${busy?'disabled aria-disabled="true"':action(actionName,active?"Continuar entrenamiento":ready?(unresolved?"Revisar ejercicios pendientes":`Comenzar entrenamiento en ${environmentLabel.toLowerCase()}`):"Elegir rutina",`data-routine-id="${routineId}"`)} data-forge-component="start-workout-action">
        <span class="home-mode__kicker">${active?"ACTIVO":"ENTRENO"}</span>
        <strong>${title}</strong>
        <small class="home-mode__context">${context}</small>
        <span class="home-mode__cta">${prompt}</span>
      </button>`;
    },
    "open-data-action":()=>`<button class="home-mode home-mode--data" ${action("open-data","Abrir datos e historial")} data-forge-component="open-data-action">
      <span class="home-mode__kicker">PROGRESO</span><strong>DATOS</strong><small>Ver evolución</small>
    </button>`,
    "weekly-progress":({data})=>{
      const sessions=number(data?.sessions);
      const bodyWeight=number(data?.bodyWeight);
      return `<button class="phx-card phx-card--compact phx-card--interactive" ${action("open-history","Abrir historial de siete días")} data-forge-metric="sessions">
          <span class="phx-card__eyebrow">7 DÍAS</span><strong class="phx-metric phx-metric--sessions">${sessions}</strong><span class="phx-metric-label">${sessions===1?"sesión":"sesiones"}</span>
        </button>
        <button class="phx-card phx-card--compact phx-card--interactive" ${action("open-history","Abrir volumen de siete días")} data-forge-metric="volume">
          <span class="phx-card__eyebrow">VOLUMEN</span><strong class="phx-metric phx-metric--volume">${localeNumber(data?.volume)}</strong><span class="phx-metric-label">kg · 7 días</span>
        </button>
        <button class="phx-card phx-card--compact phx-card--interactive" ${action("open-weight","Registrar peso corporal")} data-forge-metric="body-weight">
          <span class="phx-card__eyebrow">PESO</span><strong class="phx-metric phx-metric--weight">${bodyWeight?bodyWeight.toFixed(1):"—"}</strong><span class="phx-metric-label">${bodyWeight?"kg":"sin registrar"}</span>
        </button>`;
    },
    "last-workout":({data})=>data?.exists
      ?`<button class="phx-card phx-card--base phx-card--interactive home-last-card" ${action("open-history","Abrir historial del último entrenamiento")} data-forge-component="last-workout">
        <div class="phx-card__header"><div><div class="phx-card__eyebrow">ÚLTIMO ENTRENAMIENTO</div><div class="phx-card__title">${escapeHtml(data?.routineName||"Rutina")}</div></div><span class="phx-card__chevron" aria-hidden="true">›</span></div>
        <div class="phx-card__meta"><span>${new Date(data.date).toLocaleDateString("es-ES")}</span><span>${number(data?.totalSets)} series</span><span>${localeNumber(data?.volume)} kg</span></div>
      </button>`
      :`<div class="phx-card phx-card--base home-last-card" data-forge-component="last-workout"><div class="phx-card__eyebrow">ÚLTIMO ENTRENAMIENTO</div><div class="phx-card__title">Aún no hay sesiones</div><div class="phx-card__copy">Completa tu primer entrenamiento para ver aquí el resumen.</div></div>`
  });

  function renderSlot(slot,snapshot,context){
    const renderer=components[slot.component];
    if(typeof renderer!=="function")throw new Error(`Renderer Home: componente no implementado (${slot.component})`);
    return renderer({slot,data:snapshot?.components?.[slot.component]||{},snapshot,context});
  }
  function renderRegion(region,slotMap,snapshot,context){
    const variant=REGION_VARIANTS.has(region.variant)?region.variant:"precision-flow";
    const html=(region.slots||[]).map(id=>slotMap.get(id)).filter(Boolean).map(slot=>renderSlot(slot,snapshot,context)).join("\n");
    if(!html.trim())return "";
    if(variant==="precision-actions")return `<section class="home-mode-switch" aria-label="Acciones principales" data-forge-region="${escapeHtml(region.id)}">${html}</section>`;
    if(variant==="precision-metrics")return `<details class="home-light-details" data-forge-region="${escapeHtml(region.id)}"><summary><span>RESUMEN</span><b>7 días</b><em>›</em></summary><section class="home-metrics" aria-label="Resumen rápido">${html}</section></details>`;
    if(region.id==="history-region")return `<details class="home-light-details home-light-details--history" data-forge-region="${escapeHtml(region.id)}"><summary><span>ÚLTIMO</span><b>Entrenamiento</b><em>›</em></summary>${html}</details>`;
    return html;
  }
  function fallbackRegions(slots){
    return slots.map(slot=>({id:`region-${slot.id}`,variant:"precision-flow",order:slot.order||0,slots:[slot.id]}));
  }
  function bindActions(target){
    if(target.dataset.forgeHomeActionsBound==="1")return;
    target.dataset.forgeHomeActionsBound="1";
    target.addEventListener("click",async event=>{
      const trigger=event.target.closest?.(`[${ACTION_ATTRIBUTE}]`);
      if(!trigger||!target.contains(trigger))return;
      event.preventDefault();
      const name=trigger.getAttribute(ACTION_ATTRIBUTE);
      const payload={routineId:trigger.dataset.routineId||undefined,environment:trigger.dataset.environment||undefined};
      trigger.setAttribute("aria-busy","true");
      try{await window.PhoenixForgeActionBus?.dispatch?.(name,payload)}
      catch(error){console.warn("Phoenix Forge Home action failed",name,error)}
      finally{if(trigger.isConnected)trigger.removeAttribute("aria-busy")}
    });
  }
  function render({target,shape,snapshot,context={}}={}){
    if(!(target instanceof Element))throw new TypeError("Renderer Home: target no válido");
    const definition=shape?.screens?.home;
    if(!definition||!Array.isArray(definition.slots))throw new Error("Renderer Home: la forma no define Home");
    const slots=[...definition.slots].sort((a,b)=>(a.order||0)-(b.order||0));
    const slotMap=new Map(slots.map(slot=>[slot.id,slot]));
    const regions=(Array.isArray(definition.regions)&&definition.regions.length?definition.regions:fallbackRegions(slots))
      .slice().sort((a,b)=>(a.order||0)-(b.order||0));
    const html=regions.map(region=>renderRegion(region,slotMap,snapshot,context)).join("\n");
    target.innerHTML=`<div class="home-phoenix home-definitive" data-forge-renderer="home" data-forge-shape="${escapeHtml(shape.id||"precision")}">${html}</div>`;
    bindActions(target);
    target.dataset.forgeRendered="true";
    target.dataset.forgeRendererVersion=VERSION;
    return Object.freeze({ok:true,screen:"home",shape:shape.id||"precision",components:slots.length,regions:regions.length,version:VERSION});
  }

  window.PhoenixForgeHomeRenderer=Object.freeze({version:VERSION,render,components:Object.freeze(Object.keys(components)),regionVariants:Object.freeze([...REGION_VARIANTS])});
})();
