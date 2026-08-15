import Phaser from "phaser";
import {
  GRID,
  enemyPosition,
  getLevel,
  isPressActive,
  type Facing,
  type Point,
  type SimState,
} from "./simulation";

const TILE = 58;
const ORIGIN_X = 36;
const ORIGIN_Y = 34;
const WIDTH = 768;
const HEIGHT = 570;
const keyOf = (x: number, y: number): string => `${x},${y}`;

type LooseLevelMechanics = {
  weight?: unknown;
  weights?: unknown;
  weightStart?: unknown;
  plate?: unknown;
  plates?: unknown;
};

export class FactoryScene extends Phaser.Scene {
  private ink!: Phaser.GameObjects.Graphics;
  private fog!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private state: SimState | null = null;
  private explored: ReadonlySet<string> | undefined;
  private planning = false;
  private readonly onReady: (scene: FactoryScene) => void;

  constructor(onReady: (scene: FactoryScene) => void) {
    super("factory");
    this.onReady = onReady;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#070910");
    this.ink = this.add.graphics().setDepth(5);
    this.fog = this.add.graphics().setDepth(80);
    this.onReady(this);
  }

  /**
   * explored is optional so existing callers continue to reveal the full board.
   * Keys use the compact "x,y" form. Current vision is always centered on the robot.
   */
  showState(state: SimState, explored?: ReadonlySet<string>, planning = false): void {
    this.state = state;
    this.explored = explored;
    this.planning = planning;
    if (this.ink) this.draw();
  }

  pulse(kind: "beat" | "impact" | "win"): void {
    if (kind === "impact") {
      this.cameras.main.shake(180, 0.018);
      this.cameras.main.flash(140, 170, 31, 42);
    } else if (kind === "win") {
      this.cameras.main.flash(220, 54, 244, 154);
    } else {
      this.cameras.main.shake(35, 0.0013);
    }
  }

  private text(
    x: number,
    y: number,
    value: string,
    size: number,
    color: string,
    align: "left" | "center" = "left",
    hud = false,
  ): void {
    const label = this.add.text(x, y, value, {
      fontFamily: '"Arial Black", "Trebuchet MS", sans-serif',
      fontSize: `${size}px`,
      color,
      align,
      stroke: "#080a0f",
      strokeThickness: Math.max(2, Math.floor(size / 7)),
    });
    label.setOrigin(align === "center" ? 0.5 : 0, 0.5);
    label.setResolution(2);
    label.setDepth(hud ? 100 : 20);
    this.labels.push(label);
  }

  private isVisible(x: number, y: number): boolean {
    if (!this.explored || !this.state) return true;
    const dx = Math.abs(x - this.state.robot.x);
    const dy = Math.abs(y - this.state.robot.y);
    const radius = this.planning ? 3 : 2;
    return dx <= radius && dy <= radius && dx + dy <= radius + 1;
  }

  private isKnown(x: number, y: number): boolean {
    return this.isVisible(x, y) || this.explored?.has(keyOf(x, y)) === true;
  }

  private draw(): void {
    const state = this.state;
    if (!state) return;
    const level = getLevel(state.level);
    const g = this.ink;
    g.clear();
    this.fog.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];

    // Recessed steel display bay.
    g.fillStyle(0x121724, 1);
    g.fillRoundedRect(9, 8, WIDTH - 18, HEIGHT - 16, 9);
    g.fillStyle(0x343e50, 1);
    g.fillRect(15, 14, WIDTH - 30, 7);
    g.fillRect(15, 14, 7, HEIGHT - 28);
    g.fillStyle(0x070a10, 1);
    g.fillRect(22, 21, WIDTH - 44, HEIGHT - 42);
    g.lineStyle(2, 0x56647a, 0.55);
    g.strokeRect(18, 17, WIDTH - 36, HEIGHT - 34);

    for (let y = 0; y < GRID.height; y += 1) {
      for (let x = 0; x < GRID.width; x += 1) this.drawFloor(x, y);
    }

    level.conveyors.forEach((belt) => {
      if (this.isKnown(belt.x, belt.y)) this.drawConveyor(belt.x, belt.y, belt.direction, state.beat);
    });
    if (this.isKnown(level.target.x, level.target.y)) this.drawTarget(level.target);

