# Instrucciones para GymTracker · Desarrollo

Integra esta carpeta como módulo PEDB local.

## Ahora, en HTML/PWA
- Usa `PEDB_LOADER.install()` para importar la biblioteca a IndexedDB.
- Conecta el buscador existente con el almacén `exercises`.
- En alternativas, consulta `PEDB_DB.getRelations(exerciseId, category)`.
- Muestra primero `recommended=true`.
- El botón «Ver más» muestra el resto.
- No modifiques Home, GYM, Casio ni DATOS fuera de la conexión imprescindible.

## Más adelante, en Flutter
Seguir `MIGRACION_A_FLUTTER.md`. No crear un segundo esquema.
