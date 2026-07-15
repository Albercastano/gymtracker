#!/usr/bin/env python3
"""Browser regression for Phoenix 11 Alpha Build 007."""
from __future__ import annotations
import json
import subprocess
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8767
BASE = f"http://127.0.0.1:{PORT}/"
VIEWPORTS = [(360, 800), (390, 844), (430, 932)]

server = subprocess.Popen(
    ["python", "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
    cwd=ROOT,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
try:
    time.sleep(0.8)
    report = {"build": "007", "valid": True, "viewports": [], "consoleErrors": [], "httpErrors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for index, (width, height) in enumerate(VIEWPORTS):
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("console", lambda msg: report["consoleErrors"].append(msg.text) if msg.type == "error" else None)
            page.on("response", lambda response: report["httpErrors"].append({"url": response.url, "status": response.status}) if response.status >= 400 else None)
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_function("typeof App === 'object' && typeof App.renderForgeLab === 'function'")
            page.evaluate("""
                localStorage.setItem('gymtracker_phoenix_active_profile_v1','alberto');
                document.getElementById('profileGate')?.classList.remove('show');
                App.renderForgeLab(false);
            """)
            page.wait_for_selector("#forgeLab.active")

            # Preview must not alter saved settings.
            saved_before = page.evaluate("App.data.settings.uiMaterial")
            page.locator("#forgeLab [data-ui-material='foundry']").click()
            page.wait_for_function("document.documentElement.dataset.phxMaterial === 'foundry'")
            saved_during_preview = page.evaluate("App.data.settings.uiMaterial")
            preview_flag = page.evaluate("document.documentElement.dataset.phxMaterialPreview")
            assert saved_during_preview == saved_before, (saved_before, saved_during_preview)
            assert preview_flag == "true"

            page.locator("#forgeApplyPreview").click()
            page.wait_for_function("App.data.settings.uiMaterial === 'foundry'")
            page.evaluate("App.runForgeQualityGate()")
            page.wait_for_timeout(250)
            score = page.locator("#forgeQualityScore").inner_text()
            state = page.locator("#forgeQualityState").inner_text()
            overflow = page.evaluate("document.getElementById('forgeLab').scrollWidth > document.getElementById('forgeLab').clientWidth + 2")
            material = page.evaluate("document.documentElement.dataset.phxMaterial")
            persisted = page.evaluate("App.data.settings.uiMaterial")

            # XL text pass.
            page.evaluate("App.data.settings.fontScale='xl'; document.documentElement.dataset.fontScale='xl'; App.renderForgeLab(false)")
            page.wait_for_selector("#forgeLab.active")
            page.evaluate("App.runForgeQualityGate()")
            page.wait_for_timeout(250)
            xl_overflow = page.evaluate("document.getElementById('forgeLab').scrollWidth > document.getElementById('forgeLab').clientWidth + 2")

            # Emergency restore.
            page.evaluate("App.restorePrecisionMaterial()")
            page.wait_for_function("App.data.settings.uiMaterial === 'precision'")
            restored = page.evaluate("document.documentElement.dataset.phxMaterial")

            if index == 1:
                page.evaluate("App.data.settings.fontScale='normal'; document.documentElement.dataset.fontScale='normal'; App.setUiMaterial('foundry'); App.renderForgeLab(false)")
                page.wait_for_timeout(250)
                page.screenshot(path="/mnt/data/forge_lab_build007_foundry.png", full_page=True)

            item = {
                "viewport": f"{width}x{height}",
                "score": score,
                "state": state,
                "overflow": overflow,
                "xlOverflow": xl_overflow,
                "material": material,
                "persisted": persisted,
                "restored": restored,
            }
            report["viewports"].append(item)
            if overflow or xl_overflow or material != "foundry" or persisted != "foundry" or restored != "precision":
                report["valid"] = False
            page.close()
        browser.close()

    # Ignore benign favicon/service-worker noise only if no HTTP failures.
    if report["consoleErrors"] or report["httpErrors"]:
        report["valid"] = False
    output = ROOT / "docs" / "alpha" / "BROWSER_REGRESSION_BUILD_007.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["valid"] else 1)
finally:
    server.terminate()
    try:
        server.wait(timeout=2)
    except subprocess.TimeoutExpired:
        server.kill()
