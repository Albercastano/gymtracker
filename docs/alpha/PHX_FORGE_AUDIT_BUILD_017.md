# PHOENIX FORGE · AUDITORÍA TÉCNICA DE BUILD 017

**Proyecto:** GymTracker Phoenix / Phoenix Forge  
**Base inspeccionada:** `GymTracker_Phoenix_11_Alpha_Build_017_APEX_VISIBILITY_HOTFIX(1).zip`  
**Build interna verificada:** Phoenix 11 Alpha · Build 017 · Apex Visibility Hotfix  
**SHA-256 del ZIP:** `22a5d66703b19d9a95be907ba7cb239d1e933ca4e30bca778526d2448f5b41e7`  
**Estado de esta fase:** auditoría únicamente; no se han modificado datos, lógica ni archivos de la build.

---

## 1. Verificación de la base

La numeración interna coincide en:

- `index.html`;
- `manifest.webmanifest`;
- `sw.js`;
- `app.js`;
- `README_PHOENIX_11_ALPHA_BUILD_017.txt`.

La Build 017 es una base válida para iniciar el Forge Shape Engine.

### PEDB verificada

- **1.200 ejercicios oficiales**.
- **21.522 relaciones**.
- **0 IDs de ejercicio duplicados**.
- **0 referencias rotas detectadas en las relaciones**.
- PEDB 3.4 integrada en JSON y paquete offline.

### Tamaño actual

- ZIP: aproximadamente **4,0 MB**.
- Descomprimida: aproximadamente **12,1 MB**.
- `app.js`: **227 KB**, 3.769 líneas.
- `styles.css`: **166 KB**.
- `themes/apex/apex.css`: **90 KB**.
- `js/pedb-bundle.js`: **3,9 MB**.

---

## 2. Arquitectura real encontrada

La aplicación funciona actualmente así:

```text
DATOS + LÓGICA + NAVEGACIÓN + HTML GENERADO
                    │
                    ▼
               app.js monolítico
                    │
                    ▼
          DOM fijo + innerHTML dinámico
                    │
                    ▼
        Precision / Apex mediante CSS
```

### Evidencias de acoplamiento

- Un único objeto global `App` concentra aproximadamente **239 métodos**.
- Hay **34 asignaciones directas a `innerHTML`**.
- Hay **203 accesos mediante `document.getElementById`**.
- El HTML está ligado a acciones globales mediante:
  - **63 `onclick` estáticos** en `index.html`;
  - aproximadamente **140 `onclick` generados** desde `app.js`.
- Los renderizadores de Home, entrenamiento, Timer, Datos, rutinas, historial y ajustes construyen directamente su HTML dentro de la lógica funcional.
- Se usan cientos de clases concretas de pantalla, por lo que el CSS conoce la estructura exacta del HTML.

### Conclusión

**Phoenix todavía no posee un motor de formas.**

El sistema actual puede cambiar materiales, pero no puede modificar de forma segura la composición real de las pantallas.

Esto explica por qué Apex terminó siendo visualmente una recoloración de Precision.

---

## 3. Qué existe ya y se puede aprovechar

### Material Engine

El motor actual ya aporta una base útil:

- registro de materiales;
- manifiestos;
- validación de contrato;
- carga de estilos;
- fallback a Precision;
- selección guardada por perfil;
- bloqueo de materiales no certificados.

Pero su alcance es exclusivamente visual:

```text
material = CSS + tokens + componentes estilizados
```

No entiende:

- slots;
- orden de componentes;
- tamaños de módulos;
- composición de pantalla;
- renderizadores alternativos;
- instrumentos intercambiables.

### Component Contract y Component Runtime

Existen `component-contract.js` y `component-runtime.js`, pero actualmente:

- clasifican el DOM después de que ya haya sido creado;
- detectan elementos mediante selectores CSS;
- añaden clases semánticas sobre estructuras heredadas;
- no generan componentes;
- no exponen datos;
- no separan acciones y presentación.

Por tanto, son una **capa de etiquetado**, no todavía una Forge Component API.

### Precision

Precision puede conservarse como:

- renderer de referencia;
- fallback seguro;
- interfaz estable;
- prueba de que el nuevo motor no altera el funcionamiento actual.

### Persistencia por perfil

La elección visual ya se guarda dentro de cada perfil. Las claves actuales son:

- `gymtracker_phoenix_v8`;
- `gymtracker_phoenix_v8_profile_<perfil>`;
- `gymtracker_phoenix_v8_active`;
- `gymtracker_phoenix_v8_active_profile_<perfil>`;
- `gymtracker_phoenix_profiles_v1`;
- `gymtracker_phoenix_active_profile_v1`.

Estas claves deben conservarse.

---

## 4. Obstáculos para La Forja

### 4.1 Lógica y presentación mezcladas

