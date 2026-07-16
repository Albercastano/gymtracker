#!/usr/bin/env python3
"""Inline Chromium harness for Phoenix Build 018.

The environment blocks localhost/file URL navigation. This harness therefore loads the
real HTML, CSS and JavaScript inline and mocks only opaque-origin services
(localStorage, PEDB persistence and local JSON fetches). It does not exercise the
service worker or certify a published PWA/physical Android installation.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def build_html() -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    apex = (ROOT / "themes/apex/apex.css").read_text(encoding="utf-8")
    html = re.sub(r'<link rel="stylesheet" href="styles\.css\?v=018">', f"<style>{css}</style>", html)
    html = re.sub(
        r'<link rel="stylesheet" href="themes/apex/apex\.css\?v=018" data-phx-apex-bootstrap>',
        f'<link rel="stylesheet" data-phx-apex-bootstrap><style>{apex}</style>',
        html,
    )
    html = re.sub(r'<link rel="manifest"[^>]*>', "", html)

    shape_manifest = json.loads((ROOT / "forge/shapes/precision/manifest.json").read_text(encoding="utf-8"))
    shape = json.loads((ROOT / "forge/shapes/precision/shape.json").read_text(encoding="utf-8"))
    pedb_manifest = json.loads((ROOT / "data/manifest.json").read_text(encoding="utf-8"))
    json_map = {
        "forge/shapes/precision/manifest.json": shape_manifest,
        "forge/shapes/precision/shape.json": shape,
        "data/manifest.json": pedb_manifest,
    }
    prelude = f"""<script>
