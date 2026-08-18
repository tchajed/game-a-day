import Phaser from 'phaser';
import './style.css';

type Encounter = {
  name: string;
  kind: string;
  level: number;
  maxHp: number;
  color: number;
  accent: number;
  intro: string;
  attack: string;
  defeated: string;
};

type GameState = {
  encounter: number;
  completed: boolean[];
  playerHp: number;
  phase: 'overworld' | 'battle' | 'complete';
};

const W = 1280;
const H = 720;
const DEBUG = new URLSearchParams(location.search).get('debug') === 'true';
const state: GameState = { encounter: 0, completed: [false, false, false], playerHp: 100, phase: 'overworld' };
const touch = { up: false, down: false, left: false, right: false };

const encounters: Encounter[] = [
  {
    name: 'NULL POINTER', kind: 'Wild Bug', level: 3, maxHp: 42, color: 0xf05b4f, accent: 0xffd35c,
    intro: 'A wild NULL POINTER appeared!\nIt is pointing at absolutely nothing.',
    attack: 'NULL POINTER used PANIC IN PROD!', defeated: 'The pointer found purpose. Bug resolved!'
  },
  {
    name: 'MEMORY LEAK', kind: 'Wild Incident', level: 5, maxHp: 55, color: 0x8d63d2, accent: 0x69e6c1,
    intro: 'A wild MEMORY LEAK seeped from the tall code!\nYour laptop fan sounds concerned.',
    attack: 'MEMORY LEAK used CONSUME RAM!', defeated: 'The heap is tidy again. Incident resolved!'
  },
  {
    name: 'ONE TINY CHANGE', kind: 'Feature Request', level: 8, maxHp: 68, color: 0x3b78d8, accent: 0xffb44b,
    intro: 'PM ALEX wants to sync!\n“It is just one tiny change...”',
    attack: 'ONE TINY CHANGE used SCOPE CREEP!', defeated: 'Requirements aligned! Alex scheduled a follow-up.'
  }
];

const statusNode = document.querySelector<HTMLDivElement>('#game-status')!;
function setStatus(message: string) {
  statusNode.textContent = message;
  document.body.dataset.gamePhase = state.phase;
  document.body.dataset.encounter = String(state.encounter);
}

class TinyAudio {
  private ctx?: AudioContext;
  private timer?: number;
  private step = 0;
  enabled = new URLSearchParams(location.search).get('music') !== 'off';

  unlock() {
    if (!this.enabled) return;
    this.ctx ??= new AudioContext();
    this.ctx.resume();
    if (!this.timer) this.timer = window.setInterval(() => this.note(), 260);
  }
  private note() {
    if (!this.ctx || !this.enabled) return;
    const notes = [261.6, 329.6, 392, 493.9, 392, 329.6, 293.7, 392];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle'; osc.frequency.value = notes[this.step++ % notes.length];
    gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.21);
  }
  sfx(freq = 440, duration = 0.12, type: OscillatorType = 'square') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + duration);
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();
    return this.enabled;
  }
}
const audio = new TinyAudio();
const musicButton = document.querySelector<HTMLButtonElement>('#music-toggle')!;
function syncMusicButton() {
  musicButton.textContent = audio.enabled ? '♫ MUSIC ON' : '♫ MUSIC OFF';
  musicButton.setAttribute('aria-pressed', String(audio.enabled));
}
syncMusicButton();
musicButton.addEventListener('click', () => { audio.toggle(); syncMusicButton(); });
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', () => audio.unlock(), { once: true });

document.querySelectorAll<HTMLButtonElement>('#touch-controls button').forEach(button => {
  const direction = button.dataset.dir as keyof typeof touch;
  const on = (event: Event) => { event.preventDefault(); touch[direction] = true; audio.unlock(); };
  const off = (event: Event) => { event.preventDefault(); touch[direction] = false; };
  button.addEventListener('pointerdown', on);
  button.addEventListener('pointerup', off);
  button.addEventListener('pointercancel', off);
  button.addEventListener('pointerleave', off);
});

const textStyle = (size: number, color = '#172436', weight = '700'): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'Outfit, Arial, sans-serif', fontSize: `${size}px`, fontStyle: weight === '800' ? 'bold' : 'normal', color
});
const monoStyle = (size: number, color = '#172436'): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'DM Mono, monospace', fontSize: `${size}px`, color
});

function addPill(scene: Phaser.Scene, x: number, y: number, label: string, fill: number, color = '#ffffff') {
  const text = scene.add.text(x, y, label, monoStyle(12, color)).setOrigin(0.5);
  const bg = scene.add.rectangle(x, y, text.width + 20, 28, fill).setStrokeStyle(1, 0xffffff, 0.18);
  text.setDepth(bg.depth + 1);
  return [bg, text];
}

function createTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('hero')) return;
  const g = scene.add.graphics();
  // All character art is authored on a tiny grid, then nearest-neighbor scaled.
  // Hero (24 × 30).
  g.fillStyle(0x172436).fillRect(5, 4, 14, 4).fillRect(3, 7, 18, 3);
  g.fillStyle(0xf2bb8f).fillRect(6, 10, 12, 8).fillRect(8, 18, 8, 2);
  g.fillStyle(0x26384a).fillRect(7, 12, 3, 2).fillRect(15, 12, 3, 2);
  g.fillStyle(0x42a5d9).fillRect(4, 20, 16, 7);
  g.fillStyle(0xffd35c).fillRect(11, 20, 3, 7);
  g.fillStyle(0x243c59).fillRect(5, 27, 6, 3).fillRect(14, 27, 6, 3);
  g.generateTexture('hero', 24, 30); g.clear();
  // Tree (24 × 30).
  g.fillStyle(0x60452f).fillRect(10, 19, 5, 11);
  g.fillStyle(0x19563a).fillRect(4, 7, 16, 14).fillRect(7, 3, 11, 20).fillRect(1, 11, 22, 7);
  g.fillStyle(0x3b8a54).fillRect(7, 5, 7, 5).fillRect(3, 11, 6, 5).fillRect(14, 9, 6, 6);
  g.generateTexture('tree', 24, 30); g.clear();
  // Tall-code tuft (12 × 12).
  g.fillStyle(0x24694f).fillRect(1, 3, 2, 9).fillRect(5, 0, 2, 12).fillRect(9, 4, 2, 8);
  g.fillStyle(0x69ba70).fillRect(3, 6, 2, 2).fillRect(7, 3, 2, 2);
  g.generateTexture('grass', 12, 12); g.clear();
  // Maya's battle backsprite (48 × 52).
  g.fillStyle(0x183047).fillRect(9, 44, 28, 8);
  g.fillStyle(0x253e5d).fillRect(14, 31, 22, 16);
  g.fillStyle(0x2c9ec2).fillRect(5, 20, 35, 20).fillRect(9, 15, 27, 8);
  g.fillStyle(0xd9976e).fillRect(14, 5, 20, 16).fillRect(17, 21, 14, 3);
  g.fillStyle(0x30283a).fillRect(11, 2, 25, 8).fillRect(10, 7, 7, 8).fillRect(32, 7, 5, 6);
  g.fillStyle(0xe9f1f2).fillRect(27, 25, 20, 16);
  g.fillStyle(0x315f79).fillRect(34, 31, 7, 3);
  g.generateTexture('dev-back', 48, 52); g.clear();
  // Null Pointer (40 × 40).
  g.fillStyle(0x28384a).fillRect(4, 3, 8, 8).fillRect(28, 3, 8, 8).fillRect(5, 13, 30, 23).fillRect(10, 8, 20, 30);
  g.fillStyle(0xffd35c).fillRect(6, 5, 5, 6).fillRect(29, 5, 5, 6);
  g.fillStyle(0xf05b4f).fillRect(8, 14, 24, 21).fillRect(12, 10, 16, 27);
  g.fillStyle(0xffffff).fillRect(12, 18, 5, 5).fillRect(24, 18, 5, 5);
  g.fillStyle(0x172436).fillRect(14, 20, 2, 2).fillRect(25, 20, 2, 2).fillRect(15, 29, 10, 2);
  g.generateTexture('enemy-0', 40, 40); g.clear();
  // Memory Leak (44 × 40).
  g.fillStyle(0x342c57).fillRect(3, 19, 38, 17).fillRect(7, 10, 30, 28).fillRect(13, 5, 20, 34);
  g.fillStyle(0x8d63d2).fillRect(5, 20, 34, 15).fillRect(9, 11, 26, 25).fillRect(15, 7, 16, 30);
  g.fillStyle(0xa779e8).fillRect(9, 15, 8, 8).fillRect(17, 9, 12, 5);
  g.fillStyle(0xffffff).fillRect(12, 19, 6, 6).fillRect(27, 19, 6, 6);
  g.fillStyle(0x273247).fillRect(14, 21, 3, 3).fillRect(28, 21, 3, 3).fillRect(18, 30, 10, 2);
  g.fillStyle(0x7553bd).fillRect(6, 35, 8, 5).fillRect(31, 34, 9, 6);
  g.generateTexture('enemy-1', 44, 40); g.clear();
  // One Tiny Change (48 × 44).
  g.fillStyle(0x1d3554).fillRect(6, 13, 36, 28).fillRect(2, 5, 14, 13).fillRect(17, 1, 16, 15).fillRect(34, 7, 13, 14);
  g.fillStyle(0x3977cd).fillRect(8, 15, 32, 24);
  g.fillStyle(0xffffff).fillRect(4, 7, 10, 9).fillRect(19, 3, 12, 10).fillRect(36, 9, 9, 10).fillRect(13, 21, 6, 6).fillRect(29, 21, 6, 6);
  g.fillStyle(0xe45555).fillRect(7, 10, 5, 2).fillRect(22, 7, 6, 2).fillRect(38, 12, 5, 2);
  g.fillStyle(0xdbeaff).fillRect(16, 33, 16, 2);
  g.generateTexture('enemy-2', 48, 44); g.destroy();
}

class WorldScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  objective!: Phaser.GameObjects.Text;
  location!: Phaser.GameObjects.Text;
  private inTransition = false;
  private welcome?: Phaser.GameObjects.Container;

  constructor() { super('WorldScene'); }

  create() {
    createTextures(this);
    state.phase = 'overworld'; setStatus('Exploring Route 404. Use arrow keys or WASD to move east.');
    this.physics.world.setBounds(0, 0, 2400, H);
    this.drawMap();
    this.player = this.physics.add.sprite(330, 410, 'hero').setScale(2.5).setCollideWorldBounds(true).setDepth(30).setSize(16, 14).setOffset(4, 15);
    this.player.setPosition(state.completed[2] ? 1990 : state.completed[1] ? 1460 : state.completed[0] ? 1010 : 330, 410);
    this.cameras.main.setBounds(0, 0, 2400, H).startFollow(this.player, true, 0.09, 0.09).setZoom(1);
    const keyboard = this.input.keyboard!;
    this.keys = keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,N') as Record<string, Phaser.Input.Keyboard.Key>;
    this.makeHud();
    this.physics.add.collider(this.player, this.physics.add.staticGroup());
    this.events.on('resume', this.onResume, this);
    if (!state.completed.some(Boolean)) this.showWelcome();
    if (DEBUG) this.makeDebugTools();
  }

  private drawMap() {
    const add = this.add;
    add.rectangle(1200, 360, 2400, 720, 0xa8d980).setDepth(-20);
    // Cities and the winding route.
    add.rectangle(300, 385, 600, 290, 0xdde0cf).setDepth(-18);
    add.rectangle(2130, 380, 540, 340, 0xe3d8c2).setDepth(-18);
    const road = add.graphics().setDepth(-16);
    road.lineStyle(150, 0xc8b98f, 1).beginPath().moveTo(520, 420).lineTo(820, 430).lineTo(1060, 330).lineTo(1380, 430).lineTo(1700, 360).lineTo(1900, 400).strokePath();
    road.lineStyle(4, 0xe8dbb9, 0.8).beginPath().moveTo(520, 420).lineTo(820, 430).lineTo(1060, 330).lineTo(1380, 430).lineTo(1700, 360).lineTo(1900, 400).strokePath();
    // Route grass patches: encounter foreshadowing.
    for (const [cx, cy] of [[770, 330], [850, 500], [1190, 290], [1290, 510], [1530, 300], [1600, 470]]) {
      add.rectangle(cx, cy, 150, 86, 0x74b96e, 0.7).setStrokeStyle(3, 0x5ba45f).setDepth(-14);
      for (let i = 0; i < 9; i++) add.image(cx - 55 + (i % 5) * 27, cy - 25 + Math.floor(i / 5) * 45, 'grass').setScale(2.4).setDepth(-12);
    }
    // Water and bridges at the lower edge.
    add.rectangle(1200, 674, 2400, 92, 0x58b8d5).setDepth(-17);
    for (let x = 0; x < 2400; x += 70) add.ellipse(x, 650 + (x % 140 ? 10 : 0), 48, 7, 0x9cdef0, .65).setDepth(-15);
    // Buildings.
    this.building(80, 220, 210, 165, 0xef795c, 'GIT & GO');
    this.building(315, 180, 180, 205, 0x4c87c9, 'DEV HQ');
    this.building(90, 485, 185, 120, 0xf3b954, 'CAFÉ++');
    this.building(1950, 190, 215, 175, 0x6c88c8, 'SHIPYARD');
    this.building(2185, 245, 175, 140, 0xe27182, 'QA LAB');
    this.building(2070, 500, 215, 120, 0x58ad8c, 'CLOUD 9');
    // Trees lining route.
    for (const [x, y] of [[580,160],[660,230],[760,145],[885,200],[1000,130],[1130,170],[1270,145],[1400,180],[1530,140],[1680,180],[1790,150],[610,570],[720,610],[960,580],[1100,610],[1430,590],[1590,585],[1760,570]]) {
      add.image(x, y, 'tree').setScale(3).setDepth(y);
    }
    // City labels and route signs.
    this.sign(385, 500, 'STARTUP CITY', 'Population: pivoting');
    this.sign(1040, 210, 'ROUTE 404', 'Bugs may be encountered');
    this.sign(1940, 435, 'SHIP CITY', 'Deploy with confidence');
    // NPC flavor.
    this.npc(520, 305, 0xea638c, 'intern');
    this.npc(1845, 475, 0x755bd3, 'alex');
    // Foreground decorative lamps.
    for (const x of [45, 280, 520, 1980, 2260]) {
      add.rectangle(x, 455, 7, 80, 0x344d55).setDepth(455);
      add.circle(x, 414, 13, 0xffeb9b).setStrokeStyle(5, 0x344d55).setDepth(456);
    }
  }

  private building(x: number, y: number, width: number, height: number, color: number, name: string) {
    const a = this.add;
    a.rectangle(x + 7, y + 12, width, height, 0x213344, .18).setOrigin(0).setDepth(y - 2);
    a.rectangle(x, y, width, height, 0xf4f1e5).setOrigin(0).setStrokeStyle(5, 0x31495b).setDepth(y - 1);
    a.polygon(x + width / 2, y + 10, [0,45, width/2,-15, width,45], color).setStrokeStyle(5, 0x31495b).setDepth(y);
    a.rectangle(x + width / 2, y + height - 38, 42, 76, 0x2c465d).setDepth(y + 1);
    a.rectangle(x + 35, y + 92, 42, 42, 0x9bd7e5).setStrokeStyle(4, 0x31495b).setDepth(y + 1);
    a.text(x + width / 2, y + 58, name, monoStyle(14, '#24384c')).setOrigin(.5).setDepth(y + 2);
  }

  private sign(x: number, y: number, title: string, subtitle: string) {
    this.add.rectangle(x, y + 38, 8, 76, 0x6e573d).setDepth(y);
    this.add.rectangle(x, y, 230, 68, 0xf9efd0).setStrokeStyle(5, 0x31495b).setDepth(y + 1);
    this.add.text(x, y - 11, title, monoStyle(15, '#1d3347')).setOrigin(.5).setDepth(y + 2);
    this.add.text(x, y + 13, subtitle, textStyle(13, '#526578')).setOrigin(.5).setDepth(y + 2);
  }

  private npc(x: number, y: number, color: number, id: string) {
    const c = this.add.container(x, y).setDepth(y);
    const shadow = this.add.ellipse(0, 34, 36, 12, 0x1d3a35, .25);
    const body = this.add.rectangle(0, 12, 28, 38, color).setStrokeStyle(3, 0x26394b);
    const head = this.add.circle(0, -15, 13, 0xe6ad81).setStrokeStyle(3, 0x26394b);
    c.add([shadow, body, head]).setData('id', id);
    this.tweens.add({ targets: c, y: y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private makeHud() {
    const panel = this.add.rectangle(28, 24, 400, 92, 0x14283c, .94).setOrigin(0).setScrollFactor(0).setStrokeStyle(2, 0xffffff, .18).setDepth(100);
    this.add.text(48, 39, 'CURRENT SPRINT', monoStyle(12, '#7ee0c3')).setScrollFactor(0).setDepth(101);
    this.objective = this.add.text(48, 61, this.objectiveCopy(), textStyle(23, '#ffffff', '800')).setScrollFactor(0).setDepth(101);
    const hint = this.add.text(48, 92, 'MOVE  WASD / ARROWS', monoStyle(11, '#9ab0c2')).setScrollFactor(0).setDepth(101);
    this.location = this.add.text(W / 2, 36, 'STARTUP CITY', monoStyle(13, '#ffffff')).setOrigin(.5).setScrollFactor(0).setDepth(101).setBackgroundColor('#213e55').setPadding(14, 7);
    const dots = this.add.container(W - 270, 74).setScrollFactor(0).setDepth(101);
    for (let i = 0; i < 3; i++) {
      const done = state.completed[i];
      dots.add(this.add.circle(i * 70, 0, 18, done ? 0x67dfb6 : 0x304b61).setStrokeStyle(2, done ? 0xb9ffe8 : 0x628096));
      dots.add(this.add.text(i * 70, 0, done ? '✓' : String(i + 1), textStyle(15, done ? '#173a32' : '#b9c8d4', '800')).setOrigin(.5));
      if (i < 2) dots.add(this.add.rectangle(i * 70 + 35, 0, 34, 3, done ? 0x67dfb6 : 0x304b61));
    }
    panel.setData('hint', hint);
  }

  private objectiveCopy() {
    const count = state.completed.filter(Boolean).length;
    return count < 2 ? `Resolve blockers  ${count}/2` : count < 3 ? 'Face the stakeholder' : 'Reach Ship City';
  }

  private showWelcome() {
    const bg = this.add.rectangle(42, H - 154, 600, 116, 0xfffbeb, .98).setOrigin(0).setStrokeStyle(4, 0x223b51).setScrollFactor(0);
    const tag = this.add.text(68, H - 139, 'RAVI · SRE', monoStyle(12, '#2d9475')).setScrollFactor(0);
    const copy = this.add.text(68, H - 112, 'Morning! The deploy is due in Ship City.\nRoute 404 should be totally stable now.', textStyle(20, '#21364a')).setLineSpacing(6).setScrollFactor(0);
    const prompt = this.add.text(610, H - 60, 'MOVE  →', monoStyle(12, '#62778a')).setOrigin(1).setScrollFactor(0);
    this.welcome = this.add.container(0, 0, [bg, tag, copy, prompt]).setDepth(120);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: this.welcome, alpha: 0, y: 15, duration: 300, onComplete: () => this.welcome?.destroy() }));
  }

  private makeDebugTools() {
    const bg = this.add.rectangle(W - 260, H - 58, 230, 38, 0x672448, .92).setScrollFactor(0).setDepth(130).setInteractive({ useHandCursor: true });
    const label = this.add.text(W - 260, H - 58, '[DEBUG] N · skip fight', monoStyle(12, '#ffffff')).setOrigin(.5).setScrollFactor(0).setDepth(131);
    bg.on('pointerdown', () => this.debugSkip()); label.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.debugSkip());
    this.input.keyboard!.on('keydown-N', () => this.debugSkip());
  }

  private debugSkip() {
    const next = state.completed.findIndex(done => !done);
    if (next === -1) { this.player.x = 2130; return; }
    state.completed[next] = true; state.encounter = next;
    this.player.x = [1010, 1460, 1990][next];
    this.objective.setText(this.objectiveCopy());
  }

  private onResume() {
    state.phase = 'overworld'; this.inTransition = false;
    const i = state.encounter;
    this.player.x = [990, 1440, 1980][i];
    this.player.y = i === 1 ? 410 : 390;
    this.objective.setText(this.objectiveCopy());
    this.flashCamera(0xffffff, 180);
    setStatus(`${encounters[i].name} resolved. Continue east toward Ship City.`);
  }

  private flashCamera(color: number, duration: number) { this.cameras.main.flash(duration, (color >> 16) & 255, (color >> 8) & 255, color & 255); }

  update() {
    if (!this.player || this.inTransition) return;
    let x = 0, y = 0;
    if (this.keys.A.isDown || this.keys.LEFT.isDown || touch.left) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown || touch.right) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown || touch.up) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown || touch.down) y += 1;
    const velocity = new Phaser.Math.Vector2(x, y).normalize().scale(245);
    this.player.setVelocity(velocity.x, velocity.y);
    if (x) this.player.setFlipX(x < 0);
    if (x || y) this.player.rotation = Math.sin(this.time.now / 90) * .035;
    else this.player.rotation = 0;
    this.player.y = Phaser.Math.Clamp(this.player.y, 250, 590);
    this.player.setDepth(this.player.y + 10);
    const px = this.player.x;
    this.location.setText(px < 590 ? 'STARTUP CITY' : px < 1850 ? 'ROUTE 404' : 'SHIP CITY');
    if (!state.completed[0] && px > 825) this.startEncounter(0);
    else if (state.completed[0] && !state.completed[1] && px > 1270) this.startEncounter(1);
    else if (state.completed[1] && !state.completed[2] && px > 1800) this.startEncounter(2);
    else if (state.completed.every(Boolean) && px > 2180) {
      this.inTransition = true; state.phase = 'complete'; this.scene.start('EndScene');
    }
  }

  private startEncounter(index: number) {
    this.inTransition = true; this.player.setVelocity(0);
    state.encounter = index; state.phase = 'battle';
    audio.sfx(660, .3, 'sawtooth');
    this.cameras.main.shake(250, .008);
    this.time.delayedCall(260, () => {
      this.cameras.main.flash(380, 255, 255, 255);
      this.time.delayedCall(180, () => { this.scene.pause(); this.scene.launch('BattleScene'); });
    });
  }
}

