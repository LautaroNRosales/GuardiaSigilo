---
id: upgrade-05-medidor-alerta-evidencia
titulo: Evidencia — Medidor de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 05

**Fecha:** 2026-10-06 · **Rama:** `main` · **Punto de partida:** `5e9d47f` · **Herramienta:** OpenCode (`opencode/big-pickle`)

## Automatización

| Verificación | Resultado |
|---|---|
| `npm.cmd run typecheck` | OK |
| `npm.cmd run test:run` | 87/87 (12 archivos), 9 nuevas (`tests/perception/alertLevel.test.ts` + `tests/presentation/alertMeterStyle.test.ts`) |
| `npm.cmd run build` | OK, 26 módulos |
| `npm.cmd run validate` | OK (typecheck + tests + build) |
| Diff | No toca reglas de percepción existentes; sin dependencias nuevas |
| Arquitectura | `alertLevel.ts` en dominio puro (sin Phaser/DOM); `alertMeterStyle.ts` en presentación sin Phaser/DOM |

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-1 `visible → 1`; decaimientos 1→0/6 s (visión) y 0.6→0/3 s (sonido) | Pruebas de valores de referencia | OK (t=0, t=ventana/2, t=ventana, t=2×ventana) |
| CA-2 Sin memoria → 0; saturación en 0; rango `[0,1]`; tiempo no finito → `throw` | Pruebas unitarias | OK |
| CA-3 Color por tercios, clamp y error ante nivel no finito | Pruebas de `alertMeterStyle` | OK (verde <1/3 ≤ ámbar <2/3 ≤ rojo; −5→verde, 5→rojo; NaN/∞ → throw) |
| CA-4 Barra y número se actualizan por cuadro y coinciden con la situación | Checklist manual pasos 1–4 | OK |
| CA-5 Transiciones verde → ámbar → rojo | Checklist manual pasos 2–4 + pruebas de tercios | OK |
| CA-6 Reglas y upgrades previos intactos; módulos sin Phaser | Suite sin regresiones + revisión de diff | OK (87/87) |
| CA-7 `validate` OK | Comando | OK |

## Checklist manual (http://localhost:5173) — 6/6 OK

1. Inicio: barra vacía, `alerta 0.00` verde — **OK**
2. Detección → salta a `alerta 1.00`, barra roja llena — **OK**
3. Decaimiento ~6 s con cambio rojo → ámbar → verde hasta `0.00` — **OK**
4. `Q` → sube a ~`0.60` ámbar y baja en ~3 s — **OK**
5. Sin valores fuera de `[0,0.99]…[0,1.00]`, sin negativos ni saltos — **OK**
6. `R` reinicia en `0.00`; sin superposición con avisos ni HUD — **OK**

## Registros

- Spec/plan previos: `docs/upgrades/05-medidor-alerta/spec.md` y `plan.md`.
- Decisiones de diseño (fórmula, posición, formato) registradas en la spec.
- Matriz de estados (commit): 2 incrementos con validación `typecheck + tests + build` por cierre.

## Decisión

Evidencia suficiente para integrar: **sí** (con autorización del usuario para el commit).
