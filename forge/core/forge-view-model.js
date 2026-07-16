"use strict";
(function(){
  const VERSION="0.3.0";
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
          title:active?(activeRoutine?.name||"Rutina"):(routine?.name||"DESCANSO"),
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

  function buildWorkout(app){
    const active=app?.active;
    if(!active)return generic("gym",app);
    app.normalizeActive?.();
    const routine=app.currentRoutine?.();
    const exercise=app.currentExercise?.();
    const override=app.currentOverride?.();
    if(!routine||!exercise)return generic("gym",app);
    const completed=Math.min(Number(app.completedSeriesForCurrent?.())||0,Number(exercise.sets)||0);
    const totalExercises=Math.max(1,routine.items?.length||1);
    const progress=Math.max(0,Math.min(100,Math.round(((Number(active.exerciseIndex)||0)+(completed/Math.max(1,Number(exercise.sets)||1)))/totalExercises*100)));
    const previous=active.currentSets?.[active.currentSets.length-1]||null;
    return freeze({
      screen:"gym",generatedAt:new Date().toISOString(),profile:{id:app.activeProfileId||"alberto",name:app.activeProfile?.()?.name||"Alberto"},
      state:{activeWorkout:true,phase:active.phase||"gym",alternative:Boolean(override)},
      components:{
        "session-progress":{routineName:routine.name,currentExercise:(Number(active.exerciseIndex)||0)+1,totalExercises,progress},
        "exercise-stage":{name:exercise.name,originalName:exercise.originalName||null,alternativeReason:override?.reason||null,currentExercise:(Number(active.exerciseIndex)||0)+1,totalExercises,sets:Number(exercise.sets)||0,completed},
        "target-instrument":{mode:exercise.mode||"reps",reps:Number(exercise.reps)||0,weight:Number(exercise.weight)||0,rest:Number(exercise.rest)||0},
        "workout-context":{completed,totalSets:Number(exercise.sets)||0,remaining:Math.max(0,(Number(exercise.sets)||0)-completed),previous:previous?{reps:Number(previous.reps)||0,weight:Number(previous.weight)||0}:null},
        "begin-set-action":{mode:completed?"continue":"start"},
        "pause-workout-action":{enabled:true}
      }
    })
  }

  function buildSet(app){
    const active=app?.active;
    if(!active)return generic("series",app);
    app.normalizeActive?.();
    const routine=app.currentRoutine?.();
    const exercise=app.currentExercise?.();
    const override=app.currentOverride?.();
    if(!routine||!exercise)return generic("series",app);
    const previous=active.currentSets?.[active.currentSets.length-1]||null;
    return freeze({
      screen:"series",generatedAt:new Date().toISOString(),profile:{id:app.activeProfileId||"alberto",name:app.activeProfile?.()?.name||"Alberto"},
      state:{activeWorkout:true,phase:"series",alternative:Boolean(override)},
      components:{
        "set-header":{routineName:routine.name,exerciseName:exercise.name,originalName:exercise.originalName||null,alternative:Boolean(override),currentExercise:(Number(active.exerciseIndex)||0)+1,totalExercises:routine.items?.length||1,currentSet:(Number(active.setIndex)||0)+1,totalSets:Number(exercise.sets)||1},
        "set-console":{mode:exercise.mode||"reps",reps:Number(exercise.reps)||0,weight:Number(exercise.weight)||0,previous:previous?{reps:Number(previous.reps)||0,weight:Number(previous.weight)||0}:null},
        "save-set-action":{enabled:true},
        "change-exercise-action":{enabled:true},
        "return-workout-action":{enabled:true}
      }
    })
  }

  function buildRest(app){
    const active=app?.active;
    if(!active||active.phase!=="rest")return generic("rest",app);
    app.normalizeActive?.();
    const exercise=app.currentExercise?.();
    if(!exercise)return generic("rest",app);
    const currentSeries=Math.max(1,Number(active.setIndex)||1);
    const totalSets=Math.max(1,Number(exercise.sets)||1);
    const nextSeries=Math.min(totalSets,currentSeries+1);
    const left=Math.max(0,Math.round(Number(active.restLeft)||0));
    const total=Math.max(1,Number(active.restTotal)||left||1);
    return freeze({
      screen:"rest",generatedAt:new Date().toISOString(),profile:{id:app.activeProfileId||"alberto",name:app.activeProfile?.()?.name||"Alberto"},
      state:{activeWorkout:true,phase:"rest",paused:Boolean(active.restPaused)},
      components:{
        "timer-header":{exerciseName:exercise.name,currentSeries,nextSeries,totalSets},
        "timer-core":{left,total,paused:Boolean(active.restPaused)},
        "timer-controls":{paused:Boolean(active.restPaused)},
        "timer-skip":{enabled:true},
        "timer-settings":{sound:app.data?.settings?.sound!==false,vibration:app.data?.settings?.vibration!==false,audioReady:Boolean(app.audioUnlocked)}
      }
    })
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
  function get(screen,app){if(screen==="home")return buildHome(app);if(screen==="gym")return buildWorkout(app);if(screen==="series")return buildSet(app);if(screen==="rest")return buildRest(app);return generic(screen,app)}
  window.PhoenixForgeViewModel=Object.freeze({version:"0.5.0",get,home:buildHome,workout:buildWorkout,setConsole:buildSet,rest:buildRest,clone});
})();
