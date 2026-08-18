import Phaser from 'phaser';
import { BeatAudio } from './audio';
import {
  ACTION_WINDOW_MS,
  BEAT_MS,
  BPM,
  beatToMs,
  createLevel,
  timingDeltaMs,
  type Action,
  type BeatEvent,
  validateLevel,
} from './level';
import './style.css';

interface DebugState {
  phase: 'ready' | 'playing' | 'failed' | 'won';
  elapsedMs: number;
  nextEvent: number;
  combo: number;
}

declare global {
  interface Window {
    __BEATBOUND__?: {
      getState: () => DebugState;
      press: (action: Action) => void;
      restart: () => void;
      level: BeatEvent[];
    };
  }
}

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === 'true';
const AUTOPLAY = DEBUG && params.get('autoplay') === 'true';
const START_MUTED = params.get('music') === 'off';
const COLORS = {
  ink: 0x090b18,
  panel: 0x11152c,
  white: 0xf8f5ff,
  muted: 0x777d9e,
  mint: 0x61f4cb,
  yellow: 0xffdd57,
  pink: 0xff4f8b,
  purple: 0x8067ff,
};

class GameScene extends Phaser.Scene {
  private level = createLevel();
  private audio = new BeatAudio(this.level, START_MUTED);
  private phase: DebugState['phase'] = 'ready';
  private startAt = 0;
  private elapsedMs = 0;
  private nextEvent = 0;
  private combo = 0;
  private accepted = new Set<number>();
  private character!: Phaser.GameObjects.Container;
  private characterBody!: Phaser.GameObjects.Graphics;
  private indicator!: Phaser.GameObjects.Graphics;
  private beatPulse!: Phaser.GameObjects.Arc;
  private promptText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private debugText?: Phaser.GameObjects.Text;
  private startButton!: HTMLButtonElement;
  private soundButton!: HTMLButtonElement;
  private comboElement!: HTMLElement;
  private progressElement!: HTMLElement;
  private autoPressed = new Set<number>();

  constructor() {
    super('game');
  }

  create(): void {
    this.drawWorld();
    this.character = this.createCharacter(this.level[0].from.x, this.level[0].from.y);
    this.createCanvasHud();
    this.createDomUi();
    this.bindInputs();

    const validation = validateLevel(this.level);
    if (validation.errors.length > 0) throw new Error(validation.errors.join('\n'));

    window.__BEATBOUND__ = {
      getState: () => ({
        phase: this.phase,
        elapsedMs: Math.round(this.elapsedMs),
        nextEvent: this.nextEvent,
        combo: this.combo,
      }),
      press: (action) => this.press(action),
      restart: () => this.restart(),
      level: this.level,
    };
  }

  private drawWorld(): void {
    const background = this.add.graphics();
    background.fillStyle(COLORS.ink, 1).fillRect(0, -1200, 960, 2000);

    background.lineStyle(1, 0xffffff, 0.045);
    for (let y = -1100; y < 720; y += 48) background.lineBetween(0, y, 960, y);
    for (let x = 30; x < 930; x += 72) background.lineBetween(x, -1200, x, 720);

    for (let i = 0; i < 24; i += 1) {
      const x = 35 + ((i * 173) % 820);
      const y = 650 - i * 76;
      background.fillStyle(i % 3 === 0 ? COLORS.purple : COLORS.mint, 0.07);
      background.fillCircle(x, y, 16 + (i % 4) * 8);
    }

    const route = this.add.graphics();
    route.lineStyle(3, COLORS.purple, 0.18);
    route.beginPath();
    route.moveTo(this.level[0].from.x, this.level[0].from.y);
    for (const event of this.level) route.lineTo(event.to.x, event.to.y);
    route.strokePath();

    this.drawPlatform(route, this.level[0].from.x, this.level[0].from.y);
    for (const event of this.level) {
      if (event.action === 'duck') {
        const left = Math.min(event.from.x, event.to.x) - 92;
        const width = Math.abs(event.to.x - event.from.x) + 184;
        route.fillStyle(COLORS.panel, 1).fillRoundedRect(left, event.from.y + 28, width, 24, 9);
        route.fillStyle(COLORS.mint, 0.55).fillRect(left + 12, event.from.y + 28, width - 24, 3);
        this.drawFlyer(route, (event.from.x + event.to.x) / 2, event.from.y - 11, event.index);
      } else {
        this.drawSpikes(route, event.from.x + (event.to.x > event.from.x ? 74 : -74), event.from.y + 28, event.to.x > event.from.x ? 1 : -1);
      }
      this.drawPlatform(route, event.to.x, event.to.y);
    }

    const finish = this.level[this.level.length - 1].to;
    route.fillStyle(COLORS.yellow, 1).fillCircle(finish.x, finish.y - 70, 13);
    route.lineStyle(4, COLORS.yellow, 0.55).strokeCircle(finish.x, finish.y - 70, 23);
  }

