import * as pc from 'playcanvas';
import './style.css';

type Work = { title: string; artist: string; year: number; medium: string; image: string };
type Gallery = {
  title: string;
  heading: string;
  note: string;
  sign: string;
  accent: string;
  wall: string;
  works: Work[];
};

const galleries: Gallery[] = [
  {
    title: 'Portraits and Personages',
    heading: 'Portraits &<br><em>Personages</em>',
    note: 'Portraiture records the ordinary negotiations between a sitter and a painter: posture, costume, rank and the occasional private joke. This room brings together public likenesses and family pictures from three centuries.',
    sign: 'Public likenesses, family pictures and studies of office. Notice how costume does as much biographical work as the face.',
    accent: '#d7ff43', wall: '#827d6f',
    works: [
      { title: 'Marchioness in Winter Dress', artist: 'Elian Voss', year: 1768, medium: 'Oil and wax on linen', image: '/art/portraits-1.webp' },
      { title: 'Blackhorn, on Leave', artist: 'Mara Bell', year: 1804, medium: 'Oil on oak panel', image: '/art/portraits-2.webp' },
      { title: 'Study in Saffron (Lady Ada)', artist: 'Niko Sayer', year: 1891, medium: 'Oil on silk-faced canvas', image: '/art/portraits-3.webp' },
      { title: 'The Envoy', artist: 'Hester Vale', year: 1742, medium: 'Oil on prepared linen', image: '/art/portraits-4.webp' },
      { title: 'Capybara at Le Havre', artist: 'Tomás Venn', year: 1887, medium: 'Oil on canvas', image: '/art/portraits-5.webp' },
      { title: 'Justice at Midnight', artist: 'Iona Rook', year: 1913, medium: 'Oil and charcoal on canvas', image: '/art/portraits-6.webp' },
      { title: 'Young Heir with Blue Ribbon', artist: 'Adele North', year: 1785, medium: 'Oil over gesso', image: '/art/portraits-7.webp' },
      { title: 'Two Sisters, Blue Room', artist: 'Sami Orra', year: 1956, medium: 'Oil on linen', image: '/art/portraits-8.webp' },
      { title: 'Highland Crown', artist: 'Cora Pike', year: 1849, medium: 'Oil on coarse canvas', image: '/art/portraits-9.webp' }
    ]
  },
  {
    title: 'Domestic Arrangements',
    heading: 'Domestic<br><em>Arrangements</em>',
    note: 'A home is a set of agreements between useful things and the rooms that hold them. The paintings here follow seven objects through changes of light, weather and address without questioning their essential practicality.',
    sign: 'Seven household objects, shown in use or between uses. Their settings have changed; their purposes remain reassuringly specific.',
    accent: '#75d6df', wall: '#667477',
    works: [
      { title: 'Telephone, Low Tide', artist: 'June Halberd', year: 1972, medium: 'Oil and enamel on board', image: '/art/objects-1.webp' },
      { title: 'Chair Waiting', artist: 'M. E. Lorne', year: 1948, medium: 'Oil on scraped canvas', image: '/art/objects-3.webp' },
      { title: 'Weather House (Blue)', artist: 'Pavel Miro', year: 1986, medium: 'Oil and casein on linen', image: '/art/objects-4.webp' },
      { title: 'Breakfast Piece with Moss', artist: 'Anouk Field', year: 2001, medium: 'Oil on panel', image: '/art/objects-5.webp' },
      { title: 'Crossing No. 4', artist: 'Dev Malik', year: 1963, medium: 'Oil and graphite on canvas', image: '/art/objects-7.webp' },
      { title: 'Refrigerator in the Water Garden', artist: 'Lena Quist', year: 1994, medium: 'Oil on open-weave linen', image: '/art/objects-8.webp' },
      { title: 'Red Shoe Reliquary', artist: 'O. S. Fen', year: 1937, medium: 'Oil, bole and wax on wood', image: '/art/objects-9.webp' }
    ]
  },
  {
    title: 'Views from the Outer Counties',
    heading: 'The Outer<br><em>Counties</em>',
    note: 'These landscapes were made beyond the last familiar railway stop, where salt flats, mangroves and civic engineering meet. As in any regional survey, the artists disagree about what deserves the foreground.',
    sign: 'A regional survey of roads, settlements and cultivated land beyond the metropolitan edge. Routes are approximate.',
    accent: '#ff8b63', wall: '#75695f',
    works: [
      { title: 'Salt Moon from the East Road', artist: 'Ruth Kael', year: 1876, medium: 'Oil and pumice on linen', image: '/art/worlds-1.webp' },
      { title: 'Mangrove Machines', artist: 'Elián Moss', year: 1928, medium: 'Oil on canvas', image: '/art/worlds-2.webp' },
      { title: 'Ascending City, Late Afternoon', artist: 'Jo Pell', year: 1951, medium: 'Oil over copper ground', image: '/art/worlds-3.webp' },
      { title: 'Black Tide / White Towers', artist: 'Nara Venn', year: 1979, medium: 'Oil on fine linen', image: '/art/worlds-4.webp' },
      { title: 'Permanent Way (Solar Study)', artist: 'Arun West', year: 1934, medium: 'Oil and ochre on canvas', image: '/art/worlds-5.webp' },
      { title: 'Cobalt Archive', artist: 'Mina Søl', year: 2008, medium: 'Oil and cold wax on panel', image: '/art/worlds-6.webp' },
      { title: 'Rosewater Regatta', artist: 'Cyra Bell', year: 1862, medium: 'Oil on sailcloth', image: '/art/worlds-7.webp' },
      { title: 'Weather over Obsidian', artist: 'Peter Ash', year: 1819, medium: 'Oil and asphaltum on linen', image: '/art/worlds-8.webp' },
      { title: 'Seed Station', artist: 'Alma Reed', year: 2020, medium: 'Oil on rough linen', image: '/art/worlds-9.webp' }
    ]
  },
  {
    title: 'A Brief History of Weather',
    heading: 'A Brief History<br>of <em>Weather</em>',
    note: 'Weather enters daily life as forecast, inconvenience and conversation. These five studies document several well-observed local conditions, including seated thunder, hesitant rain and an unusually sociable bank of fog.',
    sign: 'Five local weather records. Dates refer to observation, not completion; conditions may have moved on since.',
    accent: '#a9c9ff', wall: '#69737d',
    works: [
      { title: 'Storm on a Dining Chair', artist: 'Celia Wren', year: 1922, medium: 'Oil on soft-ground canvas', image: '/art/weather-1.webp' },
      { title: 'Barometric Procession, 6:40 p.m.', artist: 'Hugh Iver', year: 1884, medium: 'Oil and chalk on linen', image: '/art/weather-2.webp' },
      { title: 'Rain Study II', artist: 'Mae Tan', year: 1967, medium: 'Glazed oil on canvas', image: '/art/weather-3.webp' },
      { title: 'Four Small Storms, Orchard', artist: 'Orla Finch', year: 2006, medium: 'Oil on jute', image: '/art/weather-4.webp' },
      { title: 'Supper with Sea Fog', artist: 'Benoit Grey', year: 1941, medium: 'Oil and silver leaf on panel', image: '/art/weather-5.webp' }
    ]
  },
  {
    title: 'The Working Day',
    heading: 'The Working<br><em>Day</em>',
    note: 'Work is most visible in its repetition. Watering, mending, folding, baking and roadside repair appear here not as symbols but as skilled jobs, carried out by experienced hands on otherwise unremarkable days.',
    sign: 'Five scenes of maintenance and service work. Tools are arranged by task; breaks are taken when circumstances permit.',
    accent: '#ffd36a', wall: '#7a6d59',
    works: [
      { title: 'Ironing', artist: 'Edith Lark', year: 1910, medium: 'Oil on warm-toned linen', image: '/art/gods-1.webp' },
      { title: 'Watering, Third Floor', artist: 'Noor Bay', year: 1998, medium: 'Oil on canvas', image: '/art/gods-2.webp' },
      { title: 'Roadside Assistance, 2:13 a.m.', artist: 'Cal Mercer', year: 1975, medium: 'Oil and wax on linen', image: '/art/gods-3.webp' },
      { title: 'Mending Basket (One Missing)', artist: 'Florence Pike', year: 1932, medium: 'Oil on burlap', image: '/art/gods-4.webp' },
      { title: 'Before the First Loaf', artist: 'Kavi North', year: 1869, medium: 'Oil and gold ground on wood', image: '/art/gods-5.webp' }
    ]
  },
  {
    title: 'The Garden at Night',
    heading: 'The Garden<br><em>at Night</em>',
    note: 'Six botanical studies record the garden after closing, when night-blooming plants, seed fruit and pollinating moths continue their usual work. Strong color preserves details that low light might otherwise conceal.',
    sign: 'Nocturnal specimens from one enclosed garden. Color has been adjusted for legibility; flowering times are recorded in the labels.',
    accent: '#ff77b7', wall: '#594d67',
    works: [
      { title: 'Moonflower, 11:52 p.m.', artist: 'Iris Okafor', year: 2018, medium: 'Oil and alkyd on linen', image: '/art/night-garden-1.webp' },
      { title: 'Foxglove Signal', artist: 'Ren Ito', year: 2021, medium: 'Knife-work oil on canvas', image: '/art/night-garden-2.webp' },
      { title: 'Blue Lotus / Tidal Clock', artist: 'Sora Bell', year: 2019, medium: 'Raised oil on panel', image: '/art/night-garden-3.webp' },
      { title: 'Fern after Lightning', artist: 'Mara Quill', year: 2023, medium: 'Oil and charcoal on dark ground', image: '/art/night-garden-4.webp' },
      { title: 'Pomegranates, Late', artist: 'Yasmin Dey', year: 2020, medium: 'Oil on woven canvas', image: '/art/night-garden-5.webp' },
      { title: 'Moth Pollination Study', artist: 'Leo Amari', year: 2024, medium: 'Oil and wax relief on linen', image: '/art/night-garden-6.webp' }
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
const stoneMat = material('Honzed limestone', '#aaa18f', { gloss: .16 });
const deskMat = material('Information desk oak', '#6b4931', { gloss: .42 });
const planterMat = material('Terracotta planter', '#75513e', { gloss: .2 });
const leafMat = material('Plant leaves', '#41513c', { gloss: .24 });
const sculptureMat = material('Concourse sculpture', '#b8aa91', { metal: .12, gloss: .5 });
const frameMaterials = [brassMat, darkMat, oakMat, paleWoodMat, blackFrameMat];

function box(name: string, position: pc.Vec3, scale: pc.Vec3, mat: pc.Material, parent?: pc.Entity) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type: 'box', material: mat });
  e.setLocalPosition(position);
  e.setLocalScale(scale);
  (parent ?? app.root).addChild(e);
  return e;
}

