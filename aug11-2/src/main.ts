import * as pc from 'playcanvas';
import './style.css';

type Work = { title: string; subtitle: string; image: string };
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
      { title: 'Her Grace, the White Marchioness', subtitle: 'Old-master glazing · Fine linen', image: '/art/portraits-1.webp' },
      { title: 'Admiral Blackhorn at Rest', subtitle: 'Court portrait · Layered impasto', image: '/art/portraits-2.webp' },
      { title: 'Lady Sighthound in Saffron', subtitle: 'Court portrait · Silk and oil', image: '/art/portraits-3.webp' },
      { title: 'The Fox Envoy', subtitle: 'Northern manner · Smooth canvas', image: '/art/portraits-4.webp' },
      { title: 'Prince Capybara at the Harbour', subtitle: 'Sunlit study · Linen weave', image: '/art/portraits-5.webp' },
      { title: 'The Midnight Justice', subtitle: 'Tonal oil · Dry-brush featherwork', image: '/art/portraits-6.webp' },
      { title: 'The Pale Heir', subtitle: 'Rococo oil · Prepared gesso', image: '/art/portraits-7.webp' },
      { title: 'Sisters of the Azure Salon', subtitle: 'Modernist oil · Simple canvas', image: '/art/portraits-8.webp' },
      { title: 'The Highland Crown', subtitle: 'Romantic oil · Coarse weave', image: '/art/portraits-9.webp' }
    ]
  },
  {
    title: 'Objects, Elsewhere',
    heading: 'Objects,<br><em>Elsewhere</em>',
    note: 'A telephone, a teacup, a chair: each has been removed from the room that taught us how to see it. In their new surroundings these familiar things become monuments, witnesses and lonely travellers.',
    accent: '#75d6df', wall: '#667477',
    works: [
      { title: 'A Call from the Bathypelagic', subtitle: 'Glazed oil · Submerged study', image: '/art/objects-1.webp' },
      { title: 'The Last Chair Before Spring', subtitle: 'Tonal oil · Scraped ground', image: '/art/objects-3.webp' },
      { title: 'Forecast: Perpetual Blue', subtitle: 'Naïve oil · Linen texture', image: '/art/objects-4.webp' },
      { title: 'Breakfast for the Old Gods', subtitle: 'Still-life glazing · Moss impasto', image: '/art/objects-5.webp' },
      { title: 'The Long Crossing', subtitle: 'Color-field oil · Thin scumble', image: '/art/objects-7.webp' },
      { title: 'Cold Storage, Water Garden', subtitle: 'Post-Impressionist oil · Open weave', image: '/art/objects-8.webp' },
      { title: 'Reliquary for a Right Foot', subtitle: 'Surrealist oil · Red ground', image: '/art/objects-9.webp' }
    ]
  },
  {
    title: 'Worlds Without Us',
    heading: 'Worlds<br>Without <em>Us</em>',
    note: 'These invented vistas treat the alien not as threat, but as landscape. Crystal, root and machine share the same deep time. Technology appears less like an arrival than another form of weather.',
    accent: '#ff8b63', wall: '#75695f',
    works: [
      { title: 'Salt Moon, Periapsis', subtitle: 'Romantic landscape · Luminous oil', image: '/art/worlds-1.webp' },
      { title: 'Machines in the Mangrove', subtitle: 'Layered oil · Botanical impasto', image: '/art/worlds-2.webp' },
      { title: 'The City That Climbed', subtitle: 'Large-format oil · Copper ground', image: '/art/worlds-3.webp' },
      { title: 'White Towers at Black Tide', subtitle: 'Minimal oil · Fine canvas grain', image: '/art/worlds-4.webp' },
      { title: 'The Solar Permanent Way', subtitle: 'Regionalist oil · Rhythmic stroke', image: '/art/worlds-5.webp' },
      { title: 'Archive in Cobalt Ice', subtitle: 'Scraped oil · Palette-knife ground', image: '/art/worlds-6.webp' },
      { title: 'Sails upon the Rosewater', subtitle: 'Fauvist oil · Direct color', image: '/art/worlds-7.webp' },
      { title: 'Obsidian Weather', subtitle: 'Sublime oil · Dark velatura', image: '/art/worlds-8.webp' },
      { title: 'The Seed Observatory', subtitle: 'Tonal oil · Rough linen', image: '/art/worlds-9.webp' }
    ]
  },
  {
    title: 'The Department of Impossible Weather',
    heading: 'Impossible<br><em>Weather</em>',
    note: 'Here weather has abandoned scale, direction and duty. A storm may become furniture, a guest, or private property. These works invite us to regard the atmosphere not as background, but as an eccentric social presence.',
    accent: '#a9c9ff', wall: '#69737d',
    works: [
      { title: 'The Storm Takes a Seat', subtitle: 'Tonal oil · Soft-brushed canvas', image: '/art/weather-1.webp' },
      { title: 'Procession at Barometric Dusk', subtitle: 'Metaphysical oil · Matte linen', image: '/art/weather-2.webp' },
      { title: 'Rain, Reconsidering Gravity', subtitle: 'Glazed oil · Impasto highlights', image: '/art/weather-3.webp' },
      { title: 'Private Storms in the Orchard', subtitle: 'Post-Impressionist oil · Coarse weave', image: '/art/weather-4.webp' },
      { title: 'Dinner with the Sea Fog', subtitle: 'Surrealist oil · Silver ground', image: '/art/weather-5.webp' }
    ]
  },
  {
    title: 'Minor Gods at Work',
    heading: 'Minor Gods<br>at <em>Work</em>',
    note: 'Divinity is usually pictured at the instant of revelation. This gallery attends instead to maintenance: ironing, watering, mending, folding and baking. Even eternity, it seems, depends upon small repeated gestures.',
    accent: '#ffd36a', wall: '#7a6d59',
    works: [
      { title: 'The Domestic Aspect', subtitle: 'Genre oil · Warm linen', image: '/art/gods-1.webp' },
      { title: 'River God, Third Floor', subtitle: 'Contemporary oil · Simple grain', image: '/art/gods-2.webp' },
      { title: 'Roadside Assistance, 2:13 AM', subtitle: 'Romantic oil · Moonlit glazing', image: '/art/gods-3.webp' },
      { title: 'Patron of Lost Socks', subtitle: 'Social realist oil · Moss impasto', image: '/art/gods-4.webp' },
      { title: 'Before the First Loaf', subtitle: 'Symbolist oil · Golden ground', image: '/art/gods-5.webp' }
    ]
  },
  {
    title: 'The Night Garden',
    heading: 'The Night<br><em>Garden</em>',
    note: 'Six impossible specimens begin as exact vector geometry, then acquire dragged pigment, raised contours and the tooth of woven canvas. Bright horizontal impasto alternates with dark, translucent scumbling: two mechanical recipes learning to leave a human trace.',
    accent: '#ff77b7', wall: '#594d67',
    works: [
      { title: 'Moonflower Keeps the Hours', subtitle: 'Procedural velatura · Directional scumble', image: '/art/night-garden-1.webp' },
      { title: 'Foxglove Broadcast', subtitle: 'Graphic impasto · Horizontal knife drag', image: '/art/night-garden-2.webp' },
      { title: 'Blue Lotus, Tidal Clock', subtitle: 'Graphic impasto · Raised contour', image: '/art/night-garden-3.webp' },
      { title: 'Ferns Remember Lightning', subtitle: 'Procedural velatura · Dark ground', image: '/art/night-garden-4.webp' },
      { title: 'Pomegranates after Midnight', subtitle: 'Graphic impasto · Woven canvas', image: '/art/night-garden-5.webp' },
      { title: 'Moths Pollinate the Stars', subtitle: 'Procedural velatura · Edge relief', image: '/art/night-garden-6.webp' }
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
app.scene.ambientLight = new pc.Color(0.38, 0.36, 0.32);
app.scene.exposure = 1.32;
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
const oakMat = material('Dark oak frame', '#4c3524', { gloss: .42 });
const paleWoodMat = material('Pale maple frame', '#b59b72', { gloss: .3 });
const blackFrameMat = material('Museum black frame', '#242321', { gloss: .2 });
const plaqueMat = material('Wall label', '#d8d1c1', { gloss: .12 });
const benchMat = material('Bench', '#4b3028', { gloss: .48 });
const frameMaterials = [brassMat, darkMat, oakMat, paleWoodMat, blackFrameMat];

function box(name: string, position: pc.Vec3, scale: pc.Vec3, mat: pc.Material, parent?: pc.Entity) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type: 'box', material: mat });
  e.setLocalPosition(position);
  e.setLocalScale(scale);
  (parent ?? app.root).addChild(e);
  return e;
}