class BattleScene extends Phaser.Scene {
  encounter!: Encounter;
  enemyHp = 0;
  playerHp = state.playerHp;
  shield = false;
  processing = true;
  enemyBar!: Phaser.GameObjects.Rectangle;
  playerBar!: Phaser.GameObjects.Rectangle;
  message!: Phaser.GameObjects.Text;
  actionGroup!: Phaser.GameObjects.Container;
  enemyArt!: Phaser.GameObjects.Container;
  enemyName!: Phaser.GameObjects.Text;
  turn = 0;

  constructor() { super('BattleScene'); }

  create() {
    this.encounter = encounters[state.encounter]; this.enemyHp = this.encounter.maxHp;
    state.phase = 'battle'; setStatus(this.encounter.intro.replace('\n', ' '));
    this.drawArena();
    this.drawCombatants();
    this.drawHud();
    this.cameras.main.fadeIn(280, 255, 255, 255);
    this.time.delayedCall(500, () => this.showMessage(this.encounter.intro, () => this.showActions()));
    if (DEBUG) this.input.keyboard!.on('keydown-K', () => this.win());
  }

  private drawArena() {
    this.add.rectangle(W/2, H/2, W, H, 0xd7f3ed).setDepth(-10);
    const sky = this.add.graphics().setDepth(-9);
    sky.fillGradientStyle(0x83d7df, 0x83d7df, 0xe6f6e8, 0xe6f6e8).fillRect(0, 0, W, 460);
    // Stylized cloud server stacks.
    for (let x = 30; x < W; x += 170) {
      const h = 95 + (x % 3) * 25;
      this.add.rectangle(x, 325 - h/2, 105, h, 0x82b9b1, .45).setOrigin(0).setDepth(-8);
      for (let y = 0; y < h - 20; y += 25) this.add.rectangle(x + 18, 345 - h + y, 69, 8, 0xc5e9df, .7).setDepth(-7);
    }
    this.add.rectangle(W/2, 493, W, 210, 0x79b77e).setDepth(-6);
    for (let x = 0; x < W; x += 64) this.add.circle(x, 410 + Math.sin(x)*10, 42, x % 128 ? 0x63a671 : 0x6bad77).setDepth(-5);
    this.add.ellipse(930, 405, 430, 126, 0x91c48a).setStrokeStyle(4, 0xe5f0b7, .8);
    this.add.ellipse(285, 565, 510, 155, 0x91c48a).setStrokeStyle(4, 0xe5f0b7, .8);
    // Top title chip.
    addPill(this, W/2, 34, state.encounter === 2 ? 'STAKEHOLDER BATTLE' : 'WILD BLOCKER', 0x18364a);
  }