    const mechanics = level as unknown as LooseLevelMechanics;
    this.pointsFrom(mechanics.plates ?? mechanics.plate).forEach((plate, index) => {
      if (this.isKnown(plate.x, plate.y)) this.drawPlate(plate, index, state);
    });

    level.presses.forEach((press, index) => {
      if (this.isKnown(press.x, press.y)) this.drawPress(press, index, state);
    });

    level.walls.forEach((wall) => {
      if (this.isKnown(wall.x, wall.y) && (!level.door || !this.same(wall, level.door) || !state.doorOpen)) {
        this.drawWall(wall.x, wall.y);
      }
    });
    if (level.door && this.isKnown(level.door.x, level.door.y)) this.drawDoor(level.door, state.doorOpen);
    if (level.panel && this.isKnown(level.panel.x, level.panel.y)) this.drawPanel(level.panel, state.doorOpen);

    const looseState = state as unknown as Record<string, unknown>;
    this.pointsFrom(looseState.weight ?? mechanics.weights ?? mechanics.weight ?? mechanics.weightStart).forEach((weight) => {
      if (this.isKnown(weight.x, weight.y)) this.drawWeight(weight.x, weight.y);
    });

    // Moving hazards are not left as misleading map-memory ghosts.
    level.enemies.forEach((enemy) => {
      const position = enemyPosition(enemy, state.beat);
      if (this.isVisible(position.x, position.y)) this.drawEnemy(position.x, position.y);
    });

    if (state.crate && this.isKnown(state.crate.x, state.crate.y)) {
      this.drawCrate(state.crate.x, state.crate.y, state.status === "won");
    }
    this.drawRobot(state);
    this.drawFog();

