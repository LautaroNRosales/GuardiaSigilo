---
id: laboratorio-guardia-sigilo-auditoria-repositorio
titulo: Auditoría del repositorio antes de los cambios
tipo: referencia
audiencia: estudiante
acceso: publico
version: 2
---

# Auditoría del repositorio antes de los cambios

## Identificación

- Fecha: 15 de septiembre de 2026.
- Rama inspeccionada: `main`.
- Commit base: `ce4c4e5` (Creacion de la Estructura Esperada). Commit inicial: `a6659b2`.
- Alcance: repositorio completo, sin modificaciones de código.
- Estado local: `GDD.md` modificado sin commitear.

## Objetivo

Documentar la ruta completa estímulo → percepción → memoria → conducta actual → verificación, con los puntos exactos de archivo/función donde entra cada estímulo, y definir la FSM esperada (H4) junto con el contexto mínimo para intervenir. Solo documentación; cero cambios de código.

## 1. Rutas y símbolos clave

Módulos y símbolos donde se reciben entradas o se genera conducta:

| Módulo | Ruta | Símbolos clave |
|---|---|---|
| Escena | `src/game/scenes/GameScene.ts` | `update` (entrada de teclas/clic), `handlePointerDown`, `updatePerception`, `updateGuardMovement`, `updateTelemetry` |
| Percepción (coordinación) | `src/application/simulation/perceptionSimulation.ts` | `updatePerceptionSimulation`, `withSoundEvent` |
| Sensores | `src/domain/perception/perception.ts` | `evaluateVision`, `evaluateSound` |
| Memoria | `src/domain/perception/memory.ts` | `rememberObservation`, `timeSinceLastPerception` |
| Navegación | `src/domain/navigation/search.ts`, `pathFollower.ts` | `findPathAStar`, `findPathBfs`, `advanceAlongPath` |
| Nivel | `src/application/simulation/labLevel.ts` | `LAB_MAP`, `PLAYER_START`, `GUARD_START`, `TILE_SIZE` |
| FSM | `src/domain/behavior/` | **No existe aún** (pendiente H4) |

Referencias de línea utilizadas: `GameScene.ts:160` (update), `:171` (sonido Q), `:207` (clic), `:267` (movimiento), `:283` (percepción), `:335` (telemetría); `perceptionSimulation.ts:41/48`; `perception.ts:35/80`; `memory.ts:25/54`.

## 2. Flujos observados y dominio del problema

### Flujo del sonido

1. `Q` se detecta en `GameScene.update` → `withSoundEvent` guarda `{position, radius, emittedAtMs, durationMs}` en `state.soundEvent`.
2. `updatePerceptionSimulation` evalúa `evaluateSound` (activo si `emittedAtMs ≤ t ≤ emittedAtMs + durationMs` y distancia ≤ radio).
3. Si se oye, `rememberObservation` actualiza `lastKnownPosition`, `source: "sound"` y `lastPerceivedAtMs`.
4. El `soundEvent` se expira cuando supera `emittedAtMs + durationMs`.
5. **Resultado observado:** solo cambia la memoria y el HUD; **no genera conducta**.

### Flujo de la visión

1. Cada frame `updatePerception` llama a `updatePerceptionSimulation` con observador, dirección, objetivo, alcance (220 px) y campo (90°).
2. `evaluateVision` resuelve en orden: rango → cono (producto punto con `facing`) → oclusión (`lineIsOccluded`, criterio conservador al tocar esquinas).
3. Si `vision.visible`, `rememberObservation` actualiza memoria con `source: "vision"` (gana ante un sonido simultáneo en `memory.ts`).
4. **Resultado observado:** el cono se dibuja verde, la memoria se actualiza; **no genera conducta**.

### Conducta actual (manual, no autónoma)

1. Clic en una celda → `handlePointerDown` fija `navigationGoal` y calcula ruta (A* o BFS).
2. `calculateRoute` devuelve estado, ruta, costo y métricas.
3. `advanceAlongPath` mueve al guardia por waypoints; `guardFacing` refleja el último tramo.
4. **Resultado observado:** el guardia se mueve solo si una persona lo indica; ver/u oír al jugador actualiza memoria pero jamás inicia persecución o investigación.

**Dominio del problema:** percepción y memoria están cerradas y probadas (H3); la conducta autónoma es el eslabón ausente (H4).

## 3. Identificación del comportamiento y FSM

### Estado actual

No existe FSM. La conducta se reduce a seguir waypoints manuales vía clic (límite explícito de H3: `docs/h3-percepcion-movimiento.md:60`). La percepción solo alimenta memoria y telemetría.

### FSM esperada (H4, objetivo aún no implementado)

| Estado | Entrada que lo dispara / condición | Salida |
|---|---|---|
| Patrullar | Inicio; búsqueda agotada; regreso completado | Siguiente punto de patrulla cíclico |
| Investigar | Sonido oído sin prioridad mayor (visión ausente) | Ruta a la posición del sonido |
| Perseguir | Visión válida (`frame.vision.visible`) | Ruta al jugador, memoria actualizada |
| Buscar | Pérdida de visión tras persecución | Búsqueda limitada alrededor de la última posición conocida |
| Regresar | Tiempo de búsqueda agotado | Ruta a un punto de patrulla válido |
| Capturado | Distancia al jugador ≤ umbral configurable (terminal) | Detiene la navegación; telemetría registra la transición |

