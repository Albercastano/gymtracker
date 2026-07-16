# PHX Precision Home Renderer 0.2

**Build:** Phoenix 11 Alpha · Build 019  
**Base:** Build 018 · Forge Foundation 0.1

Build 019 convierte la Home de Phoenix en la primera pantalla producida por el sistema declarativo de La Forja.

## Flujo activo

```text
Phoenix Core
  → Forge ViewModel Home
  → Precision shape.json
  → Home Renderer 0.2
  → Forge Action Bus
```

## Cambios técnicos

- `shape.json` incorpora regiones seguras para agrupar componentes.
- La Home se compone desde slots y regiones declarativas.
- Los componentes solo reciben datos filtrados por el ViewModel.
- Los botones emiten acciones semánticas a través del Action Bus.
- El renderer no accede a `localStorage`, IndexedDB, PEDB ni perfiles.
- Si el render declarativo falla, Phoenix ejecuta el renderer heredado de Home.

## Regiones Precision

- Marca.
- Avisos de almacenamiento.
- Entrenamiento del día.
- Acciones GYM y DATOS.
- Métricas de siete días.
- Último entrenamiento.

## Equivalencia visual

La estructura generada conserva las clases CSS de Build 018 para que Precision y Apex mantengan su aspecto actual. La diferencia es arquitectónica: el orden y la agrupación ya proceden del contrato de forma.

## Seguridad

- No se admite HTML libre desde `shape.json`.
- No se admite JavaScript de una forma.
- Los componentes y variantes de región están en listas autorizadas.
- Las acciones desconocidas son rechazadas.
- Precision sigue siendo fallback obligatorio.

## Alcance pendiente

- Gym.
- Registro de series.
- Timer.
- Datos.
- Resumen final.
- Editor visual Forge Lab.
- Primera forma Vector.
