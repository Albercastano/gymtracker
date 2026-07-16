# PHX APEX TIMER 1.0

Build 012 replaces the CSS-only Apex progress approximation with an SVG progress instrument. It retains the shared Phoenix Timer DOM contract and changes only the material-owned rendering.

## States
- Normal: cyan to green progress arc.
- Last 10 seconds: red arc and controlled breathing.
- Paused: reduced saturation and opacity.
- Finished: green completion flash.

## Audio
The app preloads a local WAV and unlocks a persistent audio element plus WebAudio during a genuine user gesture. The WAV is offline-cached. WebAudio remains the fallback.
