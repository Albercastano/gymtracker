"use strict";
(function(){
  const CONTRACT_VERSION="0.2.0";
  const SUPPORTED_SCHEMA=1;
  const ALLOWED_STATUS=new Set(["stable","beta","alpha","community"]);
  const ALLOWED_CAPABILITIES=new Set(["visual-tokens","components","timer","icons","motion","sound-theme","component-contract"]);
  const REQUIRED=["schemaVersion","id","name","author","version","engine","status","fallback","styles","assetsBudgetKb","capabilities","network","scripts","componentContract"];
  const SAFE_ID=/^[a-z][a-z0-9-]{1,39}$/;
  const SAFE_STYLE=/^[a-z0-9-]+\.css$/;

  function isPlainObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value)}
  function validateManifest(manifest){
    const errors=[];const warnings=[];
    if(!isPlainObject(manifest))return Object.freeze({valid:false,errors:["El manifiesto no es un objeto"],warnings,contractVersion:CONTRACT_VERSION});
    REQUIRED.forEach(key=>{if(!(key in manifest))errors.push(`Falta el campo obligatorio: ${key}`)});
    if(manifest.schemaVersion!==SUPPORTED_SCHEMA)errors.push(`schemaVersion debe ser ${SUPPORTED_SCHEMA}`);
    if(typeof manifest.id!=="string"||!SAFE_ID.test(manifest.id))errors.push("id no válido");
    if(typeof manifest.name!=="string"||manifest.name.trim().length<3||manifest.name.length>64)errors.push("name debe tener entre 3 y 64 caracteres");
    if(typeof manifest.author!=="string"||manifest.author.trim().length<2||manifest.author.length>64)errors.push("author no válido");
    if(typeof manifest.version!=="string"||!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?$/i.test(manifest.version))errors.push("version debe usar SemVer");
    if(manifest.engine!=="0.3.x")errors.push("engine debe usar el formato 0.3.x");
    if(manifest.componentContract!=="0.1.x")errors.push("componentContract debe usar el formato 0.1.x");
    if(!ALLOWED_STATUS.has(manifest.status))errors.push("status no permitido");
    if(typeof manifest.fallback!=="boolean")errors.push("fallback debe ser booleano");
    if(!Array.isArray(manifest.styles)||manifest.styles.length<1||manifest.styles.length>8)errors.push("styles debe contener entre 1 y 8 CSS");
    else{
      const unique=new Set();
      manifest.styles.forEach(file=>{
        if(typeof file!=="string"||!SAFE_STYLE.test(file))errors.push(`Hoja de estilo no segura: ${String(file)}`);
        if(unique.has(file))errors.push(`Hoja de estilo duplicada: ${file}`);
        unique.add(file);
      });
    }
    if(!Number.isFinite(manifest.assetsBudgetKb)||manifest.assetsBudgetKb<1||manifest.assetsBudgetKb>100)errors.push("assetsBudgetKb debe estar entre 1 y 100 KB");
    if(!Array.isArray(manifest.capabilities))errors.push("capabilities debe ser una lista");
    else manifest.capabilities.forEach(cap=>{if(!ALLOWED_CAPABILITIES.has(cap))errors.push(`Capacidad no permitida: ${cap}`)});
    if(manifest.network!=="forbidden")errors.push("network debe ser forbidden");
    if(manifest.scripts!=="forbidden")errors.push("scripts debe ser forbidden");
    if(manifest.fallback&&manifest.id!=="precision")warnings.push("Solo Precision debería actuar como fallback oficial");
    if(manifest.status==="community"&&manifest.fallback)errors.push("Una creación comunitaria no puede ser fallback");
    return Object.freeze({
      valid:errors.length===0,
      errors:Object.freeze(errors),
      warnings:Object.freeze(warnings),
      contractVersion:CONTRACT_VERSION,
      schemaVersion:SUPPORTED_SCHEMA,
      materialId:manifest.id||null
    });
  }
  function certifyRegistry(registry){
    const report={};
    Object.entries(registry||{}).forEach(([id,manifest])=>{report[id]=validateManifest(manifest)});
    return Object.freeze(report);
  }
  window.PhoenixMaterialContract=Object.freeze({
    version:CONTRACT_VERSION,
    schemaVersion:SUPPORTED_SCHEMA,
    allowedCapabilities:Object.freeze([...ALLOWED_CAPABILITIES]),
    validateManifest,
    certifyRegistry
  });
})();
