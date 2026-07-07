function cleanExerciseName(line){
 return (line||"")
  .replace(/^\s*[-•*]\s*/,"")
  .replace(/\b\d+\s*x\s*(?:al\s*)?fallo\b/ig,"")
  .replace(/\b\d+\s*x\s*\d+\s*(?:[-\/]\s*\d+)?\b/ig,"")
  .replace(/\b\d+\s*x\s*\d+\s*(?:seg|secs|segundos|s)\b/ig,"")
  .replace(/\b\d+(?:[.,]\d+)?\s*kg\b/ig,"")
  .replace(/\b(?:descanso|rest)\s*\d+\s*(?:s|seg|segundos)?\b/ig,"")
  .replace(/\([^)]*\)/g,"")
  .replace(/\s+/g," ")
  .trim()
}
function getExercise(name){
 name=name.trim();let e=S.exercises.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(e)return e;e={id:id(),name,pattern:"custom",inc:S.settings.inc||2.5,rest:S.settings.rest||120};S.exercises.push(e);return e
}
function parseLine(raw){
 raw=raw.trim();if(!raw)return null;if(/^(rutina|día|dia|bloque|semana|calentamiento|notas?|objetivo)\b/i.test(raw))return null;
 let sets=0,repsPlan=[],mode="reps";
 let fail=raw.match(/(\d+)\s*x\s*(?:al\s*)?fallo/i);
 let time=raw.match(/(\d+)\s*x\s*(\d+)\s*(?:s|seg|secs|segundos)\b/i);
 let reps=raw.match(/(\d+)\s*x\s*(\d+)(?:\s*[-\/]\s*(\d+))?/i);
 if(fail){sets=+fail[1];mode="failure";repsPlan=Array.from({length:sets},()=>0)}
 else if(time){sets=+time[1];mode="time";repsPlan=Array.from({length:sets},()=>+time[2])}
 else if(reps){sets=+reps[1];let a=+reps[2],b=reps[3]?+reps[3]:a;repsPlan=Array.from({length:sets},(_,i)=>Math.round(a+(b-a)*(sets<=1?0:i/(sets-1))))}
 else return null;
 let name=cleanExerciseName(raw);if(!name)return null;let e=getExercise(name);
 let mw=raw.match(/(\d+(?:[.,]\d+)?)\s*kg/i),mr=raw.match(/(?:descanso|rest)\s*(\d+)\s*(?:s|seg|segundos)?/i);
 return{id:id(),exerciseId:e.id,sets,repsPlan,weight:mw?parseFloat(mw[1].replace(",",".")):0,rest:mr?+mr[1]:(S.settings.rest||120),mode,order:0}
}
function importRoutine(){
 let name=document.getElementById("importName").value.trim()||"Rutina importada";
 let txt=document.getElementById("importText").value;
 let items=[];
 txt.split(/\r?\n/).forEach(l=>{let it=parseLine(l);if(it){it.order=items.length+1;items.push(it)}});
 if(!items.length){alert("No detecto ejercicios. Usa el ejemplo.");return}
 S.routines.push({id:id(),name,tag:"Importada",items});
 save();GT.render();alert("Rutina importada: "+name)
}
function exampleImport(){
 document.getElementById("importName").value="Torso A";
 document.getElementById("importText").value=`Press banca 4x8 80kg descanso 180
Dominadas 4x fallo descanso 180
Remo barra 4x10-12 60kg descanso 120
L-Sit 4x20s descanso 90
Plancha 3x45s descanso 60`;
}
function createRoutine(){let n=prompt("Nombre de la rutina");if(!n)return;S.routines.push({id:id(),name:n,tag:"Manual",items:[]});save();GT.render()}
function renameRoutine(rid){let r=rt(rid);let n=prompt("Nuevo nombre",r.name);if(!n)return;r.name=n;save();GT.render()}
function deleteRoutine(rid){if(!confirm("¿Borrar rutina?"))return;S.routines=S.routines.filter(r=>r.id!==rid);Object.keys(S.plan).forEach(d=>{if(S.plan[d].routineId===rid)delete S.plan[d]});save();GT.render()}
function duplicateRoutine(rid){let r=rt(rid);let c=JSON.parse(JSON.stringify(r));c.id=id();c.name=r.name+" copia";c.items=c.items.map((x,i)=>({...x,id:id(),order:i+1}));S.routines.push(c);save();GT.render()}
function addExercise(rid){let r=rt(rid);let name=prompt("Ejercicio");if(!name)return;let mode=prompt("Tipo: reps / time / failure","reps")||"reps";let sets=+(prompt("Series","4")||4);let target=mode==="time"?+(prompt("Segundos objetivo","20")||20):+(prompt("Reps objetivo","8")||8);let weight=mode==="time"?0:+(prompt("Peso kg","0")||0);let rest=+(prompt("Descanso segundos",String(S.settings.rest||120))||120);let e=getExercise(name);r.items.push({id:id(),exerciseId:e.id,sets,repsPlan:Array.from({length:sets},()=>target),weight,rest,mode,order:r.items.length+1});save();GT.render()}
function delItem(rid,iid){let r=rt(rid);r.items=r.items.filter(i=>i.id!==iid).map((x,i)=>({...x,order:i+1}));save();GT.render()}
function updItem(rid,iid,k,v){let it=rt(rid).items.find(i=>i.id===iid);if(!it)return;
 if(k==="sets"){it.sets=+v;it.repsPlan=Array.from({length:it.sets},(_,i)=>it.repsPlan[i]||8)}
 else if(k==="reps")it.repsPlan=Array.from({length:it.sets},()=>+v);
 else if(k==="weight")it.weight=+v;
 else if(k==="rest")it.rest=+v;
 else if(k==="mode"){it.mode=v;if(v==="failure")it.repsPlan=Array.from({length:it.sets},()=>0)}
 save()
}
function assignToday(rid){S.plan[today()]={date:today(),type:"train",routineId:rid,status:"pending"};save();GT.render();alert("Asignada para hoy")}