Los métodos `renderHome`, `renderGym`, `renderRest`, `renderData` y el resto calculan datos y producen HTML en la misma función.

Antes de permitir formas alternativas hay que separar:

```text
calcular estado → crear ViewModel → renderizar forma
```

### 4.2 Acciones incrustadas en el HTML

Las interfaces llaman directamente a `App.*` mediante `onclick`.

Una creación pública no debe conocer ni invocar métodos internos. Necesita un bus limitado de acciones semánticas:

```text
start-workout
save-set
change-weight
change-reps
pause-timer
skip-rest
open-data
finish-workout
```

### 4.3 El Component Runtime es heurístico

Actualmente decide que algo es una tarjeta o un botón observando clases ya existentes. La Forja necesita lo contrario:

```text
componente semántico → variante → DOM autorizado
```

### 4.4 CSP todavía permite código inline

La política actual contiene:

```text
style-src 'self' 'unsafe-inline'
script-src 'self' 'unsafe-inline'
```

Esto es comprensible por los manejadores actuales, pero no es suficiente para un futuro catálogo de creaciones de terceros.

No debe endurecerse de golpe porque rompería la aplicación actual. Se eliminará progresivamente al sustituir los `onclick` por eventos delegados.

### 4.5 Apex se precarga de forma estática

Build 017 fuerza Apex en el primer pintado para resolver una incidencia de caché. Antes de introducir Shape Engine habrá que separar dos elecciones:

- `uiShape`;
- `uiMaterial`.

No conviene seguir usando `uiMaterial` como sinónimo de interfaz completa.

---

## 5. Arquitectura objetivo aprobada

```text
PHOENIX CORE
Datos · perfiles · entrenamiento · PEDB · historial · Timer
                          │
                          ▼
FORGE VIEW MODEL API
Snapshots filtrados y estables por pantalla
                          │
                          ▼
FORGE ACTION BUS
Acciones semánticas autorizadas
                          │
                          ▼
SHAPE ENGINE
Slots · orden · tamaño · composición · responsive
                          │
                          ▼
INSTRUMENT ENGINE
Timer · métricas · series · controles · gráficas
                          │
                          ▼
MATERIAL ENGINE
Color · tipografía · superficies · movimiento
                          │
                          ▼
PRECISION / VECTOR APEX / CREACIONES DEL USUARIO
```

---

## 6. Estructura de carpetas propuesta

```text
forge/
├── core/
│   ├── forge-component-api.js
│   ├── forge-action-bus.js
│   ├── forge-view-model.js
│   ├── forge-diagnostics.js
│   └── forge-fallback.js
├── contracts/
│   ├── shape-contract.js
│   ├── instrument-contract.js
│   ├── forge-package-contract.js
│   └── schemas/
│       ├── shape.schema.json
│       ├── instruments.schema.json
│       └── package.schema.json
├── engine/
│   ├── shape-engine.js
│   ├── instrument-engine.js
│   ├── slot-renderer.js
│   └── responsive-resolver.js
├── shapes/
│   ├── precision/
│   │   ├── manifest.json
│   │   └── shape.json
│   └── vector/
│       ├── manifest.json
│       └── shape.json
├── instruments/
│   ├── timers/
│   ├── metrics/
│   ├── set-controls/
│   └── charts/
└── lab/
    ├── forge-lab-controller.js
    └── forge-preview.js
```

---

## 7. Contrato inicial de `shape.json`

Ejemplo conceptual:

```json
{
  "schemaVersion": 1,
  "id": "precision",
  "name": "Precision",
  "engine": "1.x",
  "screens": {
    "home": {
      "layout": "stack",
      "slots": [
        {
          "id": "hero",
          "component": "workout-today",
          "variant": "precision-hero",
          "order": 10,
          "span": 12,
          "required": true
        },
        {
          "id": "gym-action",
          "component": "start-workout-action",
          "variant": "precision-king",
          "order": 20,
          "span": 6,
          "required": true
        },
        {
          "id": "data-action",
          "component": "open-data-action",
          "variant": "precision-secondary",
          "order": 30,
          "span": 6,
          "required": true
        },
        {
          "id": "weekly-metrics",
          "component": "weekly-progress",
          "variant": "precision-cards",
          "order": 40,
          "span": 12
        }
      ]
    }
  },
  "responsive": {
    "360": {"columns": 4, "gap": 12},
    "390": {"columns": 4, "gap": 14},
    "430": {"columns": 4, "gap": 16}
  }
}
```

### Restricciones obligatorias

- Solo componentes registrados.
- Ningún JavaScript del creador.
- Acciones esenciales marcadas como `required`.
- Tamaño táctil mínimo.
- Límites de columnas y posiciones.
- Sin valores CSS arbitrarios en el JSON.
- Variantes tomadas de listas aprobadas.
- Fallback si el contrato no es válido.