  private drawCombatants() {
    this.enemyArt = this.makeEnemy(940, 258, state.encounter).setScale(.2).setAlpha(0);
    this.tweens.add({ targets: this.enemyArt, scale: 1, alpha: 1, duration: 480, ease: 'Back.out' });
    const dev = this.add.container(270, 438).setDepth(10);
    const shadow = this.add.rectangle(0, 105, 190, 32, 0x315f4d, .28);
    const sprite = this.add.image(0, 0, 'dev-back').setScale(5);
    dev.add([shadow, sprite]);
    this.tweens.add({ targets: dev, y: 430, duration: 800, yoyo: true, repeat: -1, ease: 'Stepped' });
  }

  private makeEnemy(x: number, y: number, kind: number) {
    const c = this.add.container(x, y).setDepth(8);
    const shadow = this.add.rectangle(0, 110, 220, 34, 0x315f4d, .3);
    const sprite = this.add.image(0, 0, `enemy-${kind}`).setScale(5);
    c.add([shadow, sprite]);
    this.tweens.add({ targets: c, y: y - 8, duration: 720, yoyo: true, repeat: -1, ease: 'Stepped' });
    return c;
  }

  private drawHud() {
    // Enemy status card.
    this.add.rectangle(50, 70, 475, 128, 0xfffdf4, .98).setOrigin(0).setStrokeStyle(4, 0x233a50).setDepth(20);
    this.enemyName = this.add.text(76, 90, this.encounter.name, textStyle(26, '#182c40', '800')).setDepth(21);
    this.add.text(76, 126, `${this.encounter.kind.toUpperCase()}  ·  LV.${this.encounter.level}`, monoStyle(12, '#637689')).setDepth(21);
    this.add.text(284, 158, 'BLOCKER', monoStyle(11, '#637689')).setOrigin(1, .5).setDepth(21);
    this.add.rectangle(300, 158, 196, 14, 0xd7dedb).setOrigin(0, .5).setDepth(21);
    this.enemyBar = this.add.rectangle(300, 158, 196, 14, 0x48c590).setOrigin(0, .5).setDepth(22);
    // Player card.
    this.add.rectangle(735, 400, 495, 128, 0xfffdf4, .98).setOrigin(0).setStrokeStyle(4, 0x233a50).setDepth(20);
    this.add.text(762, 418, 'MAYA', textStyle(27, '#182c40', '800')).setDepth(21);
    this.add.text(850, 426, 'STAFF ENGINEER  ·  LV.12', monoStyle(11, '#637689')).setDepth(21);
    this.add.text(762, 465, 'FOCUS', monoStyle(11, '#637689')).setDepth(21);
    this.add.rectangle(825, 471, 330, 16, 0xd7dedb).setOrigin(0, .5).setDepth(21);
    this.playerBar = this.add.rectangle(825, 471, 330 * (this.playerHp / 100), 16, 0x48c590).setOrigin(0, .5).setDepth(22);
    this.add.text(1178, 471, `${this.playerHp}/100`, monoStyle(11, '#35495c')).setOrigin(.5).setDepth(23).setName('hp-text');
    // Dialogue / actions base.
    this.add.rectangle(0, 535, W, 185, 0x132b3f).setOrigin(0).setStrokeStyle(5, 0x315267).setDepth(30);
    this.message = this.add.text(55, 570, '', textStyle(25, '#f8fbff')).setWordWrapWidth(790).setLineSpacing(8).setDepth(32);
    // Party chips.
    const party = this.add.container(1120, 576).setDepth(33);
    party.add(this.add.text(0, -20, 'ON CALL', monoStyle(11, '#7ee0c3')).setOrigin(.5));
    [['M',0x42a5d9], ['I',0xe56c99], ['R',0xf0ae4c]].forEach(([letter, color], i) => {
      party.add(this.add.circle(-70 + i * 70, 24, 24, color as number).setStrokeStyle(3, 0xffffff, .7));
      party.add(this.add.text(-70 + i * 70, 24, letter as string, textStyle(15, '#ffffff', '800')).setOrigin(.5));
    });
    party.add(this.add.text(0, 65, 'MAYA  ·  INEZ  ·  RAVI', monoStyle(10, '#a7bbca')).setOrigin(.5));
  }

