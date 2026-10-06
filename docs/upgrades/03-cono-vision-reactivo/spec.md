---
id: upgrade-03-cono-vision-reactivo
titulo: Spec — Cono de visión visible y reactivo
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 03 — Cono de visión visible y reactivo

## Problema

El cono sólo distingue dos estados: verde si ve al jugador, azul si no (`GameScene.ts` → `drawPerception`). El jugador no puede leer *por qué* no lo ve (ocluido, lejos, fuera del cono) ni percibir el instante en que el estado cambió. La amenaza pierde legibilidad.

## Intención de diseño

Que el cono comunique de un vistazo qué tan cerca está el guardia de verlo (rojo → ámbar → azul → gris) y que cada cambio de estado dé un realce visual breve que decae solo.

## Objetivo

Estilizar el cono según `VisionResult.reason` con una función pura de presentación, y animar la transición entre estados sin modificar las reglas de percepción.

## Alcance

- `src/game/presentation/visionConeStyle.ts` (nuevo, sin Phaser ni DOM):
  - `visionConeStyle(reason, progress)` → `{ fillColor, fillAlpha, strokeColor, strokeWidth }`;
  - `progress ∈ [0,1]` es el realce de transición (se amortigua fuera del rango);
  - semántica por nivel de amenaza:

    | Razón | Color de relleno | Alpha reposo |
    |---|---|---|
    | `visible` | rojo `0xe16969` | 0.30 |
    | `occluded` | ámbar `0xe5b454` | 0.16 |
    | `out-of-range` | azul `0x6b8afd` | 0.10 |
    | `outside-cone` | gris azulado `0x3b566e` | 0.06 |
    | `invalid-facing` | gris `0x555f66` | 0.05 |

  - con `progress` alto: alpha y grosor del borde aumentan de forma acotada; razón desconocida → error (sin fallos silenciosos).
- `src/game/scenes/GameScene.ts`:
  - seguimiento de la razón anterior y del instante del último cambio (reinicio en `create`);
  - `progress = 1 − min(1, (tiempo − cambio) / 350 ms)`;
  - `drawPerception` pinta el sector con `fillColor/fillAlpha` y contornea el arco con `strokeColor/strokeWidth`.
- Pruebas en `tests/presentation/visionConeStyle.test.ts`.

## Fuera de alcance

- Cambiar `evaluateVision`, `VisionResult` o cualquier regla/percepción de `src/domain/perception/`.
- Leyenda de colores en pantalla (el HUD ya informa `vision REASON`).
- Flash de pantalla, shake o partículas (upgrade 04); medidor de alerta (upgrade 05); cámara.
- Nuevas dependencias.

## Restricciones

- `src/game/presentation/` no importa Phaser ni DOM (valores numéricos de color compatibles con `Graphics.fillStyle`).
- TypeScript estricto; cambios chicos con diff revisado; conservar sonido, marcadores, HUD y upgrades 01–02.

## Caso normal

Acercándose al guardia por detrás de una pared, el cono está ámbar; al salir de la sombra a la línea de visión pasa a rojo con un realce breve que decae en ~350 ms; al alejarse vuelve a azul. El color siempre coincide con la razón que muestra el HUD.

## Casos límite

1. Primer cuadro sin razón previa → sin realce (progress 0), estado de reposo.
2. Cambios rápidos consecutivos → cada cambio reinicia el realce.
3. `progress` fuera de `[0,1]` → se amortigua al rango.
4. Razón desconocida → `throw` (defensiva, imposible con el tipo actual).
5. Reinicio con `R` → sin realce residual (el estado de escena se recrea en `create`).

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| CA-1 | Las cinco razones tienen estilo propio con color distinto | Prueba unitaria de mapeo completo |
| CA-2 | El orden de amenaza por alpha es `visible > occluded > out-of-range > outside-cone ≥ invalid-facing` | Prueba unitaria de orden |
| CA-3 | `progress` de 0 a 1 aumenta alpha y grosor de borde y se amortigua fuera del rango | Prueba unitaria de decaimiento y clamp |
| CA-4 | Al cambiar la razón en ejecución aparece el realce y desaparece en ≤ 400 ms | Ejecución manual observando la transición |
| CA-5 | Con la razón estable, el cono permanece en su estilo de reposo (sin parpadeo) | Ejecución manual |
| CA-6 | Las reglas de percepción no cambian: mismos `VisionResult` | Suite completa sin regresiones y diff que no toca `src/domain/perception/` |
| CA-7 | `npm run validate` OK y `visionConeStyle.ts` sin Phaser/DOM | Comando + revisión de imports |

## Evidencia prevista

- `npm.cmd run test:run` con `tests/presentation/visionConeStyle.test.ts` nuevo y 69 pruebas previas sin regresiones.
- `npm.cmd run validate`.
- Checklist manual: cono rojo/ámbar/azul/gris según la situación, realce al transicionar, HUD coherente con el color, `R` limpio.
- Diff por incremento.
