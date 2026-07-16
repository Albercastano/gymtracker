# PHX APEX BETA FREEZE 1.0

**Build:** Phoenix 11 Alpha · Build 016  
**Material:** FORGED Apex 1.0 Beta  
**PEDB:** 3.4 · 1.200 ejercicios · 21.522 relaciones

## Cierre

Build 016 integra en una sola entrega las etapas previstas como Quality Gate, Architecture Cleanup y Beta Freeze.

- Material Apex consolidado en un único CSS certificado.
- Foundry permanece retirado.
- Precision permanece como fallback.
- Perfiles nuevos arrancan en Apex; perfiles existentes conservan su elección.
- Estados de interacción, foco, carga, error, éxito y vacío cubiertos.
- Gráficas y rangos temporales conservados.
- Timer Apex 1.0 conservado.
- Modalidad, foco, teclado, Escape y mensajes accesibles reforzados.
- Actualización PWA no fuerza una recarga inmediata: solicita confirmación.
- Tokens y reglas documentados para HTML/PWA y futura migración a Flutter.

## Límite de la validación

La validación automatizada se ejecuta con Chromium mediante un documento inline y almacenamiento simulado porque la política administrativa del entorno bloquea navegar a localhost y `file://`. La prueba física de audio, vibración, instalación y actualización debe realizarse en el dispositivo Android.
