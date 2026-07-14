# Seguridad Alpha

- Local-first permanente.
- `PhoenixNetworkGate` permite solo lecturas GET de recursos estáticos locales.
- Las conexiones externas y las escrituras por red quedan bloqueadas.
- `PhoenixSync` usa `NoSyncProvider`; Phoenix Vault no está habilitado.
- Los materiales no contienen JavaScript y no reciben datos de usuario.
- CSP bloquea objetos, marcos, bases externas y conexiones fuera del mismo origen.
- Precision es el fallback obligatorio si un material falla.

La puerta premium futura existirá mediante un proveedor de sincronización explícito, auditable y desactivado por defecto.
