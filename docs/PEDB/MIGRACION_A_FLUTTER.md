# Migración futura a Flutter

1. Copiar `/data/pedb/` a `assets/data/pedb/`.
2. Declarar los archivos en `pubspec.yaml`.
3. Leer `manifest.json`.
4. Comparar `schema_version` y `version`.
5. Importar entidades y relaciones a Isar o SQLite.
6. Crear índices por nombre, músculo, zona, categoría y `source_id`.
7. Mantener los IDs sin transformarlos.
8. Conservar en las rutinas una copia visible del nombre.

No se requiere transformar el contenido manualmente.