  private showMessage(copy: string, onDone?: () => void) {
    this.processing = true; this.actionGroup?.destroy(); this.message.setText(copy);
    this.time.delayedCall(Math.max(700, Math.min(1450, copy.length * 22)), () => onDone?.());
  }

  private showActions() {
    this.processing = false; this.message.setText('Choose a response');
    this.actionGroup = this.add.container(430, 550).setDepth(40);
    const actions = [
      { key: '1', title: 'SET BREAKPOINT', by: 'MAYA · precise', color: 0x2c91bd },
      { key: '2', title: 'WRITE A TEST', by: 'INEZ · shields', color: 0xdd658c },
      { key: '3', title: 'CHECK METRICS', by: 'RAVI · critical', color: 0x46a67d },
      { key: '4', title: 'SHIP HOTFIX', by: 'TEAM · risky', color: 0xe2963f }
    ];
    actions.forEach((action, i) => {
      const x = (i % 2) * 295, y = Math.floor(i / 2) * 76;
      const bg = this.add.rectangle(x, y, 274, 62, action.color).setOrigin(0).setStrokeStyle(2, 0xffffff, .35).setInteractive({ useHandCursor: true });
      const num = this.add.text(x + 17, y + 12, action.key, monoStyle(13, '#ffffff'));
      const title = this.add.text(x + 44, y + 9, action.title, textStyle(16, '#ffffff', '800'));
      const by = this.add.text(x + 44, y + 34, action.by, monoStyle(10, '#e8f4f5'));
      bg.on('pointerover', () => bg.setScale(1.025)).on('pointerout', () => bg.setScale(1)).on('pointerdown', () => this.takeAction(i));
      this.actionGroup.add([bg, num, title, by]);
    });
    const keys = ['ONE','TWO','THREE','FOUR'];
    keys.forEach((key, i) => this.input.keyboard!.once(`keydown-${key}`, () => this.takeAction(i)));
    setStatus(`Battle with ${this.encounter.name}. Choose action 1 breakpoint, 2 test, 3 metrics, or 4 hotfix.`);
  }

