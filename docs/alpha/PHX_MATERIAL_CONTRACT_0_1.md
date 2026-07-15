# PHX MATERIAL CONTRACT 0.1

**Build:** Phoenix 11 Alpha · Build 003  
**Motor:** PHX Skin Engine 0.2  
**Objetivo:** permitir Creaciones de la Forja visuales, ligeras y seguras sin acceso a datos ni red.

## Reglas obligatorias

1. Un material nunca incluye JavaScript, HTML, WASM ni código ejecutable.
2. `network` y `scripts` deben declarar `forbidden`.
3. Los estilos declarados son CSS locales con nombres simples, sin rutas ni `@import`.
4. SVG opcionales se saneán: sin scripts, eventos, `foreignObject` ni recursos externos.
5. Una creación comunitaria nunca puede actuar como fallback.
6. Precision es la reserva segura permanente.
7. Ningún material puede mover acciones críticas ni reducir áreas táctiles o contraste.
8. Presupuesto máximo inicial: 100 KB; recomendado: 80 KB.

## Paquete mínimo

```text
my-material/
├── manifest.json
├── tokens.css
├── components.css
└── timer.css
```

## Validación

```bash
python tools/validate_phx_material.py themes/my-material   --report docs/alpha/my-material-validation.json
```

Un material rechazado no debe registrarse en el motor. En ejecución, Phoenix vuelve a Precision si el manifiesto o un recurso falla.
