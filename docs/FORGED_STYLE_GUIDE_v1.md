# GYMTRACKER PHOENIX · FORGED DESIGN SYSTEM v1.0

**Código:** PHX-DS-001  
**Estado:** Fuente visual oficial para HTML/PWA y Flutter  
**Principio:** *Ligera por diseño. Robusta por arquitectura. Útil por encima de todo.*

## 1. Propósito

FORGED no es “negro con dorado”. Es un lenguaje de producto para entrenar: preciso, sobrio, legible bajo esfuerzo y reconocible sin adornos innecesarios.

Todo componente debe superar estas preguntas:

1. ¿Se entiende en menos de un segundo?
2. ¿Puede usarse con una mano?
3. ¿Mantiene legibilidad con sudor, movimiento y poca luz?
4. ¿El efecto visual aporta jerarquía o solo decoración?
5. ¿Se puede implementar igual en HTML y Flutter?

## 2. Principios innegociables

- **Personal First:** la interfaz sirve al usuario, no al sistema.
- **Offline First:** ningún elemento esencial depende de red.
- **Menos toques:** las acciones principales están a un toque.
- **Belleza funcional:** profundidad y materialidad solo para comunicar jerarquía.
- **Claridad bajo esfuerzo:** números, estados y acciones dominan sobre texto explicativo.
- **Movimiento con propósito:** animaciones cortas, con significado y cancelables.
- **Consistencia:** una misma acción siempre tiene el mismo aspecto y posición relativa.

## 3. Tokens oficiales

### Color

| Token | HEX | Uso |
|---|---:|---|
| `obsidian-950` | `#030304` | Fondo absoluto |
| `obsidian-900` | `#070709` | Fondo de pantalla |
| `graphite-800` | `#17181B` | Tarjetas y controles |
| `graphite-700` | `#24252A` | Superficies elevadas |
| `steel-500` | `#676B74` | Bordes técnicos secundarios |
| `gold-500` | `#D8B35E` | Marca, acción premium, estado activo |
| `gold-300` | `#FFE3A1` | Reflejo metálico |
| `gold-700` | `#6C4812` | Sombra del oro |
| `ivory-100` | `#F4EFE4` | Texto principal |
| `muted-400` | `#8C8D92` | Texto secundario |
| `danger-600` | `#8E3035` | Destrucción confirmada |
| `success-500` | `#7EA85A` | Finalización |

**Regla 80/15/5:** 80 % obsidiana/grafito, 15 % texto neutro, máximo 5 % dorado visible.

### Gradiente metálico dorado

```css
background: linear-gradient(180deg,
  #FFF1BB 0%,
  #D6AA4C 28%,
  #8B5B14 62%,
  #F0CD74 100%);
```

Flutter:

```dart
const forgedGold = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [Color(0xFFFFF1BB), Color(0xFFD6AA4C), Color(0xFF8B5B14), Color(0xFFF0CD74)],
  stops: [0, .28, .62, 1],
);
```

### Radios

- Control pequeño: `10–12 px`
- Botón: `14–17 px`
- Tarjeta: `18–24 px`
- Panel protagonista: `24–30 px`
- Píldora de estado: `999 px`

### Elevación

FORGED usa **profundidad física**, no sombras flotantes difusas.

```css
box-shadow:
  0 6px 0 #000,
  0 20px 45px rgba(0,0,0,.55),
  inset 0 1px 0 rgba(255,255,255,.10);
```

- Primer valor: base física.
- Segundo: separación ambiental.
- Tercero: borde iluminado.

## 4. Tipografía

- UI general: `system-ui`, San Francisco/Roboto según plataforma.
- Números críticos: fuente condensada de alta presencia; siempre `tabular-nums`.
- Mayúsculas espaciadas solo en etiquetas y títulos breves.
- Nunca usar oro en párrafos largos.

Escala base:

| Nivel | Tamaño | Peso |
|---|---:|---:|
| Microetiqueta | 9–11 px | 800–1000 |
| Secundario | 12–14 px | 500–700 |
| Botón | 14–18 px | 800–1000 |
| Título | 22–34 px | 750–950 |
| Métrica | 40–96 px | 850–1000 |
| Timer | 76–152 px | 900–1000 |

## 5. Componentes

### Botón primario KING

