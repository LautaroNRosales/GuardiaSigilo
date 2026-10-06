---
id: upgrade-01-patrulla-pausas-mirada-plan
titulo: Plan — Patrulla con pausas y mirada direccional
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Plan de incrementos — Upgrade 01

Punto de partida: rama `main`, commit `c64f6c8`, `npm run validate` en verde (39 pruebas).

## Incremento 1 — Dominio de patrulla

- **Archivos previstos**: `src/domain/behavior/patrol.ts` (nuevo), `tests/behavior/patrol.test.ts` (nuevo).
- **Contenido**: `PatrolState` (`points`, `targetIndex`, `phase: travelling|paused`, `mode: patrol|manual`, `pauseRemainingMs`), `initialPatrol`, `onArrival` (llegada en modo patralla → pausa y avance de índice; en modo manual → reanuda patrulla), `tick` (cuenta de pausa), `beginManual`, `patrolLookDirection` (vector unitario hacia el punto destino durante la pausa), `skipPatrolPoint`.
- **Criterio a comprobar**: CA-1, CA-2, CA-3, CA-4, CA-5, CA-7 (unidad).
- **Validación**: `npm.cmd run test:run` y `npm.cmd run typecheck`.
- **Riesgo**: que la escena necesite decidir una regla no modelada → si ocurre, se detiene el incremento y se ajusta spec/plan antes de seguir.
- **Condición de detención**: test rojo sin causa comprendida; API insuficiente; más de ~150 líneas de diff.

## Incremento 2 — Puntos de patrulla alcanzables

- **Archivos previstos**: `src/application/simulation/labLevel.ts` (+`PATROL_POINTS`), `tests/behavior/patrol.test.ts` (agrega CA-8).
- **Contenido**: constantes `PATROL_POINTS = [(2,17),(2,2),(17,2),(17,12)]`; prueba de alcanzabilidad A* entre `GUARD_START` y cada punto y entre puntos consecutivos sobre `LAB_MAP`.
- **Criterio**: CA-8.
- **Validación**: `npm.cmd run test:run`.
- **Riesgo**: alguna celda no transitables o desconectada → corregir el punto en `labLevel.ts` y regenerar la prueba (decisión humana si cambia el circuito).
- **Condición de detención**: dos intentos de selección de celdas fallidos → consultar.

## Incremento 3 — Ciclo de vida en GameScene

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: ruta inicial al punto de patrulla; en `update`, si `advanceAlongPath.completed` en modo patrulla → `onArrival` + `guardFacing = patrolLookDirection` durante pausa + `tick(delta)` y al salir de pausa recalcular ruta al siguiente punto; `handlePointerDown` → `calculateRoute` y, si falla, HUD `RUTA FALLIDA` sin tocar el estado, si tiene éxito `beginManual`; al llegar en manual → `onArrival` y recálculo de ruta al punto pendiente; en fallo de ruta de patrulla → `skipPatrolPoint`.
- **Criterios**: CA-1, CA-2, CA-3, CA-5, CA-6, CA-7 (integración), CA-9.
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: solapamiento con el dibujo de ruta existente (`renderNavigation`) → reutilizarlo para ambas rutas; si el diff excede lo revisable, partir en 3a/3b.
- **Condición de detención**: regla que obligue a que la escena decida conducta; fallo de build sin causa.

## Incremento 4 — Telemetría de estado

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: HUD muestra `PATRULLA n/4` / `PAUSA t s` / `MANUAL` / `RUTA FALLIDA` (efímero); marcador de destino del guardia sigue al punto de patrulla activo.
- **Criterios**: CA-6, CA-9 (observabilidad).
- **Validación**: `npm.cmd run typecheck && npm.cmd run build`.
- **Riesgo**: bajo; texto de HUD ya existe como patrón.

## Cierre del upgrade

- `npm.cmd run validate` completo.
- Ejecución manual con los pasos de la spec (arranque, pausa+mirada, clic temporal, clic inválido, R) registrando observación y HUD.
- `docs/upgrades/01-patrulla-pausas-mirada/evidencia.md`: versión inicial/final, comandos y salidas, diff, matriz criterio→comprobación→resultado, decisiones y limitaciones.
- Commit del upgrade con autorización explícita.
