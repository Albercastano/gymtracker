# FORGED Apex · Phase 4 · PEDB 3.4

Build 011 integra PEDB 3.4.0 y adapta la biblioteca a un catálogo de 1.200 ejercicios.

## Cambios

- 1.200 ejercicios oficiales y 21.522 relaciones locales.
- Renderizado progresivo de 60 en 60 para evitar bloquear móviles.
- Contador real de resultados.
- Filtros rápidos: todos, casa, gimnasio, peso corporal y máquinas.
- Búsqueda sobre nombre, sinónimos, etiquetas, material, grupo y nivel.
- Fichas Apex con patrón, entorno y nivel.
- Datos personales y ejercicios `USR-EX` preservados durante la migración.

## Integridad

El archivo de origen declara 1.200 ejercicios y supera su validación. La integración repite las comprobaciones de IDs, nombres normalizados, relaciones y referencias de catálogos.
