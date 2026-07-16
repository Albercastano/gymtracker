from pathlib import Path
import json,re,subprocess
R=Path(__file__).resolve().parents[1]
checks={}
def c(k,v): checks[k]=bool(v)
for p in R.rglob("*.js"):
 r=subprocess.run(["node","--check",str(p)],capture_output=True)
 c("js:"+str(p.relative_to(R)),r.returncode==0)
for p in R.rglob("*.json"):
 try: json.loads(p.read_text()) ; c("json:"+str(p.relative_to(R)),True)
 except: c("json:"+str(p.relative_to(R)),False)
app=(R/"app.js").read_text(); eng=(R/"forge/engine/shape-engine.js").read_text(); vm=(R/"forge/core/forge-view-model.js").read_text(); bus=(R/"forge/core/forge-action-bus.js").read_text(); idx=(R/"index.html").read_text(); sw=(R/"sw.js").read_text(); shape=json.loads((R/"forge/shapes/precision/shape.json").read_text())
c("seriesShape",len(shape["screens"]["series"]["slots"])==5)
c("setViewModel","function buildSet" in vm and 'screen==="series"' in vm)
c("setRenderer",(R/"forge/renderers/set-renderer.js").exists() and "PhoenixForgeSetRenderer" in eng)
c("legacyFallback","beginSetLegacy()" in app and "this.beginSetLegacy();" in app)
c("actionBus","return-workout" in bus and 'bind("finish-workout",()=>app.finishWorkout?.())' in bus)
c("scriptOrder",idx.find("set-renderer.js?v=021")<idx.find("shape-engine.js?v=021")<idx.find("app.js?v=021"))
c("pwaCache","set-renderer.js?v=021" in sw and 'VERSION="021"' in sw)
c("buildVersion",'content="021"' in idx and "BUILD 021" in app)
c("pedbExercises",len(json.loads((R/"data/exercises.json").read_text()))==1200)
rels=json.loads((R/"data/relations.json").read_text()); c("pedbRelations",len(rels)==21522)
out={"build":"021","passed":sum(checks.values()),"total":len(checks),"ok":all(checks.values()),"checks":checks}
(R/"docs/alpha/VALIDATION_BUILD_021.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(out,ensure_ascii=False,indent=2))
raise SystemExit(0 if out["ok"] else 1)
