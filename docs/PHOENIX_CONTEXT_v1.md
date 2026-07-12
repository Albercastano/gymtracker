# PHOENIX CONTEXT v1

## Estado actual

Versión estable de trabajo: **GymTracker Phoenix v8.5 Stable**

Aplicación HTML/PWA, Android primero, offline y sin publicidad.

## Implementado

- Home con tarjeta «Hoy toca».
- Botones GYM y DATOS en paralelo.
- Número de ejercicios, series y duración estimada.
- Flujo serie → descanso Casio → siguiente serie.
- Guardado después de cada serie.
- Recuperación del entrenamiento activo.
- Transición difuminada al siguiente ejercicio.
- Informe final con todos los ejercicios y series, incluido peso externo 0.
- Biblioteca Phoenix ligera.
- Ejercicios personales, favoritos, recientes y buscador.
- Constructor de rutinas.
- Historial y backups JSON.
- Navegación Inicio / Datos / Rutinas / Ejercicio.
- Control del botón Atrás de Android.
- Zona DATOS restaurada con estética del primer Phoenix.

## Diseño aprobado y bloqueado

- Estética FORGED: negro, grafito y dorado metálico.
- Tipografía grande y alto contraste.
- Home: tarjeta superior + GYM / DATOS paralelos.
- GYM y Casio no se modifican sin aprobación expresa.
- DATOS: tarjetas oscuras compactas, aire y jerarquía clara.
- Logo Phoenix aprobado en Canva.
- Splash de Canva pendiente de integración final.

## Bugs a comprobar en uso real

- Verificar que el informe final muestre todos los ejercicios y series.
- Verificar recuperación tras bloquear y reabrir.
- Verificar Atrás Android en todas las pantallas.
- Verificar que no se dupliquen series al reanudar.
- Verificar backup e importación.

## Backlog inmediato

1. Estabilización y pruebas reales.
2. Integrar Splash aprobado de Canva.
3. Botón Phoenix discreto y circular.
4. Alternativas: máquina ocupada, casa y zona muscular.
5. Phoenix Dial para el peso.
6. Historial editable.
7. Últimos valores usados.
8. Estadísticas esenciales.
9. Motor de progresión inteligente.

## Regla de versiones

Cada ZIP es acumulativo y sustituye al anterior.
No modificar pantallas bloqueadas fuera del objetivo explícito del sprint.
