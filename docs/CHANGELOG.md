# Build 017 · Apex Visibility Hotfix

- Corregida la actualización bloqueada por cachés PWA antiguas.
- Apex se precarga antes del arranque del motor visual.
- Migración automática de cualquier preferencia `foundry` a `apex`.
- Foundry ausente del registro de materiales y del paquete.
- Añadida recuperación segura `actualizar-apex.html`.

## Phoenix 11 Alpha · Build 016 · Apex Beta Freeze

- FORGED Apex 1.0 Beta congelado y documentado.
- CSS Apex consolidado en un único activo certificado.
- Accesibilidad de pantallas, diálogos, foco, teclado y mensajes reforzada.
- Aviso de actualización PWA antes de aplicar un nuevo Service Worker.
- Apex pasa a ser el material inicial de perfiles nuevos; Precision sigue como fallback.
- PEDB 3.4 conservada: 1.200 ejercicios y 21.522 relaciones.

## Phoenix 11 Alpha · Build 013 · Apex UI Completion

- Homogeneización visual completa de Apex.
- Estados semánticos y accesibilidad.
- Gráficas Apex por métrica.
- Rangos 4S, 3M, 6M y 1A funcionales.
- Responsive y reducción de movimiento reforzados.

## Phoenix 11 Alpha · Build 011 · PEDB 3.4 + Apex Phase 4

- Integra 1.200 ejercicios PEDB 3.4.0 y 21.522 relaciones.
- Corrige los recuentos de catálogos del manifiesto integrado.
- Añade filtros de entorno y renderizado progresivo en Biblioteca.
- Amplía Apex a la experiencia completa del catálogo.
- Conserva ejercicios personales y relaciones del usuario al actualizar.

## Phoenix 11 Alpha · Build 010 · Apex Phase 3

- Apex aplicado al cierre de ejercicio y entrenamiento.
- Informes, récords, progresión y notas en lenguaje visual Apex.
- Transición al siguiente ejercicio rediseñada.
- Alternativas, perfiles, peso, diálogos de seguridad y Easter egg adaptados.
- Manifiesto, versión y caché PWA sincronizados.
- Foundry permanece retirado temporalmente.

## 10.3 · Foundry Phase 3

- Biblioteca, planificación, rutinas, bloques, historial, peso y ajustes adaptados a Foundry.
- Refinado responsive y estados físicos de controles.

## 10.2 · Foundry Phase 2
- Phoenix Timer Foundry completo y responsive.
- Mantiene Precision y toda la lógica intacta.

# 10.0 RC3 · Peso corporal robusto

- Registro de peso reconstruido para móviles con teclado decimal español.
- Acepta coma o punto decimal.
- Botón Guardar visible y fijo antes del historial.
- Confirmación clara y cierre del panel tras guardar.
- Edición y borrado por perfil conservados.
- Ajustes rápidos de ±0,1 kg.
- Peso actual y estadísticas se actualizan inmediatamente.

# 10.0 RC2 · Primer entreno

- Temporizador de descanso FORGED.
- Alternativas PEDB reforzadas y visibles durante la serie.
- Emparejamiento por nombres genéricos y fallback semántico local.

# CHANGELOG

## 10.0 RC1 · FORGED Stable
- Consolidación sobre la última base funcional 9.9.21.
- Cambio de perfil inmediato entre Alberto, Edy, Churri y Chino, sin recargar la aplicación.
- Easter egg Phoenix reforzado para pulsación táctil.
- PHX-BRAND-001: kit de iconos unificado y sin marco claro exterior.
- Peso corporal registrable, editable y eliminable por perfil.
- Migración automática de registros de peso antiguos sin identificador.
- Confirmaciones y entradas críticas mediante paneles FORGED; se eliminan alert, prompt y confirm nativos.
- PEDB 3.0 integrada: 677 ejercicios y 23.811 relaciones.
- Se mantienen las claves de almacenamiento históricas para conservar los datos existentes.

## v8.5.2 Weight Button Fix
- El peso deja de depender del ajustador genérico.
- Botones de subir y bajar peso usan funciones explícitas.
- El botón inferior calcula internamente el paso negativo.
- Paso mínimo garantizado de 0,5 kg.
- Mantiene intacto el importador de rutinas desde texto.
- No cambia la estética.

## 9.8.0
- Integración PEDB 2.0.0 local.
- Buscador y alternativas PEDB.
- Progresión automática MVP confirmable.


## 9.8.2 · PEDB 2.1
- PEDB 2.1.0 integrado.
- Importación CSV de ejercicios personales.
- Generación local de relaciones USR-EX.


## 10.0 RC4
- PHX-TIMER-2.0 implementado.
- Sonido final reforzado mediante AudioContext persistente.
- Guía FORGED v1 incorporada a la fuente.