// Six galleries open directly onto a shared concourse. Unlike the former
// enfilade, every room is one doorway away from the hub.
const ROOM_WIDTH = 12;
const ROOM_DEPTH = 16;
const ROOM_HALF_WIDTH = ROOM_WIDTH / 2;
const ROOM_HALF_DEPTH = ROOM_DEPTH / 2;
type RoomPlacement = { cx: number; cz: number; row: 'north' | 'south' };
const rooms: RoomPlacement[] = [
  { cx: -14, cz: -13, row: 'north' }, { cx: 0, cz: -13, row: 'north' }, { cx: 14, cz: -13, row: 'north' },
  { cx: -14, cz: 13, row: 'south' }, { cx: 0, cz: 13, row: 'south' }, { cx: 14, cz: 13, row: 'south' }
];
const concourseMat = material('Concourse plaster', '#605e59', { gloss: .14 });
box('Concourse floor', new pc.Vec3(0, -.16, 0), new pc.Vec3(44, .3, 10), floorMat);
box('Concourse ceiling', new pc.Vec3(0, 6.12, 0), new pc.Vec3(44, .22, 10), ceilingMat);
box('Concourse west wall', new pc.Vec3(-22, 3, 0), new pc.Vec3(.28, 6.2, 10), concourseMat);
box('Concourse east wall', new pc.Vec3(22, 3, 0), new pc.Vec3(.28, 6.2, 10), concourseMat);
[-21, -7, 7, 21].forEach(x => {
  box('Concourse north infill', new pc.Vec3(x, 3, -5), new pc.Vec3(2, 6.2, .28), concourseMat);
  box('Concourse south infill', new pc.Vec3(x, 3, 5), new pc.Vec3(2, 6.2, .28), concourseMat);
});
[-14, 0, 14].forEach(x => {
  box('Concourse light track', new pc.Vec3(x, 5.8, 0), new pc.Vec3(7.5, .06, .06), darkMat);
  const light = new pc.Entity('Concourse light');
  light.addComponent('light', { type: 'omni', color: new pc.Color(1, .83, .63), intensity: .9, range: 9, castShadows: false });
  light.setPosition(x, 4.8, 0);
  app.root.addChild(light);
});

