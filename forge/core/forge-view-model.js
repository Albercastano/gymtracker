"use strict";
(function(){
  const VERSION="0.1.0";
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
  function freeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.freeze(value);Object.values(value).forEach(freeze)
    }
    return value
  }
  function sessionDate(session){return new Date(session?.endedAt||session?.date||Date.now())}
  function buildHome(app){
    const routine=app.todayRoutine?.()||null;
    const active=app.active||null;
    const activeRoutine=active?app.getRoutine?.(active.routineId):null;
    const activeExercise=active?app.currentExercise?.():null;
    const sessions=Array.isArray(app.data?.sessions)?app.data.sessions:[];
    const lastSession=sessions.at(-1)||null;
    const weekStart=Date.now()-(6*24*60*60*1000);
    const weekSessions=sessions.filter(session=>sessionDate(session).getTime()>=weekStart);
    const totalExercises=routine?.items?.length||0;
    const totalSets=routine?.items?.reduce((sum,item)=>sum+(Number(item.sets)||0),0)||0;
    const snapshot={
      screen:"home",
      generatedAt:new Date().toISOString(),
      profile:{id:app.activeProfileId||"alberto",name:app.activeProfile?.()?.name||"Alberto"},
      state:{storageHealthy:app.storageHealthy!==false,hasActiveWorkout:Boolean(active)},
      components:{
        "app-brand":{name:"GYMTRACKER",product:"PHOENIX"},
        "storage-status":{healthy:app.storageHealthy!==false},
        "workout-today":{
          status:active?"active":routine?"ready":"rest",
          routineId:active?.routineId||routine?.id||null,
          title:active?(activeRoutine?.name||"Rutina"):(routine?.name||"Descanso"),
          exerciseName:activeExercise?.name||null,
          currentExercise:active?Math.min((Number(active.exerciseIndex)||0)+1,activeRoutine?.items?.length||1):0,
          totalExercises:activeRoutine?.items?.length||totalExercises,
          totalSets,
          estimatedMinutes:app.estimateRoutineMinutes?.(routine)||0
        },
        "start-workout-action":{enabled:Boolean(routine||active),routineId:active?.routineId||routine?.id||null,mode:active?"resume":"start"},
        "open-data-action":{enabled:true},
        "weekly-progress":{
          sessions:weekSessions.length,
          volume:Math.round(weekSessions.reduce((sum,session)=>sum+(Number(session.volume)||0),0)),
          bodyWeight:Number(app.data?.profile?.bodyWeight)||null
        },
        "last-workout":lastSession?{
          exists:true,
          routineName:lastSession.routineName||"Rutina",
          date:sessionDate(lastSession).toISOString(),
          totalSets:Number(lastSession.totalSets)||0,
          volume:Math.round(Number(lastSession.volume)||0)
        }:{exists:false}
      }
    };
    return freeze(snapshot)
  }
  function generic(screen,app){
    return freeze({
      screen,
      generatedAt:new Date().toISOString(),
      profile:{id:app?.activeProfileId||"alberto",name:app?.activeProfile?.()?.name||"Alberto"},
      state:{activeWorkout:Boolean(app?.active)},
      components:{}
    })
  }
  function get(screen,app){return screen==="home"?buildHome(app):generic(screen,app)}
  window.PhoenixForgeViewModel=Object.freeze({version:VERSION,get,home:buildHome,clone});
})();
