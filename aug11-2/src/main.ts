import * as pc from 'playcanvas';
import './style.css';

type Work = { title: string; subtitle: string; image: string; x?: number };
type Gallery = {
  title: string;
  heading: string;
  note: string;
  accent: string;
  wall: string;
  works: Work[];
};

const galleries: Gallery[] = [
  {
    title: 'The Court of Beasts',
    heading: 'The Court<br>of <em>Beasts</em>',
    note: 'In this imagined court, rank is worn in velvet, silk and fur. These portraits borrow the visual language of eighteenth-century power while quietly asking what, exactly, separates a sitter from a subject.',
    accent: '#d7ff43', wall: '#827d6f',
    works: [
      { title: 'Her Grace, the White Marchioness', subtitle: 'Generative oil study · Court archive I', image: '/art/portraits-1.webp' },
      { title: 'Admiral Blackhorn at Rest', subtitle: 'Generative oil study · Court archive II', image: '/art/portraits-2.webp' },
      { title: 'Lady Sighthound in Saffron', subtitle: 'Generative oil study · Court archive III', image: '/art/portraits-3.webp' }
    ]
  },
  {
    title: 'Objects, Elsewhere',
    heading: 'Objects,<br><em>Elsewhere</em>',
    note: 'A telephone, a teacup, a chair: each has been removed from the room that taught us how to see it. In their new surroundings these familiar things become monuments, witnesses and lonely travellers.',
    accent: '#75d6df', wall: '#667477',
    works: [
      { title: 'A Call from the Bathypelagic', subtitle: 'Oil on simulated canvas · 2025', image: '/art/objects-1.webp' },
      { title: 'Tea at Apogee', subtitle: 'Oil on simulated canvas · 2025', image: '/art/objects-2.webp' },
      { title: 'The Last Chair Before Spring', subtitle: 'Oil on simulated canvas · 2025', image: '/art/objects-3.webp' }
    ]
  },
  {
    title: 'Worlds Without Us',
    heading: 'Worlds<br>Without <em>Us</em>',
    note: 'These invented vistas treat the alien not as threat, but as landscape. Crystal, root and machine share the same deep time. Technology appears less like an arrival than another form of weather.',
    accent: '#ff8b63', wall: '#75695f',
    works: [
      { title: 'Salt Moon, Periapsis', subtitle: 'Large-format generative landscape I', image: '/art/worlds-1.webp' },
      { title: 'Machines in the Mangrove', subtitle: 'Large-format generative landscape II', image: '/art/worlds-2.webp' },
      { title: 'The City That Climbed', subtitle: 'Large-format generative landscape III', image: '/art/worlds-3.webp' }
    ]
  }
];

const canvas = document.querySelector<HTMLCanvasElement>('#museum')!;
const app = new pc.Application(canvas, {
  mouse: new pc.Mouse(canvas),
  touch: new pc.TouchDevice(canvas),
  keyboard: new pc.Keyboard(window),
  graphicsDeviceOptions: { antialias: true, alpha: false, powerPreference: 'high-performance' }
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
app.scene.ambientLight = new pc.Color(0.23, 0.22, 0.19);
app.scene.exposure = 1.15;
// These renderer settings are runtime Scene properties in PlayCanvas.
const renderScene = app.scene as pc.Scene & { toneMapping: number; gammaCorrection: number };
renderScene.toneMapping = pc.TONEMAP_ACES;
renderScene.gammaCorrection = pc.GAMMA_SRGB;
app.scene.skyboxMip = 1;
app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio, 1.6);
app.start();

window.addEventListener('resize', () => app.resizeCanvas());

function color(hex: string) {
  const value = hex.replace('#', '');
  return new pc.Color(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255
  );
}

function material(name: string, hex: string, opts: { metal?: number; gloss?: number; emissive?: string } = {}) {
  const m = new pc.StandardMaterial();
  m.name = name;
  m.diffuse = color(hex);
  m.metalness = opts.metal ?? 0;
  m.gloss = opts.gloss ?? 0.35;
  if (opts.emissive) {
    m.emissive = color(opts.emissive);
    m.emissiveIntensity = 1.2;
  }
  m.update();
  return m;
}

const floorMat = material('Dark polished terrazzo', '#292722', { gloss: .72 });
const ceilingMat = material('Ceiling', '#292722', { gloss: .08 });
const brassMat = material('Aged brass', '#7f6840', { metal: .85, gloss: .66 });
const darkMat = material('Frame shadow', '#17140f', { gloss: .25 });
const plaqueMat = material('Wall label', '#d8d1c1', { gloss: .12 });
const benchMat = material('Bench', '#4b3028', { gloss: .48 });

function box(name: string, position: pc.Vec3, scale: pc.Vec3, mat: pc.Material, parent?: pc.Entity) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type: 'box', material: mat });
  e.setLocalPosition(position);
  e.setLocalScale(scale);
  (parent ?? app.root).addChild(e);
  return e;
}

