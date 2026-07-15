GYMTRACKER PHOENIX 11 ALPHA · BUILD 004
PHX COMPONENT ARCHITECTURE 0.1

OBJETIVO
Foundry deja de depender exclusivamente de estilos por pantalla. La interfaz se clasifica en componentes semánticos PHX reutilizables.

NUEVO
- PHX Skin Engine 0.3.
- PHX Material Contract 0.2.
- PHX Component Contract 0.1.
- Runtime visual que etiqueta botones, superficies, paneles, entradas, chips, métricas y progreso.
- MutationObserver para clasificar componentes renderizados dinámicamente.
- Forge Lab muestra cobertura y versión del runtime.
- Precision y Foundry usan la misma estructura funcional.
- Las skins siguen sin JavaScript, red ni acceso a datos.

ARCHIVOS CLAVE
- themes/component-contract.js
- themes/component-runtime.js
- docs/alpha/PHX_COMPONENT_ARCHITECTURE_0_1.md

NOTA
Los selectores antiguos se conservan temporalmente como puente de compatibilidad. Nuevos materiales deben apuntar a clases phx-* y nunca a pantallas concretas.
