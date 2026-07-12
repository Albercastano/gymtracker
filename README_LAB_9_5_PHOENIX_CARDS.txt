GYMTRACKER LAB 9.5 · PHOENIX CARDS

Base: GymTracker Phoenix v8.5.2 WEIGHT BUTTON FIX

OBJETIVO
Integrar PHX-CARD-001 · Tarjeta FORGED en la Home sin alterar lógica de entrenamientos, temporizador Casio, datos, navegación ni backups.

INTEGRACIÓN
- Highlight: tarjeta Hoy toca y entrenamiento en curso.
- Compact: entrenamientos, volumen y peso corporal.
- Base: último entrenamiento.

CAMBIOS TÉCNICOS
- Nuevo sistema CSS phx-card reutilizable.
- Home renderizada con las tres variantes.
- Métricas derivadas de datos locales existentes.
- Cache PWA incrementada para evitar cargar estilos anteriores.

NO MODIFICADO
- Flujo GYM.
- Registro de series.
- Temporizador y descansos.
- Modelo de datos y claves localStorage.
- Importación/exportación y backups.
