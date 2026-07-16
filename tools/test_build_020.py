from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
checks={}
def c(n,v): checks[n]=bool(v)
for f in R.rglob("*.js"):
 c("js:"+str(f.relative_to(R)),subprocess.run(["node","--check",str(f)],capture_output=True).returncode==0)
shape=json.loads((R/"forge/shapes/precision/shape.json").read_text())
app=(R/"app.js").read_text(); wr=(R/"forge/renderers/workout-renderer.js").read_text(); vm=(R/"forge/core/forge-view-model.js").read_text(); sw=(R/"sw.js").read_text()
c("gymShape",len(shape["screens"]["gym"]["slots"])==6)
c("workoutRenderer","PhoenixForgeWorkoutRenderer" in wr and "localStorage" not in wr and "indexedDB" not in wr)
c("workoutViewModel","function buildWorkout(app)" in vm)
c("gymUsesShapeEngine",'PhoenixShapeEngine?.render?.("gym"' in app)
c("gymFallback","renderGymLegacy(withHistory=true)" in app)
c("instrumentAssetsCached","instrument-registry.js?v=020" in sw and "workout-renderer.js?v=020" in sw)
c("pedb1200",len(json.loads((R/"data/exercises.json").read_text()))==1200)
c("relations21522",len(json.loads((R/"data/relations.json").read_text()))==21522)
report={"build":"Phoenix 11 Alpha Build 020","release":"Workout Instruments 0.1","checks":checks,"passed":sum(checks.values()),"total":len(checks),"ok":all(checks.values())}
(R/"docs/alpha/VALIDATION_BUILD_020.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(0 if report["ok"] else 1)