// One continuous enfilade: three rooms connected by aligned doorways.
const centers = [-12, 0, 12];
centers.forEach((cx, index) => {
  const wallMat = material(`Gallery ${index + 1} plaster`, galleries[index].wall, { gloss: .16 });
  box(`Gallery ${index + 1} floor`, new pc.Vec3(cx, -.16, 0), new pc.Vec3(12, .3, 16), floorMat);
  box(`Gallery ${index + 1} ceiling`, new pc.Vec3(cx, 6.12, 0), new pc.Vec3(12, .22, 16), ceilingMat);
  box('North wall', new pc.Vec3(cx, 3, -8), new pc.Vec3(12, 6.2, .28), wallMat);
  box('South wall', new pc.Vec3(cx, 3, 8), new pc.Vec3(12, 6.2, .28), wallMat);
  // A quiet center bench anchors each gallery.
  box('Bench seat', new pc.Vec3(cx, .63, 1.1), new pc.Vec3(3.2, .25, .72), benchMat);
  box('Bench leg L', new pc.Vec3(cx - 1.25, .28, 1.1), new pc.Vec3(.18, .55, .58), brassMat);
  box('Bench leg R', new pc.Vec3(cx + 1.25, .28, 1.1), new pc.Vec3(.18, .55, .58), brassMat);
  // Ceiling track and warm gallery pools.
  box('Lighting track', new pc.Vec3(cx, 5.82, -4.2), new pc.Vec3(8, .06, .06), darkMat);
  [-3, 0, 3].forEach(offset => {
    const light = new pc.Entity('Gallery spotlight');
    light.addComponent('light', { type: 'omni', color: new pc.Color(1, .74, .48), intensity: index === 2 ? 1.15 : .95, range: 6.5, castShadows: false });
    light.setPosition(cx + offset, 4.65, -4.8);
    app.root.addChild(light);
    box('Spot housing', new pc.Vec3(cx + offset, 5.7, -4.2), new pc.Vec3(.18, .24, .18), darkMat);
  });
});

// Outer walls.
const room0Wall = material('Outer plaster L', galleries[0].wall, { gloss: .16 });
const room2Wall = material('Outer plaster R', galleries[2].wall, { gloss: .16 });
box('West outer wall', new pc.Vec3(-18, 3, 0), new pc.Vec3(.28, 6.2, 16), room0Wall);
box('East outer wall', new pc.Vec3(18, 3, 0), new pc.Vec3(.28, 6.2, 16), room2Wall);

// Internal walls are interrupted by tall, aligned portals.
[-6, 6].forEach((x, i) => {
  const leftMat = material(`Portal plaster ${i}`, galleries[i].wall, { gloss: .16 });
  box('Portal wall north', new pc.Vec3(x, 3, -5), new pc.Vec3(.28, 6.2, 6), leftMat);
  box('Portal wall south', new pc.Vec3(x, 3, 5), new pc.Vec3(.28, 6.2, 6), leftMat);
  box('Portal lintel', new pc.Vec3(x, 5.3, 0), new pc.Vec3(.32, 1.6, 4), leftMat);
  box('Portal brass edge N', new pc.Vec3(x + .02, 2.25, -2.02), new pc.Vec3(.35, 4.5, .07), brassMat);
  box('Portal brass edge S', new pc.Vec3(x + .02, 2.25, 2.02), new pc.Vec3(.35, 4.5, .07), brassMat);
});

function loadTexture(url: string): Promise<pc.Texture> {
  return new Promise((resolve, reject) => {
    const asset = new pc.Asset(url, 'texture', { url });
    app.assets.add(asset);
    asset.ready(() => resolve(asset.resource as pc.Texture));
    asset.on('error', reject);
    app.assets.load(asset);
  });
}