---

## 8. Fallback a Precision

Secuencia prevista:

1. Leer la forma seleccionada por el perfil.
2. Validar manifiesto y `shape.json`.
3. Verificar componentes obligatorios.
4. Verificar compatibilidad con la versión de Phoenix.
5. Resolver responsive.
6. Intentar renderizado en un contenedor aislado.
7. Confirmar que existe salida, navegación y acción principal.
8. Montar en pantalla.

Si falla cualquier paso:

1. descartar el DOM incompleto;
2. registrar diagnóstico local;
3. cargar Precision;
4. mantener datos y entrenamiento activo;
5. mostrar un aviso no bloqueante.

Precision no podrá desinstalarse ni ser reemplazada como fallback.

---

## 9. Estrategia de migración sin regresiones

No debe reescribirse todo `app.js` de una vez.

### Patrón de migración

Para cada pantalla:

```text
1. Extraer cálculo de datos.
2. Crear ViewModel estable.
3. Mantener temporalmente el render heredado.
4. Renderizar Precision desde el Shape Engine.
5. Comparar resultado y flujo.
6. Eliminar el render heredado solo tras validación.
7. Añadir Vector sobre el mismo ViewModel.
```

### Primera pantalla

La Home es la candidata correcta porque:

- tiene datos representativos;
- no modifica series directamente;
- permite probar orden, slots y tamaños;
- permite comparar Precision y Vector;
- el riesgo de pérdida de datos es bajo.

El Timer y el registro de series no deben migrarse hasta que el motor haya probado estabilidad en Home y Datos.

---

## 10. Plan de builds

### Build 018 · Forge Foundation

Sin cambios visuales intencionados.

- Forge Component API inicial.
- Action Bus seguro.
- ViewModel de Home.
- Shape Contract y validador.
- Registro de formas.
- Diagnóstico y fallback.
- Claves nuevas no destructivas:
  - `uiShape`;
  - `uiMaterial`;
  - `uiInstruments`;
  - `uiCalibration`.
- Precision sigue funcionando con el render actual mientras se conecta el motor.

### Build 019 · Precision Home sobre Shape Engine

- Home Precision definida por `shape.json`.
- Slots reordenables en Forge Lab.
- Guardado por perfil.
- Restauración de composición.
- Sin Vector todavía.

### Build 020 · Precision Core Screens

- Entrenamiento.
- Timer.
- Datos.
- Resumen final.
- Verificación de igualdad funcional con la interfaz anterior.

### Build 021 · Vector Apex Functional

- Home Vector.
- Entrenamiento Vector.
- Timer Vector.
- Datos Vector.
- Resumen Vector.
- Cambio Precision ↔ Vector usando el mismo núcleo.

### Build 022 · Forge Lab Editor

- mover módulos;
- cambiar tamaño;
- cambiar orden;
- elegir instrumentos;
- cambiar material;
- previsualizar;
- guardar y duplicar.

### Build 023 · Paquetes `.phxskin`

- exportación;
- importación;
- checksum;
- compatibilidad;
- validación;
- instalación;
- desinstalación;
- fallback.

---

## 11. Riesgos principales

### Riesgo alto

Intentar migrar todas las pantallas en una única build.

**Respuesta:** migración pantalla por pantalla y doble renderer temporal.

### Riesgo alto

Permitir HTML o JavaScript arbitrario en las creaciones.

**Respuesta:** JSON declarativo, componentes registrados y Action Bus.

### Riesgo medio

Romper una sesión activa al cambiar de forma.

**Respuesta:** persistencia previa, Timer basado en timestamp y cambio diferido durante acciones críticas.

### Riesgo medio

Duplicar CSS y aumentar mucho el peso.

**Respuesta:** componentes comunes, carga bajo demanda y presupuestos por forma/material.

### Riesgo medio

Confundir forma y material.

**Respuesta:** claves, contratos y selectores independientes.

---

## 12. Decisión técnica

Build 017 es una base válida, pero **no debe transformarse directamente en Vector mediante más CSS**.

La ruta correcta es:

> Construir primero Forge Foundation, migrar Precision al motor y utilizar Vector Apex como prueba de que Phoenix puede cambiar realmente de forma.

Esto preserva:

- datos;
- perfiles;
- rutinas;
- historial;
- PEDB;
- entrenamiento activo;
- compatibilidad PWA;
- futura migración a Flutter.

---

## 13. Resultado de la auditoría

**Fase 0 completada.**

No se han encontrado impedimentos técnicos para construir La Forja en HTML/PWA.

La limitación actual no es el navegador. Es el acoplamiento entre el estado y el HTML. Ese acoplamiento puede desmontarse gradualmente sin rehacer el núcleo ni perder datos.

El siguiente entregable correcto es **Build 018 · Forge Foundation**.
