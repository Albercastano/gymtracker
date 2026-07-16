# PHX Forge Foundation 0.1

**Build:** Phoenix 11 Alpha · Build 018  
**Base auditada:** Build 017 · Apex Visibility Hotfix  
**Modo:** Foundation — sin reconstrucción visual todavía

Build 018 introduce la primera arquitectura funcional para separar **núcleo**, **forma** y **material** sin modificar el comportamiento ni la composición visible heredada de Build 017.

## Capas añadidas

- **Shape Contract 0.1:** limita pantallas, componentes, slots, variantes, tamaños y requisitos mínimos.
- **Forge Action Bus 0.1:** expone acciones semánticas autorizadas y rechaza cualquier acción no registrada.
- **Forge View Model 0.1:** genera un snapshot inmutable y filtrado de la Home.
- **Shape Engine 0.1:** carga, valida, certifica y activa formas declarativas.
- **Forge Diagnostics 0.1:** verifica contrato, fallback, enlace con el núcleo y ViewModel.
- **Precision Shape 0.1:** primera forma oficial expresada mediante `shape.json`.

## Modo Foundation

El motor:

1. carga y certifica `shape.json`;
2. mantiene la forma activa por perfil;
3. enlaza el núcleo mediante una referencia privada, sin depender de `window.App`;
4. genera snapshots semánticos;
5. activa Precision automáticamente cuando una forma es inválida o inexistente.

En esta fase **no sustituye el renderer heredado**. La apariencia de Build 017 permanece deliberadamente intacta para aislar el cambio arquitectónico del cambio visual.

## Seguridad

- Las formas no ejecutan JavaScript.
- Solo pueden declarar componentes incluidos en el contrato.
- Las acciones se limitan a una lista autorizada.
- Una acción desconocida se rechaza antes de llegar al núcleo.
- Precision es fallback obligatorio.
- La red externa continúa bloqueada.
- Las formas no reciben acceso directo a almacenamiento, perfiles, PEDB ni historial.

## Compatibilidad de datos

No cambian las claves históricas:

- `gymtracker_phoenix_v8`
- `gymtracker_phoenix_v8_profile_<id>`
- `gymtracker_phoenix_v8_active`
- `gymtracker_phoenix_v8_active_profile_<id>`
- `gymtracker_phoenix_profiles_v1`
- `gymtracker_phoenix_active_profile_v1`

Se añaden de forma no destructiva dentro de `settings`:

- `uiShape`
- `uiInstruments`
- `uiCalibration`

## Validación ejecutada

- Sintaxis de 16 archivos JavaScript.
- Lectura de 50 archivos JSON.
- Esquema JSON de la forma Precision.
- Integridad de referencias HTML y caché PWA.
- 1.200 ejercicios y 21.522 relaciones PEDB.
- IDs y relaciones sin duplicados ni referencias rotas.
- Bundle PEDB offline coherente con los JSON.
- Harness Chromium a 360×740, 390×844, 430×932 y 844×390.
- Fallback a Precision ante forma inexistente.
- Rechazo de una forma incompleta.
- Acción semántica `open-data` enlazada al núcleo.
- Rechazo de una acción no autorizada.
- Sin desbordamiento horizontal en el harness.

## Límites de la validación

El entorno bloquea la navegación por `localhost` y `file://`. El harness carga los scripts y estilos reales mediante `page.set_content` y simula únicamente servicios que requieren un origen persistente.

No se ha validado todavía:

- instalación desde una URL publicada;
- ejecución real del service worker;
- actualización de la PWA instalada;
- persistencia IndexedDB en Android;
- uso físico en el móvil.

## Siguiente fase

Build 019 deberá migrar la **Home Precision** al renderer declarativo sin cambiar su aspecto. Solo después de demostrar equivalencia funcional comenzará Vector Apex.