  takeAction(index: number) {
    if (this.processing) return;
    this.processing = true; this.actionGroup.destroy(); this.turn++;
    let damage = 0, copy = '';
    if (index === 0) { damage = 13 + (this.turn === 1 ? 7 : 0); copy = 'MAYA set a breakpoint.\n“Ah. There you are.”'; }
    if (index === 1) { damage = 10; this.shield = true; copy = 'INEZ wrote a failing test.\nThe next interruption is blocked!'; }
    if (index === 2) { damage = this.enemyHp < this.encounter.maxHp / 2 ? 25 : 16; copy = 'RAVI checked the metrics.\nThe graph is extremely accusatory!'; }
    if (index === 3) { damage = Phaser.Math.Between(18, 29); copy = damage > 24 ? 'The team shipped a hotfix.\nIt works! Nobody breathe.' : 'The team shipped a hotfix.\nIt mostly works!'; }
    audio.sfx(560 + index * 90, .18);
    this.tweens.add({ targets: this.enemyArt, x: this.enemyArt.x + 16, duration: 55, yoyo: true, repeat: 4 });
    this.damageEnemy(damage);
    this.showMessage(`${copy}\n${damage} progress!`, () => {
      if (this.enemyHp <= 0) this.win(); else this.enemyTurn();
    });
  }

  private damageEnemy(amount: number) {
    this.enemyHp = Math.max(0, this.enemyHp - amount);
    this.tweens.add({ targets: this.enemyBar, displayWidth: 196 * (this.enemyHp / this.encounter.maxHp), duration: 350 });
    if (this.enemyHp / this.encounter.maxHp < .35) this.enemyBar.setFillStyle(0xf19c4c);
  }

