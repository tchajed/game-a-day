import Phaser from 'phaser';
import { BeatAudio } from './audio';
import {
  ACTION_WINDOW_MS,
  BEAT_MS,
  BPM,
  DUCK_BEATS,
  GROUND_Y,
  JUMP_BEATS,
  POSITION_TOLERANCE,
  RUN_SPEED,
  beatToMs,
  createLevels,
  timingDeltaMs,
  type Action,
  type BeatEvent,
  type LevelDefinition,
  validateLevel,
} from './level';
import './style.css';

interface DebugState {
  phase: 'ready' | 'playing' | 'failed' | 'won';
  elapsedMs: number;
  nextEvent: number;
  combo: number;
  playerX: number;
  speed: number;
  autoplay: boolean;
  level: number;
}

declare global {
  interface Window {
    __BEATBOUND__?: {
      getState: () => DebugState;
      press: (action: Action) => void;
      setDirection: (direction: -1 | 0 | 1) => void;
      restart: () => void;
      level: BeatEvent[];
    };
  }
}

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === 'true';
const START_MUTED = params.get('music') === 'off';
const requestedSlow = Number(params.get('slow'));
const INITIAL_SPEED = DEBUG && params.has('slow')
  ? Phaser.Math.Clamp(Number.isFinite(requestedSlow) && requestedSlow > 0 ? requestedSlow : 0.5, 0.25, 1)
  : 1;

const COLORS = {
  sky: 0x79c9ff,
  skyLight: 0xc8efff,
  hillBack: 0x77cf78,
  hillFront: 0x35a957,
  grass: 0x63c84b,
  grassDark: 0x24823c,
  soil: 0xc8793d,
  soilDark: 0x8f472e,
  cream: 0xfff7d6,
  ink: 0x17334a,
  white: 0xffffff,
  yellow: 0xffd84a,
  orange: 0xf28a35,
  red: 0xe94c45,
  brown: 0x8a4d2c,
  mint: 0x55d6a7,
};

class GameScene extends Phaser.Scene {
  private levels = createLevels();
  private currentLevelIndex = 0;
  private definition: LevelDefinition = this.levels[0];
  private level = this.definition.events;
  private worldWidth = this.calculateWorldWidth();
  private speedScale = INITIAL_SPEED;
  private autoPlay = params.get('autoplay') === 'true';
  private audio = new BeatAudio(this.level, START_MUTED, this.speedScale);
  private phase: DebugState['phase'] = 'ready';
  private startAt = 0;
  private lastClock = 0;
  private elapsedMs = 0;
  private nextEvent = 0;
  private combo = 0;
  private accepted = new Set<number>();
  private cleared = new Set<number>();
  private autoPressed = new Set<number>();
  private moveAxis: -1 | 0 | 1 = 0;
  private leftHeld = false;
  private rightHeld = false;
  private jumpStartedAt = -Infinity;
  private duckStartedAt = -Infinity;
  private character!: Phaser.GameObjects.Container;
  private characterBody!: Phaser.GameObjects.Graphics;
  private enemies = new Map<number, Phaser.GameObjects.Container>();
  private worldLayer!: Phaser.GameObjects.Container;
  private indicator!: Phaser.GameObjects.Graphics;
  private beatPulse!: Phaser.GameObjects.Arc;
  private promptText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private startButton!: HTMLButtonElement;
  private soundButton!: HTMLButtonElement;
  private comboElement!: HTMLElement;
  private progressElement!: HTMLElement;
  private levelElement!: HTMLElement;
  private speedButton?: HTMLButtonElement;
  private autoButton?: HTMLButtonElement;

  constructor() {
    super('game');
  }

  create(): void {
    const validation = validateLevel(this.level);
    if (validation.errors.length > 0) throw new Error(validation.errors.join('\n'));

    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.worldLayer = this.add.container(0, 0);
    this.drawWorld();
    this.character = this.createCharacter(this.definition.startX, GROUND_Y);
    this.createCanvasHud();
    this.createDomUi();
    this.bindInputs();

    window.__BEATBOUND__ = {
      getState: () => ({
        phase: this.phase,
        elapsedMs: Math.round(this.elapsedMs),
        nextEvent: this.nextEvent,
        combo: this.combo,
        playerX: Math.round(this.character.x),
        speed: this.speedScale,
        autoplay: this.autoPlay,
        level: this.currentLevelIndex + 1,
      }),
      press: (action) => this.press(action),
      setDirection: (direction) => { this.moveAxis = direction; },
      restart: () => this.resetRun(false),
      level: this.level,
    };
  }