  private drawPlatform(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.fillStyle(COLORS.panel, 1).fillRoundedRect(x - 96, y + 28, 192, 24, 9);
    graphics.fillStyle(COLORS.purple, 0.7).fillRect(x - 82, y + 28, 164, 3);
    graphics.fillStyle(0x000000, 0.2).fillRoundedRect(x - 80, y + 40, 160, 7, 3);
  }

  private drawSpikes(graphics: Phaser.GameObjects.Graphics, x: number, y: number, direction: number): void {
    graphics.fillStyle(COLORS.pink, 1);
    for (let i = 0; i < 3; i += 1) {
      const sx = x + direction * i * 13;
      graphics.fillTriangle(sx - 8, y, sx, y - 20 - i * 3, sx + 8, y);
    }
  }

  private drawFlyer(graphics: Phaser.GameObjects.Graphics, x: number, y: number, index: number): void {
    graphics.fillStyle(COLORS.pink, 0.15).fillCircle(x, y, 41);
    graphics.fillStyle(COLORS.pink, 1).fillRoundedRect(x - 34, y - 14, 68, 28, 13);
    graphics.fillStyle(COLORS.ink, 1).fillCircle(x - 12, y - 2, 4).fillCircle(x + 12, y - 2, 4);
    graphics.lineStyle(3, COLORS.pink, 0.65).lineBetween(x - 44, y - 21, x - 22, y - 10);
    graphics.lineBetween(x + 44, y - 21, x + 22, y - 10);
    if (index % 2 === 0) graphics.fillStyle(COLORS.yellow, 1).fillCircle(x, y + 7, 3);
  }

