# PHX Skin Engine 0.1 · Alpha Build 001

## Objetivo
Separar la lógica de entrenamiento de los materiales visuales.

## Contrato
Cada material contiene exclusivamente `manifest.json` y hojas CSS locales. No puede incluir JavaScript, HTML remoto ni conexiones.

## Materiales incluidos
- `precision`: fallback seguro.
- `foundry`: primera creación Alpha de Phoenix Forge.

## Aplicación
El motor coloca `data-phx-material` en `<html>` y carga las hojas declaradas por el material. Si falla cualquier recurso, vuelve automáticamente a Precision.

## Persistencia
El material se guarda en `settings.uiMaterial` dentro del perfil activo. Los perfiles pueden usar materiales diferentes.

## Presupuesto
- CSS recomendado: < 80 KB.
- SVG local saneado: < 20 KB.
- Sin imágenes raster salvo previsualización opcional.
