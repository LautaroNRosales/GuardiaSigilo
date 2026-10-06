---
id: upgrade-02-puertas-rutas-bloqueables-evidencia
titulo: Evidencia — Puertas, atajos o rutas bloqueables
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 02

## Identificación

- Fecha: 2026-10-06, 16:33–17:15 (≈42 min, 3 incrementos, 0 iteraciones de corrección).
- Herramienta y modelo: OpenCode (modelo `opencode/big-pickle`); revisión y decisiones humanas en cada gate.
- Versión inicial: rama `main`, commit `029d110`, `npm run validate` en verde con 61 pruebas.
- Versión final (previa al commit): working tree con los 3 incrementos, `npm run validate` en verde con 69 pruebas.
- Entorno: Windows, Node v24.21.0, npm 12.2.0 (`npm.cmd`).

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `npm.cmd run typecheck` | Sin errores (tras cada incremento) |
| `npm.cmd run test:run` | 8 archivos, **69/69 pruebas** (61 previas + 8 nuevas) |
| `npm.cmd run build` | `✓ 22 modules transformed`, `dist/` OK |
| `npm.cmd run validate` | typecheck + tests + build aprobados |
| `Invoke-WebRequest http://localhost:5173/` | **HTTP 200** (dev server con HMR) |

## Ejecución del producto (evidencia visual)

Checklist manual ejecutada por el estudiante en `http://localhost:5173` y confirmada con resultado OK (2026-10-06):

| Paso | Observación | Resultado |
|---|---|---|
| `E` adyacente a la puerta `(16,15)` | `PUERTA ABIERTA`, abertura con borde verde, jugador la cruza | OK |
| Cerrar desde el otro lado | `PUERTA CERRADA`, colisión impide el cruce | OK |
| `E` lejos de puertas | `SIN PUERTA CERCA`, sin cambios | OK |
| `E` sobre la puerta abierta | `PUERTA BLOQUEADA` (ocupada) | OK |
| Cierre sobre ruta activa del guardia | Replanificación o `RUTA CORTADA, PATRULLA REANUDADA` + retoma | OK |
| Cono frente a puerta | Cerrada corta en el muro; abierta se ve la abertura | OK |
| `R` | Puertas restauradas cerradas | OK |

## Registro cronológico

| Orden | Acción | Resultado | Decisión humana |
|---:|---|---|---|
| 1 | Exploración + 3 decisiones de diseño (sólo jugador, visión afectada, 2 puertas) | Registradas en spec | Aprobadas |
| 2 | Spec + plan | 10 criterios, 3 incrementos | Aprobado |
| 3 | Inc 1: `domain/model/doors.ts` + `DOOR_CELLS` + tests | 69/69 typecheck+tests | Aceptado |
| 4 | Inc 2: mapa efectivo, colisión/render de puertas, tecla `E` | typecheck+tests+build OK | Aceptado |
| 5 | Inc 3: rutas y visión sobre `effectiveMap` + replanificación | typecheck+tests+build OK | Aceptado |
| 6 | Cierre: `validate` + checklist 7/7 confirmada por el estudiante | Todo en verde | **Integrar** |

## Diff

```
M src/application/simulation/labLevel.ts    |  4   (+DOOR_CELLS)
M src/game/scenes/GameScene.ts              | 134 ++ (123 ins, 15 del sobre la base 029d110)
N src/domain/model/doors.ts                 | 30   (openMapCells, canToggleDoor)
N tests/model/doors.test.ts                 | 100  (8 pruebas)
N docs/upgrades/02-puertas-rutas-bloqueables/ | spec 84, plan 48, evidencia (este archivo)
```

Reglas puras en `src/domain/model/doors.ts`; la escena sólo orquesta estado (`openDoors`, `effectiveMap` en caché), reconstrucción de paredes y avisos.

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-1 `openMapCells` inmutable y puntual | Tests de inmutabilidad y alcance | ✅ |
| CA-2 Cerradas = `LAB_MAP` inicial | Test `DOOR_CELLS` bloqueadas en `LAB_MAP` | ✅ |
| CA-3 Ruta más corta por puerta abierta, bloqueada al cerrar | Test A* `(16,16)→(16,14)` con/sin puerta | ✅ |
| CA-4 `canToggleDoor`: adyacencia y ocupación | Tests de adyacencia, diagonal, distancia 2 y ocupantes | ✅ |
| CA-5 Sólo el jugador alterna (`E`) | Revisión del diff (el guardia no tiene ruta de toggles) + checklist | ✅ |
| CA-6 Colisión coherente tras alternar | Checklist pasos 1–2 (cruza abierta, choca cerrada) | ✅ |
| CA-7 Visión: cerrada oculta / abierta no oculta | Tests `evaluateVision` con mapa efectivo + checklist paso 6 | ✅ |
| CA-8 Cierre sobre ruta activa no cuelga al guardia | Checklist paso 5 (replanifica o retoma patrulla) | ✅ |
| CA-9 `R` restaura puertas cerradas | Checklist paso 7 | ✅ |
| CA-10 `validate` OK y dominio sin Phaser | `validate` + revisión de imports | ✅ |

## Limitaciones y riesgos

- Evidencia visual por observación humana; sin automatización de navegador.
- El toggle de puertas usa una tecla fija (`E`) sin remapeo.
- Con una puerta abierta en el mapa, el cono y las rutas dependen de `effectiveMap` en caché: si en el futuro se agrega un modificador de mapa en caliente, debe recalcularse desde `LAB_MAP` (como ya se hace).
- Sólo dos puertas y sin animación de apertura/cierre (fuera de alcance declarado).

## Decisión humana

**Integrar.** El estudiante verificó personalmente los 7 pasos y los resultados automatizados antes de autorizar el commit.