  private calculateWorldWidth(): number {
    const rightmost = Math.max(...this.level.flatMap((event) => [event.from.x, event.to.x, event.hazardX]));
    return Math.max(3_200, rightmost + 640);
  }

  private drawWorld(): void {
    const skyColors = [COLORS.sky, 0x79d8d0, 0xb4a9ed];
    const sky = this.add.graphics();
    this.worldLayer.add(sky);
    sky.fillStyle(skyColors[this.currentLevelIndex], 1).fillRect(0, 0, this.worldWidth, 720);

    // A tiny repeating dash-and-dot print gives the sky a handmade game-box texture.
    for (let x = 22; x < this.worldWidth; x += 64) {
      for (let y = 28; y < 560; y += 64) {
        const offset = ((x / 64 + y / 64) % 2) * 13;
        sky.fillStyle(COLORS.white, 0.12).fillCircle(x + offset, y, 2);
        sky.lineStyle(2, COLORS.ink, 0.055).lineBetween(x + 22 - offset / 2, y + 22, x + 30 - offset / 2, y + 18);
      }
    }

    for (let i = 0; i < 18; i += 1) {
      const x = 100 + i * 270 + (i % 3) * 44;
      const y = 90 + (i % 4) * 57;
      this.drawCloud(sky, x, y, 0.72 + (i % 3) * 0.14);
    }

    for (let i = 0; i < 12; i += 1) {
      const x = 40 + i * 390;
      this.drawHill(sky, x, 600, 340 + (i % 3) * 80, 220 + (i % 2) * 55, COLORS.hillBack, 0.58);
    }
    for (let i = 0; i < 10; i += 1) {
      const x = -80 + i * 490;
      this.drawHill(sky, x, 603, 430, 160 + (i % 3) * 25, COLORS.hillFront, 0.72);
    }

    const ground = this.add.graphics();
    this.worldLayer.add(ground);
    ground.fillStyle(COLORS.grassDark, 1).fillRect(0, 588, this.worldWidth, 132);
    ground.fillStyle(COLORS.soil, 1).fillRect(0, 606, this.worldWidth, 114);
    ground.fillStyle(COLORS.grass, 1).fillRect(0, 588, this.worldWidth, 18);
    ground.fillStyle(COLORS.cream, 0.7).fillRect(0, 588, this.worldWidth, 4);
    for (let x = 0; x < this.worldWidth; x += 48) {
      for (let y = 608; y < 720; y += 32) {
        const alternate = (Math.floor(x / 48) + Math.floor(y / 32)) % 2 === 0;
        ground.fillStyle(alternate ? COLORS.soilDark : COLORS.orange, alternate ? 0.32 : 0.2)
          .fillRoundedRect(x + 4, y + 4, 39, 24, 6);
        ground.fillStyle(COLORS.cream, 0.2).fillCircle(x + (alternate ? 14 : 32), y + 13, 3);
      }
    }

    for (let i = 0; i < 16; i += 1) {
      const x = 390 + i * 250;
      if (i % 3 === 0) this.drawBeatBlock(ground, x, 425 - (i % 2) * 45);
      else this.drawBush(ground, x, 585, 0.8 + (i % 2) * 0.25);
    }

    this.level.forEach((event) => {
      this.drawRunSign(ground, event);
      const enemy = this.createHazard(event);
      this.enemies.set(event.index, enemy);
    });

    const finalEvent = this.level[this.level.length - 1];
    const finishX = finalEvent.hazardX + finalEvent.direction * 260;
    ground.fillStyle(COLORS.cream, 1).fillRoundedRect(finishX, 350, 10, 238, 4);
    ground.fillStyle(COLORS.red, 1).fillTriangle(finishX + 10, 360, finishX + 92, 390, finishX + 10, 420);
    ground.fillStyle(COLORS.cream, 0.75).fillCircle(finishX + 35, 389, 7);
  }

  private drawCloud(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(COLORS.ink, 0.08).fillEllipse(x, y + 10 * scale, 128 * scale, 30 * scale);
    g.fillStyle(COLORS.white, 0.9)
      .fillCircle(x - 38 * scale, y, 25 * scale)
      .fillCircle(x - 6 * scale, y - 15 * scale, 35 * scale)
      .fillCircle(x + 32 * scale, y - 2 * scale, 28 * scale)
      .fillRoundedRect(x - 60 * scale, y - 2 * scale, 120 * scale, 30 * scale, 15 * scale);
  }

