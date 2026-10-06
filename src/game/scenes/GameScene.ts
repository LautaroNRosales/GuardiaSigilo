import Phaser from "phaser";
import {
  DOOR_CELLS,
  GUARD_START,
  GRID_HEIGHT,
  GRID_WIDTH,
  LAB_MAP,
  PATROL_POINTS,
  PLAYER_START,
  TILE_SIZE,
} from "../../application/simulation/labLevel";
import { calculateRoute } from "../../application/simulation/navigationDemo";
import {
  initialPerceptionState,
  updatePerceptionSimulation,
  withSoundEvent,
  type PerceptionSimulationState,
} from "../../application/simulation/perceptionSimulation";
import {
  beginManual,
  initialPatrol,
  onArrival,
  patrolLookDirection,
  patrolTarget,
  skipPatrolPoint,
  tick,
  type PatrolState,
} from "../../domain/behavior/patrol";
import {
  cellCenter,
  cellKey,
  isWalkable,
  worldToCell,
  type GridMap,
  type GridPoint,
} from "../../domain/model/grid";
import { canToggleDoor, openMapCells } from "../../domain/model/doors";
import type { Vector2 } from "../../domain/model/vector";
import { advanceAlongPath } from "../../domain/navigation/pathFollower";
import type { SearchAlgorithm, SearchResult, SearchStatus } from "../../domain/navigation/search";
import { timeSinceLastPerception } from "../../domain/perception/memory";
import type { VisionReason, VisionResult } from "../../domain/perception/perception";

