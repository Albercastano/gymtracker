PHOENIX 11 ALPHA · BUILD 020
WORKOUT INSTRUMENTS 0.1

La pantalla de entrenamiento (gym) ya no depende directamente de app.js.
Recorrido:
Phoenix Core → Workout ViewModel → shape.json → Workout Renderer → Instrument Registry → Forge Action Bus.

Incluye:
- ViewModel filtrado de sesión activa.
- Seis slots declarativos para Precision.
- Primer registro de instrumentos intercambiables.
- Acciones iniciar serie, alternativa y salir mediante Action Bus.
- Fallback automático a renderGymLegacy.
- Mismo aspecto Precision que Build 019.

No migra todavía la pantalla de serie, descanso ni resumen.
