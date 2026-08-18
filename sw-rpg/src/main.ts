import Phaser from 'phaser';
import { GameAudio } from './audio';
import './style.css';

type FoeId = 'null-pointer' | 'memory-leak' | 'quick-question' | 'one-tiny-change';

type EnemyProfile = {
  name: string;
  kind: string;
  level: number;
  maxHp: number;
  asset: FoeId;
  displayHeight: number;
  attack: string;
};

type Encounter = {
  name: string;
  intro: string;
  defeated: string;
  enemies: EnemyProfile[];
  trainer?: {
    name: string;
    role: string;
    asset: string;
    challenge: string;
  };
};

type GameState = {
  encounter: number;
  completed: boolean[];
  partyHp: [number, number];
  activeMember: number;
  phase: 'overworld' | 'battle' | 'complete';
};

type Effectiveness = 'super' | 'normal' | 'not' | 'none';

type MoveOutcome = {
  damage: number;
  effectiveness: Effectiveness;
  result: string;
};

type Move = {
  title: string;
  category: string;
  color: number;
  outcomes: Record<FoeId, MoveOutcome>;
  shields?: boolean;
};

type PartyMember = {
  name: string;
  role: string;
  initial: string;
  color: number;
  texture: string;
  moves: [number, number, number, number];
};

const W = 1280;
const H = 720;
const DEBUG = new URLSearchParams(location.search).get('debug') === 'true';
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const state: GameState = {
  encounter: 0,
  completed: [false, false, false],
  partyHp: [100, 100],
  activeMember: 0,
  phase: 'overworld'
};
const touch = { up: false, down: false, left: false, right: false };

const partyMembers: PartyMember[] = [
  { name: 'MAYA', role: 'STAFF ENGINEER · LV.12', initial: 'M', color: 0x42a5d9, texture: 'dev-back', moves: [0, 1, 2, 3] },
  { name: 'INEZ', role: 'QA ENGINEER · LV.11', initial: 'I', color: 0xe56c99, texture: 'inez-back', moves: [4, 5, 6, 7] }
];

const moves: Move[] = [
  {
    title: 'SET BREAKPOINT', category: 'DEBUG', color: 0x2f95bf,
    outcomes: {
      'null-pointer': { damage: 22, effectiveness: 'super', result: 'NULL POINTER freezes at the exact bad dereference. 22 progress!' },
      'memory-leak': { damage: 1, effectiveness: 'not', result: 'MEMORY LEAK keeps growing while the process is paused. Just 1 progress.' },
      'quick-question': { damage: 0, effectiveness: 'none', result: 'There is no code path inside a QUICK QUESTION to pause. Nothing happens.' },
      'one-tiny-change': { damage: 0, effectiveness: 'none', result: 'ONE TINY CHANGE has already escaped into three new requirements. Nothing happens.' }
    }
  },
  {
    title: 'SHIP HOTFIX', category: 'DEPLOY', color: 0xe49b37,
    outcomes: {
      'null-pointer': { damage: 8, effectiveness: 'normal', result: 'The guard clause gives NULL POINTER fewer places to hide. 8 progress.' },
      'memory-leak': { damage: 0, effectiveness: 'none', result: 'The hotfix deploys, but MEMORY LEAK is still allocated. Nothing happens.' },
      'quick-question': { damage: 1, effectiveness: 'not', result: 'QUICK QUESTION replies “nice!” and immediately asks another. Just 1 progress.' },
      'one-tiny-change': { damage: 2, effectiveness: 'not', result: 'The hotfix covers one head of ONE TINY CHANGE. Two more appear. Just 2 progress.' }
    }
  },
  {
    title: 'READ STACK TRACE', category: 'DEBUG', color: 0x657fd4,
    outcomes: {
      'null-pointer': { damage: 16, effectiveness: 'super', result: 'The trace points straight back to NULL POINTER. 16 progress!' },
      'memory-leak': { damage: 2, effectiveness: 'not', result: 'The trace shows where MEMORY LEAK crashed, not where it grew. Just 2 progress.' },
      'quick-question': { damage: 0, effectiveness: 'none', result: 'QUICK QUESTION has no stack, only a calendar invite. Nothing happens.' },
      'one-tiny-change': { damage: 0, effectiveness: 'none', result: 'ONE TINY CHANGE is a process problem, not an exception. Nothing happens.' }
    }
  },
  {
    title: 'RESTART SERVICE', category: 'OPS', color: 0x50a77f,
    outcomes: {
      'null-pointer': { damage: 1, effectiveness: 'not', result: 'NULL POINTER comes right back after startup. Just 1 progress.' },
      'memory-leak': { damage: 10, effectiveness: 'normal', result: 'MEMORY LEAK loses its hoarded heap—for now. 10 progress.' },
      'quick-question': { damage: 0, effectiveness: 'none', result: 'QUICK QUESTION was sent over chat, not by the service. Nothing happens.' },
      'one-tiny-change': { damage: 0, effectiveness: 'none', result: 'The service restarts into the same expanded scope. Nothing happens.' }
    }
  },
  {
    title: 'WRITE A TEST', category: 'TEST', color: 0xdf668b, shields: true,
    outcomes: {
      'null-pointer': { damage: 3, effectiveness: 'not', result: 'The test catches NULL POINTER, but does not fix it. 3 progress.' },
      'memory-leak': { damage: 1, effectiveness: 'not', result: 'The short test ends before MEMORY LEAK becomes obvious. Just 1 progress.' },
      'quick-question': { damage: 2, effectiveness: 'not', result: 'QUICK QUESTION is technically reproducible: it arrives every morning. Just 2 progress.' },
      'one-tiny-change': { damage: 20, effectiveness: 'super', result: 'The acceptance test exposes exactly how “tiny” the change is. 20 progress!' }
    }
  },
  {
    title: 'CHECK METRICS', category: 'OBSERVE', color: 0x8b64c8,
    outcomes: {
      'null-pointer': { damage: 0, effectiveness: 'none', result: 'The dashboard says NULL POINTER happened. Everyone already knew. Nothing happens.' },
      'memory-leak': { damage: 22, effectiveness: 'super', result: 'The heap graph catches MEMORY LEAK climbing in plain sight. 22 progress!' },
      'quick-question': { damage: 0, effectiveness: 'none', result: 'There is no dashboard for QUICK QUESTION urgency. Nothing happens.' },
      'one-tiny-change': { damage: 1, effectiveness: 'not', result: 'Velocity dips, but ONE TINY CHANGE calls that “just noise.” Just 1 progress.' }
    }
  },
  {
    title: 'REPRODUCE LOCALLY', category: 'TEST', color: 0xd15884,
    outcomes: {
      'null-pointer': { damage: 10, effectiveness: 'normal', result: 'NULL POINTER crashes just as reliably on Inez’s machine. 10 progress.' },
      'memory-leak': { damage: 3, effectiveness: 'not', result: 'MEMORY LEAK takes all afternoon to appear locally. 3 progress.' },
      'quick-question': { damage: 0, effectiveness: 'none', result: 'QUICK QUESTION cannot be reproduced without Alex standing behind you. Nothing happens.' },
      'one-tiny-change': { damage: 0, effectiveness: 'none', result: 'The expanded requirements work perfectly on localhost. Nothing happens.' }
    }
  },
  {
    title: 'FILE A TICKET', category: 'PROCESS', color: 0x3b9b87,
    outcomes: {
      'null-pointer': { damage: 0, effectiveness: 'none', result: 'NULL POINTER cannot read its new ticket. Nothing happens.' },
      'memory-leak': { damage: 0, effectiveness: 'none', result: 'MEMORY LEAK is now documented and still leaking. Nothing happens.' },
      'quick-question': { damage: 16, effectiveness: 'super', result: 'QUICK QUESTION must provide context and acceptance criteria. 16 progress!' },
      'one-tiny-change': { damage: 8, effectiveness: 'normal', result: 'The ticket gives ONE TINY CHANGE a visible estimate. 8 progress.' }
    }
  }
];