rooms.forEach(({ cx, cz, row }, index) => {
  const wallMat = material(`Gallery ${index + 1} plaster`, galleries[index].wall, { gloss: .16 });
  box(`Gallery ${index + 1} floor`, new pc.Vec3(cx, -.16, cz), new pc.Vec3(ROOM_WIDTH, .3, ROOM_DEPTH), floorMat);
  box(`Gallery ${index + 1} ceiling`, new pc.Vec3(cx, 6.12, cz), new pc.Vec3(ROOM_WIDTH, .22, ROOM_DEPTH), ceilingMat);
  box('West wall', new pc.Vec3(cx - ROOM_HALF_WIDTH, 3, cz), new pc.Vec3(.28, 6.2, ROOM_DEPTH), wallMat);
  box('East wall', new pc.Vec3(cx + ROOM_HALF_WIDTH, 3, cz), new pc.Vec3(.28, 6.2, ROOM_DEPTH), wallMat);

  const outerZ = cz + (row === 'north' ? -ROOM_HALF_DEPTH : ROOM_HALF_DEPTH);
  const innerZ = cz + (row === 'north' ? ROOM_HALF_DEPTH : -ROOM_HALF_DEPTH);
  box('Outer wall', new pc.Vec3(cx, 3, outerZ), new pc.Vec3(ROOM_WIDTH, 6.2, .28), wallMat);
  box('Portal wall left', new pc.Vec3(cx - 4, 3, innerZ), new pc.Vec3(4, 6.2, .28), wallMat);
  box('Portal wall right', new pc.Vec3(cx + 4, 3, innerZ), new pc.Vec3(4, 6.2, .28), wallMat);
  box('Portal lintel', new pc.Vec3(cx, 5.3, innerZ), new pc.Vec3(4, 1.6, .32), wallMat);
  box('Portal brass edge L', new pc.Vec3(cx - 2.02, 2.25, innerZ), new pc.Vec3(.07, 4.5, .35), brassMat);
  box('Portal brass edge R', new pc.Vec3(cx + 2.02, 2.25, innerZ), new pc.Vec3(.07, 4.5, .35), brassMat);

  const benchZ = cz + (row === 'north' ? 1.1 : -1.1);
  box('Bench seat', new pc.Vec3(cx, .63, benchZ), new pc.Vec3(3.2, .25, .72), benchMat);
  box('Bench leg L', new pc.Vec3(cx - 1.25, .28, benchZ), new pc.Vec3(.18, .55, .58), brassMat);
  box('Bench leg R', new pc.Vec3(cx + 1.25, .28, benchZ), new pc.Vec3(.18, .55, .58), brassMat);

  [-4.2, 4.2].forEach(trackOffset => {
    const trackZ = cz + trackOffset;
    box('Lighting track', new pc.Vec3(cx, 5.82, trackZ), new pc.Vec3(8, .06, .06), darkMat);
    [-3.5, 0, 3.5].forEach(offset => {
      const light = new pc.Entity('Gallery spotlight');
      light.addComponent('light', { type: 'omni', color: new pc.Color(1, .86, .68), intensity: index === 2 ? 1.25 : 1.12, range: 7.4, castShadows: false });
      light.setPosition(cx + offset, 4.55, cz + trackOffset * .82);
      app.root.addChild(light);
      box('Spot housing', new pc.Vec3(cx + offset, 5.7, trackZ), new pc.Vec3(.18, .24, .18), darkMat);
    });
  });
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

type Wall = 'north' | 'south' | 'west' | 'east';
type Hanging = { wall: Wall; along: number; centerY: number; width: number; height: number; frame: number };

// Every room uses a salon-like rhythm: asymmetric scales, mixed orientations and all available walls.
const hangingPlans: Hanging[][] = [
  [
    { wall: 'north', along: -3.55, centerY: 3.22, width: 1.7, height: 4.2, frame: 0 },
    { wall: 'north', along: -.85, centerY: 3.05, width: 1.45, height: 3.65, frame: 2 },
    { wall: 'north', along: 2.5, centerY: 3.3, width: 2.05, height: 4.55, frame: 0 },
    { wall: 'east', along: -3.45, centerY: 3.08, width: 1.6, height: 4.0, frame: 1 },
    { wall: 'east', along: -.45, centerY: 3.4, width: 1.35, height: 3.4, frame: 3 },
    { wall: 'east', along: 2.8, centerY: 3.05, width: 1.85, height: 4.25, frame: 2 },
    { wall: 'west', along: -5.35, centerY: 3.0, width: 3.0, height: 2.05, frame: 3 },
    { wall: 'west', along: -.75, centerY: 3.55, width: 3.7, height: 2.4, frame: 4 },
    { wall: 'west', along: 4.75, centerY: 2.75, width: 2.8, height: 1.85, frame: 2 }
  ],
  [
    { wall: 'north', along: -3.65, centerY: 3.15, width: 1.45, height: 3.8, frame: 4 },
    { wall: 'north', along: 2.65, centerY: 2.95, width: 1.65, height: 3.55, frame: 2 },
    { wall: 'west', along: -3.25, centerY: 3.35, width: 1.55, height: 3.9, frame: 3 },
    { wall: 'west', along: -.2, centerY: 2.85, width: 1.35, height: 3.45, frame: 1 },
    { wall: 'east', along: -5.25, centerY: 3.45, width: 3.35, height: 1.75, frame: 3 },
    { wall: 'north', along: -.45, centerY: 3.05, width: 3.75, height: 2.05, frame: 2 },
    { wall: 'east', along: 4.7, centerY: 2.72, width: 2.9, height: 1.6, frame: 4 }
  ],
  [
    { wall: 'north', along: -3.6, centerY: 3.3, width: 1.8, height: 4.35, frame: 1 },
    { wall: 'north', along: -.5, centerY: 2.92, width: 1.35, height: 3.5, frame: 3 },
    { wall: 'north', along: 2.7, centerY: 3.38, width: 2.0, height: 4.55, frame: 0 },
    { wall: 'west', along: -3.45, centerY: 2.95, width: 1.45, height: 3.65, frame: 4 },
    { wall: 'west', along: -.55, centerY: 3.38, width: 1.7, height: 4.2, frame: 2 },
    { wall: 'west', along: 2.9, centerY: 3.12, width: 1.75, height: 3.85, frame: 1 },
    { wall: 'east', along: -5.15, centerY: 3.3, width: 3.8, height: 1.9, frame: 4 },
    { wall: 'east', along: 4.75, centerY: 4.25, width: 4.05, height: 2.2, frame: 0 },
    { wall: 'east', along: 4.75, centerY: 1.62, width: 3.0, height: 1.7, frame: 3 }
  ],
  [
    { wall: 'west', along: -3.45, centerY: 3.2, width: 1.65, height: 4.05, frame: 2 },
    { wall: 'west', along: -.35, centerY: 3.45, width: 1.45, height: 3.6, frame: 4 },
    { wall: 'west', along: 3.0, centerY: 3.05, width: 1.8, height: 4.15, frame: 3 },
    { wall: 'south', along: -2.85, centerY: 3.25, width: 3.7, height: 1.85, frame: 3 },
    { wall: 'south', along: 2.75, centerY: 2.95, width: 3.25, height: 1.65, frame: 1 }
  ],
  [
    { wall: 'east', along: -3.5, centerY: 3.25, width: 1.6, height: 4.0, frame: 0 },
    { wall: 'east', along: -.35, centerY: 3.0, width: 1.5, height: 3.75, frame: 3 },
    { wall: 'east', along: 2.95, centerY: 3.35, width: 1.75, height: 4.2, frame: 2 },
    { wall: 'south', along: -2.8, centerY: 3.15, width: 3.65, height: 1.82, frame: 2 },
    { wall: 'south', along: 2.8, centerY: 3.0, width: 3.3, height: 1.65, frame: 4 }
  ],
  [
    { wall: 'south', along: -2.4, centerY: 3.15, width: 2.2, height: 3.05, frame: 4 },
    { wall: 'south', along: 2.4, centerY: 3.15, width: 2.2, height: 3.05, frame: 0 },
    { wall: 'west', along: -3.2, centerY: 3.15, width: 2.2, height: 3.05, frame: 3 },
    { wall: 'west', along: 2.1, centerY: 3.15, width: 2.2, height: 3.05, frame: 1 },
    { wall: 'east', along: -3.2, centerY: 3.15, width: 2.2, height: 3.05, frame: 2 },
    { wall: 'east', along: 2.1, centerY: 3.15, width: 2.2, height: 3.05, frame: 4 }
  ]
];

function findDoorwayViolations() {
  return hangingPlans.flatMap((plan, room) => plan.flatMap((hanging, work) => {
    const entranceWall: Wall = rooms[room].row === 'north' ? 'south' : 'north';
    return hanging.wall === entranceWall ? [{ room, work, wall: hanging.wall }] : [];
  }));
}

const doorwayViolations = findDoorwayViolations();
if (doorwayViolations.length) {
  throw new Error(`Artwork overlaps a doorway: ${JSON.stringify(doorwayViolations)}`);
}

const artworkPositions: { room: number; work: number; position: pc.Vec3 }[] = [];

function wallTransform(room: number, hanging: Hanging, depth: number) {
  const { cx, cz } = rooms[room];
  if (hanging.wall === 'north') return { position: new pc.Vec3(cx + hanging.along, hanging.centerY, cz - ROOM_HALF_DEPTH + depth), rotation: 0 };
  if (hanging.wall === 'south') return { position: new pc.Vec3(cx + hanging.along, hanging.centerY, cz + ROOM_HALF_DEPTH - depth), rotation: 180 };
  if (hanging.wall === 'west') return { position: new pc.Vec3(cx - ROOM_HALF_WIDTH + depth, hanging.centerY, cz + hanging.along), rotation: 90 };
  return { position: new pc.Vec3(cx + ROOM_HALF_WIDTH - depth, hanging.centerY, cz + hanging.along), rotation: -90 };
}

function wallBox(name: string, room: number, hanging: Hanging, depth: number, width: number, height: number, thickness: number, mat: pc.Material) {
  const transform = wallTransform(room, hanging, depth);
  const entity = box(name, transform.position, new pc.Vec3(width, height, thickness), mat);
  entity.setEulerAngles(0, transform.rotation, 0);
  return entity;
}

async function hangArtwork(room: number, work: number, texture: pc.Texture) {
  const hanging = hangingPlans[room][work];
  const canvasMat = new pc.StandardMaterial();
  canvasMat.name = galleries[room].works[work].title;
  canvasMat.diffuse = new pc.Color(1, 1, 1);
  canvasMat.diffuseMap = texture;
  canvasMat.gloss = work % 3 === 0 ? .1 : .2;
  canvasMat.metalness = 0;
  canvasMat.update();

  const border = hanging.frame === 1 ? .11 : hanging.frame === 4 ? .16 : .2;
  wallBox('Artwork outer frame', room, hanging, .27, hanging.width + border, hanging.height + border, .17, frameMaterials[hanging.frame]);
  wallBox('Frame inset', room, hanging, .39, hanging.width + .055, hanging.height + .055, .1, darkMat);
  wallBox(galleries[room].works[work].title, room, hanging, .47, hanging.width, hanging.height, .065, canvasMat);

  const labelHanging = { ...hanging, centerY: Math.max(.38, hanging.centerY - hanging.height / 2 - .23) };
  wallBox('Artwork label', room, labelHanging, .45, Math.min(.7, hanging.width * .45), .16, .055, plaqueMat);

  const viewPoint = wallTransform(room, { ...hanging, centerY: 1.68 }, 1.35).position;
  artworkPositions.push({ room, work, position: viewPoint });
}

const textureJobs = galleries.flatMap((gallery, room) => gallery.works.map((work, index) =>
  loadTexture(work.image).then(texture => hangArtwork(room, index, texture))
));

// Camera and restrained first-person movement. A slightly elevated eye line keeps
// the salon-style upper hangings comfortably visible without looking upward sharply.
const EYE_HEIGHT = 2.08;
const camera = new pc.Entity('Visitor camera');
camera.addComponent('camera', { clearColor: new pc.Color(.055, .052, .045), farClip: 95, nearClip: .08, fov: 65 });
camera.setPosition(rooms[0].cx, EYE_HEIGHT, rooms[0].cz + 4.7);
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
    const room = rooms[index];
    camera.setPosition(room.cx, EYE_HEIGHT, room.cz + (room.row === 'north' ? 4.7 : -4.7));
    yaw = room.row === 'north' ? 0 : 180;
    pitch = -2;
  }
  if (currentRoom === index && !teleport) return;
  currentRoom = index;
  const gallery = galleries[index];
  navButtons.forEach((b, i) => b.classList.toggle('active', i === index));
  document.querySelector<HTMLElement>('.eyebrow')!.textContent = `Gallery 0${index + 1} · Curator's note`;
  document.querySelector<HTMLElement>('.curator h1')!.innerHTML = gallery.heading;
  curatorCopy.textContent = gallery.note;
  const footerCounts = document.querySelectorAll<HTMLElement>('.curator-footer span');
  footerCounts[0].textContent = `${gallery.works.length} works`;
  footerCounts[1].textContent = 'Oil on canvas · 2025';
  roomIndex.textContent = `0${index + 1}`;
  const progress = (index + 1) / galleries.length * 100;
  progressLine.style.background = `linear-gradient(90deg, ${gallery.accent} ${progress}%, #777 ${progress}%)`;
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
  if (panelOpen) { artCard.classList.remove('visible'); return; }
  let nearest: typeof artworkPositions[number] | undefined;
  let distance = Infinity;
  artworkPositions.filter(a => a.room === currentRoom).forEach(a => {
    const d = Math.hypot(p.x - a.position.x, p.z - a.position.z);
    if (d < distance) { distance = d; nearest = a; }
  });
  if (!nearest || distance > 3.15) { artCard.classList.remove('visible'); return; }
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

function isWalkable(x: number, z: number) {
  const inConcourse = x > -21.55 && x < 21.55 && z > -4.45 && z < 4.45;
  const inGallery = rooms.some(room => Math.abs(x - room.cx) < 5.45 && Math.abs(z - room.cz) < 7.45);
  const inPortal = rooms.some(room => Math.abs(x - room.cx) < 1.82 && Math.abs(z - (room.row === 'north' ? -5 : 5)) < .75);
  return inConcourse || inGallery || inPortal;
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
      // Resolve axes independently so the visitor slides along walls instead of sticking.
      const resolvedX = isWalkable(next.x, old.z) ? next.x : old.x;
      const resolvedZ = isWalkable(resolvedX, next.z) ? next.z : old.z;
      camera.setPosition(resolvedX, EYE_HEIGHT, resolvedZ);
    }
  }
  const position = camera.getPosition();
  const occupiedRoom = rooms.findIndex(room => Math.abs(position.x - room.cx) < ROOM_HALF_WIDTH && Math.abs(position.z - room.cz) < ROOM_HALF_DEPTH);
  if (occupiedRoom >= 0 && occupiedRoom !== currentRoom) setRoom(occupiedRoom);
  updateCard();
});

setRoom(0, true);
Promise.all(textureJobs).finally(() => {
  setTimeout(() => document.querySelector('#loading')?.classList.add('done'), 350);
});

// Exposed only for deterministic layout and smoke tests.
const testWindow = window as unknown as {
  museumReady: boolean;
  museumLayout: { doorwayViolations: ReturnType<typeof findDoorwayViolations>; topology: 'concourse'; roomCount: number };
};
testWindow.museumReady = true;
testWindow.museumLayout = { doorwayViolations, topology: 'concourse', roomCount: rooms.length };
