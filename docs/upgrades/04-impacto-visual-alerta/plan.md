---
id: upgrade-04-impacto-visual-alerta-plan
titulo: Plan — Impacto visual de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Plan de incrementos — Upgrade 04

Punto de partida: rama `main`, commit `dae8f05`, `npm run validate` en verde (74 pruebas).

## Incremento 1 — Estilo del destello (función pura)

- **Archivos previstos**: `src/game/presentation/alertStyle.ts` (nuevo), `tests/presentation/alertStyle.test.ts` (nuevo).
- **Contenido**: `alertStyle(isAlertActive, flashProgress)` con estado inactivo (alpha 0), reposo activo (borde fino) y decaimiento del destello; amortiguación de `progress`. Pruebas: inactivo apagado (CA-5), decaimiento monótono, clamp y no finitos.
- **Criterios**: CA-5, CA-7 (unidad: sin Phaser).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run`.
- **Riesgo**: bajo (sin escena).
- **Condición de detención**: que los valores no sean representables con `Graphics.lineStyle`.

## Incremento 2 — Conexión en GameScene

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: campo `previousVisionVisible` + `alertEnteredAtMs` (reset en `create`); borde de detección en `updatePerception` (false→true ⇒ instante + `showNotice("¡ALERTA!", "#ff6b6b")`; true→false ⇒ apagar); capa `alertGraphics` con `strokeRect` de pantalla completa según `flashProgress = 1 − min(1, (time − entrada)/600)`; `showNotice` con color opcional (default blanco, sin cambio en avisos existentes).
- **Criterios**: CA-1, CA-2, CA-3, CA-4, CA-6, CA-7 (integración).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: orden de capas (la viñeta no debe tapar el HUD) → `setDepth` por debajo del HUD; se revisa en diff y manualmente.
- **Condición de detención**: alteración de resultados de percepción; build rojo sin causa.

## Cierre del upgrade

- `npm.cmd run validate`.
- Checklist manual (destello, decaimiento, persistencia, salida, `R`).
- `docs/upgrades/04-impacto-visual-alerta/evidencia.md` con matriz criterio→comprobación→resultado.
- Commit con autorización explícita.
