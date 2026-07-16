# FORGED APEX · DESIGN SYSTEM 1.0

**Estado:** Estable Freeze  
**Material:** `apex`  
**Versión:** `1.0.0`  
**Fallback:** FORGED Precision

## Identidad

Apex es la interfaz ultratecnológica de Phoenix: negro absoluto, líneas finas, números redondeados y color exclusivamente informativo. No utiliza imágenes decorativas, fuentes externas, scripts propios ni red.

## Color semántico

- Fondo absoluto: `#000000`.
- Superficie: `#010507` / `#020A0E`.
- Texto principal: blanco frío.
- Cian: navegación, información y foco.
- Verde: progreso, guardado y finalización.
- Rojo: peligro, error y últimos segundos.
- Ámbar: atención no destructiva.

Nunca se comunica un estado únicamente mediante color: siempre se combina con texto, icono, forma o posición.

## Tipografía y números

- Fuente local del sistema; no se descarga tipografía.
- Números críticos con `font-variant-numeric: tabular-nums`.
- Etiquetas breves, mayúsculas y espaciado controlado.
- Métricas prioritarias por encima del texto explicativo.

## Componentes congelados

- Botón primario y secundario.
- Acción destructiva.
- Tarjeta y tarjeta interactiva.
- Métrica y gráfico.
- Campo, selector, checkbox y switch.
- Chip y estado.
- Sheet, diálogo y confirmación.
- Biblioteca PEDB.
- Pantalla de serie y resumen.
- Phoenix Timer Apex 1.0.
- Toast y aviso de actualización PWA.

## Movimiento

- Respuesta táctil: 80–160 ms.
- Entrada de pantalla: hasta 220 ms.
- Ninguna animación bloquea una acción.
- `prefers-reduced-motion` elimina el movimiento no esencial.

## Accesibilidad

- Foco visible cian.
- Diálogos con rol, modalidad, foco inicial y ciclo de Tab.
- Escape cierra la capa superior.
- Pantallas inactivas quedan fuera del árbol accesible.
- Mensajes con `role=status` y `aria-live=polite`.
- Áreas táctiles de al menos 44 px.

## Responsive

Base móvil: 360–430 px. El Timer tiene reglas específicas para vertical, pantalla baja y apaisado. No se permiten desbordamientos horizontales en contenido principal.

## Contrato técnico

El paquete visual se distribuye como `themes/apex/apex.css`. El manifiesto prohíbe scripts y red. Los datos y la lógica permanecen en el núcleo de Phoenix. La futura versión Flutter debe reutilizar los mismos nombres semánticos y valores de color, espacio, tipografía, movimiento y estado.

## Regla de congelación

Desde Build 016 no se añaden cambios estéticos improvisados a Apex. Cualquier evolución requiere una nueva versión documentada del sistema, con validación visual, accesibilidad y presupuesto de tamaño.
