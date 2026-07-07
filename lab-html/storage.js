const USERS={Alberto:{icon:"💪",theme:"luxury"},Edy:{icon:"🏋️",theme:"elegance"}};
let currentUser=localStorage.getItem("gt7_user")||"Alberto";
let S=null;
function key(){return "gt7_"+currentUser}
function backupKey(){return "gt7_backups_"+currentUser}
function activeKey(){return "gt7_active_"+currentUser}
function id(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function today(){return new Date().toISOString().slice(0,10)}
function now(){return new Date().toISOString()}
function defaults(){return{version:"7.2",settings:{theme:USERS[currentUser].theme,rest:120,inc:2.5},exercises:[],routines:[],plan:{},sessions:[],sets:[],weights:[],blocks:[{id:id(),name:"Bloque actual",type:"Fuerza",startDate:today(),weeks:8,deload:true,note:""}],trash:{routines:[],blocks:[],sessions:[]},meta:{createdAt:now(),updatedAt:now(),lastDailyBackup:null}}}
function normalizeData(){
 S.settings=S.settings||{};S.exercises=S.exercises||[];S.routines=S.routines||[];S.plan=S.plan||{};S.sessions=S.sessions||[];S.sets=S.sets||[];S.weights=S.weights||[];S.blocks=S.blocks||[];
 S.trash=S.trash||{routines:[],blocks:[],sessions:[]};S.trash.routines=S.trash.routines||[];S.trash.blocks=S.trash.blocks||[];S.trash.sessions=S.trash.sessions||[];
 S.meta=S.meta||{createdAt:now()};S.version="7.2";S.meta.updatedAt=now();
 if(!S.blocks.length)S.blocks=defaults().blocks;
}
function load(){try{S=JSON.parse(localStorage.getItem(key()))}catch(e){S=null}if(!S)S=defaults();normalizeData();save(false);dailyBackup()}
function save(makeBackup=true){normalizeData();localStorage.setItem(key(),JSON.stringify(S));if(makeBackup)softBackup("autosave")}
function softBackup(reason="auto"){try{let list=JSON.parse(localStorage.getItem(backupKey())||"[]");list.push({id:id(),reason,date:now(),name:`${reason}_${now()}`,data:S});list=list.slice(-10);localStorage.setItem(backupKey(),JSON.stringify(list))}catch(e){console.warn(e)}}
function dailyBackup(){let d=today();if(S.meta.lastDailyBackup!==d){S.meta.lastDailyBackup=d;softBackup("daily");localStorage.setItem(key(),JSON.stringify(S))}}
function backupList(){try{return JSON.parse(localStorage.getItem(backupKey())||"[]")}catch(e){return[]}}
function restoreBackup(idb){let b=backupList().find(x=>x.id===idb);if(!b)return;if(!confirm("¿Restaurar este backup?"))return;softBackup("before_restore");S=b.data;normalizeData();save(false);GT.render();alert("Backup restaurado")}
function deleteBackup(idb){localStorage.setItem(backupKey(),JSON.stringify(backupList().filter(x=>x.id!==idb)));GT.render()}
function exportBackup(){const blob=new Blob([JSON.stringify({user:currentUser,exportedAt:now(),data:S},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GymTracker_${currentUser}_${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
function exportCSV(){let rows=["date,routine,exercise,set,weight,reps,mode"];S.sessions.forEach(sess=>{let r=rt(sess.routineId);S.sets.filter(x=>x.sessionId===sess.id).forEach(st=>{let e=ex(st.exerciseId);rows.push([sess.date,r?.name||"",e?.name||"",st.setNumber,st.weight,st.reps,st.mode||""].map(x=>`"${String(x).replaceAll('"','""')}"`).join(","))})});const blob=new Blob([rows.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`GymTracker_${currentUser}_${today()}.csv`;a.click();URL.revokeObjectURL(a.href)}
function importBackupText(txt){try{let obj=JSON.parse(txt);let data=obj.data||obj;if(!data.routines||!data.sessions)throw new Error("Backup no válido");softBackup("before_import");S=data;normalizeData();save(false);GT.render();alert("Backup restaurado")}catch(e){alert("No se pudo restaurar: "+e.message)}}
function saveActiveWorkout(A){if(A)localStorage.setItem(activeKey(),JSON.stringify(A))}
function clearActiveWorkout(){localStorage.removeItem(activeKey())}
function getActiveWorkout(){try{return JSON.parse(localStorage.getItem(activeKey()))}catch(e){return null}}
function ex(eid){return S.exercises.find(e=>e.id===eid)}
function rt(rid){return S.routines.find(r=>r.id===rid)}
function theme(){document.body.classList.remove("elegance","carbon");let t=S.settings.theme||USERS[currentUser].theme;if(t==="elegance")document.body.classList.add("elegance");if(t==="carbon")document.body.classList.add("carbon")}