const PLAYER_SPEED = 190;
const GUARD_SPEED = 115;
const VISION_RANGE = 220;
const FIELD_OF_VIEW = Math.PI / 2;
const SOUND_RADIUS = 190;
const SOUND_DURATION_MS = 800;
const PATROL_PAUSE_MS = 1200;
const NOTICE_DURATION_MS = 2000;
const STATUS_LABELS: Readonly<Record<SearchStatus, string>> = {
  success: "EXITO",
  unreachable: "INALCANZABLE",
  "invalid-start": "INICIO INVALIDO",
  "invalid-goal": "DESTINO INVALIDO",
};
const VISION_LABELS: Readonly<Record<VisionReason, string>> = {
  visible: "VISIBLE",
  "out-of-range": "FUERA DE RANGO",
  "outside-cone": "FUERA DEL CONO",
  occluded: "OCLUIDO",
  "invalid-facing": "DIRECCION INVALIDA",
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private guard!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveUp!: Phaser.Input.Keyboard.Key;
  private moveDown!: Phaser.Input.Keyboard.Key;
  private moveLeft!: Phaser.Input.Keyboard.Key;
  private moveRight!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private toggleAlgorithm!: Phaser.Input.Keyboard.Key;
  private emitSound!: Phaser.Input.Keyboard.Key;
  private toggleDoor!: Phaser.Input.Keyboard.Key;
  private navigationGraphics!: Phaser.GameObjects.Graphics;
  private perceptionGraphics!: Phaser.GameObjects.Graphics;
  private targetMarker!: Phaser.GameObjects.Arc;
  private lastKnownMarker!: Phaser.GameObjects.Arc;
  private navigationHud!: Phaser.GameObjects.Text;
  private navigationAlgorithm: SearchAlgorithm = "astar";
  private navigationGoal: GridPoint = GUARD_START;
  private navigationSummary: readonly string[] = [];
  private guardFacing: Vector2 = { x: -1, y: 0 };
  private guardWaypoints: readonly Vector2[] = [];
  private nextWaypoint = 0;
  private perceptionState: PerceptionSimulationState = initialPerceptionState();
  private patrolState!: PatrolState;
  private noticeHud!: Phaser.GameObjects.Text;
  private noticeExpiresAtMs = 0;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doorMarkers: Phaser.GameObjects.Rectangle[] = [];
  private openDoors = new Set<string>();
  private effectiveMap: GridMap = LAB_MAP;

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.navigationAlgorithm = "astar";
    this.navigationGoal = GUARD_START;
    this.guardFacing = { x: -1, y: 0 };
    this.guardWaypoints = [];
    this.nextWaypoint = 0;
    this.perceptionState = initialPerceptionState();
    this.patrolState = initialPatrol(
      PATROL_POINTS.map((point) => cellCenter(point, TILE_SIZE)),
    );
    this.noticeExpiresAtMs = 0;
    this.openDoors.clear();
    this.effectiveMap = LAB_MAP;
    this.doorMarkers = [];
    this.cameras.main.setBackgroundColor("#10161c");
    this.drawGrid();

    this.walls = this.physics.add.staticGroup();
    this.rebuildWalls();

    const spawn = cellCenter(PLAYER_START, TILE_SIZE);
    this.player = this.add.rectangle(spawn.x, spawn.y, 20, 20, 0xe5b454);
    this.player.setStrokeStyle(2, 0xffd98a);
    this.player.setDepth(4);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.moveUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.moveDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.moveLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.moveRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.toggleAlgorithm = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.emitSound = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.toggleDoor = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.perceptionGraphics = this.add.graphics().setDepth(1);
    this.navigationGraphics = this.add.graphics().setDepth(2);
    const guardPosition = cellCenter(GUARD_START, TILE_SIZE);
    this.guard = this.add
      .circle(guardPosition.x, guardPosition.y, 11, 0x6b8afd)
      .setStrokeStyle(2, 0xb9c5ff)
      .setDepth(4);
    this.targetMarker = this.add
      .circle(0, 0, 10, 0x000000, 0)
      .setStrokeStyle(3, 0x73c991)
      .setDepth(5);
    this.lastKnownMarker = this.add
      .circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xe16969)
      .setDepth(5)
      .setVisible(false);

    this.add
      .text(16, 14, "H3 / PERCEPCION Y MOVIMIENTO", {
        color: "#9eb4c2",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setDepth(10);

    this.navigationHud = this.add
      .text(GRID_WIDTH * TILE_SIZE - 16, 14, "", {
        align: "right",
        backgroundColor: "#10161ccc",
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.noticeHud = this.add
      .text(16, GRID_HEIGHT * TILE_SIZE - 14, "", {
        backgroundColor: "#10161ccc",
        color: "#f0c674",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0, 1)
      .setDepth(10);

    this.input.on("pointerdown", this.handlePointerDown, this);
    this.resumePatrolRoute();
    this.updatePerception(0);
  }

  public update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.scene.restart();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleAlgorithm)) {
      this.navigationAlgorithm = this.navigationAlgorithm === "astar" ? "bfs" : "astar";
      this.renderNavigation();
    }

    if (Phaser.Input.Keyboard.JustDown(this.emitSound)) {
      this.perceptionState = withSoundEvent(this.perceptionState, {
        position: { x: this.player.x, y: this.player.y },
        radius: SOUND_RADIUS,
        emittedAtMs: time,
        durationMs: SOUND_DURATION_MS,
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleDoor)) {
      this.handleDoorToggle();
    }

    if (this.patrolState.phase === "paused") {
      this.patrolState = tick(this.patrolState, delta);
      if (this.patrolState.phase === "travelling") {
        this.resumePatrolRoute();
      } else {
        const target = patrolTarget(this.patrolState);
        this.targetMarker.setPosition(target.x, target.y);
        const look = patrolLookDirection(this.patrolState, {
          x: this.guard.x,
          y: this.guard.y,
        });
        if (look) {
          this.guardFacing = look;
        }
      }
    }

    const horizontal = Number(this.cursors.right.isDown || this.moveRight.isDown)
      - Number(this.cursors.left.isDown || this.moveLeft.isDown);
    const vertical = Number(this.cursors.down.isDown || this.moveDown.isDown)
      - Number(this.cursors.up.isDown || this.moveUp.isDown);
    const velocity = new Phaser.Math.Vector2(horizontal, vertical);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(PLAYER_SPEED);
    }

    this.playerBody.setVelocity(velocity.x, velocity.y);
    this.updateGuardMovement(delta);
    this.updatePerception(time);

    if (this.noticeHud.text !== "" && time >= this.noticeExpiresAtMs) {
      this.noticeHud.setText("");
    }
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1b252d, 1);

    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      graphics.lineBetween(0, y * TILE_SIZE, GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }
  }

  private rebuildWalls(): void {
    this.walls.clear(true, true);
    for (const marker of this.doorMarkers) {
      marker.destroy();
    }
    this.doorMarkers = [];

    const doorKeys = new Set(DOOR_CELLS.map((cell) => cellKey(cell)));
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const cell = { x, y };
        if (isWalkable(this.effectiveMap, cell)) {
          continue;
        }
        const center = cellCenter(cell, TILE_SIZE);
        const isDoor = doorKeys.has(cellKey(cell));
        const wall = this.add.rectangle(
          center.x,
          center.y,
          TILE_SIZE,
          TILE_SIZE,
          isDoor ? 0x6b4a2b : 0x27333d,
        );
        wall.setStrokeStyle(1, isDoor ? 0xc99a5a : 0x3a4c58);
        this.walls.add(wall);
      }
    }

    for (const door of DOOR_CELLS) {
      if (!this.openDoors.has(cellKey(door))) {
        continue;
      }
      const center = cellCenter(door, TILE_SIZE);
      const marker = this.add
        .rectangle(center.x, center.y, TILE_SIZE - 6, TILE_SIZE - 6, 0x000000, 0)
        .setStrokeStyle(2, 0x73c991);
      marker.setDepth(1);
      this.doorMarkers.push(marker);
    }
  }

  private handleDoorToggle(): void {
    const playerCell = worldToCell({ x: this.player.x, y: this.player.y }, TILE_SIZE);
    const guardCell = worldToCell({ x: this.guard.x, y: this.guard.y }, TILE_SIZE);
    const door = DOOR_CELLS.find(
      (cell) => Math.abs(cell.x - playerCell.x) + Math.abs(cell.y - playerCell.y) <= 1,
    );
    if (!door) {
      this.showNotice("SIN PUERTA CERCA");
      return;
    }
    if (!canToggleDoor(playerCell, guardCell, door)) {
      this.showNotice("PUERTA BLOQUEADA");
      return;
    }

    const key = cellKey(door);
    const willOpen = !this.openDoors.has(key);
    if (willOpen) {
      this.openDoors.add(key);
    } else {
      this.openDoors.delete(key);
    }
    this.effectiveMap = openMapCells(
      LAB_MAP,
      DOOR_CELLS.filter((cell) => this.openDoors.has(cellKey(cell))),
    );
    this.rebuildWalls();
    this.showNotice(willOpen ? "PUERTA ABIERTA" : "PUERTA CERRADA");
    this.replanAfterDoorChange();
  }

  private replanAfterDoorChange(): void {
    if (this.patrolState.phase === "paused") {
      return;
    }

    if (this.patrolState.mode === "manual") {
      const result = this.computeRoute(this.navigationGoal);
      if (result.status !== "success") {
        this.showNotice("RUTA CORTADA, PATRULLA REANUDADA");
        this.resumePatrolRoute();
        return;
      }
      this.applyRoute(this.navigationGoal, result);
      return;
    }

    this.resumePatrolRoute();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const goalCell = worldToCell({ x: pointer.worldX, y: pointer.worldY }, TILE_SIZE);
    const result = this.computeRoute(goalCell);
    if (result.status !== "success") {
      this.showNotice("RUTA FALLIDA");
      return;
    }
    this.patrolState = beginManual(this.patrolState);
    this.applyRoute(goalCell, result);
  }

  private renderNavigation(): void {
    this.applyRoute(this.navigationGoal, this.computeRoute(this.navigationGoal));
  }

  private computeRoute(goalCell: GridPoint): SearchResult {
    const guardCell = worldToCell({ x: this.guard.x, y: this.guard.y }, TILE_SIZE);
    return calculateRoute(this.effectiveMap, guardCell, goalCell, this.navigationAlgorithm);
  }

  private applyRoute(goalCell: GridPoint, result: SearchResult): void {
    this.navigationGoal = goalCell;
    this.drawSearchResult(result);
    this.guardWaypoints = result.status === "success"
      ? result.path.map((point) => cellCenter(point, TILE_SIZE))
      : [];
    this.nextWaypoint = 0;

    const targetPosition = cellCenter(goalCell, TILE_SIZE);
    this.targetMarker.setPosition(targetPosition.x, targetPosition.y);
    this.targetMarker.setStrokeStyle(3, result.status === "success" ? 0x73c991 : 0xe16969);

    const cost = result.totalCost === null ? "-" : String(result.totalCost);
    const algorithm = result.algorithm === "astar" ? "A*" : "BFS";
    this.navigationSummary = [
      `${algorithm} / ${STATUS_LABELS[result.status]}`,
      `costo ${cost} | expandidos ${result.expandedNodes}`,
      `frontera maxima ${result.maximumFrontier}`,
    ];
  }

  private planPatrolLeg(): boolean {
    const targetCell = worldToCell(patrolTarget(this.patrolState), TILE_SIZE);
    const result = this.computeRoute(targetCell);
    this.applyRoute(targetCell, result);
    return result.status === "success";
  }

  private resumePatrolRoute(): void {
    if (this.planPatrolLeg()) {
      return;
    }
    this.patrolState = skipPatrolPoint(this.patrolState);
    this.showNotice("PUNTO DE PATRULLA INALCANZABLE, SALTADO");
    this.planPatrolLeg();
  }

  private showNotice(message: string): void {
    this.noticeHud.setText(message);
    this.noticeExpiresAtMs = this.time.now + NOTICE_DURATION_MS;
  }

  private drawSearchResult(result: SearchResult): void {
    this.navigationGraphics.clear();
    this.navigationGraphics.fillStyle(0x3b819c, 0.22);
    for (const point of result.explored) {
      this.navigationGraphics.fillRect(
        point.x * TILE_SIZE + 3,
        point.y * TILE_SIZE + 3,
        TILE_SIZE - 6,
        TILE_SIZE - 6,
      );
    }

    const firstPoint = result.path[0];
    if (!firstPoint) {
      return;
    }

    const firstCenter = cellCenter(firstPoint, TILE_SIZE);
    this.navigationGraphics.lineStyle(4, 0x62d0e8, 0.9);
    this.navigationGraphics.beginPath();
    this.navigationGraphics.moveTo(firstCenter.x, firstCenter.y);
    for (const point of result.path.slice(1)) {
      const center = cellCenter(point, TILE_SIZE);
      this.navigationGraphics.lineTo(center.x, center.y);
    }
    this.navigationGraphics.strokePath();
  }

  private updateGuardMovement(delta: number): void {
    const hasLeg = this.guardWaypoints.length > 0;
    const previous = { x: this.guard.x, y: this.guard.y };
    const movement = advanceAlongPath(
      previous,
      this.guardWaypoints,
      this.nextWaypoint,
      GUARD_SPEED * delta / 1000,
    );
    this.nextWaypoint = movement.nextWaypoint;
    this.guard.setPosition(movement.position.x, movement.position.y);

    if (movement.direction) {
      this.guardFacing = movement.direction;
    }

    if (hasLeg && movement.completed) {
      this.handleArrival();
    }
  }

  private handleArrival(): void {
    const mode = this.patrolState.mode;
    this.patrolState = onArrival(this.patrolState, PATROL_PAUSE_MS);
    if (mode === "manual") {
      this.resumePatrolRoute();
      return;
    }
    this.guardWaypoints = [];
    this.nextWaypoint = 0;
  }

  private updatePerception(time: number): void {
    const observer = { x: this.guard.x, y: this.guard.y };
    const target = { x: this.player.x, y: this.player.y };
    const frame = updatePerceptionSimulation(this.perceptionState, {
      map: this.effectiveMap,
      tileSize: TILE_SIZE,
      observer,
      facing: this.guardFacing,
      target,
      visionRange: VISION_RANGE,
      fieldOfViewRadians: FIELD_OF_VIEW,
      timeMs: time,
    });
    this.perceptionState = frame.state;

    this.drawPerception(frame.vision);
    this.updateTelemetry(time, frame.vision, frame.soundHeard);
  }

  private drawPerception(vision: VisionResult): void {
    this.perceptionGraphics.clear();
    const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
    const halfFieldOfView = FIELD_OF_VIEW / 2;
    this.perceptionGraphics.fillStyle(vision.visible ? 0x73c991 : 0x6b8afd, 0.16);
    this.perceptionGraphics.beginPath();
    this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
    this.perceptionGraphics.arc(
      this.guard.x,
      this.guard.y,
      VISION_RANGE,
      facingAngle - halfFieldOfView,
      facingAngle + halfFieldOfView,
    );
    this.perceptionGraphics.closePath();
    this.perceptionGraphics.fillPath();

    if (this.perceptionState.soundEvent) {
      this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
      this.perceptionGraphics.strokeCircle(
        this.perceptionState.soundEvent.position.x,
        this.perceptionState.soundEvent.position.y,
        this.perceptionState.soundEvent.radius,
      );
    }

    const lastKnown = this.perceptionState.memory.lastKnownPosition;
    this.lastKnownMarker.setVisible(lastKnown !== null);
    if (lastKnown) {
      this.lastKnownMarker.setPosition(lastKnown.x, lastKnown.y);
    }
  }

  private updateTelemetry(time: number, vision: VisionResult, soundHeard: boolean): void {
    const age = timeSinceLastPerception(this.perceptionState.memory, time);
    const memory = age === null
      ? "memoria -"
      : `memoria ${this.perceptionState.memory.source} ${(age / 1000).toFixed(1)}s`;
    const sound = this.perceptionState.soundEvent
      ? (soundHeard ? "OIDO" : "FUERA DE RANGO")
      : "-";

    this.navigationHud.setText([
      this.describePatrol(),
      ...this.navigationSummary,
      `vision ${VISION_LABELS[vision.reason]}`,
      `sonido ${sound}`,
      memory,
    ]);
  }

  private describePatrol(): string {
    const target = `${this.patrolState.targetIndex + 1}/${this.patrolState.points.length}`;
    if (this.patrolState.mode === "manual") {
      return `PATRULLA ${target} · MANUAL`;
    }
    if (this.patrolState.phase === "paused") {
      const remaining = (this.patrolState.pauseRemainingMs / 1000).toFixed(1);
      return `PATRULLA ${target} · PAUSA ${remaining}s`;
    }
    return `PATRULLA ${target} · EN RUTA`;
  }
}