const artworkPositions: { room: number; work: number; position: pc.Vec3 }[] = [];

async function hangArtwork(room: number, work: number, texture: pc.Texture) {
  const cx = centers[room];
  const x = cx + [-3.25, 0, 3.25][work];
  const isLandscapeRoom = room === 2;
  const width = isLandscapeRoom ? 2.45 : 2.18;
  const height = isLandscapeRoom ? 5.15 : 4.75;
  const canvasMat = new pc.StandardMaterial();
  canvasMat.name = galleries[room].works[work].title;
  canvasMat.diffuse = new pc.Color(1, 1, 1);
  canvasMat.diffuseMap = texture;
  canvasMat.gloss = .18;
  canvasMat.metalness = 0;
  canvasMat.update();
  box('Ornate outer frame', new pc.Vec3(x, 3.15, -7.72), new pc.Vec3(width + .24, height + .24, .18), brassMat);
  box('Black frame inset', new pc.Vec3(x, 3.15, -7.59), new pc.Vec3(width + .08, height + .08, .12), darkMat);
  box(galleries[room].works[work].title, new pc.Vec3(x, 3.15, -7.49), new pc.Vec3(width, height, .08), canvasMat);
  box('Artwork label', new pc.Vec3(x, .46, -7.54), new pc.Vec3(.76, .28, .07), plaqueMat);
  artworkPositions.push({ room, work, position: new pc.Vec3(x, 1.7, -7.4) });
}

const textureJobs = galleries.flatMap((gallery, room) => gallery.works.map((work, index) =>
  loadTexture(work.image).then(texture => hangArtwork(room, index, texture))
));

// Camera and restrained first-person movement.
const camera = new pc.Entity('Visitor camera');
camera.addComponent('camera', { clearColor: new pc.Color(.055, .052, .045), farClip: 70, nearClip: .08, fov: 65 });
camera.setPosition(-12, 1.68, 5.2);
app.root.addChild(camera);

let yaw = 0;
let pitch = -2;
let currentRoom = 0;
let panelOpen = true;
let lastCard = '';
const held = new Set<string>();