Prioridad explícita: visión sobre sonido ante eventos simultáneos (coherente con `memory.ts`). Entradas ya disponibles: `frame.vision`, `frame.soundHeard`, `memory.lastKnownPosition`, `timeSinceLastPerception`. Salida por estado: objetivo de ruta + evento de transición. Ubicación prevista: `src/domain/behavior/` (ver `docs/arquitectura.md:96` y `docs/hitos.md` H4).

## 4. Pruebas y métodos de validación existentes

- **Tests automatizados** (6 archivos en `tests/`):
  - `tests/navigation/search.test.ts` — A*/BFS: ruta óptima, inicio=destino, endpoints inválidos, destino inaccesible.
  - `tests/navigation/pathFollower.test.ts` — consumo de waypoints, realineación, dirección, completado.
  - `tests/perception/perception.test.ts` — rango, cono, oclusión y esquinas, sonido.
  - `tests/perception/memory.test.ts` — última posición, fuente, prioridad de visión, validación numérica.
  - `tests/application/perceptionSimulation.test.ts` — coordinación sonido/visión y expiración.
  - `tests/model/grid.test.ts` — mapa, celdas bloqueadas, conversión mundo/celda.
- **Número oficial de pruebas:** 39 casos (6 archivos, ejecutados con `npm.cmd run test:run`).
- **Comandos:** `npm run validate` (typecheck + test + build), `npm run typecheck`, `npm run test:run`, `npm run build`. En Windows PowerShell `npm.ps1` queda bloqueado por la política de ejecución; usar `npm.cmd`.
- **Validación manual:** experimentos documentados en `docs/h3-percepcion-movimiento.md` (clics, `VISIBLE`, `OCLUIDO`, sonido fuera del cono, expiración, reinicio con R).
- **Telemetría:** `updateTelemetry` → HUD con causa visual, resultado sonoro, fuente y antigüedad de memoria.
- **Evidencia registrada:** `docs/evidencias/h3-validacion.md`.
- **Futuro:** tests de FSM en `tests/behavior/` (H4).

## 5. Hechos comprobados versus supuestos y dudas

| Hechos comprobados | Supuestos (a confirmar) | Dudas / preguntas abiertas |
|---|---|---|
| Percepción no altera conducta; solo memoria y HUD (`perceptionSimulation.ts`, límite H3) | La prioridad visión-sobre-sonido se reutilizará igual en las transiciones de la FSM | ¿El modo clic se conserva como herramienta de demostración o desaparece con la FSM? |
| No existe `src/domain/behavior/` (confirmado por exploración) | La captura se modelará como estado terminal "Capturado" | ¿Los puntos de patrulla se definen en `labLevel.ts` o en la escena? |
| Oclusión conservadora al tocar esquinas (`perception.ts:132`) | Los 5 estados de hitos + Capturado cubren el comportamiento requerido | ¿Qué tecla cubre pausa/avance por pasos para reproducibilidad (RF-09)? |
| Conteo real de pruebas: 39 (confirmado por ejecución; la versión anterior decía 39 y era correcto) | El umbral de captura tendrá un valor por defecto visible | ¿Dónde se expone y configura el umbral de captura? |
| `npm.ps1` bloqueado por ExecutionPolicy; `npm.cmd` funciona | La FSM se conecta a los sensores actuales sin reescribirlos | ¿Se conserva la alternancia A*/BFS (ESPACIO) dentro de los estados? |

## 6. Contexto mínimo viable para intervenir

Para implementar H4 con impacto controlado basta con:

- **Modificar (cableado):** `src/game/scenes/GameScene.ts` — reemplazar la decisión de destino por el estado activo, dibujar ruta/estado, manejar captura.
- **Crear:** `src/domain/behavior/` — FSM pura (estados, guardas, transiciones, registro), sin Phaser ni DOM.
- **Configurar:** `src/application/simulation/labLevel.ts` — puntos de patrulla configurables.
- **Reutilizar sin cambios:** `perceptionSimulation.ts` (sensores), `search.ts`/`pathFollower.ts` (locomoción), `memory.ts` (memoria), `grid.ts` (mapa).

Justificación: los sensores y la locomoción ya tienen pruebas; la FSM solo decide **qué objetivo** perseguir y **cuándo** cambiar, así que la alteración mínima es el nuevo módulo de dominio + su conexión en la escena + patrullas. Las reglas de dependencia (domain sin Phaser) y los tests existentes acotan el cambio. Tests nuevos en `tests/behavior/`.

## 7. Comandos, resultados y evidencias observadas

| Comando / acción | Resultado observado |
|---|---|
| `git branch --show-current` | Rama `main` |
| `git log --oneline -5` | `ce4c4e5` (Creacion de la Estructura Esperada), `a6659b2` (Initial commit) |
| `git status --short` | ` M GDD.md` (modificado, sin commitear) |
| `git show --stat ce4c4e5` | 7 archivos de documentación añadidos, 98 inserciones |
| `npm run validate` | Bloqueado: `npm.ps1` no se puede cargar por ExecutionPolicy |
| `npm.cmd run validate` | Inicia correctamente; `typecheck` sin errores; interrumpido por la persona antes de test/build |
| `npm.cmd run test:run` | **39 pruebas, 6 archivos, todos aprobados** (632 ms) |
| Conteo estático (`grep` de `it()` en `tests/`) | 35 coincidencias; 4 casos usan `test()` en lugar de `it()`, lo que explica la diferencia |

### Conclusión

El guardia hoy percibe y recuerda, pero no decide. La FSM de H4 es el punto de inserción: nueva carpeta `src/domain/behavior/`, conexión en `GameScene.ts` y patrullas configurables en `labLevel.ts`, con los sensores y la navegación actuales como entrada inalterada.
