import Phaser from "phaser";
import {
  DOOR,
  GRID,
  PANEL,
  PRESSES,
  TARGET,
  isPressActive,
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
    if (!this.ink) return;
    this.draw();
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
    this.labels.push(label);
  }

  private draw(): void {
    const state = this.state;
    if (!state) return;
    const g = this.ink;
    g.clear();
    this.labels.forEach((label) => label.destroy());
    this.labels = [];

    // Steel surround and inset shadow.
    g.fillStyle(0x161c27, 1);
    g.fillRect(12, 10, WIDTH - 24, HEIGHT - 20);
    g.fillStyle(0x30394a, 1);
    g.fillRect(18, 16, WIDTH - 36, 6);
    g.fillRect(18, 16, 6, HEIGHT - 32);
    g.fillStyle(0x05070b, 1);
    g.fillRect(24, 22, WIDTH - 48, HEIGHT - 44);

    // Factory floor.
    for (let y = 0; y < GRID.height; y += 1) {
      for (let x = 0; x < GRID.width; x += 1) {
        const px = ORIGIN_X + x * TILE;
        const py = ORIGIN_Y + y * TILE;
        const color = (x + y) % 2 === 0 ? 0x18202b : 0x151b25;
        g.fillStyle(color, 1);
        g.fillRect(px, py, TILE - 2, TILE - 2);
        g.fillStyle(0x222c3b, 0.75);
        g.fillRect(px + 5, py + 5, 3, 3);
        g.fillRect(px + TILE - 10, py + TILE - 10, 3, 3);
      }
    }

    // Conveyor/drop bay.
    const tx = ORIGIN_X + TARGET.x * TILE;
    const ty = ORIGIN_Y + TARGET.y * TILE;
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

    // Divider wall, rivets, and door.
    for (let y = 1; y <= 7; y += 1) {
      if (y === DOOR.y) continue;
      this.drawWall(DOOR.x, y);
    }
    const dx = ORIGIN_X + DOOR.x * TILE;
    const dy = ORIGIN_Y + DOOR.y * TILE;
    if (!state.doorOpen) {
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

    // Switch panel.
    const panelX = ORIGIN_X + PANEL.x * TILE;
    const panelY = ORIGIN_Y + PANEL.y * TILE;
    g.fillStyle(0x353e4e, 1);
    g.fillRect(panelX + 12, panelY + 7, 34, 38);
    g.fillStyle(state.doorOpen ? 0x47ef9d : 0xf04e55, 1);
    g.fillRect(panelX + 19, panelY + 14, 20, 13);
    g.fillStyle(0x0c1119, 1);
    g.fillRect(panelX + 25, panelY + 31, 8, 9);
    this.text(panelX + TILE / 2, panelY - 7, "GATE", 9, state.doorOpen ? "#5ff1ae" : "#f47070", "center");

    // Press plates and overhead machinery.
    PRESSES.forEach((press, index) => {
      const active = isPressActive(index, state.beat);
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

    // Cargo crate.
    if (state.crate) this.drawCrate(state.crate.x, state.crate.y, state.status === "won");

    // Robot and carried crate.
    this.drawRobot(state);

    // Beat lamps across the top edge.
    for (let index = 0; index < 4; index += 1) {
      const on = state.beat % 4 === index;
      g.fillStyle(on ? 0xffbd3f : 0x303744, 1);
      g.fillRect(ORIGIN_X + index * 19, 19, 12, 7);
    }
    this.text(WIDTH - 42, 24, `B${String(state.beat).padStart(2, "0")}`, 13, "#f3c75f", "center");
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

  private drawRobot(state: SimState): void {
    const centerX = ORIGIN_X + state.robot.x * TILE + TILE / 2 - 1;
    const centerY = ORIGIN_Y + state.robot.y * TILE + TILE / 2 - 1;
    const g = this.ink;

    // Floor shadow.
    g.fillStyle(0x05070b, 0.7);
    g.fillEllipse(centerX, centerY + 19, 38, 13);

    // Legs.
    g.fillStyle(0x347b8f, 1);
    g.fillRect(centerX - 15, centerY + 10, 10, 15);
    g.fillRect(centerX + 5, centerY + 10, 10, 15);
    g.fillStyle(0x8ce7e8, 1);
    g.fillRect(centerX - 18, centerY + 21, 15, 6);
    g.fillRect(centerX + 3, centerY + 21, 15, 6);

    // Body and head.
    g.fillStyle(0x1b5068, 1);
    g.fillRect(centerX - 20, centerY - 9, 40, 26);
    g.fillStyle(0x54c6d2, 1);
    g.fillRect(centerX - 16, centerY - 20, 32, 20);
    g.fillStyle(0xa5fbef, 1);
    g.fillRect(centerX - 12, centerY - 16, 24, 5);
    g.fillStyle(0x102535, 1);
    g.fillRect(centerX - 10, centerY - 7, 20, 6);

    // Directional eye.
    const eyes: Record<string, Point> = {
      up: { x: 0, y: -10 },
      right: { x: 7, y: -4 },
      down: { x: 0, y: -2 },
      left: { x: -7, y: -4 },
    };
    const eye = eyes[state.robot.facing] ?? { x: 0, y: 0 };
    g.fillStyle(0xffd34e, 1);
    g.fillRect(centerX + eye.x - 3, centerY + eye.y - 3, 7, 7);

    // Arms and claw.
    g.fillStyle(0x4aa3b6, 1);
    g.fillRect(centerX - 26, centerY - 4, 7, 17);
    g.fillRect(centerX + 19, centerY - 4, 7, 17);
    g.fillStyle(0xb7c6cf, 1);
    g.fillRect(centerX - 28, centerY + 10, 10, 5);
    g.fillRect(centerX + 18, centerY + 10, 10, 5);

    if (state.carrying) {
      const carryX = centerX - 12;
      const carryY = centerY - 42;
      g.fillStyle(0xc57b31, 1);
      g.fillRect(carryX, carryY, 24, 19);
      g.fillStyle(0xf2b34d, 1);
      g.fillRect(carryX + 4, carryY + 3, 16, 4);
      g.lineStyle(2, 0x5b351f, 1);
      g.strokeRect(carryX, carryY, 24, 19);
    }
  }
}

export function createFactoryGame(
  parent: HTMLElement,
  onReady: (scene: FactoryScene) => void,
): Phaser.Game {
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
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
  });
}
