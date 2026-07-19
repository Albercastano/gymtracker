"use strict";
(function(){
  const VERSION="0.4.0";
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
          estimatedMinutes:app.continuityHomePlan?.estimatedMinutes||app.estimateRoutineMinutes?.(routine)||0,
          continuity:{environment:app.continuityHomeEnvironment||"gym",busy:Boolean(app.continuityHomeBusy),plan:clone(app.continuityHomePlan)}
        },
        "start-workout-action":{enabled:Boolean(routine||active),routineId:active?.routineId||routine?.id||null,mode:active?"resume":"continuity",environment:app.continuityHomeEnvironment||"gym",busy:Boolean(app.continuityHomeBusy),unresolved:app.continuityHomePlan?.items?.filter?.(item=>item.unresolved)?.length||0,adapted:app.continuityHomePlan?.items?.filter?.(item=>item.changed)?.length||0},
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
        "session-progress":{routineName:routine.name,environment:active.trainingEnvironment||"gym",environmentLabel:app.environmentLabel?.(active.trainingEnvironment||"gym")||"Gimnasio",currentExercise:(Number(active.exerciseIndex)||0)+1,totalExercises,progress},
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

  function buildExerciseSummary(app){
    const active=app?.active;if(!active)return generic("exercise-summary",app);
    const e=app.currentExercise?.();const routine=app.currentRoutine?.();if(!e||!routine)return generic("exercise-summary",app);
    const sets=(active.currentSets||[]).map((x,i)=>({index:i,reps:Number(x.reps)||0,weight:Number(x.weight)||0}));
    const totalReps=sets.reduce((a,x)=>a+x.reps,0),volume=sets.reduce((a,x)=>a+x.weight*x.reps,0);
    const best=sets.reduce((top,x)=>x.weight>(top?.weight||-1)?x:top,null);
    return freeze({screen:"exercise-summary",generatedAt:new Date().toISOString(),state:{activeWorkout:true,phase:"summary"},components:{
      "exercise-summary-hero":{name:e.name,originalName:e.originalName||null,alternativeReason:e.alternativeReason||null},
      "exercise-summary-metrics":{series:sets.length,totalReps,unit:e.mode==="time"?"segundos":"reps",volume:Math.round(volume)},
      "exercise-summary-sets":{sets,unit:e.mode==="time"?"s":"reps",bestWeight:best?.weight||0},
      "exercise-summary-next":{final:(Number(active.exerciseIndex)||0)>=((routine.items?.length||1)-1)}
    }})
  }
  function buildWorkoutSummary(app){
    const session=app?.lastCompletedSession;if(!session)return generic("workout-summary",app);
    const exercises=(session.exercises||[]).map((e,idx)=>({index:idx,name:e.name,plannedName:e.plannedName||null,alternativeReason:e.alternativeReason||null,mode:e.mode||"reps",sets:(e.sets||[]).map((x,i)=>({index:i,reps:Number(x.reps)||0,weight:Number(x.weight)||0}))}));
    return freeze({screen:"workout-summary",generatedAt:new Date().toISOString(),state:{saved:true},components:{
      "workout-summary-hero":{routineName:session.routineName,endedAt:session.endedAt},
      "workout-summary-metrics":{exercises:exercises.length,sets:Number(session.totalSets)||0,minutes:Math.max(1,Math.round((Number(session.durationMs)||0)/60000)),volume:Math.round(Number(session.volume)||0),alternatives:exercises.filter(e=>e.plannedName&&e.plannedName!==e.name).length},
      "workout-summary-report":{exercises,prs:clone(session.prs||[])},
      "workout-summary-notes":{notes:session.notes||""},
      "workout-summary-actions":{enabled:true}
    }})
  }

  function buildData(app){
    const sessions=(app?.data?.sessions||[]).slice().sort((a,b)=>new Date(a.endedAt||a.date)-new Date(b.endedAt||b.date));
    const now=Date.now(),weekAgo=now-7*86400000;
    const sessionSets=x=>Number(x.totalSets)||((x.exercises||[]).reduce((n,e)=>n+(e.sets||[]).length,0));
    const maxLoad=x=>Math.max(0,...(x.exercises||[]).flatMap(e=>(e.sets||[]).map(set=>Number(set.weight)||0)));
    const week=sessions.filter(x=>new Date(x.endedAt||x.date).getTime()>=weekAgo);
    const bodyWeight=Number(app?.data?.profile?.bodyWeight)||0;
    const allMax=Math.max(0,...sessions.map(maxLoad));
    const metric=app?.dataMetric||"volume",range=app?.dataRange||"4w";
    const days={"4w":28,"3m":92,"6m":184,"1y":366}[range]||28,cutoff=now-days*86400000;
    let series=metric==="weight"?(app?.data?.weights||[]).map(x=>({date:x.date,value:Number(x.weight)||0})):sessions.map(x=>({date:x.endedAt||x.date,value:metric==="load"?maxLoad(x):metric==="relative"?(bodyWeight?maxLoad(x)/bodyWeight:0):(Number(x.volume)||0)}));
    series=series.filter(x=>Number(x.value)>0&&new Date(x.date).getTime()>=cutoff);
    if(series.length>12){const out=[],step=(series.length-1)/11;for(let i=0;i<12;i++)out.push(series[Math.round(i*step)]);series=out}
    const recent=sessions.slice(-3).reverse().map(x=>({date:x.endedAt||x.date,routineName:x.routineName||"Entrenamiento",sets:sessionSets(x),minutes:Math.round((Number(x.durationMs)||0)/60000),volume:Number(x.volume)||0,substitutions:(x.exercises||[]).filter(e=>e.plannedName&&e.plannedName!==e.name).length}));
    return freeze({screen:"data",generatedAt:new Date().toISOString(),components:{
      "data-hero":{latest:sessions.at(-1)||null,material:app?.data?.settings?.uiMaterial||"precision"},
      "data-week":{sessions:week.length,sets:week.reduce((n,x)=>n+sessionSets(x),0),volume:week.reduce((n,x)=>n+(Number(x.volume)||0),0),minutes:Math.round(week.reduce((n,x)=>n+(Number(x.durationMs)||0),0)/60000)},
      "data-chart":{metric,range,series},
      "data-insights":{bodyWeight,relative:bodyWeight&&allMax?allMax/bodyWeight:0,maxLoad:allMax},
      "data-recent":{sessions:recent}
    }})
  }
  function buildHistory(app){
    const sessions=(app?.data?.sessions||[]).map((x,index)=>({index,date:x.endedAt||x.date,routineName:x.routineName||"Entrenamiento",durationMs:Number(x.durationMs)||0,volume:Number(x.volume)||0,totalSets:Number(x.totalSets)||((x.exercises||[]).reduce((n,e)=>n+(e.sets||[]).length,0)),exercises:(x.exercises||[]).map(e=>({name:e.name,plannedName:e.plannedName||null,sets:(e.sets||[]).map(set=>({reps:Number(set.reps)||0,weight:Number(set.weight)||0}))}))})).reverse();
    return freeze({screen:"history",generatedAt:new Date().toISOString(),components:{"history-list":{sessions}}})
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
  function get(screen,app){if(screen==="home")return buildHome(app);if(screen==="gym")return buildWorkout(app);if(screen==="series")return buildSet(app);if(screen==="rest")return buildRest(app);if(screen==="exercise-summary")return buildExerciseSummary(app);if(screen==="workout-summary")return buildWorkoutSummary(app);if(screen==="data")return buildData(app);if(screen==="history")return buildHistory(app);return generic(screen,app)}
  window.PhoenixForgeViewModel=Object.freeze({version:"0.7.0",get,home:buildHome,workout:buildWorkout,setConsole:buildSet,rest:buildRest,exerciseSummary:buildExerciseSummary,workoutSummary:buildWorkoutSummary,data:buildData,history:buildHistory,clone});
})();
