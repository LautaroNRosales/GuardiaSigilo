---
id: upgrade-03-cono-vision-reactivo-plan
titulo: Plan — Cono de visión visible y reactivo
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Plan de incrementos — Upgrade 03

Punto de partida: rama `main`, commit `19f7b1d`, `npm run validate` en verde (69 pruebas).

## Incremento 1 — Estilo del cono (función pura)

- **Archivos previstos**: `src/game/presentation/visionConeStyle.ts` (nuevo), `tests/presentation/visionConeStyle.test.ts` (nuevo).
- **Contenido**: tipo `VisionConeStyle`, `visionConeStyle(reason, progress)` con el mapa de la spec, amortiguación de `progress`, `strokeWidth` derivado del progreso y error ante razón desconocida. Pruebas: mapeo completo (CA-1), orden de alfas (CA-2), decaimiento y clamp (CA-3), error defensivo.
- **Criterios**: CA-1, CA-2, CA-3, CA-7 (unidad: sin Phaser en el módulo).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run`.
- **Riesgo**: bajo (sin dependencias de escena).
- **Condición de detención**: que la API no sea representable con `Graphics.fillStyle/lineStyle` (valores numéricos).

## Incremento 2 — Conexión en GameScene

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: campos `lastVisionReason: VisionReason | null` y `reasonChangedAtMs` (reset en `create`); en `updatePerception`, detectar cambio de razón y registrar instante; `drawPerception(vision, time)` calcula `progress = 1 − min(1, (time − reasonChangedAtMs)/350)` y pinta sector con relleno + contorno de arco según `visionConeStyle`. Primer cuadro sin realce.
- **Criterios**: CA-4, CA-5, CA-6 (diff sin tocar `src/domain/perception/`), CA-7 (integración).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: contorno del sector con `Graphics` (path compartido con el relleno) → si el trazo ensucia el dibujo, usaríamos dos paths; se revisa en el diff.
- **Condición de detención**: cambio que altere resultados de percepción; fallo de build sin causa.

## Cierre del upgrade

- `npm.cmd run validate`.
- Checklist manual: estados rojo/ámbar/azul/gris según situación, realce ≤400 ms al transicionar, HUD coherente, `R` limpio.
- `docs/upgrades/03-cono-vision-reactivo/evidencia.md` con matriz criterio→comprobación→resultado.
- Commit con autorización explícita.
