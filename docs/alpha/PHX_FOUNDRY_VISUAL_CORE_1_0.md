# PHX Foundry Visual Core 1.0

**Build:** Phoenix 11 Alpha · Build 006  
**Estado:** laboratorio visual, acumulativo y seleccionable.

## Objetivo

Foundry deja de ser Precision con una capa industrial. Este núcleo define componentes con construcción visual propia: masa, bisel, profundidad, encajes, pulsación física y jerarquía material.

## Componentes certificados en esta fase

1. Botón primario mecanizado.
2. Botón secundario mecanizado.
3. Tarjeta/placa estructural.
4. Panel de decisión.
5. Métrica metálica.
6. Phoenix Timer.
7. Fila de rutina.
8. Ficha PEDB.

## Reglas

- 70 % superficies sobrias.
- 20 % estructura industrial.
- 10 % instrumentos heroicos.
- Tornillos solo en piezas estructurales.
- Sin texturas rasterizadas pesadas.
- Sin JavaScript, red ni acceso a datos desde el material.
- Precision permanece como fallback seguro.

## Implementación

El núcleo está en `themes/foundry/visual-core.css`. Usa únicamente CSS local y componentes semánticos `phx-*`.
