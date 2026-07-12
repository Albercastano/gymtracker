GYMTRACKER PHOENIX · LAB 9.6 · GYM FLOW FORGED

Base: GymTracker Lab 9.5 Phoenix Cards.

IMPLEMENTADO
- PHX-EXERCISE-001: cabecera FORGED con ejercicio, posición, progreso, reps y descanso.
- PHX-ALT-001: alternativas funcionales por Máquina ocupada, En casa y Otra zona.
- Máximo 3 alternativas y retorno inmediato al flujo.
- Sustitución guardada solo en el entrenamiento activo; la rutina original no se modifica.
- Historial e informe final muestran ejercicio original, alternativa y motivo.
- PHX-CASIO-001: temporizador FORGED con -30, pausa/reanudar y +30.
- Estados visuales normal, últimos 10 segundos, pausa y finalizado.
- Persistencia del descanso pausado al bloquear o reabrir la app.

NO MODIFICADO
- Claves localStorage existentes.
- Modelo base de rutinas y sesiones.
- Registro serie a serie.
- Importación y backup JSON existentes.

PRUEBAS RECOMENDADAS
1. Iniciar un entrenamiento y elegir una alternativa.
2. Cerrar/reabrir durante la serie y durante un descanso pausado.
3. Completar el entrenamiento y revisar historial e informe final.
4. Iniciar una sesión nueva y confirmar que reaparece el ejercicio original.
