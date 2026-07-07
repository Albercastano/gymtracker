let A=null,timer=null,execTimer=null;
function startRoutine(rid){let r=rt(rid);if(!r||!r.items.length){alert("Rutina vacía");return}A={session:{id:id(),date:today(),routineId:rid,start:now(),note:""},idx:0,done:{},sets:[]};saveActiveWorkout(A);GT.show("workout");renderWorkout()}
function currentItem(){return rt(A.session.routineId).items[A.idx]}
function currentSet(){let it=currentItem();return (A.done[it.id]||0)+1}
function isLastSetOfItem(it,set){return set>=it.sets}
function isLastExercise(){return A.idx>=rt(A.session.routineId).items.length-1}
function recordSet(reps,weight){
 let it=currentItem(), set=currentSet(), e=ex(it.exerciseId);
 let pr=isPRSet(e.id,weight,reps);A.sets.push({id:id(),sessionId:A.session.id,exerciseId:e.id,setNumber:set,reps,weight,result:"normal",order:A.idx,mode:it.mode,pr});if(pr&&weight>0)setTimeout(()=>alert("🏆 Nuevo PR: "+e.name+" "+weight+"kg x "+reps),50);
 A.done[it.id]=set;saveActiveWorkout(A);
 if(isLastSetOfItem(it,set)){
   if(isLastExercise()){endWorkout();return}
   A.idx++;
   renderWorkout(); // Sin crono al terminar ejercicio; salta al siguiente.
   return;
 }
 startRest(it.rest||S.settings.rest||120);
}
function finishSet(){
 let it=currentItem(), set=currentSet();
 if(it.mode==="time"){startExecutionTimer(it.repsPlan[set-1]||it.repsPlan[0]||20);return}
 let reps=it.mode==="failure"?+(prompt("Reps realizadas","0")||0):(it.repsPlan[set-1]||it.repsPlan[0]||0);
 let weight=+(prompt("Peso usado",String(it.weight||0))||0);
 recordSet(reps,weight);
}
function startExecutionTimer(sec){
 let left=sec;clearInterval(execTimer);
 document.getElementById("workout").innerHTML=`<div class="timer"><div class="casio"><div class="lcd"><div>EJERCICIO</div><div id="execTime" class="lcdTime">${fmt(left)}</div><div>${ex(currentItem().exerciseId).name}</div><div class="inlineActions"><button class="wall primary" onclick="completeTimedSet(${sec})">Completar</button><button onclick="stopTimedSet()">Parar</button></div></div></div></div>`;
 execTimer=setInterval(()=>{left--;let el=document.getElementById("execTime");if(el)el.textContent=fmt(Math.max(0,left));if(left<=0){clearInterval(execTimer);completeTimedSet(sec)}},1000);
}
function completeTimedSet(target){clearInterval(execTimer);let done=+(prompt("Segundos realizados",String(target))||target);recordSet(done,0)}
function stopTimedSet(){clearInterval(execTimer);let done=+(prompt("Segundos realizados","0")||0);recordSet(done,0)}
function startRest(sec){let left=sec;clearInterval(timer);document.getElementById("workout").innerHTML=`<div class="timer"><div class="casio"><div class="lcd"><div>DESCANSO</div><div id="lcdTime" class="lcdTime">${fmt(left)}</div><div>Siguiente serie: ${nextName()}</div><button class="wall primary" onclick="skipRest()">Saltar</button></div></div></div>`;timer=setInterval(()=>{left--;let el=document.getElementById("lcdTime");if(el)el.textContent=fmt(left);if(left<=0)skipRest()},1000)}
function skipRest(){clearInterval(timer);renderWorkout()}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function nextName(){if(!A)return "";let r=rt(A.session.routineId),it=r.items[A.idx];return it?ex(it.exerciseId).name:"Fin"}
function endWorkout(){A.session.end=now();S.sessions.push(A.session);S.sets.push(...A.sets);S.plan[today()]={date:today(),type:"done",routineId:A.session.routineId,status:"done"};save();postWorkoutBackup();clearActiveWorkout();let summary=coachSummary(A.session.id);A=null;GT.show("home");GT.render();setTimeout(()=>alert(summary),100)}
function coachSummary(sid){let s=S.sessions.find(x=>x.id===sid),r=rt(s.routineId),sets=S.sets.filter(x=>x.sessionId===sid);let out=`${r.name} · ${String(s.date).slice(0,10)}\n`;r.items.forEach(it=>{let e=ex(it.exerciseId),ss=sets.filter(x=>x.exerciseId===it.exerciseId);if(ss.length){out+=`\n${e.name}\n`;ss.forEach(x=>out+=it.mode==="time"?`${x.reps}s\n`:`${x.weight}kg x ${x.reps}\n`)}});return out}
function renderWorkout(){let it=currentItem(),e=ex(it.exerciseId),set=currentSet();let target=it.mode==="failure"?"F":(it.repsPlan[set-1]||it.repsPlan[0]);let label=it.mode==="time"?"Segundos":"Reps";let lastHtml=lastSessionHtml(it.exerciseId,it.mode);let best=bestSetForExercise(it.exerciseId);let sug=typeof suggestionForItem==="function"?suggestionForItem(it):"";
document.getElementById("workout").innerHTML=`<div class="card focus"><div><div class="muted">${rt(A.session.routineId).name}</div><div class="focusTitle">${e.name}</div><div class="timeBadge">${it.mode==="time"?"Ejercicio por tiempo":it.mode==="failure"?"Al fallo":"Repeticiones"} ${it.superset?`<span class="supersetBadge">SS ${it.superset}</span>`:""}</div><div class="lastBox"><strong>Última sesión</strong><br>${lastHtml}<br><br><strong>Mejor marca</strong><br>${best?(best.weight+"kg × "+best.reps):"Sin PR"}<br><br><strong>Sugerencia</strong><br>${sug||"Mantener"}</div></div><div class="focusStats"><div class="focusStat"><span>Serie</span><b>${set}/${it.sets}</b></div><div class="focusStat"><span>${label}</span><b>${target}</b></div><div class="focusStat"><span>Peso</span><b>${it.mode==="time"?"—":(it.weight||0)}</b><small>${it.mode==="time"?"":"kg"}</small></div></div><button class="wall primary bigAction ${it.mode==="time"?"timeAction":""}" onclick="finishSet()">${it.mode==="time"?"Iniciar crono":"Fin serie"}</button><div class="row"><button onclick="A.idx=Math.max(0,A.idx-1);saveActiveWorkout(A);renderWorkout()">Anterior</button><button onclick="A.idx=Math.min(rt(A.session.routineId).items.length-1,A.idx+1);saveActiveWorkout(A);renderWorkout()">Siguiente</button><button class="danger" onclick="endWorkout()">Finalizar</button></div></div>`}
function isPRSet(eid,weight,reps){
 let best=bestSetForExercise(eid);
 if(!best)return true;
 return ((+weight||0)*(+reps||0))>((+best.weight||0)*(+best.reps||0));
}
function lastSessionHtml(eid,mode){
 let last=typeof lastSetsForExercise==="function"?lastSetsForExercise(eid):[];
 if(!last.length)return "Sin datos previos";
 return last.map(s=>mode==="time"?`${s.reps}s`:`${s.weight}kg × ${s.reps}`).join("<br>");
}
