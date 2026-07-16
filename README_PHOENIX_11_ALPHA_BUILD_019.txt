GYMTRACKER PHOENIX 11 ALPHA · BUILD 019
PHOENIX FORGE · PRECISION HOME RENDERER 0.2

Objetivo de esta build:
- Migrar la Home de Precision al Forge Shape Engine.
- Conservar su composición y comportamiento visual.
- Demostrar que Phoenix puede renderizar una pantalla desde forma, ViewModel y componentes seguros.

Añadido:
- Home Renderer 0.2 sin acceso directo a datos ni almacenamiento.
- Regiones declarativas en shape.json.
- Componentes Home autorizados y registrados.
- Acciones de Home a través de Forge Action Bus.
- Fallback automático al renderer heredado si el renderer declarativo falla.
- Diagnóstico de renderer dentro de Forge Lab.
- Contrato de forma 0.2 y Shape Engine 0.2.

Conservado:
- Apariencia actual de la Home.
- Material Precision.
- Material Apex de Build 017.
- Claves históricas de almacenamiento.
- Perfiles, rutinas, historial, peso y entrenamiento activo.
- PEDB 3.4: 1.200 ejercicios y 21.522 relaciones.

Importante:
- Solo la Home está migrada al renderer declarativo en Build 019.
- El resto de pantallas continúa usando el renderer heredado.
- Vector todavía no se incorpora.
- Precision sigue siendo fallback obligatorio.

Validación incluida:
- tools/test_build_019.py
- tools/browser_harness_build_019.py
- docs/alpha/VALIDATION_BUILD_019.json

Límite de validación:
- No se ha ejecutado una instalación PWA publicada ni una prueba física en Android.
