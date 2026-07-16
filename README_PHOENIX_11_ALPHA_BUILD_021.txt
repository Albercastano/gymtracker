# Phoenix 11 Alpha · Build 021

## Set Console Renderer 0.1

Build acumulativa sobre Build 020.

La pantalla de serie activa se genera ahora mediante:
Phoenix Core → Set ViewModel → shape.json → Set Renderer → Instrument Registry → Forge Action Bus.

Mantiene el aspecto Precision y conserva beginSetLegacy() como fallback automático.
Incluye instrumentos intercambiables para cabecera, consola de carga, confirmación, alternativa y retorno.
También corrige el enlace heredado de finish-workout en Forge Action Bus.