- Fondo grafito con núcleo dorado controlado.
- Altura mínima móvil: `56 px`.
- Texto breve en mayúsculas.
- Estado pulsado: baja 2 px; no escala.

### Botón secundario

- Grafito, borde blanco al 10–12 %.
- Texto marfil.
- No competir con KING.

### Acción destructiva

- Nunca rojo brillante.
- Borgoña oscuro, texto rosa pálido.
- Confirmación FORGED con resumen de impacto.

### Tarjeta FORGED

- Una sola jerarquía principal.
- Máximo dos acciones visibles.
- Borde dorado solo si está activa, seleccionada o es protagonista.

### Panel / Sheet

- Fondo `graphite-800 → obsidian-950`.
- Tirador discreto.
- Título, explicación de una línea, acción principal y cancelar.
- Nunca `alert`, `prompt` ni `confirm` nativos.

## 6. PHX-TIMER-2.0

El temporizador es un **instrumento de precisión**, no una tarjeta grande.

### Anatomía

1. Marca Phoenix compacta.
2. Título DESCANSO.
3. Serie actual y siguiente.
4. Carcasa técnica con tornillería.
5. Aro de progreso real.
6. Tiempo metálico dorado centrado.
7. Estado: descanso, pausado o listo.
8. Controles −30, pausa, +30.
9. Saltar descanso.
10. Sonido y vibración.

### Estados

- **Normal:** oro estable, sin pulso.
- **Últimos 10 s:** pulso dorado de 1 s y brillo en el aro.
- **Pausa:** saturación reducida y estado PAUSADO.
- **Fin:** flash de 650 ms, tono Phoenix y vibración.

### Reglas del tiempo

- El valor siempre está ópticamente centrado.
- `font-variant-numeric: tabular-nums` obligatorio.
- El aro representa `restante / total`.
- El reloj nunca depende de una imagen rasterizada.
- Animaciones desactivadas con `prefers-reduced-motion`.

## 7. Movimiento

- Respuesta táctil: `80–140 ms`.
- Apertura de panel: `180–260 ms`.
- Transición de pantalla: máximo `300 ms`.
- Flash final: `650 ms`.
- Ninguna animación bloquea una acción.

## 8. Sonido y háptica

- El audio debe desbloquearse tras una interacción real del usuario.
- Sonido y vibración son independientes.
- El final usa un acorde breve, no una alarma estridente.
- Siempre existe un estado visual equivalente para accesibilidad.

## 9. Responsive

- Diseñar primero a 360–430 px.
- Área táctil mínima: `44 × 44 px`; recomendada: `54 × 54 px`.
- Nada crítico debajo del teclado.
- En apaisado, el Timer separa instrumento y controles.
- Textos largos usan elipsis; las métricas nunca se recortan.

## 10. Accesibilidad

- Contraste mínimo AA.
- No comunicar estados solo con color.
- Respetar tamaño de texto configurado.
- Respetar reducción de movimiento.
- Controles con nombre accesible.

## 11. Lo que FORGED no es

- No es cyberpunk.
- No es neón.
- No es una interfaz gamer.
- No es poner dorado a todos los bordes.
- No es llenar la pantalla de tornillos.
- No es imitar literalmente Mercedes o Apple.

FORGED transmite la misma **calidad percibida**, pero conserva identidad Phoenix.

## 12. Checklist de implementación

Antes de aprobar una pantalla:

- [ ] ¿La acción principal se identifica en un segundo?
- [ ] ¿No hay controles nativos fuera del sistema FORGED?
- [ ] ¿El dorado está reservado a marca, selección o acción?
- [ ] ¿Todos los botones tienen estado pulsado?
- [ ] ¿Funciona a 360 px de ancho?
- [ ] ¿Funciona con texto grande?
- [ ] ¿Funciona sin red?
- [ ] ¿Tiene estado vacío, error y éxito?
- [ ] ¿Puede migrarse a Flutter mediante los mismos tokens?
- [ ] ¿La animación aporta información?

## 13. Fuente única

Los tokens de este documento deben convertirse en:

- HTML/PWA: `styles.css` mediante variables `--phx-*`.
- Flutter: `PhoenixTheme`, `PhoenixColors`, `PhoenixSpacing`, `PhoenixMotion`.
- Canva: paleta y estilos de texto con los mismos nombres.

Cualquier desviación debe documentarse como una variante oficial, nunca improvisarse por pantalla.
