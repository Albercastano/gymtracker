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
function guessCategory(name){
 let n=(name||"").toLowerCase();
 if(/dominada|fondos|l-sit|lsit|plancha|muscle|handstand|pino/.test(n))return "Calistenia";
 if(/sentadilla|prensa|peso muerto|zancada|gemelo|curl femoral|extensión/.test(n))return "Pierna";
 if(/correr|bici|cardio|elíptica|eliptica/.test(n))return "Cardio";
 return "Fuerza";
}
function ensureExerciseMeta(){
 S.exerciseMeta=S.exerciseMeta||{};
 S.exercises.forEach(e=>{
   S.exerciseMeta[e.id]=S.exerciseMeta[e.id]||{favorite:false,bag:false,category:guessCategory(e.name),notes:""};
   if(!S.exerciseMeta[e.id].category)S.exerciseMeta[e.id].category=guessCategory(e.name);
  });
}
function getExercise(name){
 name=(name||"").trim();
 if(!name)return null;
 let e=S.exercises.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(e){ensureExerciseMeta();return e}
 e={id:id(),name,pattern:"custom",inc:S.settings.inc||2.5,rest:S.settings.rest||120};
 S.exercises.push(e);ensureExerciseMeta();S.exerciseMeta[e.id]={favorite:false,bag:true,category:guessCategory(name),notes:""};
 return e
}
function parseLine(raw){
 raw=raw.trim();if(!raw)return null;
 if(/^(rutina|día|dia|bloque|semana|calentamiento|notas?|objetivo)\b/i.test(raw))return null;
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
 return{id:id(),exerciseId:e.id,sets,repsPlan,weight:mw?parseFloat(mw[1].replace(",", ".")):0,rest:mr?+mr[1]:(S.settings.rest||120),mode,order:0,note:"",superset:""}
}
function importRoutine(){
 let name=document.getElementById("importName")?.value.trim()||"Rutina importada";
 let txt=document.getElementById("importText")?.value||"";
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
function createRoutine(){
 let n=(document.getElementById("newRoutineName")?.value||"").trim()||prompt("Nombre de la rutina");
 if(!n)return;
 S.routines.push({id:id(),name:n,tag:"Manual",items:[]});
 save();GT.render();
}
function renameRoutine(rid){let r=rt(rid);let n=prompt("Nuevo nombre",r.name);if(!n)return;r.name=n;save();GT.render()}
function deleteRoutine(rid){
 let r=rt(rid);if(!r)return;
 if(!confirm("¿Mover rutina a papelera?"))return;
 S.trash=S.trash||{routines:[],blocks:[],sessions:[]};
 S.trash.routines.push({...r,deletedAt:now()});
 S.routines=S.routines.filter(x=>x.id!==rid);
 Object.keys(S.plan).forEach(d=>{if(S.plan[d].routineId===rid)delete S.plan[d]});
 save();GT.render()
}
function duplicateRoutine(rid){let r=rt(rid);let c=JSON.parse(JSON.stringify(r));c.id=id();c.name=r.name+" copia";c.items=c.items.map((x,i)=>({...x,id:id(),order:i+1}));S.routines.push(c);save();GT.render()}
function addExerciseFromName(rid,name){
 let r=rt(rid);let e=getExercise(name);if(!r||!e)return;
 r.items.push({id:id(),exerciseId:e.id,sets:4,repsPlan:[8,8,8,8],weight:0,rest:S.settings.rest||120,mode:"reps",order:r.items.length+1,note:"",superset:""});
 save();GT.render()
}
function delItem(rid,iid){let r=rt(rid);r.items=r.items.filter(i=>i.id!==iid).map((x,i)=>({...x,order:i+1}));save();GT.render()}
function duplicateItem(rid,iid){let r=rt(rid);let it=r.items.find(i=>i.id===iid);if(!it)return;let idx=r.items.findIndex(i=>i.id===iid),copy=JSON.parse(JSON.stringify(it));copy.id=id();r.items.splice(idx+1,0,copy);r.items=r.items.map((x,i)=>({...x,order:i+1}));save();GT.render()}
function moveItem(rid,iid,dir){let r=rt(rid);let idx=r.items.findIndex(i=>i.id===iid);let ni=idx+dir;if(idx<0||ni<0||ni>=r.items.length)return;[r.items[idx],r.items[ni]]=[r.items[ni],r.items[idx]];r.items=r.items.map((x,i)=>({...x,order:i+1}));save();GT.render()}
function updItem(rid,iid,k,v){
 let it=rt(rid).items.find(i=>i.id===iid);if(!it)return;
 if(k==="name"){let e=getExercise(v);if(e)it.exerciseId=e.id}
 else if(k==="sets"){it.sets=Math.max(1,+v||1);it.repsPlan=Array.from({length:it.sets},(_,i)=>it.repsPlan[i]??8)}
 else if(k==="reps"){it.repsPlan=Array.from({length:it.sets||1},()=>+v||0)}
 else if(k==="weight")it.weight=+v||0;
 else if(k==="rest")it.rest=+v||0;
 else if(k==="mode"){it.mode=v;if(v==="failure")it.repsPlan=Array.from({length:it.sets||1},()=>0);if(v==="time"&&(!it.repsPlan?.[0]))it.repsPlan=Array.from({length:it.sets||1},()=>20)}
 else if(k==="note")it.note=v;
 else if(k==="superset")it.superset=v;
 save()
}
function assignToday(rid){S.plan[today()]={date:today(),type:"train",routineId:rid,status:"pending"};save();GT.render();alert("Asignada para hoy")}
function toggleBag(eid){ensureExerciseMeta();S.exerciseMeta[eid].bag=!S.exerciseMeta[eid].bag;save();GT.render()}
function createExerciseFromSearch(){let name=(document.getElementById("exerciseSearch")?.value||"").trim();if(!name){alert("Escribe un nombre.");return}getExercise(name);save();GT.render()}
function copyItemToRoutine(fromRid,iid,toRid){
 if(!toRid)return;
 let src=rt(fromRid),dst=rt(toRid);let it=src.items.find(x=>x.id===iid);if(!it||!dst)return;
 let copy=JSON.parse(JSON.stringify(it));copy.id=id();copy.order=dst.items.length+1;
 dst.items.push(copy);save();GT.render();alert("Ejercicio copiado")
}
function routineStats(r){let sets=0,rest=0,work=0;(r.items||[]).forEach(it=>{sets+=(+it.sets||0);rest+=(Math.max(0,(+it.sets||0)-1))*(+it.rest||0); if(it.mode==="time")work+=(+it.sets||0)*(+it.repsPlan?.[0]||0); else work+=(+it.sets||0)*45});return{sets,minutes:Math.round((rest+work)/60)}}
function validateRoutine(r){let warn=[];if(!r.items.length)warn.push("Rutina vacía");r.items.forEach((it,i)=>{if(!it.sets)warn.push(`Ejercicio ${i+1} sin series`);if(it.mode!=="failure" && !(it.repsPlan?.[0]))warn.push(`${ex(it.exerciseId)?.name||"Ejercicio"} sin objetivo`)});return warn}
function renderExercisePicker(rid){
 ensureExerciseMeta();
 let q=(document.getElementById("exerciseSearch")?.value||"").toLowerCase();
 let category=(document.getElementById("categoryFilter")?.value||"");
 let cats=["","Fuerza","Calistenia","Pierna","Cardio","Personalizado"];
 let list=S.exercises.slice().sort((a,b)=>{let ma=S.exerciseMeta[a.id]||{},mb=S.exerciseMeta[b.id]||{};return (mb.bag-ma.bag)||(mb.favorite-ma.favorite)||a.name.localeCompare(b.name)}).filter(e=>(!q||e.name.toLowerCase().includes(q))&&(!category||(S.exerciseMeta[e.id]?.category===category))).slice(0,40);
 return `<div class="libraryPanel"><h3>🎒 Mochila / Biblioteca</h3><div>${cats.map(c=>`<button class="categoryChip" onclick="document.getElementById('categoryFilter').value='${c}';GT.renderRoutines()">${c||"Todos"}</button>`).join("")}</div><input id="categoryFilter" type="hidden" value="${category}"><div class="exercisePicker"><input id="exerciseSearch" class="searchInput" placeholder="Buscar o crear ejercicio" oninput="GT.renderRoutines()" value="${q}"><button onclick="createExerciseFromSearch()">Crear</button></div><div class="pickList">${list.map(e=>{let m=S.exerciseMeta[e.id]||{};return `<div class="pickRow"><span>${m.favorite?"⭐ ":""}${m.bag?"🎒 ":""}${e.name}<br><small class="muted">${m.category||""}</small></span><button onclick="addExerciseFromName('${rid}','${e.name.replaceAll("'","\\'")}')">Añadir</button><button onclick="toggleBag('${e.id}')">${m.bag?"Quitar 🎒":"🎒"}</button></div>`}).join("")||"<p class='muted'>No hay ejercicios aún.</p>"}</div></div>`
}
function renderRoutineBuilder(r){
 let stats=routineStats(r),warn=validateRoutine(r);
 return `<div class="routineCard constructor"><details open><summary><div><strong>${r.name}</strong><div class="muted">${r.items.length} ejercicios · ${stats.sets} series · ${stats.minutes} min aprox.</div></div></summary>
 <div class="builderToolbar"><button class="primary" onclick="startRoutine('${r.id}')">Comenzar</button><button onclick="assignToday('${r.id}')">Asignar hoy</button><button onclick="renameRoutine('${r.id}')">Renombrar</button><button onclick="duplicateRoutine('${r.id}')">Duplicar</button><button class="danger" onclick="deleteRoutine('${r.id}')">Borrar</button></div>
 ${warn.length?`<div class="validWarn">⚠ ${warn.join("<br>")}</div>`:""}
 <div class="previewBox"><b>Vista previa</b>${r.items.map((i,idx)=>`<div class="previewLine"><span>${idx+1}. ${ex(i.exerciseId)?.name||"Ejercicio"}</span><span>${i.sets}x${i.mode==="time"?(i.repsPlan[0]+"s"):i.mode==="failure"?"fallo":i.repsPlan[0]} · ${fmtRest(i.rest||0)}</span></div>`).join("")||"<p class='muted'>Rutina vacía.</p>"}</div>
 ${r.items.map((i,idx)=>`<div class="exerciseCard"><div class="exerciseCardHeader"><input class="exerciseNameInput" value="${ex(i.exerciseId)?.name||""}" onchange="updItem('${r.id}','${i.id}','name',this.value);GT.render()"><span class="pill proTag">#${idx+1}</span></div><div class="exerciseControls pro"><label>Modo<select onchange="updItem('${r.id}','${i.id}','mode',this.value);GT.render()"><option value="reps" ${i.mode==="reps"?"selected":""}>🔢 Reps</option><option value="time" ${i.mode==="time"?"selected":""}>⏱ Tiempo</option><option value="failure" ${i.mode==="failure"?"selected":""}>💥 Fallo</option></select></label><label>Series<input type="number" value="${i.sets}" onchange="updItem('${r.id}','${i.id}','sets',this.value);GT.render()"></label><label>${i.mode==="time"?"Segundos":"Objetivo"}<input type="number" value="${i.repsPlan?.[0]||0}" onchange="updItem('${r.id}','${i.id}','reps',this.value);GT.render()"></label><label>Peso<input type="number" step=".25" value="${i.weight||0}" onchange="updItem('${r.id}','${i.id}','weight',this.value)"></label><label>Descanso<input type="number" value="${i.rest||S.settings.rest||120}" onchange="updItem('${r.id}','${i.id}','rest',this.value)"></label><label>Superset<select onchange="updItem('${r.id}','${i.id}','superset',this.value)"><option value="" ${!i.superset?"selected":""}>No</option><option value="A" ${i.superset==="A"?"selected":""}>A</option><option value="B" ${i.superset==="B"?"selected":""}>B</option><option value="C" ${i.superset==="C"?"selected":""}>C</option></select></label></div><textarea class="noteArea" placeholder="Nota del ejercicio" onchange="updItem('${r.id}','${i.id}','note',this.value)">${i.note||""}</textarea><div class="cardActions"><button onclick="moveItem('${r.id}','${i.id}',-1)">↑</button><button onclick="moveItem('${r.id}','${i.id}',1)">↓</button><button onclick="duplicateItem('${r.id}','${i.id}')">Duplicar</button><button class="danger" onclick="delItem('${r.id}','${i.id}')">Borrar</button></div><div class="copyBox"><label>Copiar a otra rutina<select onchange="copyItemToRoutine('${r.id}','${i.id}',this.value);this.value=''"><option value="">Elegir...</option>${S.routines.filter(x=>x.id!==r.id).map(x=>`<option value="${x.id}">${x.name}</option>`).join("")}</select></label></div></div>`).join("")}
 ${renderExercisePicker(r.id)}
 </details></div>`
}
function fmtRest(s){s=+s||0;return s>=60?`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`:`${s}s`}
