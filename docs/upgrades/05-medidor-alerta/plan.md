---
id: upgrade-05-medidor-alerta-plan
titulo: Plan — Medidor de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Plan de incrementos — Upgrade 05

Punto de partida: rama `main`, commit `5e9d47f`, `npm run validate` en verde (78 pruebas).

## Incremento 1 — Regla de nivel y estilo (funciones puras)

- **Archivos previstos**: `src/domain/perception/alertLevel.ts` (nuevo), `src/game/presentation/alertMeterStyle.ts` (nuevo), `tests/perception/alertLevel.test.ts` (nuevo), `tests/presentation/alertMeterStyle.test.ts` (nuevo).
- **Contenido**: `alertLevel(memory, visionVisible, currentTimeMs)` con picos/ventanas de la spec y defensa ante tiempo no finito; `alertMeterStyle(level)` con colores por tercios, clamp y error ante nivel no finito. Pruebas: visión visible, sin memoria, valores de referencia de decaimiento, saturación en 0, tercios, clamp, errores.
- **Criterios**: CA-1, CA-2, CA-3, CA-6 (unidad; módulos sin Phaser).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run`.
- **Riesgo**: bajo (sin escena).
- **Condición de detención**: que la regla necesite datos que la memoria no expone.

## Incremento 2 — Medidor en GameScene

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: por cuadro en `updatePerception`, `level = alertLevel(memory, frame.vision.visible, time)`; capa `meterGraphics` (depth 10) con pista + relleno 180×10 en esquina inferior derecha y texto `alerta X.XX` con `alertMeterStyle` para el color; reinicio de valores en `create`.
- **Criterios**: CA-4, CA-5, CA-6 (integración), CA-7.
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: superposición con avisos (inferior izquierda) → posición inferior derecha, verificado manualmente.
- **Condición de detención**: alterar resultados de percepción; build rojo sin causa.

## Cierre del upgrade

- `npm.cmd run validate`.
- Checklist manual (inicio, salto, decaimiento con cambio de color, sonido, `R`, sin superposición).
- `docs/upgrades/05-medidor-alerta/evidencia.md` con matriz criterio→comprobación→resultado.
- Commit con autorización explícita.
