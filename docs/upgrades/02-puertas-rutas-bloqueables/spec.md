---
id: upgrade-02-puertas-rutas-bloqueables
titulo: Spec — Puertas, atajos o rutas bloqueables
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 02 — Puertas, atajos o rutas bloqueables

## Problema

El espacio es estático: `LAB_MAP` es inmutable durante la ejecución, así que el jugador no puede crear atajos ni cortar rutas. Toda partida se resuelve con la misma topología y no hay decisión de espacio que cambie la estrategia.

## Intención de diseño

Dos puertas dentro de muros existentes que el jugador abre o cierra con `E`: al abrirla aparece un atajo (para él y para la visión del guardia); al cerrarla tras pasar, obliga al guardia a rodear. El mapa se transforma como parte de la jugada.

## Objetivo

Agregar un mapa efectivo derivado del estado de las puertas, aplicado a colisión, navegación y oclusión visual, con alternancia del jugador bajo una regla de ocupación.

## Alcance

- `src/domain/model/doors.ts` (nuevo, puro):
  - `openMapCells(map, cells)` → `GridMap` nuevo con esas celdas removidas de `blocked` (inmutable);
  - `canToggleDoor(playerCell, guardCell, doorCell)` → `true` sólo si el jugador está en celda ortogonal adyacente (distancia de Manhattan ≤ 1) y ni el jugador ni el guardia ocupan la celda de la puerta.
- `src/application/simulation/labLevel.ts`: `DOOR_CELLS = [(16,15), (19,6)]`, ambas celdas de muro existentes y **cerradas al inicio** (el mapa inicial resultante es idéntico al actual).
- `src/game/scenes/GameScene.ts`:
  - estado `openDoors` (conjunto de claves) y mapa efectivo en caché, recalculado sólo al alternar;
  - colisión y render del mapa derivados del mapa efectivo: paredes existentes + puertas con color propio (cerrada = muro con marca de puerta, abierta = abertura);
  - tecla `E`: alterna la puerta adyacente según `canToggleDoor`; avisos `PUERTA ABIERTA`, `PUERTA CERRADA`, `SIN PUERTA CERCA`, `PUERTA BLOQUEADA`;
  - tras alternar: se replanifica la ruta activa del guardia (patrulla o manual);
  - `computeRoute` y `updatePerceptionSimulation` usan el mapa efectivo.
- Pruebas en `tests/model/doors.test.ts`.

## Fuera de alcance

- Animaciones, llaves, mecanismos o más de dos puertas.
- Que el guardia abra o cierre puertas (sólo el jugador).
- Cambios en A*, BFS ni en las reglas de percepción (se les pasa el mapa efectivo, que con las puertas cerradas es idéntico a `LAB_MAP`).
- Máquina de estados (H4), cámara, alerta u otros upgrades.

## Restricciones

- `src/domain/` sin Phaser/DOM; `openMapCells` y `canToggleDoor` son funciones puras con pruebas en Node.
- Sin dependencias nuevas; cambios chicos por incremento con diff revisado.
- Conservar: patrulla del upgrade 01, teclas WASD/flechas/R/Q/ESPACIO, telemetría existente.

## Caso normal

Con la puerta `(16,15)` cerrada, el jugador no puede cruzar ese muro. Se acerca y pulsa `E`: la puerta se abre, el mapa efectivo cambia, la colisión del jugador permite cruzar, las rutas del guardia y su cono de visión consideran la abertura. El jugador cruza y cierra con `E`; el guardia, para llegar al otro lado, debe rodear por otro pasillo.

## Casos límite

1. `E` sin puerta adyacente → aviso `SIN PUERTA CERCA`; nada cambia.
2. `E` con el jugador sobre la celda de la puerta para cerrarla → `canToggleDoor` rechaza (ocupada por el jugador) → aviso `PUERTA BLOQUEADA`.
3. El guardia está sobre la celda de la puerta → no se puede cerrar → `PUERTA BLOQUEADA`.
4. Cerrar una puerta que corta la ruta activa del guardia → se replanifica; si en patrulla el destino queda inaccesible, actúa el salto de punto del upgrade 01; si es ruta manual inalcanzable, se avisa y el guardia retoma la patrulla.
5. Alternar durante la pausa de la patrulla → la ruta que se planifica al salir de la pausa ya usa el mapa efectivo.
6. Reinicio con `R` → todas las puertas vuelven a cerradas (estado inicial reproducible).

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| CA-1 | `openMapCells` devuelve un mapa nuevo con esas celdas abiertas sin modificar el original | Prueba unitaria (inmutabilidad y contenido) |
| CA-2 | Con las puertas cerradas, `DOOR_CELLS` sigue bloqueada y el mapa efectivo inicial equivale a `LAB_MAP` | Prueba unitaria sobre `LAB_MAP` |
| CA-3 | Una ruta que cruza una puerta abierta tiene éxito; con la puerta cerrada el destino queda sin ruta o rodea | Prueba unitaria con mapa real (`calculateRoute`) |
| CA-4 | `canToggleDoor` sólo permite alternar con el jugador adyacente y sin ocupantes en la celda | Prueba unitaria de adyacencia y ocupación |
| CA-5 | Sólo el jugador alterna con `E`; el guardia nunca modifica puertas | Revisión del diff + ejecución manual |
| CA-6 | Tras alternar, el jugador colisiona coherentemente (no atraviesa muros, sí cruza puertas abiertas) | Ejecución manual |
| CA-7 | La puerta cerrada oculta la línea de visión y la abierta permite ver por la abertura | Prueba unitaria de `evaluateVision` con mapa efectivo + manual |
| CA-8 | Cerrar una puerta sobre la ruta activa no cuelga al guardia (replanifica o retoma patrulla) | Ejecución manual (caso límite 4) |
| CA-9 | `R` restaura todas las puertas cerradas | Ejecución manual |
| CA-10 | `npm run validate` OK y `src/domain/` sin Phaser/DOM | Comando + revisión de imports |

## Evidencia prevista

- `npm.cmd run test:run` con `tests/model/doors.test.ts` nuevo y 61 pruebas previas sin regresiones.
- `npm.cmd run validate` completo.
- Checklist manual: abrir/cruzar/cerrar con `E`, avisos de error (`SIN PUERTA CERCA`, `PUERTA BLOQUEADA`), corte de ruta del guardia y visión a través de la abertura.
- Diff por incremento.
