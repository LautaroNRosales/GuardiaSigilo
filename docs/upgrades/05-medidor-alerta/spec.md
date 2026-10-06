---
id: upgrade-05-medidor-alerta
titulo: Spec — Medidor de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 05 — Medidor de alerta

## Problema

No existe nivel de alerta numérico (la máquina de estados H4 quedó fuera de alcance). El jugador sólo infiere la alerta por el color del cono y los avisos, sin una medida continua de qué tan caliente está la situación.

## Intención de diseño

Un indicador siempre visible (barra + número, esquina inferior derecha) que sube al ser percibido y decae con el tiempo, con color por tercios.

## Decisiones de diseño (usuario)

1. **Fórmula** (regla pura de dominio): `visible → 1`; sin memoria → `0`; última observación por **visión** → decae linealmente de 1 a 0 en **6 s**; por **sonido** → de 0.6 a 0 en **3 s**.
2. **Posición**: esquina inferior derecha (opuesta a los avisos).
3. **Formato**: barra rellena + número `alerta 0.42`; color por tercios: verde < 0.33 ≤ ámbar < 0.67 ≤ rojo.

## Alcance

- `src/domain/perception/alertLevel.ts` (nuevo, puro — sin Phaser ni DOM):
  - `alertLevel(memory, visionVisible, currentTimeMs)` → `number ∈ [0,1]`;
  - constantes `VISION_DECAY_MS = 6000`, `SOUND_DECAY_MS = 3000`, `SOUND_PEAK = 0.6`;
  - tiempo no finito → `throw` (consistente con `memory.ts`).
- `src/game/presentation/alertMeterStyle.ts` (nuevo, sin Phaser ni DOM):
  - `alertMeterStyle(level)` → `{ color }` por tercios; nivel no finito → `throw`; fuera de `[0,1]` → clamp.
- `src/game/scenes/GameScene.ts`:
  - cálculo del nivel por cuadro en `updatePerception` con la memoria y `vision.visible`;
  - capa `meterGraphics` (depth 10) con pista oscura + relleno 180×10 inferior derecha, y texto `alerta X.XX` a su derecha/abajo, actualizados por cuadro; reinicio en `create`.
- Pruebas: `tests/perception/alertLevel.test.ts` y `tests/presentation/alertMeterStyle.test.ts`.

## Fuera de alcance

- Cambios en `evaluateVision`, memoria, cono, destello de alerta o avisos.
- Sonidos, shake, cámara, animaciones de la barra (sin interpolación: valor exacto por cuadro).
- Nuevas dependencias.

## Restricciones

- `src/domain/perception/` sin Phaser ni DOM (ya lo garantiza la arquitectura).
- TypeScript estricto; conservar upgrades 01–04; HUD sin superposiciones con avisos ni navegación.

## Caso normal

Al iniciar, barra vacía `alerta 0.00`. Al ser visto, salta a `1.00` (rojo). Al perderse de vista, desciende en ~6 s pasando rojo → ámbar → verde hasta 0. Al emitir sonido (Q) sube a ~0.60 y baja en ~3 s.

## Casos límite

1. `visible` con memoria vieja → 1 (manda la visión actual).
2. Sin memoria → 0.
3. Edad ≥ ventana de decaimiento → 0 (nunca negativo; edad acotada con `max(0, …)`).
4. Tiempo no finito → `throw`.
5. Nivel no finito en `alertMeterStyle` → `throw`; nivel finito fuera de `[0,1]` → clamp.
6. Sonido mientras sigue vigente el evento → la memoria se refresca y el nivel se sostiene en 0.6.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| CA-1 | `visible → 1`; decaimientos de visión (6 s) y sonido (0.6 / 3 s) exactos en valores de referencia | Pruebas unitarias de `alertLevel` |
| CA-2 | Sin memoria → 0; edad mayor a la ventana → 0; nunca fuera de `[0,1]` | Pruebas unitarias de `alertLevel` |
| CA-3 | Color por tercios correcto; clamp y error defensivo en `alertMeterStyle` | Pruebas unitarias de estilo |
| CA-4 | Barra y número se actualizan por cuadro y coinciden con la situación (sube al ser visto, baja al perderse) | Ejecución manual |
| CA-5 | Transiciones de color verde → ámbar → rojo al subir el nivel | Ejecución manual + pruebas de tercios |
| CA-6 | Reglas de percepción y upgrades previos intactos; módulos sin Phaser/DOM | Suite completa sin regresiones + revisión de diff |
| CA-7 | `npm run validate` OK | Comando |

## Evidencia prevista

- `npm.cmd run test:run` con las 78 previas sin regresiones y las nuevas.
- `npm.cmd run validate`.
- Checklist manual: inicio en 0.00, salto a 1.00, decaimiento visible con cambio de color, sonido ~0.60, `R` limpio, sin superposición con avisos.
- Diff por incremento.
