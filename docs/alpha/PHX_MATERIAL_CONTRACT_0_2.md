# PHX Material Contract 0.2

**Build:** Phoenix 11 Alpha · Build 004  
**Motor requerido:** PHX Skin Engine `0.3.x`  
**Contrato de componentes requerido:** `0.1.x`

## Cambios frente a 0.1

- Todo material declara `componentContract`.
- Capacidad oficial `component-contract`.
- Los estilos nuevos deben apuntar a componentes semánticos `phx-*`.
- Continúan prohibidos JavaScript, red, HTML ejecutable y recursos remotos.
- Precision continúa siendo el fallback obligatorio.

## Manifest mínimo

```json
{
  "schemaVersion": 1,
  "id": "mi-material",
  "name": "Mi material",
  "author": "Autor",
  "version": "0.1.0",
  "engine": "0.3.x",
  "componentContract": "0.1.x",
  "status": "community",
  "fallback": false,
  "styles": ["tokens.css", "components.css", "timer.css"],
  "assetsBudgetKb": 80,
  "capabilities": ["visual-tokens", "components", "timer", "component-contract"],
  "network": "forbidden",
  "scripts": "forbidden"
}
```