const encounters: Encounter[] = [
  {
    name: 'NULL POINTER',
    intro: 'A wild NULL POINTER appeared!\nIt is pointing at absolutely nothing.',
    defeated: 'The pointer found purpose. Bug resolved!',
    enemies: [{
      name: 'NULL POINTER', kind: 'Wild Bug', level: 3, maxHp: 42,
      asset: 'null-pointer', displayHeight: 315,
      attack: 'NULL POINTER used PANIC IN PROD!'
    }]
  },
  {
    name: 'MEMORY LEAK',
    intro: 'A wild MEMORY LEAK seeped from the tall code!\nYour laptop fan sounds concerned.',
    defeated: 'The heap is tidy again. Incident resolved!',
    enemies: [{
      name: 'MEMORY LEAK', kind: 'Wild Incident', level: 5, maxHp: 55,
      asset: 'memory-leak', displayHeight: 300,
      attack: 'MEMORY LEAK used CONSUME RAM!'
    }]
  },
  {
    name: 'PM ALEX',
    intro: 'PM ALEX wants to sync!',
    defeated: 'Requirements aligned! Alex scheduled a follow-up.',
    trainer: {
      name: 'ALEX', role: 'PRODUCT MANAGER', asset: 'alex',
      challenge: '“Before we ship, just two tiny things...”'
    },
    enemies: [
      {
        name: 'QUICK QUESTION', kind: 'Priority Ping', level: 7, maxHp: 44,
        asset: 'quick-question', displayHeight: 260,
        attack: 'QUICK QUESTION used CIRCLE BACK!'
      },
      {
        name: 'ONE TINY CHANGE', kind: 'Scope Hydra', level: 9, maxHp: 72,
        asset: 'one-tiny-change', displayHeight: 330,
        attack: 'ONE TINY CHANGE used SCOPE CREEP!'
      }
    ]
  }
];

const statusNode = document.querySelector<HTMLDivElement>('#game-status')!;
function setStatus(message: string) {
  statusNode.textContent = message;
  document.body.dataset.gamePhase = state.phase;
  document.body.dataset.encounter = String(state.encounter);
}

