# PEDB · Contrato de datos v1

## Regla principal
Los identificadores `PEX`, `PMU`, `PZN`, `PEQ`, `PPT`, `PET` y `PRL` son permanentes.

## HTML/PWA
- Fuente maestra: JSON modular.
- Persistencia de ejecución: IndexedDB.
- La interfaz nunca carga todas las relaciones en pantalla.
- Las consultas se hacen por `source_id` y categoría.

## Flutter
- Se conservarán exactamente los mismos JSON e IDs.
- La importación inicial podrá dirigirse a Isar o SQLite.
- Las rutinas guardarán `exercise_id` y `exercise_name_snapshot`.

## Datos del usuario
Favoritos, recientes, rutinas e historial no se guardan dentro de PEDB.
PEDB es sustituible y versionado; los datos personales no.
