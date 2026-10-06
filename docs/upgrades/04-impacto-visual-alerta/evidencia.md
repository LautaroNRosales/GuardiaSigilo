---
id: upgrade-04-impacto-visual-alerta-evidencia
titulo: Evidencia — Impacto visual de alerta
tipo: upgrade
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 04

**Fecha:** 2026-10-06 · **Rama:** `main` · **Punto de partida:** `dae8f05` · **Herramienta:** OpenCode (`opencode/big-pickle`)

## Automatización

| Verificación | Resultado |
|---|---|
| `npm.cmd run typecheck` | OK |
| `npm.cmd run test:run` | 78/78 (10 archivos), 4 nuevas en `tests/presentation/alertStyle.test.ts` |
| `npm.cmd run build` | OK, 24 módulos |
| `npm.cmd run validate` | OK (typecheck + tests + build) |
| Diff | No toca `src/domain/perception/` ni reglas de percepción; sin dependencias nuevas |
| Imports de `alertStyle.ts` | Sólo módulo propio; sin Phaser ni DOM |

**Hallazgo de las pruebas:** la primera versión del clamp trataba `+Infinity` como 0 en lugar de 1. Se corrigió en `alertStyle.ts` y se alineó el mismo contrato en `visionConeStyle.ts` (con aserción agregada en su test), aprobado por el usuario en el gate del incremento 2.

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-1 Destello + aviso `¡ALERTA!` al entrar en `visible` | Checklist manual pasos 2 y 5 | OK |
| CA-2 Destello decae en ~600 ms hasta borde fino | Checklist manual paso 3 | OK |
| CA-3 Borde fino persistente sin parpadeo mientras `visible` | Checklist manual paso 3 | OK |
| CA-4 Borde se apaga al dejar de estar `visible` | Checklist manual paso 4 | OK |
| CA-5 Estilos puros con decaimiento monótono y clamp | Pruebas de `alertStyle` | OK (inactivo alpha 0; reposo 0.35/2; flash 0.85/6; clamp −2/5/NaN/+∞) |
| CA-6 `R` sin residuos y avisos previos conservan su color | Checklist manual pasos 1 y 6 | OK |
| CA-7 `validate` OK, módulo sin Phaser, reglas intactas | Comando + revisión de diff | OK |

## Checklist manual (http://localhost:5173) — 6/6 OK

1. Inicio sin borde rojo ni aviso — **OK**
2. Detección → destello fuerte + `¡ALERTA!` en rojo — **OK**
3. Decaimiento a ~0,6 s hasta borde fino estable — **OK**
4. Pérdida de visión → borde apagado — **OK**
5. Reentradas repetidas → destello + aviso cada vez, sin efectos intermedios — **OK**
6. `R` limpio; avisos de puertas/patrulla en color ámbar original — **OK**

## Registros

- Spec/plan previos: `docs/upgrades/04-impacto-visual-alerta/spec.md` y `plan.md`.
- Decisiones de diseño registradas en la spec (disparador = `visible`; destello + texto; persistente).
- Matriz de estados (commit): 2 incrementos con validación `typecheck + tests + build` por cierre.

## Decisión

Evidencia suficiente para integrar: **sí** (con autorización del usuario para el commit).