  private drawHill(g: Phaser.GameObjects.Graphics, x: number, bottom: number, width: number, height: number, color: number, alpha: number): void {
    g.fillStyle(color, alpha).fillEllipse(x + width / 2, bottom, width, height * 2);
    g.fillStyle(COLORS.cream, 0.12).fillEllipse(x + width * 0.37, bottom - height * 0.38, width * 0.08, height * 0.18);
    g.fillStyle(COLORS.ink, 0.08).fillEllipse(x + width * 0.62, bottom - height * 0.2, width * 0.055, height * 0.12);
  }

  private drawBush(g: Phaser.GameObjects.Graphics, x: number, y: number, scale: number): void {
    g.fillStyle(COLORS.ink, 0.13).fillEllipse(x, y + 4, 110 * scale, 24 * scale);
    g.fillStyle(COLORS.hillFront, 1)
      .fillCircle(x - 34 * scale, y - 8 * scale, 25 * scale)
      .fillCircle(x, y - 23 * scale, 35 * scale)
      .fillCircle(x + 34 * scale, y - 7 * scale, 26 * scale)
      .fillRoundedRect(x - 56 * scale, y - 12 * scale, 112 * scale, 24 * scale, 12 * scale);
    g.fillStyle(COLORS.cream, 0.22).fillCircle(x - 10 * scale, y - 35 * scale, 6 * scale);
  }

  private drawBeatBlock(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(COLORS.ink, 0.18).fillRoundedRect(x - 24, y - 19, 54, 54, 7);
    g.fillStyle(COLORS.yellow, 1).fillRoundedRect(x - 27, y - 25, 54, 54, 7);
    g.lineStyle(3, COLORS.orange, 0.8).strokeRoundedRect(x - 27, y - 25, 54, 54, 7);
    g.fillStyle(COLORS.cream, 0.9).fillCircle(x - 17, y - 15, 3).fillCircle(x + 17, y - 15, 3)
      .fillCircle(x - 17, y + 19, 3).fillCircle(x + 17, y + 19, 3);
    g.fillStyle(COLORS.orange, 1).fillCircle(x, y - 5, 8).fillRect(x - 3, y + 2, 6, 12);
  }

  private drawRunSign(g: Phaser.GameObjects.Graphics, event: BeatEvent): void {
    const x = event.from.x + event.direction * 90;
    g.fillStyle(COLORS.brown, 1).fillRoundedRect(x - 3, 517, 6, 71, 3);
    g.fillStyle(COLORS.cream, 1).fillRoundedRect(x - 48, 482, 96, 43, 8);
    g.lineStyle(3, COLORS.brown, 0.9).strokeRoundedRect(x - 48, 482, 96, 43, 8);
    g.fillStyle(COLORS.red, 1).fillRect(x - 22, 499, 44, 8);
    const tip = x + event.direction * 32;
    const base = x + event.direction * 13;
    g.fillTriangle(tip, 503, base, 493, base, 513);
  }

  private createHazard(event: BeatEvent): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    if (event.action === 'duck') {
      g.fillStyle(COLORS.ink, 0.12).fillEllipse(0, 10, 54, 13);
      g.fillStyle(event.index % 2 === 0 ? COLORS.red : COLORS.orange, 1).fillRoundedRect(-25, -10, 50, 22, 10);
      g.fillStyle(COLORS.cream, 1).fillCircle(-9, -2, 5).fillCircle(9, -2, 5);
      g.fillStyle(COLORS.ink, 1).fillCircle(-8, -1, 2).fillCircle(10, -1, 2);
      g.lineStyle(4, COLORS.brown, 0.8).lineBetween(-34, -14, -21, -5).lineBetween(34, -14, 21, -5);
      const flyer = this.add.container(event.hazardX, 536, [g]).setDepth(12);
      this.worldLayer.add(flyer);
      return flyer;
    }

