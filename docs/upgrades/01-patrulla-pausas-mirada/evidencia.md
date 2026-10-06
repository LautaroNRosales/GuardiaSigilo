---
id: upgrade-01-patrulla-pausas-mirada-evidencia
titulo: Evidencia — Patrulla con pausas y mirada direccional
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 01

## Identificación

- Fecha: 2026-10-06, 15:48–16:30 (≈42 min, 4 incrementos, 0 iteraciones de corrección).
- Herramienta y modelo: OpenCode (modelo `opencode/big-pickle`) en terminal del estudiante; decisiones y revisión humanas en cada gate.
- Versión inicial: rama `main`, commit base `c64f6c8`, `npm run validate` en verde con 39 pruebas (línea base).
- Versión final (previa al commit de este upgrade): mismos cambios de los 4 incrementos en working tree, `npm run validate` en verde con 61 pruebas.
- Entorno: Windows, Node v24.21.0, npm 12.2.0 (ejecutando `npm.cmd` por política de PowerShell).

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `npm.cmd run typecheck` | Sin errores (también después de cada incremento) |
| `npm.cmd run test:run` | 7 archivos, **61/61 pruebas** (39 preexistentes + 22 nuevas) |
| `npm.cmd run build` | `✓ 21 modules transformed`, `dist/` generado, sin errores de tipos |
| `npm.cmd run validate` | typecheck + tests + build aprobados |
| `Invoke-WebRequest http://localhost:5173/` (dev server) | **HTTP 200**, 1187 bytes |

Nota: el chequeo más cercano se ejecutó tras cada incremento (inc 1–2: typecheck + tests; inc 3: typecheck + tests + build; inc 4: typecheck + build) y `validate` completo al cierre.

## Ejecución del producto (evidencia visual)

Servidor de desarrollo en `http://localhost:5173` con verificación humana del estudiante. Checklist ejecutada el 2026-10-06:

| Paso | Observación | Resultado |
|---|---|---|
| Apertura sin clic | Guardia arranca hacia `(2,17)`, HUD `PATRULLA 1/4 · EN RUTA` | ✅ |
| Llegada al punto | Pausa ≈1,2 s, HUD `PAUSA 1.2s`, cono mira fijo al siguiente punto | ✅ |
| Ciclo completo | 1/4 → 2/4 → 3/4 → 4/4 → 1/4 | ✅ |
| Clic en celda transitable | HUD `MANUAL`, llega al clic y retoma la patrulla | ✅ |
| Clic dentro de una pared | Aviso `RUTA FALLIDA`, patrulla continúa sin cortarse | ✅ |
| Tecla `R` | Reinicio reproducible al estado inicial | ✅ |
| Tecla `ESPACIO` | Alterna BFS/A* sin cortar la patrulla | ✅ |

## Registro cronológico

| Orden | Acción | Resultado | Decisión humana |
|---:|---|---|---|
| 0 | Punto inicial: commit `c64f6c8` (GDD + auditoría preexistentes) | Árbol limpio, baseline verde | Autorizado |
| 1 | Spec + plan del upgrade | 10 criterios, 4 incrementos | Aprobado |
| 2 | Inc 1: `domain/behavior/patrol.ts` + tests | 61/61 typecheck+tests | Aceptado |
| 3 | Inc 2: `PATROL_POINTS` + prueba de alcanzabilidad A* | 61/61; circuito alcanzable a la primera | Aceptado |
| 4 | Inc 3: integración en `GameScene` | typecheck+tests+build OK | Aceptado |
| 5 | Inc 4: telemetría HUD + marcador | typecheck+build OK | Aceptado |
| 6 | Cierre: `validate` + checklist manual 7/7 | Todo en verde | **Integrar** |

## Diff

```
M src/application/simulation/labLevel.ts    |   6 +
M src/game/scenes/GameScene.ts              | 131 +++++++++++++--- (127 ins, 10 del)
N src/domain/behavior/patrol.ts             |  98
N tests/behavior/patrol.test.ts             | 201
N docs/upgrades/01-patrulla-pausas-mirada/  | spec 85, plan 54, evidencia (este archivo)
```

Reglas de conducta en dominio puro (`patrol.ts`, sin Phaser/DOM); `GameScene` sólo orquesta: convierte celdas, planifica rutas y aplica la dirección devuelta por el dominio.

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-1 Patrulla autónoma al iniciar | Test `initialPatrol` + checklist paso 1 | ✅ |
| CA-2 Pausa 1200 ms al llegar | Tests de cuenta (`tick`) + checklist paso 2 | ✅ |
| CA-3 Mirada fija al siguiente punto en pausa | Test `patrolLookDirection` (unitario) + cono observado paso 2 | ✅ |
| CA-4 Ciclo cíclico 0→1→2→3→0 | Test `wraps the target index` + checklist paso 3 | ✅ |
| CA-5 Clic temporal con retoma | Tests de `beginManual`/`onArrival` + checklist paso 4 | ✅ |
| CA-6 Clic inalcanzable no altera patrulla | Checklist paso 5 (aviso `RUTA FALLIDA`, recorrido continuo) | ✅ |
| CA-7 Fallo de ruta de patrulla salta punto | Test `skips a failed point` + revisión de `resumePatrolRoute` | ✅ |
| CA-8 Puntos alcanzables por A* en `LAB_MAP` | 3 pruebas nuevas de circuito sobre el mapa real | ✅ |
| CA-9 `R` reproducible y suite sin regresiones | Checklist paso 6 + `test:run` 61/61 | ✅ |
| CA-10 `npm run validate` y dominio sin Phaser | `validate` completo + revisión de imports del diff | ✅ |

## Limitaciones y riesgos

- La evidencia visual depende de observación humana: no hay automatización de navegador (mismo riesgo residual declarado en H3).
- El salto de punto por ruta fallida (CA-7) está cubierto por unidad; con el mapa actual no es provocable en ejecución.
- La pausa es una constante fija (`PATROL_PAUSE_MS = 1200`) sin ajuste en caliente.
- El comportamiento de la patrulla no está conectado todavía a estados de alerta (fuera de alcance: H4 queda pendiente).

## Decisión humana

**Integrar.** El estudiante verificó personalmente los 7 pasos de ejecución y los resultados automatizados antes de autorizar el commit.
