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

export class FactoryScene extends Phaser.Scene {
  private ink!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private state: SimState | null = null;
  private readonly onReady: (scene: FactoryScene) => void;

  constructor(onReady: (scene: FactoryScene) => void) {
    super("factory");
    this.onReady = onReady;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0d14");
    this.ink = this.add.graphics();
    this.onReady(this);
  }

  showState(state: SimState): void {
    this.state = state;
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

  private text(x: number, y: number, value: string, size: number, color: string, align: "left" | "center" = "left"): void {
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
    this.labels.push(label);
  }

  private draw(): void {
    const state = this.state;
    if (!state) return;
    const level = getLevel(state.level);
    const g = this.ink;
    g.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];

    g.fillStyle(0x161c27, 1);
    g.fillRect(12, 10, WIDTH - 24, HEIGHT - 20);
    g.fillStyle(0x30394a, 1);
    g.fillRect(18, 16, WIDTH - 36, 6);
    g.fillRect(18, 16, 6, HEIGHT - 32);
    g.fillStyle(0x05070b, 1);
    g.fillRect(24, 22, WIDTH - 48, HEIGHT - 44);

    for (let y = 0; y < GRID.height; y += 1) {
      for (let x = 0; x < GRID.width; x += 1) {
        const px = ORIGIN_X + x * TILE;
        const py = ORIGIN_Y + y * TILE;
        g.fillStyle((x + y) % 2 === 0 ? 0x18202b : 0x151b25, 1);
        g.fillRect(px, py, TILE - 2, TILE - 2);
        g.fillStyle(0x222c3b, 0.75);
        g.fillRect(px + 5, py + 5, 3, 3);
        g.fillRect(px + TILE - 10, py + TILE - 10, 3, 3);
      }
    }

    level.conveyors.forEach((belt) => this.drawConveyor(belt.x, belt.y, belt.direction, state.beat));
    this.drawTarget(level.target);

    level.walls.forEach((wall) => {
      if (!level.door || !this.same(wall, level.door) || !state.doorOpen) this.drawWall(wall.x, wall.y);
    });
    if (level.door) this.drawDoor(level.door, state.doorOpen);
    if (level.panel) this.drawPanel(level.panel, state.doorOpen);

    level.presses.forEach((press, index) => {
      const active = isPressActive(index, state.beat, state.level);
      const px = ORIGIN_X + press.x * TILE;
      const py = ORIGIN_Y + press.y * TILE;
      g.fillStyle(active ? 0x661d29 : 0x31232b, 1);
      g.fillRect(px + 3, py + 3, TILE - 8, TILE - 8);
      g.lineStyle(3, active ? 0xff4154 : 0x96505a, 1);
      g.strokeRect(px + 6, py + 6, TILE - 14, TILE - 14);
      for (let stripe = 0; stripe < 4; stripe += 1) {
        g.fillStyle(active ? 0xffb02e : 0x71532d, 1);
        g.fillRect(px + 10 + stripe * 11, py + 10, 5, TILE - 22);
      }
      if (active) {
        g.fillStyle(0xd5dbe4, 1);
        g.fillRect(px + 9, py + 8, TILE - 20, TILE - 18);
        g.fillStyle(0x758194, 1);
        g.fillRect(px + 14, py + 14, TILE - 30, TILE - 30);
      }
      this.text(px + TILE / 2, py - 7, active ? "CRUSH" : `P${index + 1} SAFE`, 9, active ? "#ff5b66" : "#8b97a8", "center");
    });

    level.enemies.forEach((enemy) => {
      const position = enemyPosition(enemy, state.beat);
      this.drawEnemy(position.x, position.y);
    });

    if (state.crate) this.drawCrate(state.crate.x, state.crate.y, state.status === "won");
    this.drawRobot(state);

    for (let index = 0; index < 4; index += 1) {
      g.fillStyle(state.beat % 4 === index ? 0xffbd3f : 0x303744, 1);
      g.fillRect(ORIGIN_X + index * 19, 19, 12, 7);
    }
    this.text(WIDTH - 65, 24, `L${state.level + 1} B${String(state.beat).padStart(2, "0")}`, 13, "#f3c75f", "center");
  }