    g.fillStyle(COLORS.ink, 0.18).fillEllipse(0, 16, 42, 9);
    g.fillStyle(COLORS.brown, 1).fillRoundedRect(-19, -17, 38, 29, 13);
    g.fillStyle(event.index % 2 === 0 ? COLORS.red : COLORS.orange, 1).fillRoundedRect(-18, -18, 36, 11, 8);
    g.fillStyle(COLORS.cream, 1).fillCircle(-7, -4, 5).fillCircle(7, -4, 5);
    g.fillStyle(COLORS.ink, 1).fillCircle(-6, -3, 2).fillCircle(8, -3, 2);
    g.fillStyle(COLORS.ink, 1).fillRoundedRect(-19, 9, 15, 7, 3).fillRoundedRect(4, 9, 15, 7, 3);
    const enemy = this.add.container(event.hazardX, 573, [g]).setDepth(12);
    this.worldLayer.add(enemy);
    return enemy;
  }

  private createCharacter(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 28, 42, 9, COLORS.ink, 0.2);
    this.characterBody = this.add.graphics();
    this.drawCharacterBody(false);
    return this.add.container(x, y, [shadow, this.characterBody]).setDepth(20);
  }

  private drawCharacterBody(failed: boolean): void {
    this.characterBody.clear();
    if (failed) {
      this.characterBody.fillStyle(COLORS.red, 1).fillRoundedRect(-22, -12, 44, 28, 12);
      this.characterBody.fillStyle(COLORS.ink, 1).fillCircle(-8, -3, 3).fillCircle(8, -3, 3);
      return;
    }
    this.characterBody.fillStyle(COLORS.yellow, 1).fillRoundedRect(-20, -25, 40, 51, 15);
    this.characterBody.lineStyle(3, COLORS.ink, 0.75).strokeRoundedRect(-20, -25, 40, 51, 15);
    this.characterBody.fillStyle(COLORS.white, 1).fillCircle(-8, -8, 6).fillCircle(8, -8, 6);
    this.characterBody.fillStyle(COLORS.ink, 1).fillCircle(-7, -7, 2).fillCircle(9, -7, 2);
    this.characterBody.fillStyle(COLORS.orange, 1).fillRoundedRect(-11, 8, 22, 5, 3);
    this.characterBody.fillStyle(COLORS.cream, 1).fillRoundedRect(-21, 20, 17, 8, 4).fillRoundedRect(4, 20, 17, 8, 4);
  }

  private createCanvasHud(): void {
    this.indicator = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.beatPulse = this.add.circle(94, 661, 28, COLORS.yellow, 0.28).setScrollFactor(0).setDepth(50);
    this.add.circle(94, 661, 18, COLORS.yellow, 1).setScrollFactor(0).setDepth(51);
    this.add.text(94, 661, 'BEAT', {
      color: '#17334a', fontFamily: 'Nunito, sans-serif', fontSize: '9px', fontStyle: '900',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

    this.promptText = this.add.text(480, 100, 'HOLD → · JUMP ON THE BEAT', {
      color: '#17334a', fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontStyle: '900',
      backgroundColor: '#fff7d6e8', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(54);
    this.feedbackText = this.add.text(480, 165, '', {
      color: '#ffffff', fontFamily: 'Nunito, sans-serif', fontSize: '34px', fontStyle: '900',
      stroke: '#17334a', strokeThickness: 7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);
  }

  private introMarkup(cta: string): string {
    const titles = [
      'RUN RIGHT.<br>JUMP BIG.',
      'JUMP OR<br>DUCK.',
      'FOLLOW THE<br>ARROWS.',
    ];
    const controls = [
      'HOLD D OR → &nbsp; · &nbsp; TAP SPACE ON THE BIG BEAT',
      'SPACE = JUMP &nbsp; · &nbsp; S OR ↓ = DUCK',
      'A / D = RUN &nbsp; · &nbsp; SPACE = JUMP &nbsp; · &nbsp; S = DUCK',
    ];
    return `
      <small>LEVEL ${this.currentLevelIndex + 1} · ${this.definition.name} · ${BPM} BPM</small>
      <strong>${titles[this.currentLevelIndex]}</strong>
      <em>${controls[this.currentLevelIndex]}</em>
      <span class="start-cta">${cta}</span>`;
  }

  private createDomUi(): void {
    document.querySelector('#ui')?.remove();
    const ui = document.createElement('div');
    ui.id = 'ui';
    ui.innerHTML = `
      <div class="topbar">
        <div class="brand">BEAT<span>BOUND</span></div>
        <div class="stats">
          <span class="pill" id="level-pill">LEVEL ${this.currentLevelIndex + 1} / ${this.levels.length}</span>
          <span class="pill" id="progress-pill">0 / ${this.level.length}</span>
          <span class="pill" id="combo-pill">0 STREAK</span>
          <button class="pill" id="sound" aria-label="Toggle music">${START_MUTED ? '♪ OFF' : '♪ ON'}</button>
        </div>
      </div>
      ${DEBUG ? `<div id="debug-tools">
        <strong>DEBUG READY</strong>
        <button data-debug="speed">SPEED ${Math.round(this.speedScale * 100)}%</button>
        <button data-debug="auto">AUTO ${this.autoPlay ? 'ON' : 'OFF'}</button>
        <button data-debug="level">LEVEL +</button>
        <button data-debug="reset">RESET</button>
      </div>` : ''}
      <button id="start" aria-label="Start Beatbound">
        <span class="start-card">
          ${this.introMarkup('START THE MUSIC')}
        </span>
      </button>
      <div id="mobile-controls">
        <button class="action-button move-button" data-move="-1">←</button>
        <button class="action-button jump-button" data-action="jump">↑ JUMP</button>
        <button class="action-button duck-button" data-action="duck">↓ DUCK</button>
        <button class="action-button move-button" data-move="1">→</button>
      </div>`;
    document.body.append(ui);

    this.startButton = ui.querySelector<HTMLButtonElement>('#start')!;
    this.soundButton = ui.querySelector<HTMLButtonElement>('#sound')!;
    this.comboElement = ui.querySelector<HTMLElement>('#combo-pill')!;
    this.progressElement = ui.querySelector<HTMLElement>('#progress-pill')!;
    this.levelElement = ui.querySelector<HTMLElement>('#level-pill')!;
    this.speedButton = ui.querySelector<HTMLButtonElement>('[data-debug="speed"]') ?? undefined;
    this.autoButton = ui.querySelector<HTMLButtonElement>('[data-debug="auto"]') ?? undefined;

    this.startButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (this.phase === 'ready') void this.startGame();
      else if (this.phase === 'won' && this.currentLevelIndex < this.levels.length - 1) this.loadLevel(this.currentLevelIndex + 1, true);
      else if (this.phase !== 'playing') this.resetRun(true);
    });
    this.soundButton.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      const muted = !this.audio.isMuted();
      this.audio.setMuted(muted);
      this.soundButton.textContent = muted ? '♪ OFF' : '♪ ON';
    });

    ui.querySelector<HTMLButtonElement>('[data-debug="speed"]')?.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.toggleSlowMotion();
    });
    ui.querySelector<HTMLButtonElement>('[data-debug="auto"]')?.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.toggleAutoplay();
    });
    ui.querySelector<HTMLButtonElement>('[data-debug="level"]')?.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.loadLevel((this.currentLevelIndex + 1) % this.levels.length, false);
    });
    ui.querySelector<HTMLButtonElement>('[data-debug="reset"]')?.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.resetRun(false);
    });

    ui.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      const action = button.dataset.action as Action;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.press(action);
      });
    });
    ui.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
      const direction = Number(button.dataset.move) as -1 | 1;
      const release = () => { if (this.moveAxis === direction) this.moveAxis = 0; };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.moveAxis = direction;
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
  }

  private bindInputs(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      if (event.code === 'KeyA' || event.code === 'ArrowLeft') this.leftHeld = true;
      if (event.code === 'KeyD' || event.code === 'ArrowRight') this.rightHeld = true;
      this.syncMoveAxis();
      if (event.repeat) return;

      if (DEBUG && event.code === 'KeyT') {
        this.toggleSlowMotion();
        return;
      }
      if (DEBUG && event.code === 'KeyP') {
        this.toggleAutoplay();
        return;
      }
      if (DEBUG && event.code === 'KeyN' && this.phase === 'playing') {
        this.assistNext();
        return;
      }

      if (this.phase === 'ready') {
        if (event.code === 'Space' || event.code === 'Enter') void this.startGame();
        return;
      }
      if (this.phase !== 'playing') {
        if (event.code === 'Space' || event.code === 'KeyR' || event.code === 'Enter') {
          if (this.phase === 'won' && this.currentLevelIndex < this.levels.length - 1) this.loadLevel(this.currentLevelIndex + 1, true);
          else this.resetRun(true);
        }
        return;
      }
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.press('jump');
      if (event.code === 'ArrowDown' || event.code === 'KeyS') this.press('duck');
    });
    this.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      if (event.code === 'KeyA' || event.code === 'ArrowLeft') this.leftHeld = false;
      if (event.code === 'KeyD' || event.code === 'ArrowRight') this.rightHeld = false;
      this.syncMoveAxis();
    });
  }

  private syncMoveAxis(): void {
    this.moveAxis = this.leftHeld === this.rightHeld ? 0 : this.leftHeld ? -1 : 1;
  }

  private toggleSlowMotion(): void {
    this.speedScale = this.speedScale < 1 ? 1 : 0.5;
    this.audio.setSpeed(this.speedScale);
    if (this.speedButton) this.speedButton.textContent = `SPEED ${Math.round(this.speedScale * 100)}%`;
    this.feedback(this.speedScale < 1 ? '50% PRACTICE SPEED' : 'FULL SPEED', COLORS.mint);
  }

  private toggleAutoplay(): void {
    this.autoPlay = !this.autoPlay;
    if (this.autoButton) this.autoButton.textContent = `AUTO ${this.autoPlay ? 'ON' : 'OFF'}`;
    this.feedback(this.autoPlay ? 'AUTOPLAY ON' : 'AUTOPLAY OFF', COLORS.mint);
  }

  private assistNext(): void {
    const event = this.level[this.nextEvent];
    if (!event) return;
    if (Math.abs(timingDeltaMs(this.elapsedMs, event)) <= ACTION_WINDOW_MS) {
      this.character.x = event.to.x;
      this.press(event.action);
    } else {
      this.feedback('N WORKS NEAR THE BEAT', COLORS.orange);
    }
  }

  private async startGame(): Promise<void> {
    if (this.phase !== 'ready') return;
    this.startButton.classList.add('hidden');
    await this.audio.start();
    this.phase = 'playing';
    this.startAt = performance.now() + 80;
    this.lastClock = this.startAt;
    if (this.autoPlay) this.moveAxis = this.level[0].direction;
    this.feedback(this.speedScale < 1 ? 'PRACTICE RUN' : 'GO!', COLORS.white);
  }

  private loadLevel(index: number, startImmediately: boolean): void {
    this.definition = this.levels[index];
    this.currentLevelIndex = index;
    this.level = this.definition.events;
    this.worldWidth = this.calculateWorldWidth();

    const validation = validateLevel(this.level);
    if (validation.errors.length > 0) throw new Error(validation.errors.join('\n'));

    this.worldLayer.destroy(true);
    this.enemies.clear();
    this.worldLayer = this.add.container(0, 0);
    this.drawWorld();
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.levelElement.textContent = `LEVEL ${index + 1} / ${this.levels.length}`;
    if (window.__BEATBOUND__) window.__BEATBOUND__.level = this.level;
    this.resetRun(startImmediately);
  }

  private resetRun(startImmediately: boolean): void {
    const muted = this.audio.isMuted();
    this.audio.stop();
    this.audio = new BeatAudio(this.level, muted, this.speedScale);
    this.phase = 'ready';
    this.startAt = 0;
    this.lastClock = 0;
    this.elapsedMs = 0;
    this.nextEvent = 0;
    this.combo = 0;
    this.accepted.clear();
    this.cleared.clear();
    this.autoPressed.clear();
    this.jumpStartedAt = -Infinity;
    this.duckStartedAt = -Infinity;
    if (this.autoPlay) this.moveAxis = this.level[0].direction;
    else this.syncMoveAxis();
    this.character.setPosition(this.definition.startX, GROUND_Y).setScale(1).setRotation(0).setAlpha(1);
    this.drawCharacterBody(false);
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.definition.startX - 280, 0, this.worldWidth - 960);
    this.comboElement.textContent = '0 STREAK';
    this.progressElement.textContent = `0 / ${this.level.length}`;
    this.enemies.forEach((enemy, index) => {
      const event = this.level[index];
      enemy.setScale(1).setAlpha(1).setY(event.action === 'duck' ? 536 : 573);
    });
    this.showIntroCard();
    this.drawIndicator(0);
    if (startImmediately) void this.startGame();
  }

  private showIntroCard(): void {
    this.startButton.classList.remove('hidden');
    this.startButton.querySelector('.start-card')!.innerHTML = this.introMarkup('START THE MUSIC');
  }

  private press(action: Action): void {
    if (this.phase !== 'playing') return;
    const event = this.level[this.nextEvent];
    if (!event) return;
    const delta = timingDeltaMs(this.elapsedMs, event);

    if (Math.abs(delta) > ACTION_WINDOW_MS) {
      if (delta < -ACTION_WINDOW_MS) this.feedback('WAIT FOR THE BEAT', COLORS.orange);
      return;
    }
    if (action !== event.action) {
      this.fail(`NEEDED ${event.action.toUpperCase()}`);
      return;
    }
    if (Math.abs(this.character.x - event.to.x) > POSITION_TOLERANCE) {
      const behind = event.direction === 1 ? this.character.x < event.to.x : this.character.x > event.to.x;
      this.fail(behind ? `KEEP HOLDING ${event.direction === 1 ? '→' : '←'}` : 'TOO FAR AHEAD');
      return;
    }

    this.accepted.add(event.index);
    this.nextEvent += 1;
    this.combo += 1;
    if (action === 'jump') this.jumpStartedAt = this.elapsedMs;
    else this.duckStartedAt = this.elapsedMs;
    const perfect = Math.abs(delta) <= 80;
    this.feedback(perfect ? `PERFECT ${action.toUpperCase()}!` : 'NICE!', perfect ? COLORS.mint : COLORS.yellow);
    this.audio.hit(action, perfect ? 'perfect' : 'good');
    this.comboElement.textContent = `${this.combo} STREAK`;
    this.progressElement.textContent = `${this.nextEvent} / ${this.level.length}`;
  }

  private fail(reason: string): void {
    if (this.phase !== 'playing') return;
    this.phase = 'failed';
    this.combo = 0;
    this.cameras.main.shake(180, 0.009);
    this.drawCharacterBody(true);
    this.feedback('TRY AGAIN!', COLORS.red);
    this.startButton.classList.remove('hidden');
    this.startButton.querySelector('.start-card')!.innerHTML = `
      <small>${reason}</small>
      <strong>SO CLOSE!</strong>
      <em>ONE PRESS RESTARTS THE RUN</em>
      <span class="start-cta">TRY AGAIN</span>`;
  }

  private win(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'won';
    this.feedback('ROAD CLEARED!', COLORS.yellow);
    this.cameras.main.flash(420, 255, 247, 214);
    this.startButton.classList.remove('hidden');
    const hasNextLevel = this.currentLevelIndex < this.levels.length - 1;
    const next = this.levels[this.currentLevelIndex + 1];
    this.startButton.querySelector('.start-card')!.innerHTML = `
      <small>LEVEL ${this.currentLevelIndex + 1} CLEAR · ${this.level.length} / ${this.level.length} CUES</small>
      <strong>${hasNextLevel ? 'NICE RUN!' : 'BEATBOUND!'}</strong>
      <em>${hasNextLevel ? `NEXT: ${next.name} · ${next.subtitle}` : 'YOU CLEARED ALL THREE RHYTHM ROADS'}</em>
      <span class="start-cta">${hasNextLevel ? 'NEXT LEVEL' : 'RUN IT AGAIN'}</span>`;
  }

  private feedback(message: string, color: number): void {
    this.feedbackText.setText(message).setColor(`#${color.toString(16).padStart(6, '0')}`).setScale(0.8).setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({ targets: this.feedbackText, scale: 1, duration: 110, ease: 'Back.Out' });
    this.tweens.add({ targets: this.feedbackText, alpha: 0, delay: 500, duration: 240 });
  }

  update(): void {
    if (this.phase !== 'playing') {
      this.drawIndicator(this.elapsedMs);
      return;
    }

    const now = performance.now();
    if (now < this.startAt) return;
    const gameDeltaMs = Math.min(50, now - this.lastClock) * this.speedScale;
    this.lastClock = now;
    this.elapsedMs += gameDeltaMs;

    const event = this.level[this.nextEvent];
    if (this.autoPlay && event) {
      this.moveAxis = event.direction;
      if (!this.autoPressed.has(event.index) && this.elapsedMs >= beatToMs(event.beat)) {
        this.autoPressed.add(event.index);
        this.press(event.action);
      }
    }
    if (event && timingDeltaMs(this.elapsedMs, event) > ACTION_WINDOW_MS) {
      this.fail(`MISSED THE ${event.action.toUpperCase()}`);
      return;
    }

    this.updateCharacter(gameDeltaMs);
    this.updateEnemies();
    this.checkHazardCollisions();
    this.drawIndicator(this.elapsedMs);

    const beat = this.elapsedMs / BEAT_MS;
    const pulse = 1 + Math.max(0, 1 - (beat % 1) * 5) * 0.34;
    this.beatPulse.setScale(pulse).setAlpha(0.2 + (pulse - 1) * 0.65);

    const targetScroll = Phaser.Math.Clamp(this.character.x - 280, 0, this.worldWidth - 960);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetScroll, 0.09);

    const finalEvent = this.level[this.level.length - 1];
    const finishX = finalEvent.hazardX + finalEvent.direction * 230;
    const reachedFinish = finalEvent.direction === 1 ? this.character.x >= finishX : this.character.x <= finishX;
    if (this.nextEvent === this.level.length && reachedFinish) this.win();
  }

  private updateCharacter(gameDeltaMs: number): void {
    this.character.x = Phaser.Math.Clamp(
      this.character.x + this.moveAxis * RUN_SPEED * (gameDeltaMs / 1000),
      55,
      this.worldWidth - 80,
    );

    const jumpProgress = (this.elapsedMs - this.jumpStartedAt) / beatToMs(JUMP_BEATS);
    const duckProgress = (this.elapsedMs - this.duckStartedAt) / beatToMs(DUCK_BEATS);
    if (jumpProgress >= 0 && jumpProgress < 1) {
      this.character.y = GROUND_Y - Math.sin(jumpProgress * Math.PI) * 100;
      this.character.rotation = Math.sin(jumpProgress * Math.PI * 2) * 0.08;
      this.character.setScale(1 + Math.sin(jumpProgress * Math.PI) * 0.06, 1 - Math.sin(jumpProgress * Math.PI) * 0.04);
    } else if (duckProgress >= 0 && duckProgress < 1) {
      this.character.y = GROUND_Y + 15;
      this.character.rotation = 0;
      this.character.setScale(1.18, 0.42);
    } else {
      this.character.y = GROUND_Y;
      this.character.rotation = 0;
      this.character.setScale(1);
    }
  }

  private updateEnemies(): void {
    this.level.forEach((event) => {
      const enemy = this.enemies.get(event.index)!;
      const baseY = event.action === 'duck' ? 536 : 573;
      if (!this.cleared.has(event.index)) enemy.y = baseY + Math.sin(this.elapsedMs / 170 + event.index) * 2;
      const passed = event.direction === 1
        ? this.character.x > event.hazardX + 48
        : this.character.x < event.hazardX - 48;
      if (this.accepted.has(event.index) && passed && !this.cleared.has(event.index)) {
        this.cleared.add(event.index);
        enemy.setAlpha(0.35);
        if (event.action === 'jump') enemy.setScale(1, 0.3).setY(584);
      }
    });
  }

  private checkHazardCollisions(): void {
    for (const event of this.level) {
      if (this.cleared.has(event.index)) continue;
      if (event.index !== this.nextEvent && !this.accepted.has(event.index)) continue;
      if (Math.abs(this.character.x - event.hazardX) > 42) continue;
      if (event.action === 'jump') {
        const playerBottom = this.character.y + 26 * this.character.scaleY;
        if (playerBottom > 552) {
          this.fail('BONKED A BOUNCER');
          return;
        }
      } else {
        const playerTop = this.character.y - 25 * this.character.scaleY;
        if (playerTop < 548) {
          this.fail('DUCK UNDER THE FLYER');
          return;
        }
      }
    }
  }

  private drawIndicator(elapsedMs: number): void {
    const g = this.indicator;
    g.clear();
    g.fillStyle(COLORS.cream, 0.94).fillRoundedRect(180, 629, 600, 64, 25);
    g.lineStyle(3, COLORS.ink, 0.15).strokeRoundedRect(180, 629, 600, 64, 25);
    g.lineStyle(5, COLORS.red, 0.92).lineBetween(258, 635, 258, 687);
    g.fillStyle(COLORS.red, 1).fillTriangle(258, 628, 249, 639, 267, 639);

    for (let i = this.nextEvent; i < Math.min(this.level.length, this.nextEvent + 5); i += 1) {
      const event = this.level[i];
      const beatsAway = (beatToMs(event.beat) - elapsedMs) / BEAT_MS;
      const x = 258 + beatsAway * 70;
      if (x < 200 || x > 755) continue;
      const color = event.action === 'jump' ? COLORS.yellow : COLORS.mint;
      g.fillStyle(color, 0.3).fillCircle(x, 661, 25);
      g.fillStyle(color, 1).fillCircle(x, 661, 18);
      g.lineStyle(4, COLORS.ink, 0.9).lineBetween(x, event.action === 'jump' ? 670 : 652, x, event.action === 'jump' ? 651 : 670);
      const tipY = event.action === 'jump' ? 651 : 670;
      const baseY = event.action === 'jump' ? 659 : 662;
      g.lineBetween(x, tipY, x - 8, baseY);
      g.lineBetween(x, tipY, x + 8, baseY);
      g.fillStyle(COLORS.white, 0.95).fillCircle(x + 25, 648, 9);
      g.lineStyle(3, COLORS.ink, 0.9).lineBetween(x + 25 - event.direction * 4, 648, x + 25 + event.direction * 4, 648);
    }

    const next = this.level[this.nextEvent];
    if (!next) {
      const direction = this.level[this.level.length - 1].direction === 1 ? '→' : '←';
      this.promptText.setText(`KEEP RUNNING ${direction} TO THE FLAG`);
      return;
    }
    const beatsAway = Math.max(0, Math.ceil((beatToMs(next.beat) - elapsedMs) / BEAT_MS));
    const direction = next.direction === 1 ? '→' : '←';
    const action = next.action.toUpperCase();
    this.promptText.setText(beatsAway > 0 ? `HOLD ${direction} · ${action} IN ${beatsAway}` : `${action}!`);
  }
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount');

new Phaser.Game({
  type: Phaser.AUTO,
  parent: app,
  width: 960,
  height: 720,
  backgroundColor: '#79c9ff',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
});
