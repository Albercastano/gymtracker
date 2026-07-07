const USERS={Alberto:{icon:"💪",theme:"luxury"},Edy:{icon:"🏋️",theme:"elegance"}};
let currentUser=localStorage.getItem("gt7_user")||"Alberto";
let S=null;
function key(){return "gt7_"+currentUser}
function id(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function today(){return new Date().toISOString().slice(0,10)}
function now(){return new Date().toISOString()}
function defaults(){return{version:"7.1",settings:{theme:USERS[currentUser].theme,rest:120,inc:2.5},exercises:[],routines:[],plan:{},sessions:[],sets:[],weights:[],blocks:[{id:id(),name:"Bloque actual",type:"Fuerza",startDate:today(),weeks:8,deload:true,note:""}]}}
function load(){try{S=JSON.parse(localStorage.getItem(key()))}catch(e){S=null}if(!S)S=defaults();S.settings=S.settings||{};S.exercises=S.exercises||[];S.routines=S.routines||[];S.plan=S.plan||{};S.sessions=S.sessions||[];S.sets=S.sets||[];S.weights=S.weights||[];S.blocks=S.blocks||[];if(!S.blocks.length)S.blocks=defaults().blocks}
function save(){localStorage.setItem(key(),JSON.stringify(S))}
function ex(eid){return S.exercises.find(e=>e.id===eid)}
function rt(rid){return S.routines.find(r=>r.id===rid)}
function theme(){document.body.classList.remove("elegance","carbon");let t=S.settings.theme||USERS[currentUser].theme;if(t==="elegance")document.body.classList.add("elegance");if(t==="carbon")document.body.classList.add("carbon")}


function exportBackup(){
  const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`GymTracker_${currentUser}_${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