  private createCharacter(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 33, 58, 12, 0x000000, 0.3);
    this.characterBody = this.add.graphics();
    this.characterBody.fillStyle(COLORS.yellow, 1).fillRoundedRect(-28, -31, 56, 61, 19);
    this.characterBody.lineStyle(4, COLORS.ink, 0.8).strokeRoundedRect(-28, -31, 56, 61, 19);
    this.characterBody.fillStyle(COLORS.white, 1).fillCircle(-11, -9, 8).fillCircle(11, -9, 8);
    this.characterBody.fillStyle(COLORS.ink, 1).fillCircle(-9, -8, 3).fillCircle(13, -8, 3);
    this.characterBody.lineStyle(3, COLORS.ink, 0.8).lineBetween(-8, 11, 8, 11);
    const container = this.add.container(x, y, [shadow, this.characterBody]);
    container.setDepth(20);
    return container;
  }

  private createCanvasHud(): void {
    this.indicator = this.add.graphics().setScrollFactor(0).setDepth(50);
    this.beatPulse = this.add.circle(82, 635, 30, COLORS.purple, 0.25).setScrollFactor(0).setDepth(50);
    this.add.circle(82, 635, 20, COLORS.purple, 0.9).setScrollFactor(0).setDepth(51);
    this.add.text(82, 635, 'BEAT', {
      color: '#f8f5ff', fontFamily: 'Space Mono, monospace', fontSize: '10px', fontStyle: '700',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

    this.promptText = this.add.text(824, 625, 'GET READY', {
      color: '#f8f5ff', fontFamily: 'Chivo, sans-serif', fontSize: '19px', fontStyle: '900', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(54);
    this.feedbackText = this.add.text(480, 115, '', {
      color: '#61f4cb', fontFamily: 'Chivo, sans-serif', fontSize: '32px', fontStyle: '900', stroke: '#090b18', strokeThickness: 7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);
    this.progressText = this.add.text(24, 76, 'CLIMB 01', {
      color: '#777d9e', fontFamily: 'Space Mono, monospace', fontSize: '12px', fontStyle: '700',
    }).setScrollFactor(0).setDepth(54);

    if (DEBUG) {
      this.debugText = this.add.text(18, 108, '', {
        color: '#61f4cb', backgroundColor: '#090b18cc', fontFamily: 'monospace', fontSize: '11px', padding: { x: 6, y: 4 },
      }).setScrollFactor(0).setDepth(80);
    }
  }

  private createDomUi(): void {
    document.querySelector('#ui')?.remove();
    const ui = document.createElement('div');
    ui.id = 'ui';
    ui.innerHTML = `
      <div class="topbar">
        <div class="brand">BEAT<b>BOUND</b></div>
        <div class="stats">
          <span class="pill" id="progress-pill">0 / ${this.level.length}</span>
          <span class="pill" id="combo-pill">0 COMBO</span>
          <button class="pill" id="sound" aria-label="Toggle music">${START_MUTED ? '♪ OFF' : '♪ ON'}</button>
        </div>
      </div>
      <button id="start" aria-label="Start Beatbound">
        <span class="start-card">
          <small>${BPM} BPM · ONE BUTTON AT A TIME</small>
          <strong>PRESS TO<br>DROP THE BEAT</strong>
          <em>SPACE / ↑ = JUMP &nbsp; · &nbsp; ↓ = DUCK</em>
        </span>
      </button>
      <div id="mobile-controls">
        <button class="action-button" data-action="jump">↑ JUMP</button>
        <button class="action-button" data-action="duck">↓ DUCK</button>
      </div>`;
    document.body.append(ui);

    this.startButton = ui.querySelector<HTMLButtonElement>('#start')!;
    this.soundButton = ui.querySelector<HTMLButtonElement>('#sound')!;
    this.comboElement = ui.querySelector<HTMLElement>('#combo-pill')!;
    this.progressElement = ui.querySelector<HTMLElement>('#progress-pill')!;

    this.startButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (this.phase === 'ready') void this.startGame();
      else if (this.phase !== 'playing') this.restart();
    });
    this.soundButton.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      const muted = !this.audio.isMuted();
      this.audio.setMuted(muted);
      this.soundButton.textContent = muted ? '♪ OFF' : '♪ ON';
    });
    ui.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.phase === 'ready') void this.startGame();
        else this.press(button.dataset.action as Action);
      });
    });
  }

  private bindInputs(): void {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
      if (this.phase === 'ready') {
        if (event.code === 'Space' || event.code === 'Enter') void this.startGame();
        return;
      }
      if (this.phase !== 'playing') {
        if (event.code === 'Space' || event.code === 'KeyR') this.restart();
        return;
      }
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.press('jump');
      if (event.code === 'ArrowDown' || event.code === 'KeyS') this.press('duck');
      if (DEBUG && event.code === 'KeyN') this.press(this.level[this.nextEvent]?.action ?? 'jump');
    });
  }

  private async startGame(): Promise<void> {
    this.startButton.classList.add('hidden');
    await this.audio.start();
    this.phase = 'playing';
    this.startAt = performance.now() + 80;
    this.feedback('LISTEN…', COLORS.white);
  }

  private restart(): void {
    this.audio.stop();
    this.scene.restart();
  }

  private press(action: Action): void {
    if (this.phase !== 'playing') return;
    const event = this.level[this.nextEvent];
    if (!event) return;
    const delta = timingDeltaMs(this.elapsedMs, event);

    if (Math.abs(delta) > ACTION_WINDOW_MS) {
      if (delta < -ACTION_WINDOW_MS) this.feedback('TOO SOON', COLORS.muted);
      return;
    }
    if (action !== event.action) {
      this.fail(`NEEDED ${event.action.toUpperCase()}`);
      return;
    }

    this.accepted.add(event.index);
    this.nextEvent += 1;
    this.combo += 1;
    const perfect = Math.abs(delta) <= 58;
    this.feedback(perfect ? 'PERFECT' : delta < 0 ? 'EARLY' : 'LATE', perfect ? COLORS.mint : COLORS.yellow);
    this.audio.hit(action, perfect ? 'perfect' : 'good');
    this.comboElement.textContent = `${this.combo} COMBO`;
    this.progressElement.textContent = `${this.nextEvent} / ${this.level.length}`;
  }

  private fail(reason: string): void {
    if (this.phase !== 'playing') return;
    this.phase = 'failed';
    this.combo = 0;
    this.cameras.main.shake(230, 0.012);
    this.characterBody.clear();
    this.characterBody.fillStyle(COLORS.pink, 1).fillRoundedRect(-30, -18, 60, 36, 16);
    this.characterBody.fillStyle(COLORS.ink, 1).fillCircle(-11, -4, 4).fillCircle(11, -4, 4);
    this.feedback('BEAT BROKEN', COLORS.pink);
    this.startButton.classList.remove('hidden');
    this.startButton.querySelector('.start-card')!.innerHTML = `<small>${reason}</small><strong>OFF THE<br>BEAT</strong><em>PRESS SPACE TO RETRY</em>`;
  }

  private win(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'won';
    this.feedback('BOUND!', COLORS.yellow);
    this.cameras.main.flash(450, 97, 244, 203);
    this.startButton.classList.remove('hidden');
    this.startButton.querySelector('.start-card')!.innerHTML = `<small>${this.level.length} / ${this.level.length} CUES HIT</small><strong>BEAT<br>BOUND!</strong><em>PRESS SPACE TO RUN IT AGAIN</em>`;
  }

  private feedback(message: string, color: number): void {
    this.feedbackText.setText(message).setColor(`#${color.toString(16).padStart(6, '0')}`).setScale(0.75).setAlpha(1);
    this.tweens.killTweensOf(this.feedbackText);
    this.tweens.add({ targets: this.feedbackText, scale: 1, duration: 100, ease: 'Back.Out' });
    this.tweens.add({ targets: this.feedbackText, alpha: 0, delay: 380, duration: 260 });
  }

  update(): void {
    if (this.phase !== 'playing') {
      this.drawIndicator(this.elapsedMs);
      return;
    }

    this.elapsedMs = Math.max(0, performance.now() - this.startAt);
    const event = this.level[this.nextEvent];

    if (AUTOPLAY && event && !this.autoPressed.has(event.index) && this.elapsedMs >= beatToMs(event.beat)) {
      this.autoPressed.add(event.index);
      this.press(event.action);
    }

    if (event && timingDeltaMs(this.elapsedMs, event) > ACTION_WINDOW_MS) {
      this.fail(`MISSED ${event.action.toUpperCase()}`);
    }

    this.updateCharacter();
    this.drawIndicator(this.elapsedMs);

    const beat = this.elapsedMs / BEAT_MS;
    const pulse = 1 + Math.max(0, 1 - (beat % 1) * 5) * 0.35;
    this.beatPulse.setScale(pulse).setAlpha(0.18 + (pulse - 1) * 0.7);

    const targetScroll = Math.min(0, this.character.y - 500);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetScroll, 0.075);
    this.progressText.setText(`CLIMB ${String(this.nextEvent + 1).padStart(2, '0')}`);

    if (this.debugText) {
      const nextDelta = event ? Math.round(timingDeltaMs(this.elapsedMs, event)) : 0;
      this.debugText.setText(`DEBUG · ${AUTOPLAY ? 'AUTOPLAY' : 'MANUAL'}\nnext=${this.nextEvent} Δ=${nextDelta}ms\nwindow=±${ACTION_WINDOW_MS}ms · N=hit`);
    }

    const finalEvent = this.level[this.level.length - 1];
    if (this.nextEvent === this.level.length && this.elapsedMs > beatToMs(finalEvent.beat + 2)) this.win();
  }

  private updateCharacter(): void {
    let active: BeatEvent | undefined;
    for (const event of this.level) {
      if (this.accepted.has(event.index) && this.elapsedMs >= beatToMs(event.beat)) active = event;
    }
    if (!active) return;

    const progress = Phaser.Math.Clamp((this.elapsedMs - beatToMs(active.beat)) / beatToMs(2), 0, 1);
    const eased = Phaser.Math.Easing.Sine.InOut(progress);
    this.character.x = Phaser.Math.Linear(active.from.x, active.to.x, eased);
    this.character.y = Phaser.Math.Linear(active.from.y, active.to.y, eased);

    if (active.action === 'jump') {
      this.character.y -= Math.sin(progress * Math.PI) * 128;
      this.character.setScale(1 + Math.sin(progress * Math.PI) * 0.08, 1 - Math.sin(progress * Math.PI) * 0.08);
      this.character.rotation = Math.sin(progress * Math.PI * 2) * 0.06 * (active.to.x > active.from.x ? 1 : -1);
    } else {
      const duck = Math.sin(progress * Math.PI);
      this.character.setScale(1 + duck * 0.18, 1 - duck * 0.46);
      this.character.rotation = 0;
    }
  }

  private drawIndicator(elapsedMs: number): void {
    const g = this.indicator;
    g.clear();
    g.fillStyle(COLORS.panel, 0.82).fillRoundedRect(768, 70, 144, 535, 28);
    g.lineStyle(2, 0xffffff, 0.08).strokeRoundedRect(768, 70, 144, 535, 28);
    g.lineStyle(4, COLORS.white, 0.8).lineBetween(786, 556, 894, 556);
    g.fillStyle(COLORS.white, 0.9).fillTriangle(778, 556, 788, 549, 788, 563);
    g.fillTriangle(902, 556, 892, 549, 892, 563);

    for (let i = this.nextEvent; i < Math.min(this.level.length, this.nextEvent + 5); i += 1) {
      const event = this.level[i];
      const beatsAway = (beatToMs(event.beat) - elapsedMs) / BEAT_MS;
      const y = 556 - beatsAway * 82;
      if (y < 92 || y > 585) continue;
      const color = event.action === 'jump' ? COLORS.yellow : COLORS.mint;
      g.fillStyle(color, 0.16).fillCircle(840, y, 30);
      g.fillStyle(color, 1).fillCircle(840, y, 23);
      g.lineStyle(4, COLORS.ink, 0.85);
      if (event.action === 'jump') {
        g.lineBetween(840, y + 10, 840, y - 10);
        g.lineBetween(840, y - 10, 830, y);
        g.lineBetween(840, y - 10, 850, y);
      } else {
        g.lineBetween(840, y - 10, 840, y + 10);
        g.lineBetween(840, y + 10, 830, y);
        g.lineBetween(840, y + 10, 850, y);
      }
    }

    const next = this.level[this.nextEvent];
    this.promptText.setText(next ? next.action.toUpperCase() : 'FINISH!').setColor(next?.action === 'duck' ? '#61f4cb' : '#ffdd57');
  }
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount');

new Phaser.Game({
  type: Phaser.AUTO,
  parent: app,
  width: 960,
  height: 720,
  backgroundColor: '#090b18',
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
