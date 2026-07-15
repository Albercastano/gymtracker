# PHX Component Architecture 0.1

**Build:** Phoenix 11 Alpha · Build 004  
**Skin Engine:** 0.3  
**Material Contract:** 0.2  
**Component Contract:** 0.1

## Propósito

Separar definitivamente la apariencia de las pantallas y de la lógica. Un material no diseña `Home`, `Historial` o `Rutinas`: diseña componentes semánticos reutilizables.

## Componentes oficiales

- `phx-button` · primary, secondary, danger, neutral, material y profile.
- `phx-surface` · card, panel, rail e inset.
- `phx-input` · text, select, textarea y toggle.
- `phx-chip` · neutral, active, success, warning y danger.
- `phx-metric` · standard y hero.
- `phx-progress` · standard, success y warning.
- `phx-label` · eyebrow y caption.
- `phx-timer` · instrumento protagonista.

## Runtime de transición

`component-runtime.js` reconoce componentes heredados, añade las clases semánticas y observa nuevos nodos creados por la aplicación. No lee datos, no usa red y no ejecuta código procedente de materiales.

## Regla para Phoenix Forge

Una Creación de la Forja debe estilizar clases `phx-*`. Queda prohibido depender de IDs de pantalla, datos del usuario o estructura interna de un módulo.

## Compatibilidad

Los selectores históricos permanecen como puente durante la Alpha. Se retirarán cuando la cobertura semántica sea suficiente y las pruebas reales confirmen que no existe regresión.
