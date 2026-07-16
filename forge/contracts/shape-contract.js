"use strict";
(function(){
  const VERSION="0.2.0";
  const allowedScreens=new Set(["home","gym","series","rest","exerciseSummary","workoutSummary","data","routines","blocks","history","settings","backups","library","forgeLab"]);
  const allowedLayouts=new Set(["stack","grid","instrument","split","list"]);
  const allowedComponents=new Set([
    "app-brand","storage-status","workout-today","start-workout-action","resume-workout-action","discard-workout-action","open-data-action","weekly-progress","last-workout","current-exercise","current-set","weight-control","reps-control","save-set-action","rest-timer","workout-progress","exercise-summary","workout-summary","metric","chart","exercise-list","personal-record","body-weight","navigation-action"
  ]);
  const allowedRegionVariants=new Set(["precision-flow","precision-actions","precision-metrics"]);
  const requiredByScreen=Object.freeze({
    home:Object.freeze(["workout-today","start-workout-action","open-data-action"]),
    gym:Object.freeze(["current-exercise","workout-progress"]),
    series:Object.freeze(["current-set","weight-control","reps-control","save-set-action"]),
    rest:Object.freeze(["rest-timer"]),
    workoutSummary:Object.freeze(["workout-summary"]),
    data:Object.freeze(["metric","chart"])
  });
  const safeId=value=>typeof value==="string"&&/^[a-z][a-z0-9-]{1,63}$/.test(value);
  const safeVariant=value=>value==null||(typeof value==="string"&&/^[a-z0-9-]{1,64}$/.test(value));
  function validateSlot(slot,screen,index){
    const errors=[];
    if(!slot||typeof slot!=="object")return [`${screen}.slots[${index}] no es un objeto`];
    if(!safeId(slot.id))errors.push(`${screen}.slots[${index}].id no es válido`);
    if(!allowedComponents.has(slot.component))errors.push(`${screen}.${slot.id||index}: componente no autorizado (${slot.component||"vacío"})`);
    if(!safeVariant(slot.variant))errors.push(`${screen}.${slot.id||index}: variante no válida`);
    if(slot.order!=null&&(!Number.isInteger(slot.order)||slot.order<0||slot.order>9999))errors.push(`${screen}.${slot.id||index}: order fuera de rango`);
    if(slot.span!=null&&(!Number.isInteger(slot.span)||slot.span<1||slot.span>12))errors.push(`${screen}.${slot.id||index}: span debe estar entre 1 y 12`);
    if(slot.minTouch!=null&&Number(slot.minTouch)<44)errors.push(`${screen}.${slot.id||index}: área táctil inferior a 44 px`);
    return errors;
  }
  function validateRegion(region,screen,index,slotIds,assigned){
    const errors=[];
    if(!region||typeof region!=="object")return [`${screen}.regions[${index}] no es un objeto`];
    if(!safeId(region.id))errors.push(`${screen}.regions[${index}].id no es válido`);
    if(!allowedRegionVariants.has(region.variant))errors.push(`${screen}.${region.id||index}: variante de región no autorizada (${region.variant||"vacía"})`);
    if(region.order!=null&&(!Number.isInteger(region.order)||region.order<0||region.order>9999))errors.push(`${screen}.${region.id||index}: order fuera de rango`);
    if(!Array.isArray(region.slots)||!region.slots.length)errors.push(`${screen}.${region.id||index}: slots de región debe ser una lista no vacía`);
    else region.slots.forEach(slotId=>{
      if(!slotIds.has(slotId))errors.push(`${screen}.${region.id||index}: referencia un slot inexistente (${slotId})`);
      if(assigned.has(slotId))errors.push(`${screen}: el slot ${slotId} aparece en más de una región`);
      assigned.add(slotId);
    });
    return errors;
  }
  function validate(shape){
    const errors=[],warnings=[];
    if(!shape||typeof shape!=="object")return Object.freeze({valid:false,errors:Object.freeze(["Shape ausente"]),warnings:Object.freeze([]),contractVersion:VERSION});
    if(shape.schemaVersion!==1)errors.push("schemaVersion debe ser 1");
    if(!safeId(shape.id))errors.push("id de forma no válido");
    if(!shape.screens||typeof shape.screens!=="object")errors.push("screens es obligatorio");
    const componentCoverage={};
    if(shape.screens&&typeof shape.screens==="object"){
      Object.entries(shape.screens).forEach(([screen,definition])=>{
        if(!allowedScreens.has(screen)){errors.push(`Pantalla no autorizada: ${screen}`);return}
        if(!definition||typeof definition!=="object"){errors.push(`${screen}: definición no válida`);return}
        if(!allowedLayouts.has(definition.layout))errors.push(`${screen}: layout no autorizado (${definition.layout||"vacío"})`);
        if(!Array.isArray(definition.slots)){errors.push(`${screen}: slots debe ser una lista`);return}
        const ids=new Set();
        componentCoverage[screen]=new Set();
        definition.slots.forEach((slot,index)=>{
          validateSlot(slot,screen,index).forEach(error=>errors.push(error));
          if(slot?.id){if(ids.has(slot.id))errors.push(`${screen}: slot duplicado ${slot.id}`);ids.add(slot.id)}
          if(slot?.component)componentCoverage[screen].add(slot.component);
        });
        if(Array.isArray(definition.regions)){
          const regionIds=new Set(),assigned=new Set();
          definition.regions.forEach((region,index)=>{
            validateRegion(region,screen,index,ids,assigned).forEach(error=>errors.push(error));
            if(region?.id){if(regionIds.has(region.id))errors.push(`${screen}: región duplicada ${region.id}`);regionIds.add(region.id)}
          });
          const unassigned=[...ids].filter(id=>!assigned.has(id));
          if(unassigned.length)warnings.push(`${screen}: slots sin región (${unassigned.join(", ")})`);
        }else warnings.push(`${screen}: no define regiones; se usará una región por slot`);
        (requiredByScreen[screen]||[]).forEach(component=>{
          if(!componentCoverage[screen].has(component))errors.push(`${screen}: falta el componente obligatorio ${component}`);
        });
      });
    }
    if(!shape.screens?.home)errors.push("La forma debe definir la pantalla home");
    if(!shape.responsive||typeof shape.responsive!=="object")warnings.push("No se ha definido configuración responsive");
    return Object.freeze({
      valid:errors.length===0,
      errors:Object.freeze(errors),
      warnings:Object.freeze(warnings),
      contractVersion:VERSION,
      shapeId:shape.id||null,
      screens:Object.freeze(Object.keys(shape.screens||{}))
    });
  }
  window.PhoenixShapeContract=Object.freeze({
    version:VERSION,
    allowedScreens:Object.freeze([...allowedScreens]),
    allowedLayouts:Object.freeze([...allowedLayouts]),
    allowedComponents:Object.freeze([...allowedComponents]),
    allowedRegionVariants:Object.freeze([...allowedRegionVariants]),
    requiredByScreen,
    validate
  });
})();