window.addEventListener('keydown', e => held.add(e.code));
window.addEventListener('keyup', e => held.delete(e.code));
canvas.addEventListener('click', () => { if (!panelOpen && document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * .09;
  pitch = Math.max(-67, Math.min(67, pitch - e.movementY * .08));
});

const navButtons = [...document.querySelectorAll<HTMLButtonElement>('.gallery-nav button')];
const curator = document.querySelector<HTMLElement>('#curator')!;
const curatorCopy = document.querySelector<HTMLElement>('#curator-copy')!;
const roomIndex = document.querySelector<HTMLElement>('#room-index')!;
const progressLine = document.querySelector<HTMLElement>('.room-progress i')!;
const artCard = document.querySelector<HTMLElement>('#art-card')!;
const root = document.documentElement;

function setRoom(index: number, teleport = false) {
  if (teleport) {
    camera.setPosition(centers[index], 1.68, 4.7);
    yaw = 0; pitch = -2;
  }
  if (currentRoom === index && !teleport) return;
  currentRoom = index;
  const gallery = galleries[index];
  navButtons.forEach((b, i) => b.classList.toggle('active', i === index));
  document.querySelector<HTMLElement>('.eyebrow')!.textContent = `Gallery 0${index + 1} · Curator's note`;
  document.querySelector<HTMLElement>('.curator h1')!.innerHTML = gallery.heading;
  curatorCopy.textContent = gallery.note;
  roomIndex.textContent = `0${index + 1}`;
  progressLine.style.background = `linear-gradient(90deg, ${gallery.accent} ${(index + 1) * 33.333}%, #777 ${(index + 1) * 33.333}%)`;
  root.style.setProperty('--acid', gallery.accent);
  if (teleport) {
    panelOpen = true;
    curator.classList.remove('hidden');
    document.exitPointerLock?.();
  }
}

navButtons.forEach((button, index) => button.addEventListener('click', e => {
  e.stopPropagation();
  setRoom(index, true);
}));

document.querySelector('#enter-gallery')!.addEventListener('click', () => {
  panelOpen = false;
  curator.classList.add('hidden');
  canvas.requestPointerLock?.();
});

// A tiny procedural room tone, opt-in only.
let audio: { ctx: AudioContext; gain: GainNode; oscillators: OscillatorNode[] } | null = null;
document.querySelector('#sound')!.addEventListener('click', () => {
  const button = document.querySelector<HTMLButtonElement>('#sound')!;
  if (!audio) {
    const ctx = new AudioContext();
    const gain = ctx.createGain(); gain.gain.value = .018; gain.connect(ctx.destination);
    const oscillators = [55, 82.41].map((frequency, i) => {
      const osc = ctx.createOscillator(); const level = ctx.createGain();
      osc.type = i ? 'sine' : 'triangle'; osc.frequency.value = frequency; level.gain.value = i ? .25 : .18;
      osc.connect(level); level.connect(gain); osc.start(); return osc;
    });
    audio = { ctx, gain, oscillators };
    button.querySelector('span')!.textContent = '●';
    button.setAttribute('aria-label', 'Mute ambience');
  } else {
    const active = audio.gain.gain.value > 0;
    audio.gain.gain.setTargetAtTime(active ? 0 : .018, audio.ctx.currentTime, .08);
    button.querySelector('span')!.textContent = active ? '◌' : '●';
    button.setAttribute('aria-label', active ? 'Play ambience' : 'Mute ambience');
  }
});

function updateCard() {
  const p = camera.getPosition();
  if (p.z > -2.8 || panelOpen) { artCard.classList.remove('visible'); return; }
  let nearest: typeof artworkPositions[number] | undefined;
  let distance = Infinity;
  artworkPositions.filter(a => a.room === currentRoom).forEach(a => {
    const d = Math.hypot(p.x - a.position.x, p.z - a.position.z);
    if (d < distance) { distance = d; nearest = a; }
  });
  if (!nearest || distance > 4.6) { artCard.classList.remove('visible'); return; }
  const key = `${nearest.room}-${nearest.work}`;
  if (key !== lastCard) {
    const work = galleries[nearest.room].works[nearest.work];
    artCard.querySelector<HTMLElement>('.art-number')!.textContent = `0${nearest.work + 1}`;
    artCard.querySelector<HTMLElement>('h2')!.textContent = work.title;
    artCard.querySelector<HTMLElement>('p')!.textContent = work.subtitle;
    lastCard = key;
  }
  artCard.classList.add('visible');
}

app.on('update', (dt: number) => {
  camera.setEulerAngles(pitch, yaw, 0);
  if (!panelOpen) {
    const forward = new pc.Vec3(-Math.sin(yaw * Math.PI / 180), 0, -Math.cos(yaw * Math.PI / 180));
    const right = new pc.Vec3(Math.cos(yaw * Math.PI / 180), 0, -Math.sin(yaw * Math.PI / 180));
    const move = new pc.Vec3();
    if (held.has('KeyW') || held.has('ArrowUp')) move.add(forward);
    if (held.has('KeyS') || held.has('ArrowDown')) move.sub(forward);
    if (held.has('KeyD') || held.has('ArrowRight')) move.add(right);
    if (held.has('KeyA') || held.has('ArrowLeft')) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().mulScalar(Math.min(dt, .04) * 3.25);
      const old = camera.getPosition().clone();
      const next = old.clone().add(move);
      next.x = Math.max(-17.45, Math.min(17.45, next.x));
      next.z = Math.max(-7.35, Math.min(7.35, next.z));
      // Keep visitors from walking through the internal walls outside their door openings.
      for (const boundary of [-6, 6]) {
        if ((old.x - boundary) * (next.x - boundary) < 0 && Math.abs(next.z) > 1.82) {
          next.x = boundary + (old.x < boundary ? -.22 : .22);
        }
      }
      camera.setPosition(next.x, 1.68, next.z);
    }
  }
  const x = camera.getPosition().x;
  const room = x < -6 ? 0 : x < 6 ? 1 : 2;
  if (room !== currentRoom) setRoom(room);
  updateCard();
});

setRoom(0, true);
Promise.all(textureJobs).finally(() => {
  setTimeout(() => document.querySelector('#loading')?.classList.add('done'), 350);
});

// Exposed only for deterministic smoke tests.
(window as unknown as { museumReady: boolean }).museumReady = true;
