GYMTRACKER PHOENIX 11 ALPHA · BUILD 018
PHOENIX FORGE · FOUNDATION 0.1

Objetivo de esta build:
- Iniciar la separación real entre núcleo, forma y material.
- Mantener intacta la apariencia y funcionamiento de Build 017.
- Preparar Phoenix para formas alternativas y futuras creaciones de La Forja.

Añadido:
- Forge Shape Contract 0.1.
- Forge Action Bus 0.1 con acciones autorizadas.
- Forge View Model 0.1 para Home.
- Shape Engine 0.1 en modo Foundation.
- Forma Precision declarada mediante shape.json.
- Diagnóstico visible en Forge Lab.
- Fallback permanente a Precision.
- Nuevas preferencias no destructivas por perfil: uiShape, uiInstruments y uiCalibration.

Conservado:
- Material Precision.
- Material Apex de Build 017, sin cambios visuales.
- Claves históricas de almacenamiento.
- Perfiles, rutinas, historial, peso y entrenamiento activo.
- PEDB 3.4: 1.200 ejercicios y 21.522 relaciones.

Importante:
- Build 018 todavía no reorganiza la Home.
- El Shape Engine observa, valida y genera ViewModels, pero el render heredado sigue activo.
- La migración visual de Precision comienza en Build 019.

Validación incluida:
- tools/test_build_018.py
- tools/browser_harness_build_018.py
- docs/alpha/VALIDATION_BUILD_018.json

Límite de validación:
- No se ha ejecutado una instalación PWA publicada ni una prueba física en Android.