const audio = new GameAudio();
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
  if (scene.textures.exists('hero-down')) return;
  const g = scene.add.graphics();
  // All overworld character art is authored on a tiny grid, then nearest-neighbor scaled.
  // Maya, facing the camera (28 × 36).
  g.fillStyle(0x213148).fillRect(7, 2, 14, 3).fillRect(4, 5, 20, 6).fillRect(6, 10, 17, 3);
  g.fillStyle(0xb84f57).fillRect(5, 4, 4, 8).fillRect(20, 5, 4, 7);
  g.fillStyle(0xf0b487).fillRect(7, 12, 14, 8).fillRect(5, 21, 3, 8).fillRect(20, 21, 3, 8);
  g.fillStyle(0x25384c).fillRect(9, 14, 3, 2).fillRect(17, 14, 3, 2).fillRect(12, 18, 5, 1);
  g.fillStyle(0x268db5).fillRect(7, 20, 15, 10).fillRect(4, 22, 4, 7).fillRect(21, 22, 4, 7);
  g.fillStyle(0xe8f2eb).fillRect(9, 21, 11, 3);
  g.fillStyle(0xffca4f).fillRect(13, 24, 3, 6);
  g.fillStyle(0x243958).fillRect(8, 30, 6, 5).fillRect(16, 30, 6, 5);
  g.fillStyle(0xf4eee2).fillRect(6, 34, 8, 2).fillRect(16, 34, 8, 2);
  g.generateTexture('hero-down', 28, 36); g.clear();
  // Maya, rear view. This echoes the battle stance without battle-level detail.
  g.fillStyle(0x213148).fillRect(7, 2, 14, 3).fillRect(4, 5, 20, 8).fillRect(6, 11, 17, 3);
  g.fillStyle(0xb84f57).fillRect(5, 4, 4, 9).fillRect(20, 5, 4, 8);
  g.fillStyle(0xf0b487).fillRect(5, 21, 3, 8).fillRect(20, 21, 3, 8);
  g.fillStyle(0x268db5).fillRect(7, 14, 15, 16).fillRect(4, 20, 4, 9).fillRect(21, 20, 4, 9);
  g.fillStyle(0x175d82).fillRect(10, 17, 9, 7).fillRect(12, 19, 5, 2);
  g.fillStyle(0xe8f2eb).fillRect(8, 14, 13, 3);
  g.fillStyle(0xffca4f).fillRect(13, 24, 3, 6);
  g.fillStyle(0x243958).fillRect(8, 30, 6, 5).fillRect(16, 30, 6, 5);
  g.fillStyle(0xf4eee2).fillRect(6, 34, 8, 2).fillRect(16, 34, 8, 2);
  g.generateTexture('hero-up', 28, 36); g.clear();
  // Maya, side-on (28 × 36).
  g.fillStyle(0xb84f57).fillRect(8, 3, 13, 9).fillRect(6, 6, 5, 9);
  g.fillStyle(0xf0b487).fillRect(11, 10, 11, 10).fillRect(21, 13, 3, 4).fillRect(7, 22, 3, 8);
  g.fillStyle(0x24384d).fillRect(19, 13, 2, 2);
  g.fillStyle(0x268db5).fillRect(9, 20, 13, 10).fillRect(6, 22, 5, 8);
  g.fillStyle(0xe8f2eb).fillRect(12, 21, 10, 3);
  g.fillStyle(0xffca4f).fillRect(11, 25, 3, 5);
  g.fillStyle(0x243958).fillRect(10, 30, 5, 5).fillRect(18, 30, 6, 5);
  g.fillStyle(0xf4eee2).fillRect(8, 34, 7, 2).fillRect(18, 34, 8, 2);
  g.generateTexture('hero-side', 28, 36); g.clear();
  // Small but expressive route NPCs.
  g.fillStyle(0x5a352c).fillRect(5, 1, 10, 5).fillRect(3, 4, 14, 4);
  g.fillStyle(0xe7ad80).fillRect(5, 8, 10, 8);
  g.fillStyle(0x25384c).fillRect(7, 10, 2, 2).fillRect(12, 10, 2, 2);
  g.fillStyle(0xe75f8e).fillRect(3, 16, 14, 10).fillRect(1, 18, 3, 8).fillRect(17, 18, 3, 8);
  g.fillStyle(0x452c5b).fillRect(4, 26, 5, 5).fillRect(11, 26, 5, 5);
  g.generateTexture('npc-intern', 20, 31); g.clear();
  g.fillStyle(0x372b46).fillRect(4, 1, 13, 5).fillRect(2, 5, 16, 5);
  g.fillStyle(0xb97858).fillRect(5, 9, 10, 8);
  g.fillStyle(0x25384c).fillRect(7, 11, 2, 2).fillRect(12, 11, 2, 2);
  g.fillStyle(0x6f58c9).fillRect(3, 17, 14, 10).fillRect(1, 19, 3, 8).fillRect(17, 19, 3, 8);
  g.fillStyle(0xf4f0e3).fillRect(7, 18, 6, 7);
  g.fillStyle(0x253858).fillRect(4, 27, 5, 4).fillRect(11, 27, 5, 4);
  g.generateTexture('npc-alex', 20, 31); g.clear();
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
  // Inez's battle backsprite (48 × 52).
  g.fillStyle(0x312b46).fillRect(9, 44, 28, 8);
  g.fillStyle(0x4d365f).fillRect(14, 31, 22, 16);
  g.fillStyle(0xd65f8c).fillRect(5, 20, 35, 20).fillRect(9, 15, 27, 8);
  g.fillStyle(0xb97455).fillRect(14, 5, 20, 16).fillRect(17, 21, 14, 3);
  g.fillStyle(0x211d2f).fillRect(10, 1, 27, 8).fillRect(8, 6, 8, 15).fillRect(33, 6, 6, 15);
  g.fillStyle(0xf5f0dc).fillRect(27, 25, 20, 16);
  g.fillStyle(0xc24d77).fillRect(34, 31, 7, 3);
  g.generateTexture('inez-back', 48, 52); g.clear();
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
  ['hero-down', 'hero-up', 'hero-side', 'npc-intern', 'npc-alex', 'tree', 'grass', 'dev-back', 'inez-back', 'enemy-0', 'enemy-1', 'enemy-2']
    .forEach(key => scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST));
}

class WorldScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  location!: Phaser.GameObjects.Text;
  private inTransition = false;
  private welcome?: Phaser.GameObjects.Container;

  constructor() { super('WorldScene'); }

  create() {
    createTextures(this);
    audio.setTheme('overworld');
    state.phase = 'overworld'; setStatus('Exploring Route 529. Use arrow keys or WASD to move east.');
    this.physics.world.setBounds(0, 0, 2400, H);
    this.drawMap();
    this.player = this.physics.add.sprite(330, 410, 'hero-down').setScale(2.25).setCollideWorldBounds(true).setDepth(30).setSize(17, 15).setOffset(5, 18);
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
    this.sign(1040, 210, 'ROUTE 529', 'Bugs may be encountered');
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
    const labelY = height <= 130 ? y + 28 : y + 58;
    a.text(x + width / 2, labelY, name, monoStyle(14, '#24384c')).setOrigin(.5).setDepth(y + 2);
  }

  private sign(x: number, y: number, title: string, subtitle: string) {
    this.add.rectangle(x, y + 38, 8, 76, 0x6e573d).setDepth(y);
    this.add.rectangle(x, y, 230, 68, 0xf9efd0).setStrokeStyle(5, 0x31495b).setDepth(y + 1);
    this.add.text(x, y - 11, title, monoStyle(15, '#1d3347')).setOrigin(.5).setDepth(y + 2);
    this.add.text(x, y + 13, subtitle, textStyle(13, '#526578')).setOrigin(.5).setDepth(y + 2);
  }

  private npc(x: number, y: number, _color: number, id: string) {
    const c = this.add.container(x, y).setDepth(y);
    const shadow = this.add.ellipse(0, 27, 38, 12, 0x1d3a35, .25);
    const sprite = this.add.image(0, -2, `npc-${id}`).setScale(2.15);
    c.add([shadow, sprite]).setData('id', id);
    this.tweens.add({ targets: c, y: y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private makeHud() {
    // Keep the top edge quiet: location context only, no checklist or objective tracker.
    this.location = this.add.text(W / 2, 36, 'STARTUP CITY', monoStyle(13, '#ffffff')).setOrigin(.5).setScrollFactor(0).setDepth(1001).setBackgroundColor('#213e55').setPadding(14, 7);
  }

  private showWelcome() {
    const bg = this.add.rectangle(42, H - 154, 600, 116, 0xfffbeb, .98).setOrigin(0).setStrokeStyle(4, 0x223b51).setScrollFactor(0);
    const tag = this.add.text(68, H - 139, 'RAVI · SRE', monoStyle(12, '#2d9475')).setScrollFactor(0);
    const copy = this.add.text(68, H - 112, 'Morning! The deploy is due in Ship City.\nRoute 529 should be totally stable now.', textStyle(20, '#21364a')).setLineSpacing(6).setScrollFactor(0);
    const prompt = this.add.text(610, H - 60, 'MOVE  →', monoStyle(12, '#62778a')).setOrigin(1).setScrollFactor(0);
    // Screen-space dialogue must sort above every y-sorted world object.
    this.welcome = this.add.container(0, 0, [bg, tag, copy, prompt]).setDepth(1010);
    this.time.delayedCall(5000, () => this.tweens.add({ targets: this.welcome, alpha: 0, y: 15, duration: 300, onComplete: () => this.welcome?.destroy() }));
  }

  private makeDebugTools() {
    const bg = this.add.rectangle(W - 260, H - 58, 230, 38, 0x672448, .92).setScrollFactor(0).setDepth(1020).setInteractive({ useHandCursor: true });
    const label = this.add.text(W - 260, H - 58, '[DEBUG] N · skip fight', monoStyle(12, '#ffffff')).setOrigin(.5).setScrollFactor(0).setDepth(1021);
    bg.on('pointerdown', () => this.debugSkip()); label.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.debugSkip());
    this.input.keyboard!.on('keydown-N', () => this.debugSkip());
  }

  private debugSkip() {
    const next = state.completed.findIndex(done => !done);
    if (next === -1) { this.player.x = 2130; return; }
    state.completed[next] = true; state.encounter = next;
    this.player.x = [1010, 1460, 1990][next];
  }

  private onResume() {
    audio.setTheme('overworld');
    state.phase = 'overworld'; this.inTransition = false;
    const i = state.encounter;
    this.player.x = [990, 1440, 1980][i];
    this.player.y = i === 1 ? 410 : 390;
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
    if (x) {
      this.player.setTexture('hero-side').setFlipX(x < 0);
    } else if (y < 0) {
      this.player.setTexture('hero-up').setFlipX(false);
    } else if (y > 0) {
      this.player.setTexture('hero-down').setFlipX(false);
    }
    if (x || y) this.player.rotation = Math.sin(this.time.now / 90) * .035;
    else this.player.rotation = 0;
    this.player.y = Phaser.Math.Clamp(this.player.y, 250, 590);
    this.player.setDepth(this.player.y + 10);
    const px = this.player.x;
    this.location.setText(px < 590 ? 'STARTUP CITY' : px < 1850 ? 'ROUTE 529' : 'SHIP CITY');
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
  foe!: EnemyProfile;
  foeIndex = 0;
  enemyHp = 0;
  shield = false;
  processing = true;
  enemyBar!: Phaser.GameObjects.Rectangle;
  playerBar!: Phaser.GameObjects.Rectangle;
  message!: Phaser.GameObjects.Text;
  continuePrompt!: Phaser.GameObjects.Text;
  actionGroup?: Phaser.GameObjects.Container;
  enemyArt?: Phaser.GameObjects.Image;
  trainerArt?: Phaser.GameObjects.Image;
  enemyName!: Phaser.GameObjects.Text;
  enemyMeta!: Phaser.GameObjects.Text;
  playerSprite!: Phaser.GameObjects.Image;
  memberName!: Phaser.GameObjects.Text;
  memberRole!: Phaser.GameObjects.Text;
  hpText!: Phaser.GameObjects.Text;
  partyGroup!: Phaser.GameObjects.Container;
  private advanceCallback?: () => void;
  private advanceArmed = false;
  private seenMoveEffects = new Set<number>();
  turn = 0;

  constructor() { super('BattleScene'); }

  preload() {
    const assets = ['maya', 'inez', 'alex', 'null-pointer', 'memory-leak', 'quick-question', 'one-tiny-change'];
    assets.forEach(name => this.load.image(`battle-${name}`, assetUrl(`assets/battle/${name}.png`)));
  }

  create() {
    audio.setTheme('battle');
    this.encounter = encounters[state.encounter];
    this.foeIndex = 0;
    this.foe = this.encounter.enemies[0];
    this.enemyHp = this.foe.maxHp;
    state.phase = 'battle'; setStatus(this.encounter.intro.replace('\n', ' '));
    ['maya', 'inez', 'alex', 'null-pointer', 'memory-leak', 'quick-question', 'one-tiny-change']
      .forEach(name => this.textures.get(`battle-${name}`).setFilter(Phaser.Textures.FilterMode.NEAREST));
    this.drawArena();
    this.drawCombatants();
    this.drawHud();
    this.cameras.main.fadeIn(280, 255, 255, 255);
    this.input.on('pointerdown', () => this.advanceMessage());
    this.input.keyboard!.on('keydown-SPACE', () => this.advanceMessage());
    this.input.keyboard!.on('keydown-ENTER', () => this.advanceMessage());
    this.input.keyboard!.on('keydown-ONE', () => this.takeAction(0));
    this.input.keyboard!.on('keydown-TWO', () => this.takeAction(1));
    this.input.keyboard!.on('keydown-THREE', () => this.takeAction(2));
    this.input.keyboard!.on('keydown-FOUR', () => this.takeAction(3));
    this.input.keyboard!.on('keydown-S', () => this.swapMember());
    this.time.delayedCall(500, () => this.beginEncounter());
    if (DEBUG) this.input.keyboard!.on('keydown-K', () => this.finishFoe());
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
    this.add.ellipse(270, 494, 225, 42, 0x315f4d, .24).setDepth(7);
    this.playerSprite = this.add.image(270, 358, `battle-${partyMembers[state.activeMember].name.toLowerCase()}`)
      .setDisplaySize(state.activeMember === 0 ? 234 : 184, 360).setDepth(10);
    this.tweens.add({ targets: this.playerSprite, y: 352, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (this.encounter.trainer) this.showTrainer();
  }

  private beginEncounter() {
    if (!this.encounter.trainer) {
      this.spawnEnemy();
      this.showMessage(this.encounter.intro, () => this.showActions());
      return;
    }
    const trainer = this.encounter.trainer;
    this.showMessage(`PM ${trainer.name} challenges you to a sync!\n${trainer.challenge}`, () => {
      this.sendOutFoe(`${trainer.name} sent out ${this.foe.name}!`);
    }, true);
  }

  private showTrainer() {
    const trainer = this.encounter.trainer;
    if (!trainer) return;
    this.trainerArt?.destroy();
    this.trainerArt = this.add.image(970, 265, `battle-${trainer.asset}`).setDisplaySize(170, 380).setDepth(9).setAlpha(0);
    this.tweens.add({ targets: this.trainerArt, x: 950, alpha: 1, duration: 420, ease: 'Cubic.out' });
  }

  private spawnEnemy() {
    this.enemyArt?.destroy();
    const texture = `battle-${this.foe.asset}`;
    const source = this.textures.get(texture).getSourceImage() as HTMLImageElement;
    const finalScale = this.foe.displayHeight / source.height;
    this.enemyArt = this.add.image(945, 265, texture).setScale(finalScale * .25).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: this.enemyArt, scale: finalScale, alpha: 1, duration: 520, ease: 'Back.out' });
    this.tweens.add({ targets: this.enemyArt, y: 257, duration: 900, delay: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private sendOutFoe(copy: string) {
    const launch = () => {
      this.refreshEnemyHud();
      this.spawnEnemy();
      audio.sfx(720, .24, 'triangle');
      this.showMessage(copy, () => this.showActions());
    };
    if (!this.trainerArt) { launch(); return; }
    this.tweens.add({ targets: this.trainerArt, x: 1090, alpha: 0, duration: 280, onComplete: () => {
      this.trainerArt?.destroy();
      this.trainerArt = undefined;
      launch();
    }});
  }

  private drawHud() {
    // Enemy status card.
    this.add.rectangle(50, 70, 475, 128, 0xfffdf4, .98).setOrigin(0).setStrokeStyle(4, 0x233a50).setDepth(20);
    this.enemyName = this.add.text(76, 90, this.encounter.trainer ? `PM ${this.encounter.trainer.name}` : this.foe.name, textStyle(26, '#182c40', '800')).setDepth(21);
    this.enemyMeta = this.add.text(76, 126, this.encounter.trainer ? `${this.encounter.trainer.role}  ·  2 REQUESTS` : `${this.foe.kind.toUpperCase()}  ·  LV.${this.foe.level}`, monoStyle(12, '#637689')).setDepth(21);
    this.add.text(284, 158, 'BLOCKER', monoStyle(11, '#637689')).setOrigin(1, .5).setDepth(21);
    this.add.rectangle(300, 158, 196, 14, 0xd7dedb).setOrigin(0, .5).setDepth(21);
    this.enemyBar = this.add.rectangle(300, 158, 196, 14, 0x48c590).setOrigin(0, .5).setDepth(22);
    // Active party member card.
    this.add.rectangle(735, 400, 495, 128, 0xfffdf4, .98).setOrigin(0).setStrokeStyle(4, 0x233a50).setDepth(20);
    this.memberName = this.add.text(762, 418, '', textStyle(27, '#182c40', '800')).setDepth(21);
    this.memberRole = this.add.text(850, 426, '', monoStyle(11, '#637689')).setDepth(21);
    this.add.text(762, 465, 'FOCUS', monoStyle(11, '#637689')).setDepth(21);
    this.add.rectangle(825, 471, 330, 16, 0xd7dedb).setOrigin(0, .5).setDepth(21);
    this.playerBar = this.add.rectangle(825, 471, 330, 16, 0x48c590).setOrigin(0, .5).setDepth(22);
    this.hpText = this.add.text(1178, 471, '', monoStyle(11, '#35495c')).setOrigin(.5).setDepth(23);
    // Dialogue always owns the foreground; combatants and status cards cannot cover it.
    this.add.rectangle(0, 535, W, 185, 0xf8f6ed).setOrigin(0).setStrokeStyle(5, 0x21374b).setDepth(1000);
    this.add.rectangle(0, 535, W, 8, 0x59b8d2).setOrigin(0).setDepth(1001);
    this.message = this.add.text(55, 570, '', textStyle(25, '#172b3e')).setWordWrapWidth(880).setLineSpacing(8).setDepth(1002);
    this.continuePrompt = this.add.text(980, 689, 'CLICK / SPACE / ENTER  ▾', monoStyle(11, '#287b95')).setOrigin(1).setDepth(1004).setVisible(false);
    this.partyGroup = this.add.container(1120, 576).setDepth(1003);
    this.refreshPlayerHud();
  }

  private refreshEnemyHud() {
    this.enemyName.setText(this.foe.name);
    this.enemyMeta.setText(`${this.foe.kind.toUpperCase()}  ·  LV.${this.foe.level}${this.encounter.enemies.length > 1 ? `  ·  ${this.foeIndex + 1}/${this.encounter.enemies.length}` : ''}`);
    this.enemyHp = this.foe.maxHp;
    this.enemyBar.setDisplaySize(196, 14).setFillStyle(0x48c590);
  }

  private refreshPlayerHud() {
    const member = partyMembers[state.activeMember];
    const hp = state.partyHp[state.activeMember];
    this.memberName.setText(member.name);
    this.memberRole.setText(member.role);
    this.playerSprite.setTexture(`battle-${member.name.toLowerCase()}`).setDisplaySize(state.activeMember === 0 ? 234 : 184, 360);
    this.playerBar.setDisplaySize(330 * (hp / 100), 16).setFillStyle(hp < 35 ? 0xf05b4f : hp < 60 ? 0xf0ae4c : 0x48c590);
    this.hpText.setText(`${hp}/100`);
    this.partyGroup.removeAll(true);
    this.partyGroup.add(this.add.text(0, -20, 'ON CALL · 2', monoStyle(11, '#287b95')).setOrigin(.5));
    partyMembers.forEach((partyMember, i) => {
      const x = -45 + i * 90;
      const active = i === state.activeMember;
      this.partyGroup.add(this.add.circle(x, 24, 24, partyMember.color).setStrokeStyle(active ? 4 : 2, active ? 0xe2a52e : 0x546879, active ? 1 : .45));
      this.partyGroup.add(this.add.text(x, 24, partyMember.initial, textStyle(15, '#ffffff', '800')).setOrigin(.5));
      this.partyGroup.add(this.add.text(x, 57, `${partyMember.name} ${state.partyHp[i]}`, monoStyle(9, active ? '#a46500' : '#607486')).setOrigin(.5));
    });
  }

  private showMessage(copy: string, onDone?: () => void, requireInput = false) {
    this.processing = true;
    this.actionGroup?.destroy();
    this.actionGroup = undefined;
    this.partyGroup?.setVisible(true);
    this.advanceArmed = false;
    this.advanceCallback = undefined;
    this.continuePrompt.setVisible(false);
    this.message.setText(copy);
    if (requireInput) {
      this.advanceCallback = onDone;
      this.time.delayedCall(140, () => {
        if (!this.advanceCallback) return;
        this.advanceArmed = true;
        this.continuePrompt.setVisible(true);
      });
      return;
    }
    this.time.delayedCall(Math.max(700, Math.min(1450, copy.length * 22)), () => onDone?.());
  }

  continueDialogue() { this.advanceMessage(); }

  private advanceMessage() {
    if (!this.advanceArmed) return;
    this.advanceArmed = false;
    this.continuePrompt.setVisible(false);
    const callback = this.advanceCallback;
    this.advanceCallback = undefined;
    callback?.();
  }

  private showActions() {
    this.processing = false;
    this.message.setText('');
    this.partyGroup.setVisible(false);
    this.actionGroup = this.add.container(0, 0).setDepth(1010);
    const member = partyMembers[state.activeMember];
    const other = partyMembers[1 - state.activeMember];

    const prompt = this.add.graphics();
    prompt.fillStyle(0x142e43, 1).fillRoundedRect(18, 552, 282, 150, 18);
    prompt.fillStyle(member.color, 1).fillRoundedRect(18, 552, 12, 150, { tl: 18, bl: 18, tr: 0, br: 0 });
    prompt.lineStyle(2, 0xffffff, .12).strokeRoundedRect(18, 552, 282, 150, 18);
    const fightTag = this.add.text(48, 568, 'FIGHT', monoStyle(11, '#83dff1')).setLetterSpacing(2);
    const question = this.add.text(48, 591, `What will ${member.name} do?`, textStyle(20, '#ffffff', '800'));
    const hint = this.add.text(48, 620, 'ATTACK 1–4', monoStyle(9, '#a9bfce'));
    this.actionGroup.add([prompt, fightTag, question, hint]);
    const addChoice = (cx: number, cy: number, width: number, title: string, detail: string, color: number, key: string, choose: () => void) => {
      const choice = this.add.container(cx, cy).setSize(width, 62).setInteractive({ useHandCursor: true });
      const plate = this.add.graphics();
      const draw = (hovered: boolean) => {
        plate.clear();
        plate.fillStyle(0x13283a, .18).fillRoundedRect(-width/2 + 4, -26, width, 58, 15);
        plate.fillStyle(hovered ? 0xffffff : 0xfdfcf7, 1).fillRoundedRect(-width/2, -31, width, 58, 15);
        plate.lineStyle(hovered ? 4 : 2, hovered ? color : 0xc9d0d2, 1).strokeRoundedRect(-width/2, -31, width, 58, 15);
        plate.fillStyle(color, 1).fillRoundedRect(-width/2 + 8, -23, 9, 42, 5);
        plate.fillStyle(color, 1).fillCircle(-width/2 + 39, -2, 17);
        if (hovered) plate.fillTriangle(-width/2 - 13, -9, -width/2 - 13, 7, -width/2 - 3, -1);
      };
      draw(false);
      const keyText = this.add.text(-width/2 + 39, -2, key, monoStyle(12, '#ffffff')).setOrigin(.5);
      const titleText = this.add.text(-width/2 + 69, -20, title, textStyle(16, '#172b3e', '800'));
      const detailText = this.add.text(-width/2 + 69, 4, detail, monoStyle(9, '#627587'));
      choice.add([plate, keyText, titleText, detailText]);
      choice.on('pointerover', () => { draw(true); audio.sfx(320, .045); });
      choice.on('pointerout', () => draw(false));
      choice.on('pointerdown', choose);
      this.actionGroup!.add(choice);
    };

    member.moves.forEach((moveIndex, i) => {
      const move = moves[moveIndex];
      const effect = move.outcomes[this.foe.asset].effectiveness;
      const effectCopy = effect === 'super' ? 'SUPER EFFECTIVE' : effect === 'not' ? 'NOT VERY EFFECTIVE' : effect === 'none' ? 'NO EFFECT' : 'NORMAL EFFECT';
      const detail = this.seenMoveEffects.has(moveIndex) ? `${move.category}  ·  ${effectCopy}` : move.category;
      const column = i % 2;
      const row = Math.floor(i / 2);
      addChoice(532 + column * 460, 582 + row * 70, 438, move.title, detail, move.color, String(i + 1), () => this.takeAction(i));
    });
    addChoice(159, 672, 244, `SWAP TO ${other.name}`, `${state.partyHp[1 - state.activeMember]}/100 FOCUS`, other.color, 'S', () => this.swapMember());
    setStatus(`Battle with ${this.foe.name}. ${member.name} is active. Choose attack 1–4, or press S to swap.`);
  }

  takeAction(index: number) {
    if (this.processing || index < 0 || index > 3) return;
    this.processing = true;
    this.actionGroup?.destroy();
    this.actionGroup = undefined;
    this.turn++;
    const member = partyMembers[state.activeMember];
    const moveIndex = member.moves[index];
    const move = moves[moveIndex];
    const outcome = move.outcomes[this.foe.asset];
    this.seenMoveEffects.add(moveIndex);
    if (move.shields) this.shield = true;
    audio.sfx(560 + moveIndex * 55, .18);
    if (outcome.damage > 0 && this.enemyArt) this.tweens.add({ targets: this.enemyArt, x: this.enemyArt.x + 16, duration: 55, yoyo: true, repeat: 4 });
    this.damageEnemy(outcome.damage);
    const shieldCopy = move.shields ? '\nThe next interruption is guarded.' : '';
    this.showMessage(`${member.name} used ${move.title}!\n${outcome.result}${shieldCopy}`, () => {
      if (this.enemyHp <= 0) this.finishFoe(); else this.enemyTurn();
    }, true);
  }

  swapMember() {
    if (this.processing) return;
    this.processing = true;
    this.actionGroup?.destroy();
    this.actionGroup = undefined;
    this.turn++;
    const outgoing = partyMembers[state.activeMember];
    state.activeMember = 1 - state.activeMember;
    const incoming = partyMembers[state.activeMember];
    audio.sfx(420, .2, 'triangle');
    this.tweens.add({
      targets: this.playerSprite, alpha: 0, duration: 140, yoyo: true,
      onYoyo: () => this.refreshPlayerHud()
    });
    this.showMessage(`${outgoing.name} tagged out.\n${incoming.name} joined the incident!`, () => this.enemyTurn(), true);
  }

  private damageEnemy(amount: number) {
    this.enemyHp = Math.max(0, this.enemyHp - amount);
    this.tweens.add({ targets: this.enemyBar, displayWidth: 196 * (this.enemyHp / this.foe.maxHp), duration: 350 });
    if (this.enemyHp / this.foe.maxHp < .35) this.enemyBar.setFillStyle(0xf19c4c);
  }

  private enemyTurn() {
    const blocked = this.shield;
    this.shield = false;
    const amount = blocked ? 2 : Phaser.Math.Between(8, 14) + state.encounter * 2;
    const active = state.activeMember;
    const member = partyMembers[active];
    state.partyHp[active] = Math.max(0, state.partyHp[active] - amount);
    audio.sfx(180, .25, 'sawtooth');
    this.cameras.main.shake(180, .009);
    this.refreshPlayerHud();
    const tail = blocked ? '\nThe test caught most of it.' : `\n${member.name} lost ${amount} focus.`;
    this.showMessage(`${this.foe.attack}${tail}`, () => {
      if (state.partyHp[active] <= 0) this.recover(); else this.showActions();
    }, true);
  }

  private recover() {
    const exhausted = partyMembers[state.activeMember];
    const otherIndex = 1 - state.activeMember;
    if (state.partyHp[otherIndex] > 0) {
      state.activeMember = otherIndex;
      const incoming = partyMembers[state.activeMember];
      this.refreshPlayerHud();
      this.showMessage(`${exhausted.name} is out of focus!\n${incoming.name} takes over.`, () => this.showActions(), true);
      return;
    }
    state.partyHp = [60, 60];
    this.refreshPlayerHud();
    this.showMessage('The emergency rubber duck has been deployed.\nThe team recovered 60 focus!', () => this.showActions(), true);
  }

  private finishFoe() {
    if (this.enemyHp > 0) this.damageEnemy(this.enemyHp);
    this.processing = true;
    audio.sfx(880, .3, 'triangle');
    if (this.foeIndex >= this.encounter.enemies.length - 1) { this.win(); return; }
    if (this.enemyArt) this.tweens.add({ targets: this.enemyArt, alpha: 0, y: this.enemyArt.y + 70, duration: 420, ease: 'Back.in' });

    const defeated = this.foe.name;
    this.showMessage(`${defeated} was resolved!\nALEX checks one item off the list.`, () => {
      this.enemyArt?.destroy();
      this.enemyArt = undefined;
      this.foeIndex++;
      this.foe = this.encounter.enemies[this.foeIndex];
      this.seenMoveEffects.clear();
      this.showTrainer();
      this.enemyName.setText('PM ALEX');
      this.enemyMeta.setText(`${this.encounter.trainer?.role}  ·  1 REQUEST LEFT`);
      this.showMessage('ALEX: “Amazing. While I have you—one tiny follow-up...”', () => {
        this.sendOutFoe(`ALEX sent out ${this.foe.name}!`);
      }, true);
    }, true);
  }

  win() {
    if (this.enemyHp > 0) this.damageEnemy(this.enemyHp);
    this.processing = true; audio.sfx(880, .4, 'triangle');
    if (this.enemyArt) this.tweens.add({ targets: this.enemyArt, alpha: 0, y: this.enemyArt.y + 80, duration: 520, ease: 'Back.in' });
    state.completed[state.encounter] = true;
    state.partyHp = state.partyHp.map(hp => Math.min(100, hp + 24)) as [number, number];
    setStatus(this.encounter.defeated);
    this.showMessage(`${this.encounter.defeated}\n+24 TEAM FOCUS  ·  +1 TEAM MORALE`, () => {
      this.time.delayedCall(350, () => { this.scene.stop(); this.scene.resume('WorldScene'); });
    }, true);
  }
}

class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }
  create() {
    audio.setTheme('overworld');
    state.phase = 'complete'; setStatus('Deploy complete. You reached Ship City and won Route 529.');
    this.add.rectangle(W/2, H/2, W, H, 0x10273a);
    for (let i = 0; i < 70; i++) {
      const color = [0x67dfb6, 0xf0ae4c, 0xe56c99, 0x53a9db][i % 4];
      const bit = this.add.rectangle(Phaser.Math.Between(0,W), Phaser.Math.Between(-100,H), 8, 18, color).setRotation(Phaser.Math.FloatBetween(-1,1));
      this.tweens.add({ targets: bit, y: H + 80, x: bit.x + Phaser.Math.Between(-100,100), rotation: bit.rotation + 4, duration: Phaser.Math.Between(2500,5000), repeat: -1 });
    }
    addPill(this, W/2, 105, 'SPRINT COMPLETE', 0x2c8e72);
    this.add.text(W/2, 190, 'DEPLOYED!', textStyle(70, '#ffffff', '800')).setOrigin(.5);
    this.add.text(W/2, 277, 'Route 529 → Ship City', monoStyle(18, '#82d9c1')).setOrigin(.5);
    this.add.rectangle(W/2, 407, 680, 150, 0xf9f5e7).setStrokeStyle(5, 0x385266);
    this.add.text(W/2, 371, '3 BLOCKERS RESOLVED', monoStyle(14, '#526779')).setOrigin(.5);
    this.add.text(W/2, 415, '✓ BUG FIXED    ✓ LEAK PATCHED    ✓ SCOPE ALIGNED', textStyle(18, '#193348', '800')).setOrigin(.5);
    this.add.text(W/2, 461, 'The deploy was flawless. Please ignore monitoring.', textStyle(17, '#607387')).setOrigin(.5);
    const replay = this.add.rectangle(W/2, 570, 245, 58, 0x3c9fc0).setStrokeStyle(3, 0xffffff, .35).setInteractive({ useHandCursor: true });
    this.add.text(W/2, 570, 'RUN IT BACK', monoStyle(15, '#ffffff')).setOrigin(.5);
    replay.on('pointerdown', () => {
      state.completed = [false,false,false]; state.partyHp = [100, 100]; state.activeMember = 0; state.encounter = 0;
      this.scene.start('WorldScene');
    });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  backgroundColor: '#10273a',
  pixelArt: false,
  antialias: true,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene, BattleScene, EndScene],
  render: { pixelArt: false, antialias: true, antialiasGL: true, roundPixels: true }
});

// Small, stable hooks for automated playtesting.
(window as Window & { __SW_RPG__?: object }).__SW_RPG__ = {
  getState: () => ({ ...state, completed: [...state.completed], partyHp: [...state.partyHp] }),
  startBattle: (index = 0) => {
    state.encounter = Phaser.Math.Clamp(index, 0, 2); state.phase = 'battle';
    const world = game.scene.getScene('WorldScene'); world.scene.pause(); world.scene.launch('BattleScene');
  },
  chooseAction: (index = 0) => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.takeAction(Phaser.Math.Clamp(index, 0, 3));
  },
  swapParty: () => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.swapMember();
  },
  continueDialogue: () => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.continueDialogue();
  },
  winBattle: () => {
    const battle = game.scene.getScene('BattleScene') as BattleScene;
    if (battle.scene.isActive()) battle.win();
  },
  reset: () => {
    state.completed = [false,false,false]; state.partyHp = [100, 100]; state.activeMember = 0; state.encounter = 0;
    game.scene.start('WorldScene');
  }
};
