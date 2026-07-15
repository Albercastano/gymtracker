#!/usr/bin/env python3
"""Validador offline para Creaciones de la Forja (PHX Material Contract 0.2)."""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from pathlib import Path

REQUIRED={"schemaVersion","id","name","author","version","engine","status","fallback","styles","assetsBudgetKb","capabilities","network","scripts","componentContract"}
ALLOWED_EXT={".css",".svg",".png",".webp",".woff2",".json"}
ALLOWED_STATUS={"stable","beta","alpha","community"}
ALLOWED_CAP={"visual-tokens","components","timer","icons","motion","sound-theme","component-contract"}
FORBIDDEN_FILES={".js",".mjs",".cjs",".html",".htm",".wasm",".php",".exe",".dll",".so"}
FORBIDDEN_CSS=[r"@import",r"https?://",r"javascript:",r"expression\s*\(",r"behavior\s*:",r"-moz-binding",r"url\s*\(\s*['\"]?//"]
FORBIDDEN_SVG=[r"<script\b",r"<foreignObject\b",r"\son[a-z]+\s*=",r"https?://",r"javascript:",r"data:text/html"]

def sha256(path:Path)->str:
    h=hashlib.sha256();
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(65536),b''): h.update(chunk)
    return h.hexdigest()

def validate(folder:Path)->dict:
    errors=[];warnings=[];files=[]
    manifest_path=folder/'manifest.json'
    if not manifest_path.exists():
        return {"valid":False,"errors":["Falta manifest.json"],"warnings":[],"files":[]}
    try: manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    except Exception as exc:
        return {"valid":False,"errors":[f"manifest.json inválido: {exc}"],"warnings":[],"files":[]}
    missing=sorted(REQUIRED-set(manifest))
    if missing: errors.append("Faltan campos: "+", ".join(missing))
    if manifest.get('schemaVersion')!=1: errors.append('schemaVersion debe ser 1')
    if not re.fullmatch(r'[a-z][a-z0-9-]{1,39}',str(manifest.get('id',''))): errors.append('id no válido')
    if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?',str(manifest.get('version',''))): errors.append('version no SemVer')
    if manifest.get('engine')!='0.3.x': errors.append('engine debe ser 0.3.x')
    if manifest.get('componentContract')!='0.1.x': errors.append('componentContract debe ser 0.1.x')
    if manifest.get('status') not in ALLOWED_STATUS: errors.append('status no permitido')
    if manifest.get('network')!='forbidden': errors.append('network debe ser forbidden')
    if manifest.get('scripts')!='forbidden': errors.append('scripts debe ser forbidden')
    budget=manifest.get('assetsBudgetKb')
    if not isinstance(budget,(int,float)) or not 1<=budget<=100: errors.append('assetsBudgetKb debe estar entre 1 y 100')
    caps=manifest.get('capabilities',[])
    if not isinstance(caps,list): errors.append('capabilities debe ser una lista')
    else:
        for cap in caps:
            if cap not in ALLOWED_CAP: errors.append(f'Capacidad no permitida: {cap}')
    styles=manifest.get('styles',[])
    if not isinstance(styles,list) or not 1<=len(styles)<=8: errors.append('styles debe contener entre 1 y 8 archivos')
    else:
        for style in styles:
            if not re.fullmatch(r'[a-z0-9-]+\.css',str(style)): errors.append(f'CSS no seguro: {style}')
            elif not (folder/style).exists(): errors.append(f'Falta el CSS declarado: {style}')
    total=0
    for path in sorted(folder.rglob('*')):
        if not path.is_file(): continue
        rel=path.relative_to(folder).as_posix(); ext=path.suffix.lower(); size=path.stat().st_size; total+=size
        files.append({"path":rel,"bytes":size,"sha256":sha256(path)})
        if ext in FORBIDDEN_FILES: errors.append(f'Archivo ejecutable prohibido: {rel}')
        elif ext not in ALLOWED_EXT: errors.append(f'Extensión no permitida: {rel}')
        if ext=='.css':
            text=path.read_text(encoding='utf-8',errors='ignore')
            for pattern in FORBIDDEN_CSS:
                if re.search(pattern,text,re.I): errors.append(f'Patrón CSS prohibido en {rel}: {pattern}')
        if ext=='.svg':
            text=path.read_text(encoding='utf-8',errors='ignore')
            for pattern in FORBIDDEN_SVG:
                if re.search(pattern,text,re.I): errors.append(f'Patrón SVG prohibido en {rel}: {pattern}')
    if isinstance(budget,(int,float)) and total>budget*1024: errors.append(f'Presupuesto excedido: {total/1024:.1f} KB > {budget} KB')
    if manifest.get('status')=='community' and manifest.get('fallback') is True: errors.append('Una creación comunitaria no puede ser fallback')
    return {"valid":not errors,"materialId":manifest.get('id'),"contractVersion":"0.2.0","totalBytes":total,"budgetKb":budget,"errors":errors,"warnings":warnings,"files":files}

def main()->int:
    ap=argparse.ArgumentParser();ap.add_argument('folder',type=Path);ap.add_argument('--report',type=Path)
    args=ap.parse_args();report=validate(args.folder.resolve())
    payload=json.dumps(report,ensure_ascii=False,indent=2)
    print(payload)
    if args.report: args.report.write_text(payload+'\n',encoding='utf-8')
    return 0 if report['valid'] else 1

if __name__=='__main__': raise SystemExit(main())
