# PHX APEX UI COMPLETION 1.0

**Build:** Phoenix 11 Alpha · Build 013  
**Material:** FORGED Apex 0.6 Alpha

## Objetivo

Cerrar la homogeneidad visual del material Apex sin modificar la lógica de entrenamiento ni los datos. El material usa un contrato único para estados, métricas, gráficas, superficies densas, responsive y accesibilidad.

## Semántica de color

- Cian: información, navegación y volumen.
- Azul: carga externa.
- Verde: mejora, fuerza relativa y éxito.
- Rojo: peso corporal como señal de seguimiento, alertas y peligro.
- Blanco: valor principal.

## Estados obligatorios

Normal, pulsado, seleccionado, foco, desactivado, cargando, éxito, aviso, error y vacío.

## Movimiento

La entrada de pantalla es inferior a 220 ms. `prefers-reduced-motion` desactiva todo movimiento no esencial.

## Responsive

Se validan 360, 390 y 430 px, pantalla baja y apaisado. Métricas y cifras usan numeración tabular, no invaden etiquetas y nunca deben provocar desplazamiento horizontal.
