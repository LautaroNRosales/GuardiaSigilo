---
id: upgrade-01-patrulla-pausas-mirada
titulo: Spec — Patrulla con pausas y mirada direccional
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 01 — Patrulla con pausas y mirada direccional

## Problema

El guardia no tiene conducta autónoma: sólo se mueve cuando el jugador hace clic (`src/game/scenes/GameScene.ts:207` → `renderNavigation():212` → `updateGuardMovement():267`). Sin patrulla no hay ritmo de recorrido, ni pausas, ni mirada intencional, y la experiencia de sigilo no es observable sin intervención constante del jugador.

## Intención de diseño

Que el guardia recorra por sí mismo un circuito de cuatro puntos con una pausa breve en cada punto, y que durante la pausa su cono de visión mire fijo hacia el siguiente punto: anticipación visual de por dónde va a continuar.

## Objetivo

Agregar al guardia una patrulla cíclica autónoma con pausa por punto y mirada direccional durante la pausa, conservando el clic como destino temporal que se reintegra a la patrulla al llegar.

## Alcance

- Módulo de dominio puro `src/domain/behavior/patrol.ts`: estado de patrulla (punto destino, fase viaje/pausa, modo patrulla/manual, cuenta de pausa), transiciones y dirección de mirada.
- Circuito de cuatro puntos en `src/application/simulation/labLevel.ts` como `PATROL_POINTS` (celdas `(2,17)`, `(2,2)`, `(17,2)`, `(17,12)`).
- Integración en `src/game/scenes/GameScene.ts`:
  - ruta inicial desde `GUARD_START` al punto 1 con `calculateRoute`;
  - llegada a un punto → pausa de 1200 ms (`PATROL_PAUSE_MS`, constante) → ruta al siguiente punto;
  - durante la pausa `guardFacing` apunta fijo al siguiente punto (el cono de visión lo muestra);
  - clic con ruta válida → destino temporal (modo manual); al llegar, retoma la ruta al punto de patrulla actual;
  - clic en celda inalcanzable → la patrulla continúa sin cambios y el HUD informa el fallo;
  - ruta a un punto de patrulla fallida → se salta ese punto y se registra en el HUD;
  - telemetría de estado en el HUD: `PATRULLA n/4`, `PAUSA t`, `MANUAL`.
- Pruebas de dominio en `tests/behavior/patrol.test.ts`, incluida la verificación de que los cuatro puntos y `GUARD_START` son alcanzables entre sí por A* en `LAB_MAP`.

## Fuera de alcance

- Máquina de estados completa (Investigar, Perseguir, Buscar, Regresar) o cualquier otra conducta de H4.
- Reglas de percepción: distancia, ángulo, oclusión y sonido no cambian.
- Barrido oscilante de mirada durante la pausa.
- Sonido, medidor de alerta, puertas, cámara o efectos visuales de otros upgrades.
- Nuevas dependencias; arte o audio externo.

## Restricciones

- `src/domain/` no importa Phaser, DOM ni APIs del navegador; el módulo de patrulla es puro (tiempo y llegada se inyectan como argumentos).
- GameScene adapta y presenta; no decide reglas de la patrulla.
- TypeScript estricto; cambios chicos y diff revisado por incremento.
- Conservar los comportamientos preexistentes: clic, teclas, reinicio con R, navegación BFS/A*, telemetría existente.

## Caso normal

Al iniciar la escena el guardia calcula ruta al punto `(2,17)`, lo recorre, pausa 1200 ms mirando hacia `(2,2)`, continúa por el circuito en orden y repite indefinidamente. El jugador puede hacer clic en cualquier momento: el guardia va primero a ese destino y, al llegar, reanuda la ruta al punto de patrulla que tenía pendiente.

## Casos límite

1. Clic en celda inalcanzable o fuera del mapa: la ruta falla, el estado de patrulla no cambia, el guardia sigue su curso y el HUD informa `RUTA FALLIDA`.
2. Clic mientras el guardia está en pausa: la pausa se cancela, el destino manual se procesa y al llegar se reanuda la patrulla desde el mismo punto destino (el índice no se pierde).
3. Ruta calculada termina en el mismo instante en que el guardia llega a un punto de patrulla (`advanceAlongPath.completed`): la llegada sólo se registra una vez y genera una sola pausa.
4. Ruta hacia el siguiente punto de patrulla falla (punto bloqueado): se salta al siguiente punto del circuito con registro en HUD; con el mapa actual este caso no debería ocurrir y queda cubierto por prueba unitaria.
5. Reinicio con R durante una pausa: la escena reinicia y la patrulla vuelve al estado inicial reproducible.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| CA-1 | Al iniciar, el guardia comienza a recorrer la patrulla sin clic previo | Prueba unitaria del flujo `initialPatrol` + ejecución manual observando el arranque |
| CA-2 | Al llegar a un punto, el guardia permanece en pausa durante 1200 ms y recién entonces avanza al siguiente | Prueba unitaria de cuenta de pausa con `delta` inyectado + ejecución manual |
| CA-3 | Durante la pausa, `guardFacing` es el vector unitario hacia el siguiente punto de patrulla | Prueba unitaria de `patrolLookDirection` + observación del cono en ejecución |
| CA-4 | El circuito avanza en orden 0→1→2→3→0 (ciclo cíclico) | Prueba unitaria de avance e índice con módulo |
| CA-5 | Clic con ruta válida activa el modo manual y, al llegar, se reanuda la ruta al punto de patrulla pendiente | Prueba unitaria de `onArrival` en modo manual + ejecución manual |
| CA-6 | Clic en celda inalcanzable no altera la patrulla e informa el fallo | Ejecución manual reproducible con observación de HUD y continuidad del recorrido |
| CA-7 | Un fallo de ruta hacia el punto de patrulla salta al siguiente punto con registro | Prueba unitaria de `skipPatrolPoint` + revisión del manejo en GameScene |
| CA-8 | Los cuatro puntos del circuito y `GUARD_START` son alcanzables entre sí por A* en `LAB_MAP` | Prueba automatizada que ejecuta `calculateRoute` sobre el mapa real |
| CA-9 | R conserva el reinicio reproducible y el estado informado coincide con el comportamiento | Ejecución manual de R + suite completa sin regresiones (`npm run test:run`) |
| CA-10 | `npm run validate` finaliza correctamente y `src/domain/` no importa Phaser/DOM | Comando `npm run validate` + revisión de imports del diff |

## Evidencia prevista

- Salida de `npm run test:run` con el archivo nuevo `tests/behavior/patrol.test.ts` y las 39 pruebas existentes sin regresiones.
- Salida de `npm run validate` (typecheck + tests + build).
- Pasos de ejecución manual (`npm run dev`): arranque sin clic, pausa con mirada, clic temporal y retoma, clic inválido, reinicio con R — con el HUD como telemetría (`PATRULLA n/4`, `PAUSA`, `MANUAL`, `RUTA FALLIDA`).
- Diff por incremento revisado antes de continuar.
