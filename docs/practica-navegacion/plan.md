# Plan — práctica de navegación
Estado: Aprobado
Variante: A
Spec: spec.md

| Incremento | Trabajo | Archivos reales | Criterios | Comprobación |
|---|---|---|---|---|
| 1 | Configurar A* ponderado y probar casos comunes y franja lenta | src/domain/navigation/search.ts; tests/navigation/searchCommon.test.ts; tests/navigation/terrainCost.test.ts | BASE-AC2, BASE-AC3, A-AC1, A-AC2 | npm run test:run |
| 2 | Conectar modo ponderado con calculateRoute y conservar modo unitario | src/application/simulation/navigationDemo.ts; src/game/scenes/GameScene.ts; tests/application/navigationDemo.test.ts | A-AC3, BASE-AC5 | npm run typecheck && npm run test:run |
| 3 | Validación final, diff y cierre de evidencia | docs/practica-navegacion/spec.md; docs/practica-navegacion/plan.md; docs/practica-navegacion/evidencia.md | BASE-AC1 a BASE-AC6 | npm run validate |

Referencia previa: comparación y casos comunes BASE-01 a BASE-04 completados.
Riesgos: A* ponderado pudo haber conservado totalCost = path.length - 1; se corrigió para devolver g(goal). El desempate de la franja puede elegir rodeo superior o inferior, por lo que las pruebas no exigen una ruta única.
Detenerse si: faltan permisos, hay cambios ajenos, conflicto de contrato, regresión nueva o se requiere dependencia/UI/refactorización fuera del alcance.
No crear commits ni publicar automáticamente.