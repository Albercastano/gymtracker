#!/usr/bin/env python3
"""Static integrity checks for GymTracker Phoenix 11 Alpha Build 019.

This script does not replace a published-PWA or physical Android test.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

try:
    import jsonschema
except ImportError:  # pragma: no cover
    jsonschema = None

ROOT = Path(__file__).resolve().parents[1]
BUILD = "019"


class IdAndAssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.assets: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(str(data["id"]))
        if tag == "script" and data.get("src"):
            self.assets.append(str(data["src"]))
        if tag == "link" and data.get("href"):
            rel = str(data.get("rel") or "")
            if any(token in rel for token in ("stylesheet", "manifest", "icon")):
                self.assets.append(str(data["href"]))
        if tag in {"img", "audio", "source"} and data.get("src"):
            self.assets.append(str(data["src"]))


def local_path(reference: str) -> Path | None:
    clean = urlsplit(reference).path
    if not clean or clean.startswith(("http://", "https://", "data:", "blob:")):
        return None
    clean = clean.lstrip("./")
    return ROOT / clean


def load_bundle() -> dict:
    text = (ROOT / "js/pedb-bundle.js").read_text(encoding="utf-8")
    prefix = "window.PEDB_BUNDLE="
    if not text.startswith(prefix):
        raise AssertionError("pedb-bundle.js no usa el formato esperado")
    payload = text[len(prefix):].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def main() -> int:
    failures: list[str] = []
    checks: dict[str, object] = {}

    def check(name: str, condition: bool, detail: str = "") -> None:
        checks[name] = bool(condition)
        if not condition:
            failures.append(f"{name}: {detail or 'falló'}")

    # Version consistency in release-critical files.
    critical_text = {
        "index": (ROOT / "index.html").read_text(encoding="utf-8"),
        "app": (ROOT / "app.js").read_text(encoding="utf-8"),
        "manifest": (ROOT / "manifest.webmanifest").read_text(encoding="utf-8"),
        "sw": (ROOT / "sw.js").read_text(encoding="utf-8"),
        "repair": (ROOT / "actualizar-apex.html").read_text(encoding="utf-8"),
        "readme": (ROOT / "README_PHOENIX_11_ALPHA_BUILD_019.txt").read_text(encoding="utf-8"),
    }
    check("versionBuild019", all(BUILD in text for text in critical_text.values()), "algún archivo crítico no contiene 018")
    check("indexTitleBuild019", "Build 019" in critical_text["index"])
    check("serviceWorkerCacheBuild019", "build-019-precision-home-renderer" in critical_text["sw"])
    check("manifestStartUrlBuild019", '"start_url": "./index.html?v=019"' in critical_text["manifest"])

    # JavaScript syntax.
    js_files = sorted(ROOT.rglob("*.js"))
    syntax_errors: list[str] = []
    for file in js_files:
        proc = subprocess.run(["node", "--check", str(file)], capture_output=True, text=True)
        if proc.returncode:
            syntax_errors.append(f"{file.relative_to(ROOT)}: {proc.stderr.strip()}")
    check("javascriptSyntax", not syntax_errors, " | ".join(syntax_errors[:3]))
    checks["javascriptFilesChecked"] = len(js_files)

    # JSON syntax and schema.
    json_files = sorted(ROOT.rglob("*.json"))
    parsed_json: dict[Path, object] = {}
    json_errors: list[str] = []
    for file in json_files:
        try:
            parsed_json[file] = json.loads(file.read_text(encoding="utf-8"))
        except Exception as exc:
            json_errors.append(f"{file.relative_to(ROOT)}: {exc}")
    check("jsonSyntax", not json_errors, " | ".join(json_errors[:3]))
    checks["jsonFilesChecked"] = len(json_files)

    schema_path = ROOT / "forge/contracts/schemas/shape.schema.json"
    shape_path = ROOT / "forge/shapes/precision/shape.json"
    if jsonschema is not None and schema_path in parsed_json and shape_path in parsed_json:
        try:
            jsonschema.Draft202012Validator(parsed_json[schema_path]).validate(parsed_json[shape_path])
            shape_schema_ok = True
        except Exception as exc:
            shape_schema_ok = False
            failures.append(f"precisionShapeSchema: {exc}")
        checks["precisionShapeSchema"] = shape_schema_ok
    else:
        checks["precisionShapeSchema"] = "not-run"

    # HTML IDs and referenced assets.
    parser = IdAndAssetParser()
    parser.feed(critical_text["index"])
    duplicates = {key: value for key, value in Counter(parser.ids).items() if value > 1}
    check("duplicateHtmlIds", not duplicates, str(duplicates))
    missing_html_assets = []
    for ref in parser.assets:
        path = local_path(ref)
        if path is not None and not path.exists():
            missing_html_assets.append(ref)
    check("htmlAssetsPresent", not missing_html_assets, ", ".join(missing_html_assets))

    # Service worker assets.
    match = re.search(r"const ASSETS=(\[.*?\]);", critical_text["sw"], re.S)
    sw_assets = json.loads(match.group(1)) if match else []
    missing_sw_assets = []
    for ref in sw_assets:
        clean = urlsplit(ref).path
        if clean in {"", "/"} or ref == "./":
            continue
        path = ROOT / clean.lstrip("./")
        if not path.exists():
            missing_sw_assets.append(ref)
    check("serviceWorkerAssetsPresent", bool(match) and not missing_sw_assets, ", ".join(missing_sw_assets))
    checks["serviceWorkerAssetCount"] = len(sw_assets)
    required_forge_assets = {
        "./forge/contracts/shape-contract.js?v=019",
        "./forge/core/forge-action-bus.js?v=019",
        "./forge/core/forge-view-model.js?v=019",
        "./forge/core/forge-diagnostics.js?v=019",
        "./forge/renderers/home-renderer.js?v=019",
        "./forge/engine/shape-engine.js?v=019",
        "./forge/shapes/precision/manifest.json",
        "./forge/shapes/precision/shape.json",
    }
    check("forgeAssetsCached", required_forge_assets.issubset(set(sw_assets)), str(sorted(required_forge_assets - set(sw_assets))))

    # Forge integration and local-only security foundation.
    app = critical_text["app"]
    network_gate = (ROOT / "core/network-gate.js").read_text(encoding="utf-8")
    shape_engine = (ROOT / "forge/engine/shape-engine.js").read_text(encoding="utf-8")
    action_bus = (ROOT / "forge/core/forge-action-bus.js").read_text(encoding="utf-8")
    check("forgeScriptsLoadedBeforeApp", critical_text["index"].find("forge/engine/shape-engine.js") < critical_text["index"].find("app.js?v=019"))
    check("forgeRootAllowedLocally", "'/forge/'" in network_gate)
    check("externalNetworkStillBlocked", "conexión bloqueada por política local-first" in network_gate)
    check("shapeEnginePrecisionFallback", 'const FALLBACK="precision"' in shape_engine)
    check("shapeEngineNoWindowAppDependency", "window.App" not in shape_engine)
    check("shapeEngineCoreBinding", "function bindCore(app)" in shape_engine and "coreBound" in shape_engine)
    check("actionBusWhitelist", "const allowed=new Set" in action_bus and "Acción Forge no autorizada" in action_bus)
    check("forgeSettingsNonDestructive", all(token in app for token in ("uiShape", "uiInstruments", "uiCalibration")))
    check("appBindsForgeCore", "PhoenixShapeEngine?.bindCore?.(this)" in app and "PhoenixForgeActionBus?.bindCore?.(this)" in app)
    home_renderer = (ROOT / "forge/renderers/home-renderer.js").read_text(encoding="utf-8")
    precision_shape = parsed_json.get(ROOT / "forge/shapes/precision/shape.json", {})
    check("homeRendererPresent", "PhoenixForgeHomeRenderer" in home_renderer and "data-forge-action" in home_renderer)
    check("homeRendererNoDirectStorage", "localStorage" not in home_renderer and "indexedDB" not in home_renderer)
    check("homeUsesShapeEngineRenderer", 'PhoenixShapeEngine?.render?.("home"' in app)
    check("homeLegacyFallbackPreserved", "renderHomeLegacy(withHistory=true)" in app)
    check("precisionHomeRegions", len(precision_shape.get("screens", {}).get("home", {}).get("regions", [])) == 6)
    check("shapeEngineRendererMode", 'dataset.phxShapeMode="renderer-home"' in shape_engine and "function render(screen,target" in shape_engine)

    # App inline actions point to implemented App methods.
    method_pattern = re.compile(r"^\s{2}(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^\n]*?\)\s*\{", re.M)
    methods = set(method_pattern.findall(app))
    references = set(re.findall(r"App\.([A-Za-z_$][\w$]*)\s*\(", critical_text["index"] + app))
    missing_methods = sorted(references - methods)
    check("appActionMethodsPresent", not missing_methods, ", ".join(missing_methods))
    checks["appMethodCount"] = len(methods)

    # PEDB integrity in JSON and offline bundle.
    exercises = parsed_json.get(ROOT / "data/exercises.json", [])
    relations = parsed_json.get(ROOT / "data/relations.json", [])
    exercise_ids = [row.get("id") for row in exercises if isinstance(row, dict)]
    known_ids = set(exercise_ids)
    relation_ids = [row.get("i") or row.get("id") for row in relations if isinstance(row, dict)]
    broken_relations = [row for row in relations if isinstance(row, dict) and ((row.get("s") or row.get("source_id")) not in known_ids or (row.get("t") or row.get("target_id")) not in known_ids)]
    check("pedbExercises1200", len(exercises) == 1200, str(len(exercises)))
    check("pedbRelations21522", len(relations) == 21522, str(len(relations)))
    check("pedbExerciseIdsUnique", len(exercise_ids) == len(set(exercise_ids)), "IDs duplicados")
    check("pedbRelationIdsUnique", len(relation_ids) == len(set(relation_ids)), "IDs de relación duplicados")
    check("pedbRelationReferencesValid", not broken_relations, f"{len(broken_relations)} referencias rotas")
    try:
        bundle = load_bundle()
        bundle_exercises = bundle.get("exercises.json", [])
        bundle_relations = bundle.get("relations.json", [])
        bundle_manifest = bundle.get("manifest.json", {})
        bundle_ok = len(bundle_exercises) == 1200 and len(bundle_relations) == 21522 and bundle_manifest.get("version") == "3.4.0"
    except Exception as exc:
        bundle_ok = False
        failures.append(f"pedbOfflineBundle: {exc}")
    checks["pedbOfflineBundle"] = bundle_ok

    report = {
        "build": "Phoenix 11 Alpha Build 019",
        "release": "Phoenix Forge Precision Home Renderer 0.2",
        "root": str(ROOT),
        "checks": checks,
        "missingHtmlAssets": missing_html_assets,
        "missingServiceWorkerAssets": missing_sw_assets,
        "failures": failures,
        "result": "pass" if not failures else "fail",
        "scope": "static integrity only; does not certify published PWA or physical Android behavior",
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
