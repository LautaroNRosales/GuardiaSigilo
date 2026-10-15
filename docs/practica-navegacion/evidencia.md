# Evidencia — práctica de navegación

Repositorio: https://github.com/LautaroNRosales/GuardiaSigilo.git
Commit inicial: 50465b4f5ba376ef9ed88692c2aef87b229f2768
Commit de implementación: cambios validados en working tree; commit final pendiente de autorización humana
Versión de entrega: commit final informado por el estudiante en la plataforma
Variante: A
Herramienta/modelo o trabajo manual: OpenCode; decisiones humanas en cada gate
Cambios previos: repositorio con upgrades 01–05 y validación verde (87 pruebas)
Línea base: npm run validate → typecheck + tests + build aprobados; 12 archivos de prueba, 87/87 pruebas

## Exploración mínima
| Capa | Ruta/símbolo | Capacidad comprobada |
|---|---|---|
| Búsqueda | src/domain/navigation/search.ts (findPathBfs, findPathAStar, SearchResult) | BFS unitario; A* unitario con estado, ruta, costo, nodos expandidos, frontera máxima |
| Seguimiento | src/domain/navigation/pathFollower.ts (advanceAlongPath) | Seguimiento de puntos por distancia máxima, sin dependencia del motor |
| Consumidor | src/application/simulation/navigationDemo.ts (calculateRoute), src/game/scenes/GameScene.ts (computeRoute) | calculateRoute elige BFS/A* y la escena reenvía el mapa efectivo y el algoritmo |
| Pruebas | tests/navigation/search.test.ts, tests/model/doors.test.ts, tests/behavior/patrol.test.ts | 87 pruebas verdes en la línea base |

Contraste y decisión humana: se comprobó que A* usaba costo fijo 1 y BFS una cola FIFO. Se contrastó con la capacidad existente calculateRoute y se decidió reutilizar findPathAStar con un parámetro EntryCost opcional, default 1, sin crear una interfaz nueva ni modificar GridMap. Spec/plan aprobados: Paso 3, antes de los cambios de código.

## Comparación común — fixture libre 5x3
Vecinos y desempate reales: cuatro vecinos cardinales en orden Norte, Este, Sur, Oeste; sólo celdas internas y no bloqueadas. BFS usa cola FIFO y descubre en ese orden. A* extrae el mínimo f = g + h, desempata por h y luego por orden de inserción. El desempate real se registra en src/domain/navigation/search.ts.

| Algoritmo | Estado | Ruta | Pasos | Costo | Expandidos | Frontera máxima |
|---|---|---|---:|---:|---|---|
| BFS | success | S=(0,1) a G=(4,1) por fila central | 4 | 4 | disponible en SearchResult; no transcriptado exacto para no inventar métrica | disponible en SearchResult; no transcriptado exacto |
| A* | success | S=(0,1) a G=(4,1) por fila central | 4 | 4 | disponible en SearchResult; no transcriptado exacto | disponible en SearchResult; no transcriptado exacto |

DFS: la traza S,A,C,X,G es una ruta de cuatro pasos, pero encontrarla primero no demuestra optimalidad porque DFS puede descubrir una rama profunda antes de otra más corta. BFS encuentra S,B,D,G de tres pasos en el mismo grafo.
Dijkstra: S=0 descubre A=1 y B=3; al extraer A=1, G=10; al extraer B=3, mejora G=6; la entrada válida de G da la ruta S-B-G con costo 6. Ambas rutas tienen dos acciones, pero sus costos difieren; no hay que terminar al descubrir G por primera vez porque puede mejorar.

Caso normal: franja lenta en (1,1),(2,1),(3,1) con costo 5; A* ponderado devuelve rodeo de 6 pasos y costo 6, sin entrar en las celdas lentas. Caso límite: la misma función con la franja restaurada a costo 1 devuelve 4 pasos y costo 4. Se probó que no se reutilizan costos anteriores por accidente.

## Criterio → evidencia
| Criterio | Prueba/archivo y comando o reproducción | Observado | Cumple/pendiente |
|---|---|---|---|
| BASE-AC1 | git status --short, git rev-parse HEAD, npm run validate | repo limpio en base; validación verde | Cumple |
| BASE-AC2 | tests/navigation/searchCommon.test.ts, fixture libre 5x3 | BFS y A* tienen 4 pasos y costo 4 | Cumple |
| BASE-AC3 | tests/navigation/searchCommon.test.ts | inicio=meta costo 0; barrera inaccesible; (-1,1) invalid-start y (5,1) invalid-goal | Cumple |
| BASE-AC4 | docs/practica-navegacion/spec.md y plan.md | spec/plan aprobados, decisión humana registrada | Cumple |
| A-AC1 | tests/navigation/terrainCost.test.ts | directa conceptual 4 pasos/costo 16; ponderado 6 pasos/costo 6 | Cumple |
| A-AC2 | tests/navigation/terrainCost.test.ts | sin franja: 4 pasos/costo 4 | Cumple |
| A-AC3 | tests/application/navigationDemo.test.ts | consumidor obtiene costo 6 con franja y costo 4 sin franja | Cumple |
| BASE-AC5 | npm run validate; revisión del diff | 100/100 pruebas, build OK, sin cambios fuera del alcance | Cumple |
| BASE-AC6 | URL, docs/practica-navegacion/, commit inicial/pending | tres documentos presentes; commit final pendiente de autorización humana | Pendiente de commit final |

## Registro mínimo de intervención
Prompts: Pasos 1 a 8 de la guía, variante A, con adaptación a rutas reales del repositorio.
Decisión tras incremento 1: aceptar A* ponderado por EntryCost con validación >= 1, BFS sin cambios, y agregar pruebas de fixture común y terreno lento.
Decisión tras incremento 2: aceptar conexión mediante calculateRoute(map, start, goal, algorithm, entryCost), preservando el modo unitario y añadiendo prueba del consumidor.
Validación final: npm run validate → typecheck + 15 archivos/100 pruebas + build correctos.
Diff revisado: src/domain/navigation/search.ts; src/application/simulation/navigationDemo.ts; src/game/scenes/GameScene.ts; tests/navigation/searchCommon.test.ts; tests/navigation/terrainCost.test.ts; tests/application/navigationDemo.test.ts; docs/practica-navegacion/*.md.
Conclusión: para esta variante, A* ponderado por costo de entrada es la opción adecuada. BFS sigue siendo la comparación unitaria y no es oráculo del mínimo ponderado; el rodeo de seis pasos y costo seis evita la franja de costo cinco sin modificar velocidad ni animator.
Limitaciones: la evidencia visual del juego no se automatizó; los costos son preferencias de navegación, no velocidades físicas. El commit final debe incluir los tres documentos y los cambios de código/pruebas antes de la entrega.