---
id: upgrade-04-impacto-visual-alerta
titulo: Spec — Impacto visual de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Upgrade 04 — Impacto visual de alerta

## Problema

Hoy la única señal de que el guardia te detectó es el color del cono y la palabra `VISION VISIBLE` en el HUD. No hay ningún impacto perceptible en el momento exacto en que pasas a estar visto, ni señal persistente de que sigues a la vista.

## Intención de diseño

Un evento claro al entrar en alerta (destello + aviso) y una señal sutil constante mientras la detección dure, sin marear al jugador ni tocar reglas.

## Decisiones de diseño (usuario)

1. **Disparador**: la razón pasa a `visible` (false→true). El oído queda cubierto por cono/HUD.
2. **Efectos al entrar**: destello de borde rojo que decae (~600 ms) + aviso `¡ALERTA!` en rojo.
3. **Persistente**: mientras `visible` se mantiene un borde rojo fino de baja intensidad; el destello fuerte es sólo al entrar.

## Alcance

- `src/game/presentation/alertStyle.ts` (nuevo, sin Phaser ni DOM):
  - `alertStyle(isAlertActive, flashProgress)` → `{ borderColor, borderAlpha, borderWidth }`;
  - inactivo → alpha 0; activo en reposo → borde fino (alpha ~0.35, ancho 2); con `flashProgress` alto → borde fuerte (alpha ~0.85, ancho 6);
  - `flashProgress ∈ [0,1]` amortiguado fuera del rango.
- `src/game/scenes/GameScene.ts`:
  - seguimiento de la detección (antes/después de `vision.visible`); al entrar: registrar instante y `showNotice("¡ALERTA!", "#ff6b6b")` (`showNotice` gana color opcional, default blanco);
  - `flashProgress = 1 − min(1, (tiempo − entrada) / 600 ms)`;
  - capa `alertGraphics` (por encima del tablero, por debajo del HUD) que pinta un rectángulo de borde según `alertStyle`; reinicio en `create`.
- Pruebas en `tests/presentation/alertStyle.test.ts`.

## Fuera de alcance

- Shake de cámara, sonidos, partículas o texto grande centrado.
- Medidor numérico de alerta (upgrade 05) y máquina de estados H4 (fuera de alcance).
- Cambios en `src/domain/perception/` o en el cono (upgrade 03).
- Nuevas dependencias.

## Restricciones

- Módulo de presentación sin Phaser/DOM (valores numéricos compatibles con `Graphics.lineStyle`).
- TypeScript estricto; conservar sonido, memoria, HUD, cono y upgrades 01–03.

## Caso normal

Al entrar en la línea de visión del guardia, la pantalla recibe un destello rojo de borde que decae en ~0,6 s y aparece el aviso `¡ALERTA!` en rojo; mientras sigas a la vista permanece un borde rojo fino; al salir de su cono el borde desaparece.

## Casos límite

1. Detectado en el primer cuadro → sin destello (progress 0), sólo estado activo.
2. Pérdida y recuperación rápida de la vista → cada entrada reinicia destello y aviso.
3. `flashProgress` fuera de `[0,1]` o no finito → amortiguado a `[0,1]`.
4. Reinicio con `R` → sin destello ni borde residual (`create` limpia estado).
5. Cambios de razón que no pasan por `visible` (ocluido↔fuera de rango) → sin efecto de alerta.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| CA-1 | Al pasar a `visible` aparece el destello rojo y el aviso `¡ALERTA!` en rojo | Ejecución manual |
| CA-2 | El destello decae a los ~600 ms hasta el borde fino sin desaparecer del todo | Ejecución manual |
| CA-3 | Mientras `visible` persiste, el borde fino rojo se mantiene sin parpadeo | Ejecución manual |
| CA-4 | Al dejar de estar `visible` el borde se apaga | Ejecución manual |
| CA-5 | Estilos puros: inactivo alpha 0; activo con decaimiento monótono y clamp | Prueba unitaria de `alertStyle` |
| CA-6 | `R` reinicia sin residuos visuales | Ejecución manual |
| CA-7 | `npm run validate` OK, `alertStyle.ts` sin Phaser y reglas de percepción intactas | Comando + revisión de diff |

## Evidencia prevista

- `npm.cmd run test:run` con `tests/presentation/alertStyle.test.ts` y las 74 previas sin regresiones.
- `npm.cmd run validate`.
- Checklist manual (detección, decaimiento, persistencia, salida, `R`).
- Diff por incremento.
