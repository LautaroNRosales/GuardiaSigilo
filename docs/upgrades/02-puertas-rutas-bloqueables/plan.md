---
id: upgrade-02-puertas-rutas-bloqueables-plan
titulo: Plan — Puertas, atajos o rutas bloqueables
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Plan de incrementos — Upgrade 02

Punto de partida: rama `main`, commit `029d110`, `npm run validate` en verde (61 pruebas).

## Incremento 1 — Dominio de puertas + constantes

- **Archivos previstos**: `src/domain/model/doors.ts` (nuevo), `src/application/simulation/labLevel.ts` (+`DOOR_CELLS`), `tests/model/doors.test.ts` (nuevo).
- **Contenido**: `openMapCells` (mapa efectivo inmutable), `canToggleDoor` (adyacencia Manhattan ≤ 1 y sin ocupantes); `DOOR_CELLS = [(16,15),(19,6)]`; pruebas: inmutabilidad, apertura puntual, `DOOR_CELLS` bloqueadas en `LAB_MAP` (CA-2), ruta exitosa por puerta abierta vs. bloqueada con `calculateRoute` (CA-3), adyacencia/ocupación (CA-4), `evaluateVision` con mapa efectivo: cerrada oculta / abierta no oculta la abertura (CA-7 unidad).
- **Criterios**: CA-1, CA-2, CA-3, CA-4, CA-7 (unidad).
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run`.
- **Riesgo**: que alguna celda propuesta no esté en un muro → corregir `DOOR_CELLS` (decisión humana si cambia la ubicación).
- **Condición de detención**: dos ubicaciones fallidas; test de visión ambiguo sobre la abertura.

## Incremento 2 — Mapa efectivo en la escena (colisión y render)

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: estado `openDoors` + caché `effectiveMap` (recalculada con `openMapCells` sólo al alternar); factorizar `rebuildWalls()` desde `create` usando `effectiveMap`; render de puertas con color propio (cerrada con marca, abierta como abertura); tecla `E` + `canToggleDoor` + avisos (`PUERTA ABIERTA` / `PUERTA CERRADA` / `SIN PUERTA CERCA` / `PUERTA BLOQUEADA`); `R` ya reinicia la escena completa (puertas vuelven a cerradas por `create`).
- **Criterios**: CA-4 (integración), CA-5, CA-6, CA-9.
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: física estática al reconstruir el grupo de paredes (destruir/recrear el `staticGroup` y el collider del jugador).
- **Condición de detención**: que reconstruir paredes deje de colisionar sin causa comprendida; diff > ~150 líneas sin revisión.

*Nota de secuencia*: en este punto las rutas del guardia todavía usan `LAB_MAP`; se conecta en el incremento 3 (el build queda verde en cada paso).

## Incremento 3 — Navegación y visión con el mapa efectivo

- **Archivos previstos**: `src/game/scenes/GameScene.ts`.
- **Contenido**: `computeRoute` y `updatePerceptionSimulation` sobre `effectiveMap`; al alternar una puerta, replanificar la ruta activa: en pausa no hace falta (se planifica al salir con el mapa nuevo), en manual → recalcular y si falla avisar y `resumePatrolRoute`, en patrulla → `resumePatrolRoute`.
- **Criterios**: CA-3 (integración), CA-6, CA-7 (integración), CA-8.
- **Validación**: `npm.cmd run typecheck && npm.cmd run test:run && npm.cmd run build`.
- **Riesgo**: destino manual quedado inaccesible tras cerrar puerta → cubierto por el mismo manejo de fallo existente.
- **Condición de detención**: que el guardia pueda quedar sin ruta y sin salida (estado colgado).

## Cierre del upgrade

- `npm.cmd run validate` completo.
- Checklist manual: abrir `(16,15)` con `E`, cruzar, cerrar y observar al guardia rodeando; `E` sin puerta cerca; intento de cerrar estando encima (puerta bloqueada); visión a través de la abertura; corte de ruta; `R`.
- `docs/upgrades/02-puertas-rutas-bloqueables/evidencia.md` con matriz criterio→comprobación→resultado, comandos, diff, decisiones y limitaciones.
- Commit con autorización explícita.
