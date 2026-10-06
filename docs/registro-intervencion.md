---
id: laboratorio-registro-intervencion
titulo: Registro de intervención agéntica — Laboratorio Eje 04
tipo: registro
audiencia: docente
acceso: publico
version: 1
---

# Registro de intervención agéntica

- Fecha: 2026-10-06.
- Objetivo y criterio de aceptación: completar 5 upgrades del catálogo (patrulla con pausas y mirada direccional, puertas y rutas bloqueables, cono de visión reactivo, impacto visual de alerta, medidor de alerta), cada uno con spec + plan + incrementos validados + evidencia manual + commit, sin regresiones y con `npm run validate` en verde.
- Estado inicial: rama `main`, commit `c64f6c8` (baseline con 39 pruebas en verde).
- Herramienta y modelo declarados: OpenCode (`opencode/big-pickle`); comandos `npm.cmd run typecheck | test:run | build | validate`; servidor de desarrollo `npm run dev` (HTTP 200) para verificación manual.

| Orden | Entrada relevante | Acción o herramienta | Resultado observable | Decisión humana |
|---:|---|---|---|---|
| 1 | Registro de entorno y baseline | Lectura de `AGENTS.md`, specs y arquitectura; `validate` | 39 pruebas en verde | Aceptar punto de partida |
| 2 | Cambios preexistentes del repo | `git add GDD.md docs/auditoria-repositorio.md` | Commit inicial `c64f6c8` | Autorizado por el usuario |
| 3 | Selección del paquete de 5 upgrades | Exploración read-only de escena/percepción/navegación | Mapa de hallazgos y del H4 pendiente (fuera de alcance) | Elegir upgrades 1, 2, 4, 8 y 10 del catálogo |
| 4 | Ciclo upgrade 01 — patrulla | Preguntas de diseño → spec/plan → 2 incrementos → 22 pruebas | Circuito de 4 puntos con pausa 1200 ms, mirada al objetivo, clic temporal | Aprobó diseño e incrementos; checklist manual 7/7; commit `029d110` |
| 5 | Ciclo upgrade 02 — puertas | Preguntas → spec/plan → 3 incrementos → 8 pruebas | `E` abre/cierra puertas; ruta A* recalculada sobre mapa efectivo | Aprobó diseño; checklist 7/7; commit `19f7b1d` |
| 6 | Ciclo upgrade 03 — cono reactivo | Preguntas → spec/plan → función pura + conexión en escena → 5 pruebas | Cono coloreado por razón de amenaza con destello de 350 ms | Aprobó color por amenaza, sin leyenda; checklist 7/7; commit `dae8f05` |
| 7 | Ciclo upgrade 04 — impacto de alerta | Preguntas → spec/plan → 4 pruebas; prueba detectó bug | Destello de borde + `¡ALERTA!` + borde fino persistente | Aprobó disparador/efectos/persistencia; **aprobó corrección**: clamp `+Infinity` → 1 en `alertStyle` y `visionConeStyle`; checklist 6/6; commit `5e9d47f` |
| 8 | Ciclo upgrade 05 — medidor | Preguntas → spec/plan → regla de dominio + estilo → 9 pruebas | Barra + `alerta X.XX` inferior derecha; 1 → 0 en 6 s (visión), 0.6 → 0 en 3 s (sonido) | Aprobó fórmula, posición y formato; checklist 6/6; commit `8590212` |
| 9 | Cierre | `npm.cmd run validate` global | 87/87 pruebas, build 26 módulos, typecheck OK | Aceptar |

## Cierre

- Archivos modificados: `src/domain/behavior/patrol.ts`, `src/domain/model/doors.ts`, `src/domain/perception/alertLevel.ts`, `src/application/simulation/labLevel.ts`, `src/game/scenes/GameScene.ts`, `src/game/presentation/{visionConeStyle,alertStyle,alertMeterStyle}.ts`, `tests/{behavior/patrol,model/doors,perception/alertLevel,presentation/*}.test.ts`, `docs/upgrades/01..05/*` (spec/plan/evidencia), este registro.
- Validaciones: `npm.cmd run typecheck`, `test:run` (87/87), `build` (26 módulos) y `validate` por upgrade y al cierre; todos en verde.
- Correcciones humanas: 6 preguntas de diseño por upgrade aprobadas; 1 bug de clamp detectado por pruebas y corregido con aprobación; 5 checklists manuales confirmados (7/7, 7/7, 7/7, 6/6, 6/6).
- Riesgos pendientes: FSM de alerta (H4) fuera de alcance; evidencia visual manual (sin automatización de navegador); warning de chunk >500 kB preexistente; latencia/costo de iteración no medidos (RA9 sólo cuando corresponda).
- Estado final: rama `main`, commit `8590212` (más este registro en el commit de cierre).

No registrar cadenas de pensamiento privadas, credenciales ni conversaciones irrelevantes.