function primitive(name: string, type: 'cylinder' | 'sphere' | 'cone', position: pc.Vec3, scale: pc.Vec3, mat: pc.Material) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type, material: mat });
  e.setPosition(position);
  e.setLocalScale(scale);
  app.root.addChild(e);
  return e;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function canvasMaterial(name: string, title: string, room: number, vertical = false) {
  const canvas = document.createElement('canvas');
  canvas.width = vertical ? 600 : 1200;
  canvas.height = vertical ? 760 : 280;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#e7e0d2';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = galleries[room].accent;
  context.fillRect(0, 0, vertical ? 18 : 22, canvas.height);
  context.fillStyle = '#1d1b17';
  context.font = vertical ? '500 25px Arial' : '500 25px Arial';
  context.letterSpacing = '4px';
  context.fillText(`GALLERY ${String(room + 1).padStart(2, '0')}`, vertical ? 58 : 55, vertical ? 75 : 62);
  context.letterSpacing = '0px';
  context.font = vertical ? '500 62px Georgia' : '500 70px Georgia';
  const lines = wrapText(context, title, vertical ? 480 : 1010);
  lines.slice(0, vertical ? 4 : 2).forEach((line, index) => context.fillText(line, vertical ? 58 : 55, (vertical ? 175 : 153) + index * (vertical ? 72 : 76)));
  if (vertical) {
    context.fillStyle = '#5f594f';
    context.font = '500 19px Arial';
    context.letterSpacing = '3px';
    context.fillText('ROOM GUIDE', 58, 610);
    context.letterSpacing = '0px';
    context.font = '400 21px Georgia';
    context.fillText('Look here for an introduction', 58, 665);
    context.fillText('to the room.', 58, 696);
  }
  const texture = new pc.Texture(app.graphicsDevice, {
    width: canvas.width,
    height: canvas.height,
    mipmaps: true,
    minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
    magFilter: pc.FILTER_LINEAR,
    anisotropy: 8
  });
  texture.setSource(canvas);
  const signMat = new pc.StandardMaterial();
  signMat.name = name;
  signMat.diffuse = new pc.Color(1, 1, 1);
  signMat.diffuseMap = texture;
  signMat.emissive = new pc.Color(.18, .18, .18);
  signMat.emissiveMap = texture;
  signMat.emissiveIntensity = .35;
  signMat.gloss = .12;
  signMat.update();
  return signMat;
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

// Everyday public furniture makes the concourse feel occupied without blocking
// the six direct routes between opposite galleries.
box('Information desk', new pc.Vec3(-7, .72, 0), new pc.Vec3(4.2, 1.22, 1.05), deskMat);
box('Information desk counter', new pc.Vec3(-7, 1.42, -.08), new pc.Vec3(4.55, .18, 1.3), stoneMat);
box('Information desk inset', new pc.Vec3(-7, .78, .55), new pc.Vec3(2.1, .52, .05), brassMat);
primitive('Desk lamp', 'sphere', new pc.Vec3(-8.25, 1.7, 0), new pc.Vec3(.25, .14, .25), brassMat);
box('Concourse sculpture plinth', new pc.Vec3(7, .42, 0), new pc.Vec3(1.45, .84, 1.45), stoneMat);
primitive('Sculpture lower stone', 'sphere', new pc.Vec3(6.85, 1.38, 0), new pc.Vec3(.72, .72, .72), sculptureMat);
primitive('Sculpture brass axis', 'cylinder', new pc.Vec3(7.18, 2.05, 0), new pc.Vec3(.18, 1.55, .18), brassMat).setEulerAngles(0, 0, -18);
primitive('Sculpture upper stone', 'sphere', new pc.Vec3(7.46, 2.65, 0), new pc.Vec3(.48, .48, .48), sculptureMat);

function addPlanter(x: number, z: number) {
  primitive('Concourse planter', 'cylinder', new pc.Vec3(x, .48, z), new pc.Vec3(.75, .95, .75), planterMat);
  primitive('Planter foliage', 'sphere', new pc.Vec3(x, 1.3, z), new pc.Vec3(1.05, .8, 1.05), leafMat);
  primitive('Planter foliage', 'sphere', new pc.Vec3(x - .38, 1.64, z + .08), new pc.Vec3(.55, .72, .55), leafMat);
}
addPlanter(-20.25, -3.2);
addPlanter(-20.25, 3.2);
addPlanter(20.25, -3.2);
addPlanter(20.25, 3.2);
box('West concourse bench', new pc.Vec3(-19.8, .62, 0), new pc.Vec3(.72, .24, 3.1), benchMat);
box('West bench support', new pc.Vec3(-19.8, .3, 0), new pc.Vec3(.5, .58, .35), brassMat);
box('East concourse bench', new pc.Vec3(19.8, .62, 0), new pc.Vec3(.72, .24, 3.1), benchMat);
box('East bench support', new pc.Vec3(19.8, .3, 0), new pc.Vec3(.5, .58, .35), brassMat);
box('Concourse directory', new pc.Vec3(14.9, 1.45, 2.9), new pc.Vec3(1.25, 2.65, .18), darkMat);
box('Directory brass header', new pc.Vec3(14.9, 2.48, 2.78), new pc.Vec3(1.05, .12, .08), brassMat);

const guideTargets: { room: number; position: pc.Vec3 }[] = [];

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

  const exteriorSignZ = innerZ + (row === 'north' ? .23 : -.23);
  const exteriorSignX = cx + (row === 'north' ? 3.75 : -3.75);
  box(`${galleries[index].title} entrance sign`, new pc.Vec3(exteriorSignX, 3.15, exteriorSignZ), new pc.Vec3(3.25, .76, .1), canvasMaterial(`Gallery ${index + 1} entrance lettering`, galleries[index].title, index));

  const guideX = cx + (row === 'north' ? 3.85 : -3.85);
  const guideZ = innerZ + (row === 'north' ? -1.7 : 1.7);
  box(`Gallery ${index + 1} guide sign`, new pc.Vec3(guideX, 1.7, guideZ), new pc.Vec3(1.35, 1.72, .1), canvasMaterial(`Gallery ${index + 1} guide lettering`, galleries[index].title, index, true));
  box('Guide sign post', new pc.Vec3(guideX, .66, guideZ), new pc.Vec3(.09, .55, .09), brassMat);
  box('Guide sign foot', new pc.Vec3(guideX, .22, guideZ), new pc.Vec3(.72, .08, .48), brassMat);
  guideTargets.push({ room: index, position: new pc.Vec3(guideX, 1.72, guideZ + (row === 'north' ? .15 : -.15)) });

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
let collectionOpen = false;
let lastCard = '';
let lastGuide = -1;
const held = new Set<string>();

window.addEventListener('keydown', e => {
  held.add(e.code);
  if (e.code === 'Escape' && collectionOpen) setCollectionOpen(false);
});
window.addEventListener('keyup', e => held.delete(e.code));
canvas.addEventListener('click', () => { if (!panelOpen && !collectionOpen && document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
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
const galleryGuide = document.querySelector<HTMLElement>('#gallery-guide')!;
const collection = document.querySelector<HTMLElement>('#collection')!;
const collectionGrid = document.querySelector<HTMLElement>('#collection-grid')!;
const collectionFilters = document.querySelector<HTMLElement>('#collection-filters')!;
const collectionToggle = document.querySelector<HTMLButtonElement>('#collection-toggle')!;
const collectionTotal = document.querySelector<HTMLElement>('#collection-total')!;
const root = document.documentElement;

const collectionWorks = galleries.flatMap((gallery, room) => gallery.works.map((work, workIndex) => ({ gallery, room, work, workIndex })));
let collectionFilter = -1;

function renderCollection() {
  const visible = collectionWorks.filter(entry => collectionFilter < 0 || entry.room === collectionFilter);
  collectionTotal.textContent = String(visible.length);
  collectionGrid.innerHTML = visible.map(({ gallery, room, work, workIndex }) => `
    <article class="collection-card" style="--card-accent:${gallery.accent}">
      <div class="collection-art"><img src="${work.image}" alt="${work.title}" loading="lazy"></div>
      <div class="collection-meta"><span>0${room + 1} · ${String(workIndex + 1).padStart(2, '0')}</span><span>${gallery.title}</span></div>
      <h2>${work.title}</h2>
      <p class="collection-artist">${work.artist}, ${work.year}</p>
      <p class="collection-medium">${work.medium}</p>
      <button data-visit-room="${room}" data-visit-work="${workIndex}">View in room <span>→</span></button>
    </article>`).join('');
  collectionGrid.querySelectorAll<HTMLButtonElement>('[data-visit-work]').forEach(button => button.addEventListener('click', () => {
    visitArtwork(Number(button.dataset.visitRoom), Number(button.dataset.visitWork));
  }));
}

collectionFilters.innerHTML = [
  '<button class="active" data-filter="-1">All galleries</button>',
  ...galleries.map((gallery, room) => `<button data-filter="${room}"><span>0${room + 1}</span>${gallery.title}</button>`)
].join('');
collectionFilters.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.addEventListener('click', () => {
  collectionFilter = Number(button.dataset.filter);
  collectionFilters.querySelectorAll('button').forEach(candidate => candidate.classList.toggle('active', candidate === button));
  renderCollection();
  collection.scrollTo({ top: 0, behavior: 'smooth' });
}));

function setCollectionOpen(open: boolean) {
  collectionOpen = open;
  collection.classList.toggle('open', open);
  collection.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('collection-open', open);
  collectionToggle.setAttribute('aria-expanded', String(open));
  collectionToggle.querySelector('b')!.textContent = open ? 'Museum' : 'Collection';
  collectionToggle.querySelector('.grid-icon')!.textContent = open ? '◫' : '▦';
  if (open) {
    artCard.classList.remove('visible');
    document.exitPointerLock?.();
  }
}
collectionToggle.addEventListener('click', () => setCollectionOpen(!collectionOpen));
renderCollection();

function visitArtwork(roomIndex: number, workIndex: number) {
  const hanging = hangingPlans[roomIndex][workIndex];
  const viewingDistance = Math.max(2.8, hanging.height * .82);
  const position = wallTransform(roomIndex, { ...hanging, centerY: EYE_HEIGHT }, .47 + viewingDistance).position;
  const wallYaw: Record<Wall, number> = { north: 0, south: 180, west: 90, east: -90 };

  setCollectionOpen(false);
  setRoom(roomIndex);
  camera.setPosition(position);
  yaw = wallYaw[hanging.wall];
  pitch = Math.atan2(hanging.centerY - EYE_HEIGHT, viewingDistance) * 180 / Math.PI;
  panelOpen = false;
  curator.classList.add('hidden');
  lastCard = '';
  canvas.focus();
  canvas.requestPointerLock?.();
}

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
  const years = gallery.works.map(work => work.year);
  footerCounts[1].textContent = `${Math.min(...years)}–${Math.max(...years)}`;
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

function updateGuide() {
  if (panelOpen || collectionOpen) {
    galleryGuide.classList.remove('visible');
    galleryGuide.setAttribute('aria-hidden', 'true');
    return false;
  }
  const target = guideTargets.find(guide => guide.room === currentRoom);
  if (!target) return false;
  const towardSign = target.position.clone().sub(camera.getPosition());
  const distance = towardSign.length();
  const visible = distance < 5.4 && towardSign.normalize().dot(camera.forward) > .94;
  galleryGuide.classList.toggle('visible', visible);
  galleryGuide.setAttribute('aria-hidden', String(!visible));
  if (visible && lastGuide !== currentRoom) {
    const gallery = galleries[currentRoom];
    galleryGuide.querySelector<HTMLElement>('#gallery-guide-number')!.textContent = String(currentRoom + 1).padStart(2, '0');
    galleryGuide.querySelector<HTMLElement>('#gallery-guide-title')!.textContent = gallery.title;
    galleryGuide.querySelector<HTMLElement>('#gallery-guide-copy')!.textContent = gallery.sign;
    lastGuide = currentRoom;
  }
  return visible;
}

function updateCard(guideVisible: boolean) {
  const p = camera.getPosition();
  if (panelOpen || collectionOpen || guideVisible) { artCard.classList.remove('visible'); return; }
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
    artCard.querySelector<HTMLElement>('.art-artist')!.textContent = `${work.artist}, ${work.year}`;
    artCard.querySelector<HTMLElement>('.art-medium')!.textContent = work.medium;
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
  if (!panelOpen && !collectionOpen) {
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
  const guideVisible = updateGuide();
  updateCard(guideVisible);
});

setRoom(0, true);
Promise.all(textureJobs).finally(() => {
  setTimeout(() => document.querySelector('#loading')?.classList.add('done'), 350);
});

// Exposed only for deterministic layout and smoke tests.
const testWindow = window as unknown as {
  museumReady: boolean;
  museumLayout: { doorwayViolations: ReturnType<typeof findDoorwayViolations>; topology: 'concourse'; roomCount: number; guideCount: number; concourseFeatureGroups: number };
  museumViewGuide: (room: number) => void;
};
testWindow.museumReady = true;
testWindow.museumLayout = { doorwayViolations, topology: 'concourse', roomCount: rooms.length, guideCount: guideTargets.length, concourseFeatureGroups: 8 };
testWindow.museumViewGuide = (roomIndex: number) => {
  const target = guideTargets[roomIndex];
  const placement = rooms[roomIndex];
  setRoom(roomIndex);
  panelOpen = false;
  curator.classList.add('hidden');
  camera.setPosition(target.position.x, EYE_HEIGHT, target.position.z + (placement.row === 'north' ? -2.6 : 2.6));
  yaw = placement.row === 'north' ? 180 : 0;
  pitch = 3;
};
