let A=null,timer=null;
function startRoutine(rid){let r=rt(rid);if(!r||!r.items.length){alert("Rutina vacía");return}A={session:{id:id(),date:today(),routineId:rid,start:now(),note:""},idx:0,done:{},sets:[]};GT.show("workout");renderWorkout()}
function currentItem(){return rt(A.session.routineId).items[A.idx]}
function currentSet(){let it=currentItem();return (A.done[it.id]||0)+1}
function finishSet(){
 let it=currentItem(), set=currentSet(), e=ex(it.exerciseId);
 let reps=it.mode==="failure"?+(prompt("Reps realizadas","0")||0):(it.repsPlan[set-1]||it.repsPlan[0]||0);
 let weight=+(prompt("Peso usado",String(it.weight||0))||0);
 A.sets.push({id:id(),sessionId:A.session.id,exerciseId:e.id,setNumber:set,reps,weight,result:"normal",order:A.idx});
 A.done[it.id]=set;
 if(set>=it.sets){A.idx++; if(A.idx>=rt(A.session.routineId).items.length){endWorkout();return}}
 startRest(it.rest||S.settings.rest||120)
}
function startRest(sec){let left=sec;clearInterval(timer);document.getElementById("workout").innerHTML=`<div class="timer"><div class="casio"><div class="lcd"><div>DESCANSO</div><div id="lcdTime" class="lcdTime">${fmt(left)}</div><div>Siguiente: ${nextName()}</div><button class="wall primary" onclick="skipRest()">Saltar</button></div></div></div>`;timer=setInterval(()=>{left--;let el=document.getElementById("lcdTime");if(el)el.textContent=fmt(left);if(left<=0)skipRest()},1000)}
function skipRest(){clearInterval(timer);renderWorkout()}
function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function nextName(){if(!A)return "";let r=rt(A.session.routineId),it=r.items[A.idx];return it?ex(it.exerciseId).name:"Fin"}
function endWorkout(){A.session.end=now();S.sessions.push(A.session);S.sets.push(...A.sets);S.plan[today()]={date:today(),type:"done",routineId:A.session.routineId,status:"done"};save();let summary=coachSummary(A.session.id);A=null;GT.show("home");GT.render();setTimeout(()=>alert(summary),100)}
function coachSummary(sid){let s=S.sessions.find(x=>x.id===sid),r=rt(s.routineId),sets=S.sets.filter(x=>x.sessionId===sid);let out=`${r.name} · ${String(s.date).slice(0,10)}\n`;r.items.forEach(it=>{let e=ex(it.exerciseId),ss=sets.filter(x=>x.exerciseId===it.exerciseId);if(ss.length){out+=`\n${e.name}\n`;ss.forEach(x=>out+=`${x.weight}kg x ${x.reps}\n`)}});return out}
function renderWorkout(){let it=currentItem(),e=ex(it.exerciseId),set=currentSet();document.getElementById("workout").innerHTML=`<div class="card focus"><div><div class="muted">${rt(A.session.routineId).name}</div><div class="focusTitle">${e.name}</div></div><div class="focusStats"><div class="focusStat"><span>Serie</span><b>${set}/${it.sets}</b></div><div class="focusStat"><span>Reps</span><b>${it.mode==="failure"?"F":(it.repsPlan[set-1]||it.repsPlan[0])}</b></div><div class="focusStat"><span>Peso</span><b>${it.weight||0}</b><small>kg</small></div></div><button class="wall primary bigAction" onclick="finishSet()">Fin serie</button></div>`}