    // HUD sits above fog and keeps the four-beat rhythm readable.
    g.fillStyle(0x090c13, 1);
    g.fillRect(27, 14, 98, 15);
    for (let index = 0; index < 4; index += 1) {
      g.fillStyle(state.beat % 4 === index ? 0xffd34e : 0x344052, 1);
      g.fillRect(34 + index * 21, 18, 15, 7);
      if (state.beat % 4 === index) {
        g.fillStyle(0xfff0a6, 1);
        g.fillRect(36 + index * 21, 19, 11, 2);
      }
    }
    this.text(WIDTH - 76, 24, `SHIFT ${state.level + 1} · B${String(state.beat).padStart(2, "0")}`, 12, "#f5cf69", "center", true);
  }

  private drawFloor(x: number, y: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    const panel = (x + y) % 2 === 0 ? 0x202a36 : 0x1d2632;

    // Straight, orthogonal steel deck plates. Narrow gutters keep the grid legible
    // without the optical-motion effect of the old diamond facets.
    g.fillStyle(0x080b11, 1);
    g.fillRect(px, py, TILE - 1, TILE - 1);
    g.fillStyle(panel, 1);
    g.fillRoundedRect(px + 3, py + 3, TILE - 7, TILE - 7, 2);
    g.fillStyle(0x2b3745, 1);
    g.fillRect(px + 5, py + 5, TILE - 11, 3);
    g.fillStyle(0x141b25, 1);
    g.fillRect(px + 5, py + TILE - 9, TILE - 11, 3);
    g.lineStyle(1, 0x3e4b5c, 0.65);
    g.strokeRoundedRect(px + 5.5, py + 5.5, TILE - 12, TILE - 12, 1);

    // Identical recessed fasteners are the only surface detail; every unique
    // floor marking is reserved for something the player can use or avoid.
    for (const [bx, by] of [[9, 10], [TILE - 11, 10], [9, TILE - 12], [TILE - 11, TILE - 12]]) {
      g.fillStyle(0x0b1018, 1);
      g.fillCircle(px + bx, py + by, 2.1);
      g.fillStyle(0x637083, 0.65);
      g.fillCircle(px + bx - 0.5, py + by - 0.5, 0.75);
    }
  }

  private same(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private pointsFrom(value: unknown): Point[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.filter((item): item is Point => {
      if (!item || typeof item !== "object") return false;
      const point = item as Partial<Point>;
      return typeof point.x === "number" && typeof point.y === "number";
    });
  }

  private drawTarget(target: Point): void {
    const tx = ORIGIN_X + target.x * TILE;
    const ty = ORIGIN_Y + target.y * TILE;
    const g = this.ink;
    g.fillStyle(0x0a171a, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(tx + 29, ty + 5), new Phaser.Math.Vector2(tx + 52, ty + 28),
      new Phaser.Math.Vector2(tx + 29, ty + 51), new Phaser.Math.Vector2(tx + 6, ty + 28),
    ], true);
    g.lineStyle(3, 0x52e8bd, 1);
    g.strokePoints([
      new Phaser.Math.Vector2(tx + 29, ty + 6), new Phaser.Math.Vector2(tx + 51, ty + 28),
      new Phaser.Math.Vector2(tx + 29, ty + 50), new Phaser.Math.Vector2(tx + 7, ty + 28),
    ], true);
    for (let offset = 0; offset < 3; offset += 1) {
      g.fillStyle(offset === 1 ? 0x8bffe1 : 0x287c70, 1);
      g.fillTriangle(tx + 17 + offset * 10, ty + 21, tx + 23 + offset * 10, ty + 28, tx + 17 + offset * 10, ty + 35);
    }
    if (this.isVisible(target.x, target.y)) this.text(tx + 29, ty + 8, "DISPATCH", 8, "#78f7d4", "center");
  }

  private drawConveyor(x: number, y: number, direction: Facing, beat: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    g.fillStyle(0x0a1018, 1);
    g.fillRect(px + 3, py + 9, TILE - 8, TILE - 17);
    g.fillStyle(0x334b59, 1);
    g.fillRect(px + 5, py + 12, TILE - 12, TILE - 23);
    g.lineStyle(3, 0x7893a0, 1);
    g.strokeRect(px + 4, py + 10, TILE - 10, TILE - 19);
    for (let roller = 0; roller < 4; roller += 1) {
      g.fillStyle(roller === beat % 4 ? 0x66e4dd : 0x172b35, 1);
      if (direction === "left" || direction === "right") g.fillRect(px + 10 + roller * 11, py + 18, 6, 23);
      else g.fillRect(px + 17, py + 14 + roller * 9, 24, 5);
    }
    const cx = px + 29;
    const cy = py + 29;
    g.fillStyle(0xc9f8ed, 1);
    if (direction === "right") g.fillTriangle(cx - 7, cy - 7, cx + 8, cy, cx - 7, cy + 7);
    else if (direction === "left") g.fillTriangle(cx + 7, cy - 7, cx - 8, cy, cx + 7, cy + 7);
    else if (direction === "up") g.fillTriangle(cx - 7, cy + 7, cx, cy - 8, cx + 7, cy + 7);
    else g.fillTriangle(cx - 7, cy - 7, cx, cy + 8, cx + 7, cy - 7);
  }

  private drawPress(press: Point, index: number, state: SimState): void {
    const active = isPressActive(index, state.beat, state.level);
    const px = ORIGIN_X + press.x * TILE;
    const py = ORIGIN_Y + press.y * TILE;
    const g = this.ink;
    g.fillStyle(0x08090d, 0.8);
    g.fillEllipse(px + 29, py + 47, 51, 13);
    g.fillStyle(active ? 0x7b1e2b : 0x332830, 1);
    g.fillRect(px + 5, py + 8, 47, 36);
    g.fillStyle(active ? 0xe94752 : 0x62434a, 1);
    g.fillRect(px + 8, py + 5, 41, 8);
    g.fillStyle(0x151922, 1);
    g.fillRect(px + 8, py + 36, 41, 10);
    for (let stripe = 0; stripe < 4; stripe += 1) {
      g.fillStyle(active ? 0xffc23d : 0x8c6730, 1);
      g.fillRect(px + 11 + stripe * 10, py + 17, 5, 16);
    }
    g.fillStyle(active ? 0xff5a64 : 0x5a2028, 1);
    g.fillRect(px + 14, py + 2, 29, 4);
    if (this.isVisible(press.x, press.y)) this.text(px + 29, py + 7, active ? "CRUSH" : `PRESS ${index + 1}`, 8, active ? "#fff0b1" : "#b8a274", "center");
  }

  private drawDoor(door: Point, open: boolean): void {
    const dx = ORIGIN_X + door.x * TILE;
    const dy = ORIGIN_Y + door.y * TILE;
    const g = this.ink;
    g.fillStyle(0x080b11, 0.8);
    g.fillRect(dx + 2, dy + 48, 54, 8);
    g.fillStyle(0x252f3e, 1);
    g.fillRect(dx + 3, dy - 7, 9, 59);
    g.fillRect(dx + 46, dy - 7, 9, 59);
    g.fillStyle(0x69788c, 1);
    g.fillRect(dx + 6, dy - 4, 3, 50);
    g.fillRect(dx + 49, dy - 4, 3, 50);
    if (!open) {
      g.fillStyle(0x3d495a, 1);
      g.fillRect(dx + 11, dy - 4, 35, 51);
      for (let stripe = -8; stripe < 50; stripe += 16) {
        g.fillStyle(0xe3a13a, 1);
        g.fillTriangle(dx + 11, dy + stripe, dx + 11, dy + stripe + 9, dx + 46, dy + stripe + 28);
      }
      g.lineStyle(3, 0x111722, 1);
      g.strokeRect(dx + 11, dy - 3, 35, 49);
      g.fillStyle(0xaec1d2, 1);
      g.fillRect(dx + 27, dy + 10, 3, 25);
    } else {
      g.fillStyle(0x55efb5, 1);
      g.fillRect(dx + 6, dy + 5, 4, 13);
      g.fillRect(dx + 48, dy + 5, 4, 13);
    }
  }

  private drawPanel(panel: Point, open: boolean): void {
    const px = ORIGIN_X + panel.x * TILE;
    const py = ORIGIN_Y + panel.y * TILE;
    const g = this.ink;
    g.fillStyle(0x080a0e, 0.75);
    g.fillRect(px + 13, py + 17, 37, 35);
    g.fillStyle(0x414d60, 1);
    g.fillRect(px + 10, py + 6, 36, 39);
    g.fillStyle(0x67758a, 1);
    g.fillRect(px + 13, py + 9, 30, 5);
    g.fillStyle(0x0b1217, 1);
    g.fillRect(px + 17, py + 17, 22, 14);
    g.fillStyle(open ? 0x54f2aa : 0xf45660, 1);
    g.fillRect(px + 20, py + 20, 16, 5);
    g.fillStyle(0xf1c759, 1);
    g.fillCircle(px + 20, py + 37, 3);
    g.fillStyle(0x1b222d, 1);
    g.fillCircle(px + 33, py + 37, 3);
  }

  private drawWall(x: number, y: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    // A raised block with a bright top and deep front face.
    g.fillStyle(0x080a0f, 0.75);
    g.fillRect(px + 6, py + 49, TILE - 7, 8);
    g.fillStyle(0x1b222e, 1);
    g.fillRect(px + 4, py + 8, TILE - 8, 43);
    g.fillStyle(0x3c485a, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(px + 4, py + 8), new Phaser.Math.Vector2(px + 12, py),
      new Phaser.Math.Vector2(px + TILE - 4, py), new Phaser.Math.Vector2(px + TILE - 4, py + 42),
      new Phaser.Math.Vector2(px + TILE - 12, py + 50), new Phaser.Math.Vector2(px + 4, py + 50),
    ], true);
    g.fillStyle(0x59677c, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(px + 5, py + 8), new Phaser.Math.Vector2(px + 13, py + 1),
      new Phaser.Math.Vector2(px + TILE - 5, py + 1), new Phaser.Math.Vector2(px + TILE - 13, py + 8),
    ], true);
    g.fillStyle(0x242d3b, 1);
    g.fillRect(px + 9, py + 12, TILE - 22, 31);
    g.fillStyle(0x0e131b, 1);
    g.fillRect(px + 13, py + 33, TILE - 30, 6);
    g.fillStyle(0x91a1b5, 1);
    g.fillRect(px + 12, py + 16, 4, 4);
    g.fillRect(px + TILE - 19, py + 16, 4, 4);
    g.fillStyle(0xb96d32, 1);
    g.fillRect(px + 8, py + 44, TILE - 20, 3);
  }

  private drawPlate(plate: Point, index: number, state: SimState): void {
    const px = ORIGIN_X + plate.x * TILE;
    const py = ORIGIN_Y + plate.y * TILE;
    const rawState = state as unknown as Record<string, unknown>;
    const pressedList = rawState.pressedPlates;
    const weights = this.pointsFrom(rawState.weight ?? rawState.weights);
    const active = rawState.plateActive === true
      || (Array.isArray(pressedList) && pressedList.includes(index))
      || weights.some((weight) => this.same(weight, plate));
    const g = this.ink;
    g.fillStyle(0x0b0e14, 1);
    g.fillEllipse(px + 29, py + 34, 43, 25);
    g.fillStyle(active ? 0x397d67 : 0x46505c, 1);
    g.fillEllipse(px + 29, py + 29, 41, 23);
    g.lineStyle(3, active ? 0x79f0bd : 0xa3afba, 1);
    g.strokeEllipse(px + 29, py + 29, 41, 23);
    g.fillStyle(active ? 0x9bffd8 : 0xd2a443, 1);
    g.fillRect(px + 25, py + 25, 8, 8);
  }

  private drawWeight(x: number, y: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    g.fillStyle(0x07090e, 0.8);
    g.fillEllipse(px + 29, py + 44, 43, 13);
    g.fillStyle(0x293340, 1);
    g.fillRect(px + 11, py + 19, 36, 25);
    g.fillStyle(0x66758a, 1);
    g.fillRect(px + 15, py + 14, 28, 7);
    g.fillStyle(0xaeb8c4, 1);
    g.fillRect(px + 19, py + 18, 5, 18);
    g.fillStyle(0xe1a741, 1);
    g.fillRect(px + 31, py + 26, 9, 6);
  }

  private drawCrate(x: number, y: number, shipped = false): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    const body = shipped ? 0x358e72 : 0x92572f;
    const edge = shipped ? 0x83e8c4 : 0xe5a04c;
    g.fillStyle(0x05070b, 0.72);
    g.fillEllipse(px + 29, py + 47, 44, 11);
    g.fillStyle(body, 1);
    g.fillRoundedRect(px + 9, py + 15, 40, 32, 3);
    g.fillStyle(edge, 1);
    g.fillRoundedRect(px + 11, py + 11, 36, 8, 2);
    g.fillStyle(0xf4bd62, 0.95);
    g.fillRoundedRect(px + 14, py + 19, 5, 24, 1);
    g.fillRoundedRect(px + 39, py + 19, 5, 24, 1);
    g.lineStyle(1.5, shipped ? 0x174c3d : 0x4f2c1d, 1);
    g.strokeRoundedRect(px + 9.5, py + 15.5, 39, 31, 3);
    g.lineStyle(1, 0x5a321f, 0.75);
    g.lineBetween(px + 20, py + 21, px + 37, py + 40);
    g.lineBetween(px + 37, py + 21, px + 20, py + 40);
    g.fillStyle(0xf7e5ad, 1);
    g.fillRoundedRect(px + 22, py + 25, 14, 9, 1);
    g.fillStyle(0x70402b, 1);
    g.fillRect(px + 25, py + 28, 8, 1.5);
    g.fillRect(px + 25, py + 31, 5, 1);
  }

  private drawContactMarker(x: number, y: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    // High-contrast bracketed diamond remains readable under the oversized sprite.
    g.fillStyle(0x26080e, 0.9);
    g.fillPoints([
      new Phaser.Math.Vector2(px + 29, py + 7), new Phaser.Math.Vector2(px + 52, py + 29),
      new Phaser.Math.Vector2(px + 29, py + 52), new Phaser.Math.Vector2(px + 6, py + 29),
    ], true);
    g.lineStyle(4, 0xff4057, 1);
    g.strokePoints([
      new Phaser.Math.Vector2(px + 29, py + 6), new Phaser.Math.Vector2(px + 52, py + 29),
      new Phaser.Math.Vector2(px + 29, py + 52), new Phaser.Math.Vector2(px + 6, py + 29),
    ], true);
    g.fillStyle(0xffd84b, 1);
    g.fillRect(px + 25, py + 47, 8, 5);
  }

  private drawEnemy(x: number, y: number): void {
    this.drawContactMarker(x, y);
    const cx = ORIGIN_X + x * TILE + 29;
    const cy = ORIGIN_Y + y * TILE + 28;
    const g = this.ink;
    g.fillStyle(0x030407, 0.85);
    g.fillEllipse(cx, cy + 24, 66, 18);
    // Tall, brutal forklift-like patrol; intentionally larger than one tile.
    g.fillStyle(0x1b202a, 1);
    g.fillRect(cx - 31, cy - 8, 62, 31);
    g.fillStyle(0x671923, 1);
    g.fillRect(cx - 27, cy - 26, 54, 42);
    g.fillStyle(0xa52b38, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(cx - 27, cy - 26), new Phaser.Math.Vector2(cx - 17, cy - 35),
      new Phaser.Math.Vector2(cx + 24, cy - 35), new Phaser.Math.Vector2(cx + 27, cy - 26),
    ], true);
    g.fillStyle(0xe04450, 1);
    g.fillRect(cx - 21, cy - 22, 42, 6);
    g.fillStyle(0x080b10, 1);
    g.fillRect(cx - 17, cy - 12, 34, 15);
    g.fillStyle(0xffc83d, 1);
    g.fillRect(cx - 12, cy - 8, 8, 6);
    g.fillRect(cx + 5, cy - 8, 8, 6);
    g.fillStyle(0x090b10, 1);
    g.fillRect(cx - 28, cy + 16, 13, 12);
    g.fillRect(cx + 15, cy + 16, 13, 12);
    g.fillStyle(0xd23c49, 1);
    g.fillRect(cx - 25, cy + 18, 7, 7);
    g.fillRect(cx + 18, cy + 18, 7, 7);
    g.fillStyle(0xff5a64, 1);
    g.fillRect(cx - 4, cy - 42, 8, 8);
    g.fillStyle(0x7b2831, 1);
    g.fillRect(cx - 2, cy - 35, 4, 8);
  }

  private drawRobot(state: SimState): void {
    const cx = ORIGIN_X + state.robot.x * TILE + 29;
    const cy = ORIGIN_Y + state.robot.y * TILE + 30;
    const g = this.ink;

    // Compact courier robot with rounded bodywork, articulated wheels, cabinet
    // seams and a glass face panel. Fine one-pixel accents now stay crisp because
    // the scene is rendered with antialiasing instead of nearest-neighbour scaling.
    g.fillStyle(0x030508, 0.72);
    g.fillEllipse(cx, cy + 24, 55, 14);
    for (const side of [-1, 1]) {
      g.fillStyle(0x0b1017, 1);
      g.fillRoundedRect(cx + side * 17 - (side < 0 ? 8 : 0), cy + 7, 8, 22, 4);
      g.fillStyle(0x53697b, 1);
      g.fillCircle(cx + side * 20, cy + 14, 3.2);
      g.fillCircle(cx + side * 20, cy + 23, 3.2);
      g.fillStyle(0x18232e, 1);
      g.fillCircle(cx + side * 20, cy + 14, 1.2);
      g.fillCircle(cx + side * 20, cy + 23, 1.2);
    }

    g.fillStyle(0x1d6572, 1);
    g.fillRoundedRect(cx - 20, cy - 31, 40, 51, 6);
    g.fillStyle(0x55c8c5, 1);
    g.fillRoundedRect(cx - 17, cy - 29, 34, 7, 3);
    g.fillStyle(0x2e91a0, 1);
    g.fillRoundedRect(cx - 17, cy - 20, 34, 37, 3);
    g.lineStyle(1.5, 0x97f5e9, 0.9);
    g.strokeRoundedRect(cx - 16.5, cy - 19.5, 33, 36, 3);

    // Smoked display and expressive status lights.
    g.fillStyle(0x07151c, 1);
    g.fillRoundedRect(cx - 13, cy - 16, 26, 14, 3);
    g.fillStyle(0x173c45, 1);
    g.fillRoundedRect(cx - 11, cy - 14, 22, 10, 2);
    g.fillStyle(0xa4ffeb, 1);
    g.fillCircle(cx - 6, cy - 9, 2);
    g.fillCircle(cx + 6, cy - 9, 2);
    g.lineStyle(1.5, 0x71e5d6, 1);
    g.lineBetween(cx - 3, cy - 5.5, cx + 3, cy - 5.5);

    // Insulated cargo-door latch and maintenance details.
    g.fillStyle(0xf2c550, 1);
    g.fillRoundedRect(cx - 12, cy + 3, 24, 5, 2);
    g.fillStyle(0x123c48, 1);
    g.fillRoundedRect(cx - 9, cy + 11, 18, 3, 1);
    g.fillStyle(0x9fe6df, 0.85);
    g.fillCircle(cx - 13, cy + 12.5, 1.3);
    g.fillStyle(0xff735f, 1);
    g.fillCircle(cx + 13, cy + 12.5, 1.3);

    // Flexible antenna with a warm locator beacon.
    g.lineStyle(1.5, 0x8296a6, 1);
    g.lineBetween(cx + 10, cy - 31, cx + 13, cy - 41);
    g.fillStyle(0xffc942, 0.25);
    g.fillCircle(cx + 14, cy - 44, 6);
    g.fillStyle(0xffd454, 1);
    g.fillCircle(cx + 14, cy - 44, 3.2);
    g.fillStyle(0xffffcf, 1);
    g.fillCircle(cx + 13, cy - 45, 1.1);

    const marker: Record<Facing, Point> = {
      up: { x: 0, y: -33 }, right: { x: 22, y: -4 }, down: { x: 0, y: 22 }, left: { x: -22, y: -4 },
    };
    const facing = marker[state.robot.facing];
    g.fillStyle(0xffd34e, 1);
    g.fillTriangle(cx + facing.x, cy + facing.y - 4, cx + facing.x + 4, cy + facing.y + 3, cx + facing.x - 4, cy + facing.y + 3);

    if (state.carrying) {
      g.fillStyle(0x713e24, 1);
      g.fillRoundedRect(cx - 14, cy - 40, 28, 14, 3);
      g.fillStyle(0xe29142, 1);
      g.fillRoundedRect(cx - 12, cy - 38, 24, 10, 2);
      g.fillStyle(0xffc45d, 1);
      g.fillRoundedRect(cx - 8, cy - 36, 16, 2, 1);
      g.lineStyle(1, 0x56301e, 1);
      g.strokeRoundedRect(cx - 13.5, cy - 39.5, 27, 13, 3);
    }
  }

  private drawFog(): void {
    if (!this.explored) return;
    const f = this.fog;
    for (let y = 0; y < GRID.height; y += 1) {
      for (let x = 0; x < GRID.width; x += 1) {
        if (this.isVisible(x, y)) continue;
        const px = ORIGIN_X + x * TILE;
        const py = ORIGIN_Y + y * TILE;
        if (this.explored.has(keyOf(x, y))) {
          f.fillStyle(0x070a12, 0.69);
          f.fillRect(px, py, TILE - 2, TILE - 2);
          f.lineStyle(1, 0x223044, 0.18);
          f.lineBetween(px + 5, py + 12, px + TILE - 7, py + 12);
        } else {
          f.fillStyle(0x020307, 0.985);
          f.fillRect(px - 1, py - 1, TILE, TILE);
          // Tiny dithering breaks up the black without revealing geometry.
          if ((x + y) % 2 === 0) {
            f.fillStyle(0x101622, 0.6);
            f.fillRect(px + 12, py + 17, 3, 3);
            f.fillRect(px + 42, py + 39, 2, 2);
          }
        }
      }
    }
  }
}

export function createFactoryGame(parent: HTMLElement, onReady: (scene: FactoryScene) => void): Phaser.Game {
  const scene = new FactoryScene(onReady);
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: "#070910",
    pixelArt: false,
    antialias: true,
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: false, antialias: true, roundPixels: false },
  });
}