  private enemyTurn() {
    const blocked = this.shield; this.shield = false;
    const amount = blocked ? 2 : Phaser.Math.Between(8, 14) + state.encounter * 2;
    this.playerHp = Math.max(0, this.playerHp - amount);
    audio.sfx(180, .25, 'sawtooth');
    this.cameras.main.shake(180, .009);
    this.tweens.add({ targets: this.playerBar, displayWidth: 330 * (this.playerHp / 100), duration: 350 });
    const hpText = this.children.getByName('hp-text') as Phaser.GameObjects.Text;
    hpText.setText(`${this.playerHp}/100`);
    if (this.playerHp < 35) this.playerBar.setFillStyle(0xf05b4f);
    const tail = blocked ? '\nThe test caught most of it.' : `\nMaya lost ${amount} focus.`;
    this.showMessage(`${this.encounter.attack}${tail}`, () => {
      if (this.playerHp <= 0) this.recover(); else this.showActions();
    });
  }

  private recover() {
    this.playerHp = 60; state.playerHp = 60;
    this.playerBar.setDisplaySize(330 * .6, 16).setFillStyle(0xf0ae4c);
    (this.children.getByName('hp-text') as Phaser.GameObjects.Text).setText('60/100');
    this.showMessage('RAVI deployed the emergency rubber duck.\nMaya recovered 60 focus!', () => this.showActions());
  }

  win() {
    if (this.enemyHp > 0) this.damageEnemy(this.enemyHp);
    this.processing = true; audio.sfx(880, .4, 'triangle');
    this.tweens.add({ targets: this.enemyArt, alpha: 0, scale: .3, y: this.enemyArt.y + 80, duration: 520, ease: 'Back.in' });
    state.completed[state.encounter] = true;
    state.playerHp = Math.min(100, this.playerHp + 24);
    setStatus(this.encounter.defeated);
    this.showMessage(`${this.encounter.defeated}\n+24 FOCUS  ·  +1 TEAM MORALE`, () => {
      this.time.delayedCall(650, () => { this.scene.stop(); this.scene.resume('WorldScene'); });
    });
  }
}

class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }
  create() {
    state.phase = 'complete'; setStatus('Deploy complete. You reached Ship City and won Route 404.');
    this.add.rectangle(W/2, H/2, W, H, 0x10273a);
    for (let i = 0; i < 70; i++) {
      const color = [0x67dfb6, 0xf0ae4c, 0xe56c99, 0x53a9db][i % 4];
      const bit = this.add.rectangle(Phaser.Math.Between(0,W), Phaser.Math.Between(-100,H), 8, 18, color).setRotation(Phaser.Math.FloatBetween(-1,1));
      this.tweens.add({ targets: bit, y: H + 80, x: bit.x + Phaser.Math.Between(-100,100), rotation: bit.rotation + 4, duration: Phaser.Math.Between(2500,5000), repeat: -1 });
    }
    addPill(this, W/2, 105, 'SPRINT COMPLETE', 0x2c8e72);
    this.add.text(W/2, 190, 'DEPLOYED!', textStyle(70, '#ffffff', '800')).setOrigin(.5);
    this.add.text(W/2, 277, 'Route 404 → Ship City', monoStyle(18, '#82d9c1')).setOrigin(.5);
    this.add.rectangle(W/2, 407, 680, 150, 0xf9f5e7).setStrokeStyle(5, 0x385266);
    this.add.text(W/2, 371, '3 BLOCKERS RESOLVED', monoStyle(14, '#526779')).setOrigin(.5);
    this.add.text(W/2, 415, '✓ BUG FIXED    ✓ LEAK PATCHED    ✓ SCOPE ALIGNED', textStyle(18, '#193348', '800')).setOrigin(.5);
    this.add.text(W/2, 461, 'The deploy was flawless. Please ignore monitoring.', textStyle(17, '#607387')).setOrigin(.5);
    const replay = this.add.rectangle(W/2, 570, 245, 58, 0x3c9fc0).setStrokeStyle(3, 0xffffff, .35).setInteractive({ useHandCursor: true });
    this.add.text(W/2, 570, 'RUN IT BACK', monoStyle(15, '#ffffff')).setOrigin(.5);
    replay.on('pointerdown', () => { state.completed = [false,false,false]; state.playerHp = 100; state.encounter = 0; this.scene.start('WorldScene'); });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  backgroundColor: '#10273a',
  pixelArt: true,
  antialias: false,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene, BattleScene, EndScene],
  render: { pixelArt: true, antialias: false, antialiasGL: false, roundPixels: true }
});

// Small, stable hooks for automated playtesting.
(window as Window & { __SW_RPG__?: object }).__SW_RPG__ = {
  getState: () => ({ ...state, completed: [...state.completed] }),
  startBattle: (index = 0) => {
    state.encounter = Phaser.Math.Clamp(index, 0, 2); state.phase = 'battle';
    const world = game.scene.getScene('WorldScene'); world.scene.pause(); world.scene.launch('BattleScene');
  },
  chooseAction: (index = 0) => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.takeAction(Phaser.Math.Clamp(index, 0, 3));
  },
  winBattle: () => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.win();
  },
  reset: () => { state.completed = [false,false,false]; state.playerHp = 100; state.encounter = 0; game.scene.start('WorldScene'); }
};
