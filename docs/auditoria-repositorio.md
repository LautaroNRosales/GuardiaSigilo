---
id: laboratorio-guardia-sigilo-auditoria-repositorio
titulo: Auditoría del repositorio antes de los cambios
tipo: referencia
audiencia: estudiante
acceso: publico
version: 1
---

# Antes de los cambios

## Identificación

- Fecha: 14 de septiembre de 2026.
- Base inspeccionada: rama `main`, commit `a6659b2`.
- Alcance: repositorio completo.
- Propósito: registrar el estado actual del flujo estímulo → percepción → memoria → conducta y los puntos de verificación, para intervenir con precisión en las modificaciones posteriores (H4, máquina de estados).

## Objetivo

Documentar la ruta completa estímulo → percepción → memoria → conducta actual → verificación, con los puntos exactos de archivo/función donde un estímulo de visión o sonido entra y se procesa, y dónde se insertará la FSM (H4) para intervenir con precisión.

## Entregable

Crear `docs/auditoria-repositorio.md` (solo documentación, cero cambios de código) con:

### 1. Rutas de entrada del estímulo

- Sonido: tecla `Q` → `GameScene.update` (GameScene.ts:171) → `withSoundEvent` → `state.soundEvent`.
- Visión: sin evento externo, se evalúa cada frame en `GameScene.updatePerception` (GameScene.ts:283) → `updatePerceptionSimulation` (perceptionSimulation.ts:48).
- Posición del jugador y `guardFacing` como insumos de los sensores.
- Clic manual (nav) como conducta actual (GameScene.ts:207), no autónoma.

### 2. Procesamiento

- `evaluateVision` (perception.ts:35): rango → cono (dot con `facing`) → oclusión `lineIsOccluded`.
- `evaluateSound` (perception.ts:80): activo si `emittedAtMs ≤ t ≤ emittedAtMs + durationMs` y distancia ≤ radio.
- `updatePerceptionSimulation`: coordina sonido/visión y delega a `rememberObservation` (memory.ts:25) con prioridad de visión simultánea; expira el `soundEvent`.

### 3. Decisiones actuales (sin FSM todavía)

- La percepción sólo actualiza `lastKnownPosition`/`source`/`time`; NO cambia conducta (límite explícito de H3, `docs/h3-percepcion-movimiento.md:60`).
- Conducta actual: seguir waypoints manuales vía `advanceAlongPath` (GameScene.ts:267) y telemetría HUD.

### 4. Punto de inserción de la FSM (H4)

- Carpeta prevista `src/domain/behavior/` (arquitectura.md:96) con estados y prioridades esperadas según `docs/hitos.md` H4.
- Datos ya disponibles como entrada: `frame.vision`, `frame.soundHeard`, `memory.lastKnownPosition`, `timeSinceLastPerception`.
- Faltantes a intervenir: puntos de patrulla cíclicos y reemplazo del modo "clic" por decisión de estado.

### 5. Verificación de esos cambios

- Tests automatizados: `tests/perception/perception.test.ts`, `tests/perception/memory.test.ts`, `tests/application/perceptionSimulation.test.ts` (39 pruebas en `npm run test:run`).
- `npm run validate` (typecheck + test + build).
- Validación manual: experimentos de `docs/h3-percepcion-movimiento.md`.
- Telemetría: `updateTelemetry` (GameScene.ts:335) → HUD con causa visual, sonido y edad de memoria.
- Evidencia registrada: `docs/evidencias/h3-validacion.md`.

## Validación

- Como no toca código, `npm run validate` no es imprescindible; opcional correrlo para confirmar baseline saludable.