  private same(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private drawTarget(target: Point): void {
    const tx = ORIGIN_X + target.x * TILE;
    const ty = ORIGIN_Y + target.y * TILE;
    const g = this.ink;
    g.fillStyle(0x122c2e, 1);
    g.fillRect(tx + 2, ty + 2, TILE - 6, TILE - 6);
    g.lineStyle(3, 0x42e8c1, 1);
    g.strokeRect(tx + 4, ty + 4, TILE - 10, TILE - 10);
    for (let offset = 9; offset < TILE - 8; offset += 12) {
      g.fillStyle(0x2e8b80, 1);
      g.fillRect(tx + offset, ty + 11, 5, TILE - 24);
      g.fillStyle(0x79f8d9, 1);
      g.fillRect(tx + offset, ty + 13, 2, TILE - 28);
    }
    this.text(tx + TILE / 2 - 1, ty - 8, "OUT", 10, "#62f2d0", "center");
  }

  private drawConveyor(x: number, y: number, direction: Facing, beat: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    g.fillStyle(0x192f3b, 1);
    g.fillRect(px + 2, py + 5, TILE - 6, TILE - 12);
    g.lineStyle(2, 0x52798a, 1);
    g.strokeRect(px + 3, py + 6, TILE - 8, TILE - 14);
    const offset = (beat % 3) * 6;
    for (let stripe = -10 + offset; stripe < TILE; stripe += 18) {
      g.fillStyle(0x55c4cf, 0.8);
      if (direction === "right") g.fillTriangle(px + stripe, py + 18, px + stripe + 10, py + 28, px + stripe, py + 38);
      else if (direction === "left") g.fillTriangle(px + stripe + 10, py + 18, px + stripe, py + 28, px + stripe + 10, py + 38);
      else if (direction === "up") g.fillTriangle(px + 18, py + stripe + 10, px + 28, py + stripe, px + 38, py + stripe + 10);
      else g.fillTriangle(px + 18, py + stripe, px + 28, py + stripe + 10, px + 38, py + stripe);
    }
  }

  private drawDoor(door: Point, open: boolean): void {
    const dx = ORIGIN_X + door.x * TILE;
    const dy = ORIGIN_Y + door.y * TILE;
    const g = this.ink;
    if (!open) {
      g.fillStyle(0x3c4658, 1);
      g.fillRect(dx + 5, dy, TILE - 12, TILE - 2);
      for (let stripe = -12; stripe < TILE; stripe += 17) {
        g.fillStyle(0xe8a83b, 1);
        g.fillTriangle(dx + stripe, dy + TILE - 3, dx + stripe + 9, dy + TILE - 3, dx + stripe + 26, dy + 1);
      }
      g.lineStyle(3, 0x111722, 1);
      g.strokeRect(dx + 5, dy + 2, TILE - 12, TILE - 7);
    } else {
      g.fillStyle(0x1f2936, 1);
      g.fillRect(dx + 4, dy, 8, TILE - 2);
      g.fillRect(dx + TILE - 14, dy, 8, TILE - 2);
      g.fillStyle(0x48e5ae, 1);
      g.fillRect(dx + 7, dy + 8, 3, 14);
      g.fillRect(dx + TILE - 11, dy + 8, 3, 14);
    }
  }

  private drawPanel(panel: Point, open: boolean): void {
    const px = ORIGIN_X + panel.x * TILE;
    const py = ORIGIN_Y + panel.y * TILE;
    const g = this.ink;
    g.fillStyle(0x353e4e, 1);
    g.fillRect(px + 12, py + 7, 34, 38);
    g.fillStyle(open ? 0x47ef9d : 0xf04e55, 1);
    g.fillRect(px + 19, py + 14, 20, 13);
    g.fillStyle(0x0c1119, 1);
    g.fillRect(px + 25, py + 31, 8, 9);
    this.text(px + TILE / 2, py - 7, "GATE", 9, open ? "#5ff1ae" : "#f47070", "center");
  }

  private drawWall(x: number, y: number): void {
    const px = ORIGIN_X + x * TILE;
    const py = ORIGIN_Y + y * TILE;
    const g = this.ink;
    g.fillStyle(0x30394a, 1);
    g.fillRect(px + 3, py, TILE - 8, TILE - 2);
    g.fillStyle(0x4a566a, 1);
    g.fillRect(px + 7, py + 5, TILE - 16, 7);
    g.fillStyle(0x121722, 1);
    g.fillRect(px + 8, py + TILE - 11, TILE - 18, 6);
    g.fillStyle(0x8d98aa, 1);
    g.fillRect(px + 10, py + 16, 4, 4);
    g.fillRect(px + TILE - 17, py + TILE - 18, 4, 4);
  }

  private drawCrate(x: number, y: number, shipped = false): void {
    const px = ORIGIN_X + x * TILE + 10;
    const py = ORIGIN_Y + y * TILE + 10;
    const g = this.ink;
    g.fillStyle(shipped ? 0x55d7a8 : 0xc57b31, 1);
    g.fillRect(px, py, TILE - 22, TILE - 22);
    g.fillStyle(shipped ? 0xa2f3d5 : 0xf2b34d, 1);
    g.fillRect(px + 4, py + 4, TILE - 30, 6);
    g.fillRect(px + 5, py + 12, 6, TILE - 35);
    g.lineStyle(3, 0x5b351f, 1);
    g.strokeRect(px + 2, py + 2, TILE - 26, TILE - 26);
    g.lineBetween(px + 7, py + 7, px + TILE - 29, py + TILE - 29);
    g.lineBetween(px + TILE - 29, py + 7, px + 7, py + TILE - 29);
  }

  private drawEnemy(x: number, y: number): void {
    const cx = ORIGIN_X + x * TILE + TILE / 2 - 1;
    const cy = ORIGIN_Y + y * TILE + TILE / 2 + 4;
    const g = this.ink;
    g.fillStyle(0x05070b, 0.7);
    g.fillEllipse(cx, cy + 14, 43, 12);
    g.fillStyle(0x4e141e, 1);
    g.fillEllipse(cx, cy, 45, 28);
    g.lineStyle(4, 0xef4554, 1);
    g.strokeEllipse(cx, cy, 45, 28);
    g.fillStyle(0xffbd3f, 1);
    g.fillRect(cx - 11, cy - 6, 22, 7);
    g.fillStyle(0xff5562, 1);
    g.fillCircle(cx, cy - 13, 5);
  }

  private drawRobot(state: SimState): void {
    const cx = ORIGIN_X + state.robot.x * TILE + TILE / 2 - 1;
    const cy = ORIGIN_Y + state.robot.y * TILE + TILE / 2 + 7;
    const g = this.ink;

    // A squat autonomous floor cleaner: wheels are tucked under one low shell.
    g.fillStyle(0x05070b, 0.75);
    g.fillEllipse(cx, cy + 13, 48, 13);
    g.fillStyle(0x172b38, 1);
    g.fillRect(cx - 23, cy - 5, 5, 17);
    g.fillRect(cx + 18, cy - 5, 5, 17);
    g.fillStyle(0x276d7c, 1);
    g.fillEllipse(cx, cy, 47, 29);
    g.lineStyle(4, 0x79e5df, 1);
    g.strokeEllipse(cx, cy, 47, 29);
    g.fillStyle(0x163e4d, 1);
    g.fillEllipse(cx, cy - 4, 31, 15);
    g.fillStyle(0x9af7ea, 1);
    g.fillCircle(cx, cy - 10, 5);

    const marker: Record<Facing, Point> = {
      up: { x: 0, y: -12 }, right: { x: 18, y: 0 }, down: { x: 0, y: 10 }, left: { x: -18, y: 0 },
    };
    const eye = marker[state.robot.facing];
    g.fillStyle(0xffd34e, 1);
    g.fillCircle(cx + eye.x, cy + eye.y, 4);

    if (state.carrying) {
      g.fillStyle(0xc57b31, 1);
      g.fillRect(cx - 13, cy - 31, 26, 20);
      g.fillStyle(0xf2b34d, 1);
      g.fillRect(cx - 9, cy - 27, 18, 4);
      g.lineStyle(2, 0x5b351f, 1);
      g.strokeRect(cx - 13, cy - 31, 26, 20);
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
    backgroundColor: "#0a0d14",
    pixelArt: true,
    antialias: false,
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: true, antialias: false, roundPixels: true },
  });
}