(function(){{
 const values=new Map();
 const storage={{getItem:k=>values.has(String(k))?values.get(String(k)):null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]||null,get length(){{return values.size}}}};
 try{{Object.defineProperty(window,'localStorage',{{value:storage,configurable:true}})}}catch(_){{}}
 try{{Object.defineProperty(window,'sessionStorage',{{value:storage,configurable:true}})}}catch(_){{}}
 window.__HARNESS_JSON__={json.dumps(json_map, ensure_ascii=False)};
 window.fetch=async function(input){{
   const raw=String(input&&input.url||input);
   const key=raw.replace(/^https?:\\/\\/[^/]+\\//,'').replace(/^\\.\\//,'').split('?')[0];
   const value=window.__HARNESS_JSON__[key];
   if(value!==undefined)return new Response(JSON.stringify(value),{{status:200,headers:{{'Content-Type':'application/json'}}}});
   return new Response('',{{status:404}})
 }};
 window.PhoenixNetworkGate=Object.freeze({{mode:'harness-local-only',syncEnabled:false,getAudit:()=>[],canConnect:()=>false,describe:()=>({{mode:'harness-local-only'}})}})
}})();
</script>"""
    html = html.replace("<head>", "<head>" + prelude, 1)

    def inline_script(match: re.Match[str]) -> str:
        src = match.group(1).split("?")[0]
        if src == "core/network-gate.js":
            return "<script>/* network gate validated statically; harness uses a local fetch mock */</script>"
        if src == "js/pedb-bundle.js":
            return f'<script>window.PEDB_BUNDLE={{"manifest.json":{json.dumps(pedb_manifest, ensure_ascii=False)}}};</script>'
        if src == "js/pedb-db.js":
            return "<script>const PEDB_DB={open:async()=>true,get:async()=>null,getAll:async()=>[],clear:async()=>true,putMany:async()=>true};</script>"
        if src == "js/pedb-loader.js":
            return '<script>const PEDB_LOADER={install:async()=>window.__HARNESS_JSON__["data/manifest.json"]};</script>'
        return f"<script>\n{(ROOT / src).read_text(encoding='utf-8')}\n</script>"

    return re.sub(r'<script src="([^"]+)"></script>', inline_script, html)


def boot_snapshot(page) -> dict:
    return page.evaluate(
        """()=>({
          title:document.title,
          build:document.documentElement.dataset.phxBuild,
          material:document.documentElement.dataset.phxMaterial,
          materialReady:document.documentElement.dataset.phxMaterialReady,
          shape:document.documentElement.dataset.phxShape,
          shapeReady:document.documentElement.dataset.phxShapeReady,
          shapeCertified:document.documentElement.dataset.phxShapeCertified,
          shapeMode:document.documentElement.dataset.phxShapeMode,
          screen:App?.currentScreen,
          shapeEngine:window.PhoenixShapeEngine?.version,
          shapeContract:window.PhoenixShapeContract?.version,
          actionBus:window.PhoenixForgeActionBus?.version,
          actionCoreBound:window.PhoenixForgeActionBus?.coreBound,
          shapeCoreBound:window.PhoenixShapeEngine?.coreBound,
          snapshotComponents:Object.keys(window.PhoenixShapeEngine?.lastSnapshot?.components||{}),
          settings:App?.data?.settings,
          width:{scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth},
          forgeReport:window.PhoenixForgeDiagnostics?.run?.(App)
        })"""
    )


def functional_checks(page) -> dict:
    return page.evaluate(
        """async()=>{
          const invalid={schemaVersion:1,id:'bad-shape',screens:{home:{layout:'stack',slots:[]}}};
          const invalidCert=PhoenixShapeEngine.validate(invalid);
          const fallback=await PhoenixShapeEngine.apply('does-not-exist',{source:'harness'});
          await PhoenixForgeActionBus.dispatch('open-data');
          const afterOpen=App.currentScreen;
          let unauthorizedRejected=false;
          try{await PhoenixForgeActionBus.dispatch('read-profile')}catch(_){unauthorizedRejected=true}
          App.renderForgeLab(false);
          await new Promise(resolve=>setTimeout(resolve,100));
          return {
            invalidShapeRejected:invalidCert.valid===false,
            invalidShapeErrors:invalidCert.errors,
            unsupportedShapeFallback:fallback,
            actionBusOpenedData:afterOpen,
            unauthorizedActionRejected:unauthorizedRejected,
            forgeLab:{
              shape:document.getElementById('forgeShapeActive')?.textContent,
              contract:document.getElementById('forgeShapeContract')?.textContent,
              bus:document.getElementById('forgeActionBusState')?.textContent,
              viewModel:document.getElementById('forgeViewModelState')?.textContent
            }
          }
        }"""
    )


def main() -> int:
    html = build_html()
    viewports = [(360, 740), (390, 844), (430, 932), (844, 390)]
    output: dict[str, object] = {
        "build": "Phoenix 11 Alpha Build 018",
        "method": "Chromium page.set_content with real app scripts/styles and opaque-origin mocks",
        "limitations": [
            "localhost and file URL navigation are blocked by environment policy",
            "service worker and install/update flow are not exercised",
            "PEDB IndexedDB persistence is mocked; PEDB files are validated separately by static tests",
            "this is not a physical Android test",
        ],
        "viewports": [],
        "functional": None,
        "errors": [],
        "console": [],
    }
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path="/usr/bin/chromium",
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        for width, height in viewports:
            page = browser.new_page(viewport={"width": width, "height": height})
            page_errors: list[str] = []
            console_errors: list[dict[str, str]] = []
            page.on("pageerror", lambda error, bucket=page_errors: bucket.append(str(error)))
            page.on(
                "console",
                lambda message, bucket=console_errors: bucket.append({"type": message.type, "text": message.text})
                if message.type in {"error", "warning"}
                else None,
            )
            page.set_content(html, wait_until="load", timeout=60_000)
            page.wait_for_timeout(2_000)
            snapshot = boot_snapshot(page)
            output["viewports"].append(
                {
                    "width": width,
                    "height": height,
                    "boot": snapshot,
                    "horizontalOverflow": snapshot["width"]["scroll"] > snapshot["width"]["client"],
                    "errors": page_errors,
                    "console": console_errors,
                }
            )
            if width == 390 and height == 844:
                output["functional"] = functional_checks(page)
            output["errors"].extend(page_errors)
            output["console"].extend(console_errors)
            page.close()
        browser.close()

    all_booted = all(
        item["boot"]["shapeReady"] == "true"
        and item["boot"]["shapeCertified"] == "true"
        and item["boot"]["actionCoreBound"] is True
        and item["boot"]["shapeCoreBound"] is True
        and not item["horizontalOverflow"]
        and not item["errors"]
        for item in output["viewports"]
    )
    functional = output["functional"] or {}
    output["passed"] = bool(
        all_booted
        and functional.get("invalidShapeRejected")
        and functional.get("unsupportedShapeFallback") == "precision"
        and functional.get("actionBusOpenedData") == "data"
        and functional.get("unauthorizedActionRejected")
        and not output["errors"]
        and not output["console"]
    )
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0 if output["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
