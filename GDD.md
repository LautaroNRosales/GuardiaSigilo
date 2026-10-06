# Guardia de Sigilo — Documento de Diseño de Juego

## Antes de los cambios

### Experiencia de juego actual

Escena 2D cenital con cuadrícula de 30×20 celdas (32 px). Paredes y pasillos estáticos generados por código; sin arte externo.

El jugador se desplaza con WASD o flechas a 190 px/s y colisiona con las paredes. Se representa como un rectángulo dorado.

El guardia es un círculo azul que permanece estático hasta que el jugador hace clic en una celda. El clic calcula una ruta con A* o BFS (alternable con ESPACIO) y el guardia la recorre a 115 px/s sin planificar por sí mismo.

El cono visual de 90° y 220 px se dibuja en cada cuadro; cuando detecta al jugador dentro del rango y sin pared entre ambos, cambia de azul a verde. Un sonido se emite con Q (radio 190 px, duración 800 ms) y se dibuja como un círculo amarillo. La memoria conserva la última posición conocida (marcador rojo), la fuente y la antigüedad. Un HUD en la esquina superior derecha muestra algoritmo, costo, nodos expandidos, frontera máxima, razón visual, estado sonoro y tiempo desde la última percepción.

R reinicia la escena al estado inicial reproducible.

### Problema concreto

La percepción se evalúa y almacena, pero no produce transiciones de comportamiento. El guardia no patrulla, no investiga, no persigue, no busca y no regresa. Sin máquina de estados, no hay cambios de conducta observables, prioridades entre eventos ni telemetría de transiciones. El jugador puede provocar eventos (posición, sonido), pero el guardia no reacciona de forma autónoma.

### Conducta esperada

- El guardia recorre puntos de patrulla cíclicos al iniciar y al regresar de una investigación fallida.
- Un sonido dentro del radio activa Investigación si no existe una prioridad mayor.
- Visión válida activa Perseguir y actualiza la última posición conocida.
- Pérdida de percepción inicia una búsqueda limitada en el tiempo alrededor de la última posición conocida.
- Agotada la búsqueda, el guardia regresa a un punto de patrulla válido.
- Captura al alcanzar una distancia configurable del jugador.
- Cada transición queda registrada con estado anterior, evento y estado nuevo.

### Reglas

- Mapa rectangular de 30×20 celdas de 32 px con paredes estáticas.
- Velocidad del jugador: 190 px/s. Velocidad del guardia: 115 px/s.
- Campo visual: 90°, alcance: 220 px.
- Radio sonoro: 190 px, duración del evento: 800 ms.
- Colisión con paredes para jugador y guardia.
- Estados: Patrullar, Investigar, Perseguir, Buscar, Regresar.
- Prioridad: visión sobre sonido ante eventos simultáneos.
- El guardia dentro del estado Buscar solo explora alrededor de la última posición conocida sin usar información no percibida.

### Restricciones

- TypeScript en modo estricto.
- `src/domain/` no puede importar Phaser, DOM ni APIs del navegador.
- Sin recursos externos necesarios para ejecutar el escenario base.
- Sin efectos laterales al importar módulos de dominio.
- Pruebas de dominio ejecutables en Node sin crear un juego Phaser.
- Comandos únicos para desarrollo, pruebas, tipos, compilación y validación completa.

### Fuera de alcance

- Arte, animaciones o audio de producción.
- Combate, inventario o narrativa ramificada.
- Multijugador.
- Generación procedural de niveles.
- Modelos generativos durante la ejecución.
- Servidor, base de datos o autenticación.
- Implementación obligatoria de behavior trees, Utility AI o GOAP.

### Caso límite

El guardia persigue al jugador y este se detiene justo en la distancia de captura. El guardia debe registrar la captura, detener la navegación y el estado informado debe coincidir con el comportamiento ejecutado: no continúa recorriendo waypoints, no permanece en Perseguir ni transiciona a Buscar. La última posición conocida queda en la posición de captura y la telemetría refleja la transición correcta.