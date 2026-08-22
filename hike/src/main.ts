import "./style.css";

type StyleKey = "paper" | "pixel";
type Surprise = {
  id: string;
  x: number;
  title: string;
  note: string;
  tone: "trail" | "odd";
};

type Palette = {
  sky: string;
  sun: string;
  far: string;
  mid: string;
  near: string;
  ground: string;
  path: string;
  ink: string;
  accent: string;
  accent2: string;
  paper: string;
  shadow: string;
};

// A new trail moment arrives roughly every 13 seconds at the natural walking pace.
// Familiar sightings establish a believable hike; odd ones keep the player watching.
const surprises: Surprise[] = [
  { id: "marker", x: 38, title: "Blue Blaze", note: "Still on the trail. Always nice to know.", tone: "trail" },
  { id: "mushrooms", x: 70, title: "After-Rain Mushrooms", note: "A small red village under the ferns.", tone: "trail" },
  { id: "cloud", x: 102, title: "Forecast: Unlikely", note: "A cloud tied itself into a perfect square.", tone: "odd" },
  { id: "squirrel", x: 134, title: "Red Squirrel", note: "It objects to your route, loudly and at length.", tone: "trail" },
  { id: "bird", x: 166, title: "A Party of One", note: "One very small bird. One extremely large opinion.", tone: "odd" },
  { id: "creek", x: 198, title: "Cold Creek", note: "Snowmelt running clear over dark stones.", tone: "trail" },
  { id: "trash", x: 230, title: "Trail Custodian", note: "You packed out what someone else packed in.", tone: "trail" },
  { id: "deer", x: 262, title: "Between the Trees", note: "A deer watches until you remember to stand still.", tone: "trail" },
  { id: "twins", x: 294, title: "Copy / Paste", note: "Two identical trees, right down to the last needle.", tone: "odd" },
  { id: "cairn", x: 326, title: "Cairn", note: "Five patient stones point toward the next bend.", tone: "trail" },
  { id: "door", x: 358, title: "Unreasonably Small Door", note: "You knocked. Something much smaller knocked back.", tone: "odd" },
  { id: "flowers", x: 390, title: "Paintbrush Patch", note: "A pocket of red survives beneath the old growth.", tone: "trail" },
  { id: "choir", x: 422, title: "The Stone Choir", note: "Their encore may take several geological eras.", tone: "odd" },
  { id: "fox", x: 454, title: "Fox at Dusk", note: "A copper tail slips quietly into the fog.", tone: "trail" },
  { id: "waterfall", x: 486, title: "Uphill Waterfall", note: "Every drop is determined to see the summit.", tone: "odd" },
  { id: "bridge", x: 518, title: "Log Crossing", note: "Three careful steps over a very determined stream.", tone: "trail" },
  { id: "moth", x: 550, title: "Moon, Pocket-Sized", note: "The moth carried a tiny moon away on its wings.", tone: "odd" },
  { id: "marmot", x: 582, title: "Marmot Lookout", note: "The mountain's roundest ranger checks your permit.", tone: "trail" },
  { id: "teatable", x: 614, title: "Tea for Nobody", note: "The cup is warm. The chair is still pulling itself out.", tone: "odd" },
  { id: "lake", x: 646, title: "Alpine Tarn", note: "A piece of sky resting between the rocks.", tone: "trail" },
  { id: "boot", x: 678, title: "The Other Hiker", note: "A lone boot continues upward without complaint.", tone: "odd" },
  { id: "flag", x: 706, title: "Summit Marker", note: "Wind, snow, and one last bright scrap of red.", tone: "trail" },
];

const styleInfo: Record<StyleKey, { name: string; subtitle: string; swatch: string }> = {
  paper: { name: "Cut Paper", subtitle: "warm layers & soft shadows", swatch: "linear-gradient(145deg,#e9b65f 0 42%,#698761 43% 67%,#fff3d4 68%)" },
  pixel: { name: "Pocket Hike", subtitle: "bright 16-bit wilderness", swatch: "linear-gradient(135deg,#75cbe8 0 40%,#397657 41% 62%,#f5d67b 63%); image-rendering:pixelated" },
};

const palettes: Record<StyleKey, Palette> = {
  paper: { sky: "#e9b65f", sun: "#fff2c7", far: "#d9c78f", mid: "#93a478", near: "#627f60", ground: "#aaa378", path: "#eadbb4", ink: "#26382f", accent: "#d84f3f", accent2: "#4e7583", paper: "#fff8e7", shadow: "rgba(45,52,38,.18)" },
  pixel: { sky: "#75cbe8", sun: "#fff0a8", far: "#8ab4a0", mid: "#568d72", near: "#35664f", ground: "#6d8b54", path: "#e8c979", ink: "#172d32", accent: "#d94c45", accent2: "#277a85", paper: "#fff3c4", shadow: "rgba(23,45,50,.24)" },
};

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="game" data-style="paper">
    <canvas aria-label="A winding mountain trail"></canvas>
    <header class="brand"><h1>Hike.</h1></header>
    <div class="top-controls">
      <button class="icon-button music" aria-label="Turn music on" title="Music">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
      </button>
      <button class="style-toggle" aria-expanded="false"><span>Art</span><strong>Cut Paper</strong></button>
    </div>
    <section class="style-panel" hidden>
      <div class="label">Choose an art treatment</div>
      ${Object.entries(styleInfo).map(([key, info]) => `<button class="style-option${key === "paper" ? " active" : ""}" data-key="${key}"><span class="swatch" style="${info.swatch}"></span><span><b>${info.name}</b><span>${info.subtitle}</span></span></button>`).join("")}
    </section>
    <div class="progress-wrap" aria-label="Hike progress">
      <div class="progress-track"><div class="progress-fill"></div></div>
      <div class="progress-caption"><span class="biome-label">young woods</span> · <span class="percent">0%</span></div>
    </div>
    <button class="walk-button" aria-label="Hold to hike">
      <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4c2 5 2 10 0 14-1 2 0 5 3 6 3 1 7-1 8-4 1-2-1-3-3-4-2-1-2-4-1-7l1-5"/><path d="M18 7c4 1 7 4 8 8 1 3-1 6-4 6h-4M8 14h7"/></svg>
      <span>hold</span>
    </button>
    <div class="prompt"><strong>Hold to hike.</strong></div>
    <aside class="toast" aria-hidden="true"><div class="toast-icon">✦</div><small>Noticed</small><b></b><p></p></aside>
    <section class="finish-card" hidden>
      <div class="eyebrow">Summit log</div>
      <h2>You made it.</h2>
      <p>You walked 720 metres from the young woods to the snowline.</p>
      <button class="again">Hike it again</button>
    </section>
  </main>`;

const game = document.querySelector<HTMLElement>(".game")!;
const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const ctx = canvas.getContext("2d")!;
const pixelCanvas = document.createElement("canvas");
const pixelCtx = pixelCanvas.getContext("2d")!;
const walkButton = document.querySelector<HTMLButtonElement>(".walk-button")!;
const prompt = document.querySelector<HTMLElement>(".prompt")!;
const toast = document.querySelector<HTMLElement>(".toast")!;
const progressFill = document.querySelector<HTMLElement>(".progress-fill")!;
const progressCaption = document.querySelector<HTMLElement>(".progress-caption .percent")!;
const biomeLabel = document.querySelector<HTMLElement>(".biome-label")!;
const stylePanel = document.querySelector<HTMLElement>(".style-panel")!;
const styleToggle = document.querySelector<HTMLButtonElement>(".style-toggle")!;
const musicButton = document.querySelector<HTMLButtonElement>(".music")!;
const finishCard = document.querySelector<HTMLElement>(".finish-card")!;

let width = 0;
let height = 0;
let dpr = 1;
let style: StyleKey = "paper";
let progress = 0;
let displayProgress = 0;
let walking = false;
let lastTime = performance.now();
let elapsed = 0;
let toastTimer = 0;
let completed = new Set<string>();
let targets: { id: string; x: number; y: number; r: number }[] = [];
let musicOn = !new URLSearchParams(location.search).has("music") || new URLSearchParams(location.search).get("music") !== "off";
let audio: AudioContext | null = null;
let musicTimer = 0;
let noteIndex = 0;
let finished = false;
let debugSpeed = 1;
let pointerX = -100;
let pointerY = -100;
const debug = new URLSearchParams(location.search).get("debug") === "true";

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function seeded(n: number) {
  const x = Math.sin(n * 91.931 + 17.13) * 43758.5453;
  return x - Math.floor(x);
}

function elevation(x: number) {
  return x * .17 + Math.sin(x * .017) * 16 + Math.sin(x * .051) * 5;
}

const TRAIL_LENGTH = 720;
// Keep the original grounded walking pace; the shorter route makes one hike five minutes.
const WALK_SPEED = 1150 / (8 * 60);
function smoothstep(from: number, to: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}
function trailPhase(worldX: number) {
  const t = Math.max(0, Math.min(1, worldX / TRAIL_LENGTH));
  if (t < .24) return "young woods";
  if (t < .5) return "old-growth forest";
  if (t < .74) return "cloud forest";
  return "snowline";
}

// Three brief openings turn the distant mountain from wallpaper into a reward.
// Everywhere else, the next rise and the trees keep the hiker's sightline short.
const vistaStations = [207, 441, 636];
function vistaAmount(station = displayProgress) {
  return vistaStations.reduce((amount, centre) => Math.max(amount, 1 - smoothstep(18, 58, Math.abs(station - centre))), 0);
}
function cliffOpeningAmount(station: number) {
  return vistaStations.reduce((amount, centre) => Math.max(amount, 1 - smoothstep(38, 118, Math.abs(station - centre))), 0);
}

type Projected = { x: number; y: number; scale: number; depth: number; visible: boolean };

// A broad, hand-authored centreline makes each stretch of trail feel composed,
// while Catmull-Rom interpolation keeps the switchbacks from looking mechanical.
const routeTurns = [0, -18, 36, 78, 24, -64, -88, -6, 76, 98, 18, -82, -58, 42, 82, 12, -24];
function routeCenter(station: number) {
  const position = Math.max(0, Math.min(routeTurns.length - 1, station / TRAIL_LENGTH * (routeTurns.length - 1)));
  const i = Math.floor(position), t = position - i;
  const a = routeTurns[Math.max(0, i - 1)], b = routeTurns[i];
  const c = routeTurns[Math.min(routeTurns.length - 1, i + 1)], d = routeTurns[Math.min(routeTurns.length - 1, i + 2)];
  return .5 * ((2 * b) + (-a + c) * t + (2*a - 5*b + 4*c - d) * t*t + (-a + 3*b - 3*c + d) * t*t*t);
}
function routeSlope(station: number) { return (routeCenter(station + 1) - routeCenter(station - 1)) * .5; }
function project(station: number, lateral = 0, lift = 0): Projected {
  const cameraX = routeCenter(displayProgress), slope = routeSlope(displayProgress);
  const invLength = 1 / Math.hypot(slope, 1), tangentX = slope * invLength, tangentZ = invLength;
  // Lateral offsets live on the camera's cross-trail axis. Keeping them out of
  // depth prevents the outside bank from disappearing whenever the route turns.
  const relX = routeCenter(station) - cameraX + lateral * tangentZ;
  const relZ = station - displayProgress - lateral * tangentX;
  const depth = relX * tangentX + relZ * tangentZ;
  const sideways = relX * tangentZ - relZ * tangentX;
  const vista = vistaAmount();
  const focal = 150;
  const scale = focal / (focal + Math.max(-12, depth));
  const horizon = height * .405, near = height * .9;
  const rise = elevation(station) - elevation(displayProgress);
  const x = width * .5 + sideways * Math.min(4.25, width / 285) * scale;
  const y = horizon + (near - horizon) * scale - (rise * 1.35 + lift) * scale;
  const farClip = 330 + vista * 270;
  return { x, y, scale, depth, visible: depth > -18 && depth < farClip && x > -150 && x < width + 150 };
}

function line(points: [number, number][], close = false) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
}

function mountainLayer(base: number, amplitude: number, color: string, speed: number, jagged: number) {
  const points: [number, number][] = [[-20, height + 20]];
  const offset = displayProgress * speed;
  const step = style === "pixel" ? 34 : 70;
  for (let x = -40; x <= width + 80; x += step) {
    const world = x + offset;
    const rawY = base - Math.sin(world * .006) * amplitude - seeded(Math.floor(world / step) + jagged) * jagged;
    points.push([x, style === "pixel" ? Math.round(rawY / 5) * 5 : rawY]);
  }
  points.push([width + 20, height + 20]);
  line(points, true); ctx.fillStyle = color;
  if (style === "paper") { ctx.shadowColor = palettes[style].shadow; ctx.shadowOffsetY = -7; }
  ctx.fill(); ctx.shadowColor = "transparent";
}

function drawSky(p: Palette) {
  const vista = vistaAmount();
  ctx.fillStyle = p.sky; ctx.fillRect(0, 0, width, height);
  if (style === "pixel") {
    ctx.fillStyle = "rgba(255,255,255,.58)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 223 - displayProgress * .04) % (width + 180)) - 90, y = 55 + (i % 3) * 46;
      ctx.fillRect(Math.round(x), y, 72, 12); ctx.fillRect(Math.round(x + 14), y - 8, 34, 8);
    }
  }
  const sunX = width * .72 - displayProgress * .025, sunY = height * .18;
  if (style === "pixel") { ctx.fillStyle = p.sun; ctx.fillRect(Math.round(sunX - 28), Math.round(sunY - 28), 56, 56); }
  else { ctx.beginPath(); ctx.arc(sunX, sunY, Math.min(58, width * .075), 0, Math.PI * 2); ctx.fillStyle = p.sun; ctx.fill(); }

  // The route circles counterclockwise: the mountain stays close on the left.
  // Only a gap in the trees on the downhill (right) side reveals the range beyond.
  if (vista > .01) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(width * (.53 - vista * .05), height * .18);
    ctx.lineTo(width + 20, height * .18);
    ctx.lineTo(width + 20, height * .61);
    ctx.lineTo(width * (.58 - vista * .03), height * .57);
    ctx.closePath(); ctx.clip();
    ctx.globalAlpha = vista;
    mountainLayer(height * .39, height * .09, p.far, .035, 30);
    mountainLayer(height * .47, height * .105, p.mid, .07, 38);
    mountainLayer(height * .55, height * .115, p.near, .12, 46);
    ctx.restore();
  }

  // A close treeline—not another mountain ridge—seals the ordinary horizon.
  // Its crowns remain high on the uphill left and sink only on the cliff side.
  ctx.save(); ctx.fillStyle = style === "pixel" ? "#315b46" : "#526d54";
  const treeStep = style === "pixel" ? 24 : 30;
  const forestEdge: [number, number][] = [];
  for (let x = -treeStep; x <= width + treeStep; x += treeStep) {
    const onRight = smoothstep(width * .48, width, x);
    const base = height * (.54 + vista * onRight * .115);
    forestEdge.push([x, base]);
    const top = height * (.37 + seeded(Math.floor(x / treeStep) + Math.floor(displayProgress / 70)) * .095 + vista * onRight * .19);
    const treeHeight = base - top;
    for (let tier = 0; tier < 3; tier++) {
      const y = top + treeHeight * (.24 + tier * .24), spread = treeStep * (.37 + tier * .12);
      ctx.beginPath(); ctx.moveTo(x + treeStep * .5, y - treeHeight * .28); ctx.lineTo(x + treeStep * .5 - spread, y + treeHeight * .2); ctx.lineTo(x + treeStep * .5 + spread, y + treeHeight * .2); ctx.closePath(); ctx.fill();
    }
  }
  line([...forestEdge, [width + treeStep,height*.68],[-treeStep,height*.68]], true); ctx.fill();
  ctx.restore();
}

function trailRibbon(p: Palette) {
  const left: [number, number][] = [], right: [number, number][] = [], centre: [number, number][] = [];
  const maxDepth = 320 + vistaAmount() * 265;
  for (let d = -10; d <= maxDepth; d += 7) {
    const station = displayProgress + d, halfWidth = 7.2 + Math.sin(station * .031) * .7;
    const l = project(station, -halfWidth), r = project(station, halfWidth), c = project(station);
    if (l.depth > -16) { left.push([l.x,l.y]); right.push([r.x,r.y]); centre.push([c.x,c.y]); }
  }
  if (left.length < 2) return;
  const ribbon = [...left, ...right.reverse()];
  line(ribbon, true);
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7; }
  ctx.fillStyle = p.path; ctx.fill(); ctx.shadowColor = "transparent";
  ctx.strokeStyle = style === "pixel" ? "rgba(23,45,50,.28)" : "rgba(38,56,47,.18)";
  ctx.lineWidth = style === "pixel" ? 2 : 1.2; line(left); ctx.stroke(); line(right.reverse()); ctx.stroke();
  ctx.setLineDash(style === "pixel" ? [5,8] : [2,10]); ctx.lineWidth = 1; ctx.globalAlpha = .24; line(centre); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}

function drawGround(p: Palette) {
  const ridge: [number, number][] = [];
  const vista = vistaAmount();
  for (let x = -30; x <= width + 30; x += style === "pixel" ? 22 : 34) {
    const downhill = smoothstep(width * .5, width, x) * vista * height * .08;
    const y = height * .505 + downhill + Math.sin(x * .018 + displayProgress * .009) * 8 + (seeded(Math.floor(x / 34) + 99) - .5) * 10;
    ridge.push([x, style === "pixel" ? Math.round(y / 4) * 4 : y]);
  }
  line([...ridge, [width + 30,height + 30], [-30,height + 30]], true); ctx.fillStyle = p.ground;
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetY = -7; }
  ctx.fill(); ctx.shadowColor = "transparent";
  const snow = smoothstep(476, 588, displayProgress);
  if (snow > .01) { ctx.globalAlpha = snow * .88; ctx.fillStyle = style === "pixel" ? "#e8f1e8" : "#f8f5e9"; ctx.fillRect(0,height*.5,width,height*.5); ctx.globalAlpha = 1; }
}

function drawMountainShoulder(p: Palette) {
  const inner: [number, number][] = [], outer: [number, number][] = [];
  const maxDepth = 340 + vistaAmount() * 150;
  for (let d = -8; d <= maxDepth; d += 12) {
    const station = displayProgress + d;
    const edge = project(station, -10);
    const bank = project(station, -105, 32 + Math.sin(station * .028) * 7);
    if (edge.depth > -16) { inner.push([edge.x, edge.y]); outer.push([bank.x, bank.y]); }
  }
  if (inner.length < 2) return;
  ctx.save();
  ctx.fillStyle = style === "pixel" ? "#55744b" : "#87906a";
  line([...inner, ...outer.reverse()], true); ctx.fill();
  ctx.globalAlpha = style === "pixel" ? .28 : .18;
  ctx.strokeStyle = p.ink; ctx.lineWidth = style === "pixel" ? 2 : 1.2;
  for (let offset = -30; offset >= -90; offset -= 20) {
    const contour: [number, number][] = [];
    for (let d = 8; d <= maxDepth; d += 18) {
      const station = displayProgress + d;
      const point = project(station, offset, Math.abs(offset + 10) * .28);
      if (point.visible) contour.push([point.x, point.y]);
    }
    if (contour.length > 1) { line(contour); ctx.stroke(); }
  }
  ctx.restore();
}

function drawSlopeStrata(p: Palette) {
  const vista = vistaAmount();
  const maxDepth = 325 + vista * 190;
  ctx.save();
  for (let d = maxDepth; d >= 8; d -= 22) {
    const station = displayProgress + d;
    const next = station + 23;
    const widthAtDepth = 105 + d * .24;
    const a = project(station, -widthAtDepth), b = project(station, widthAtDepth);
    const c = project(next, widthAtDepth + 7), e = project(next, -widthAtDepth - 7);
    const tint = Math.floor(d / 22) % 2;
    ctx.globalAlpha = style === "pixel" ? .14 : .105;
    ctx.fillStyle = tint ? p.near : p.paper;
    line([[a.x,a.y],[b.x,b.y],[c.x,c.y],[e.x,e.y]], true); ctx.fill();
    ctx.globalAlpha = style === "pixel" ? .2 : .12;
    ctx.strokeStyle = p.ink; ctx.lineWidth = style === "pixel" ? 2 : 1;
    line([[a.x,a.y],[b.x,b.y]]); ctx.stroke();
  }
  ctx.restore();
}

function floorColors() {
  return style === "pixel"
    ? { litter: "#80633f", moss: "#3e704c", bark: "#503e2e", stone: "#788779", fern: "#2f6744" }
    : { litter: "#786744", moss: "#68795a", bark: "#4d4638", stone: "#828476", fern: "#557052" };
}

function drawTreeSprite(point: Projected, worldX: number, size: number, p: Palette, seed: number, alpha = 1) {
  if (!point.visible) return;
  const drawn = size * point.scale, lean = (seeded(seed) - .5) * 7;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(point.x, point.y); ctx.rotate(lean * Math.PI / 180);
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 4 * point.scale; ctx.shadowOffsetY = 5 * point.scale; }
  if (style === "pixel") {
    const unit = Math.max(1, Math.round(drawn / 15));
    ctx.fillStyle = "#5a4432"; ctx.fillRect(-unit, -drawn * .55, unit * 2, drawn * .58);
    ctx.fillStyle = seed % 2 ? p.near : p.mid;
    for (let i=0;i<4;i++){const yy=-drawn*(.35+i*.18),spread=Math.round(drawn*(.28-i*.04));ctx.fillRect(-spread,Math.round(yy),spread*2,unit*3);}
  } else {
    ctx.fillStyle = p.ink; ctx.fillRect(-1.5*point.scale,-drawn*.42,3*point.scale,drawn*.45);
    const tiers=3+Math.floor(seeded(seed+2)*2);
    for(let i=0;i<tiers;i++){const yy=-drawn*.35-i*drawn*.19,spread=drawn*(.27-i*.035);ctx.beginPath();ctx.moveTo(0,yy-drawn*.31);ctx.lineTo(-spread,yy+drawn*.13);ctx.lineTo(spread,yy+drawn*.13);ctx.closePath();ctx.fillStyle=i%2?p.near:p.mid;ctx.fill();}
  }
  const snow=smoothstep(476,576,worldX);
  if(snow>.03){ctx.globalAlpha=alpha*snow*.92;ctx.strokeStyle=style==="pixel"?"#edf6e8":"#faf8ef";ctx.lineWidth=Math.max(1,(style==="pixel"?4:size*.045)*point.scale);for(let i=0;i<4;i++){const yy=-drawn*(.28+i*.18),spread=drawn*(.2-i*.025);ctx.beginPath();ctx.moveTo(-spread,yy);ctx.lineTo(spread*.7,yy+1);ctx.stroke();}}
  ctx.restore(); ctx.globalAlpha=1; ctx.shadowColor="transparent";
}

function drawShrubSprite(point: Projected, size: number, p: Palette, seed: number) {
  if(!point.visible)return; const drawn=size*point.scale;
  ctx.save();ctx.translate(point.x,point.y);if(style==="paper"){ctx.shadowColor=p.shadow;ctx.shadowOffsetX=2*point.scale;ctx.shadowOffsetY=3*point.scale;}
  const leaves=3+Math.floor(seeded(seed+4)*4);
  for(let i=0;i<leaves;i++){const angle=-Math.PI+(i/Math.max(1,leaves-1))*Math.PI,lx=Math.cos(angle)*drawn*.42,ly=-Math.sin(angle)*drawn*.28-drawn*.18;ctx.fillStyle=i%2?p.near:p.mid;if(style==="pixel")ctx.fillRect(Math.round(lx-drawn*.18),Math.round(ly-drawn*.14),Math.max(1,Math.round(drawn*.36)),Math.max(1,Math.round(drawn*.24)));else{ctx.beginPath();ctx.ellipse(lx,ly,drawn*.24,drawn*.15,angle*.25,0,Math.PI*2);ctx.fill();}}
  ctx.restore();ctx.shadowColor="transparent";
}

function drawDetailSprite(point: Projected, worldX: number, p: Palette, seed: number) {
  if(!point.visible||point.scale<.24)return;const s=point.scale,snow=smoothstep(495,582,worldX);
  ctx.save();ctx.translate(point.x,point.y);ctx.scale(s,s);ctx.lineCap="round";
  if(seed%7===0){ctx.fillStyle=snow>.35?"#d7ddd5":p.near;if(style==="pixel")ctx.fillRect(-7,-4,14,5);else{ctx.beginPath();ctx.ellipse(0,-3,7+seeded(seed)*5,4+seeded(seed+2)*3,-.1,Math.PI,Math.PI*2);ctx.fill();}}
  else{ctx.strokeStyle=p.near;ctx.lineWidth=style==="pixel"?2:1.2;const blades=snow>.45?2:3+Math.abs(seed)%4;for(let i=0;i<blades;i++){const dx=(i-blades/2)*3;ctx.beginPath();ctx.moveTo(dx,0);ctx.lineTo(dx+(seeded(seed+i)-.5)*7,-(5+seeded(seed+i+8)*11)*(1-snow*.55));ctx.stroke();}if(snow<.18&&Math.abs(seed)%11===2){ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(0,-10,style==="pixel"?2.5:1.8,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}

function drawForestFloorSprite(point: Projected, worldX: number, seed: number, p: Palette) {
  if (!point.visible || point.scale < .18) return;
  const c = floorColors(), s = point.scale, kind = Math.abs(seed) % 6;
  ctx.save(); ctx.translate(point.x, point.y); ctx.scale(s, s); ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; }
  if (kind === 0) {
    // A fallen branch is a single cheap shape that makes the floor read as woodland.
    ctx.strokeStyle = c.bark; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-13,-2); ctx.quadraticCurveTo(0,-7,16,1); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4,-4); ctx.lineTo(9,-12); ctx.moveTo(-5,-4); ctx.lineTo(-9,-10); ctx.stroke();
  } else if (kind <= 2) {
    ctx.fillStyle = kind === 1 ? c.stone : c.moss;
    if (style === "pixel") ctx.fillRect(-7,-6,14,7);
    else { ctx.beginPath(); ctx.ellipse(0,-3,8+seeded(seed+2)*5,4+seeded(seed+3)*3,-.12,Math.PI,Math.PI*2); ctx.fill(); }
  } else if (kind === 3) {
    ctx.strokeStyle = c.fern; ctx.lineWidth = 1.5;
    for (let frond = -2; frond <= 2; frond++) {
      const tipX = frond * 7, tipY = -11 - Math.abs(frond) * 2;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(frond*2,-7,tipX,tipY); ctx.stroke();
      for (let leaf = 1; leaf < 4; leaf++) {
        const t = leaf / 4, x = tipX*t, y = tipY*t;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-4,y-3); ctx.moveTo(x,y); ctx.lineTo(x+4,y-3); ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = c.litter; ctx.globalAlpha = .72;
    for (let i=0;i<4;i++) {
      const x=(seeded(seed+i*3)-.5)*25,y=-seeded(seed+i*5+1)*5;
      if(style==="pixel")ctx.fillRect(Math.round(x),Math.round(y),3,2);else{ctx.beginPath();ctx.ellipse(x,y,4,1.5,(seeded(seed+i)-.5)*2,0,Math.PI*2);ctx.fill();}
    }
  }
  const snow = smoothstep(495,588,worldX);
  if (snow > .08) { ctx.globalAlpha = snow * .72; ctx.fillStyle = style === "pixel" ? "#e7efe5" : "#f4f1e4"; ctx.fillRect(-10,-4,20,3); }
  ctx.restore(); ctx.globalAlpha = 1; ctx.shadowColor = "transparent";
}

function drawLivingSlope(p: Palette) {
  drawSlopeStrata(p);
  trailRibbon(p);
  const items: { station:number; lateral:number; seed:number }[] = [];
  const start = Math.floor((displayProgress - 4) / 5);
  const end = Math.ceil((displayProgress + 335 + vistaAmount()*160) / 5);
  for (let i=start;i<=end;i++) {
    const station=i*5+(seeded(i+811)-.5)*4;
    if(station<2||station>TRAIL_LENGTH)continue;
    for(let side=-1;side<=1;side+=2) {
      if ((i + side) % 3 === 0 && seeded(i*3+side) < .28) continue;
      const lateral=side*(11+seeded(i*7+side*13)*96);
      items.push({station,lateral,seed:i*17+side*5});
    }
  }
  items.sort((a,b)=>b.station-a.station);
  for(const item of items)drawForestFloorSprite(project(item.station,item.lateral),item.station,item.seed,p);
}

function drawForest(p: Palette) {
  const items: { station:number; lateral:number; kind:"tree"|"shrub"|"detail"; size:number; seed:number }[]=[];
  const start=Math.floor((displayProgress-12)/9),end=Math.ceil((displayProgress+470+vistaAmount()*100)/9);
  for(let i=start;i<=end;i++){
    const station=i*9+(seeded(i+90)-.5)*6;
    if(station<2||station>TRAIL_LENGTH-5)continue;
    const high=smoothstep(550,700,station);
    for(let side=-1;side<=1;side+=2){
      const opening=side>0?cliffOpeningAmount(station):0;
      for(let row=0;row<3;row++){
        const seed=i*37+side*11+row*101;
        if(side>0&&opening>.12&&seeded(seed+77)<opening*(row?1:.88))continue;
        const lateral=side*(15+row*48+seeded(seed+12)*(row?38:20));
        if(station<640&&(station<560||seeded(seed+9)>.62)){
          const size=96+seeded(seed+4)*70+row*25-high*46;
          items.push({station:station+(seeded(seed)-.5)*5,lateral,kind:"tree",size,seed});
        } else if(station<670&&seeded(seed+3)>.45) {
          items.push({station,lateral,kind:"shrub",size:18+seeded(seed+8)*18,seed});
        }
      }
      items.push({station:station+2,lateral:side*(10+seeded(i+side*53)*58),kind:"detail",size:1,seed:i+side*17+700});
    }
  }
  items.sort((a,b)=>b.station-a.station);
  for(const item of items){
    const point=project(item.station,item.lateral);
    if(item.kind==="tree"){
      // Trees nearest the camera still frame the shot, but fade enough that the
      // hiker and the few metres of trail immediately around them remain legible.
      const nearFade=.16+.84*smoothstep(10,62,point.depth);
      const cliffWindow=vistaAmount()*smoothstep(width*.5,width*.72,point.x)*smoothstep(8,70,point.depth);
      const alpha=nearFade*(1-cliffWindow);
      if(alpha>.04)drawTreeSprite(point,item.station,item.size,p,item.seed,alpha);
    }else if(item.kind==="shrub")drawShrubSprite(point,item.size,p,item.seed);
    else drawDetailSprite(point,item.station,p,item.seed);
  }
}

function drawFog(p: Palette) {
  const fog=smoothstep(313,407,displayProgress)*(1-smoothstep(532,620,displayProgress));if(fog<.01)return;
  ctx.save();ctx.globalAlpha=fog*.24;ctx.fillStyle=style==="pixel"?"#e6f1e8":"#f5f1df";const drift=(elapsed*9)%180;
  if(style==="pixel"){for(let i=-1;i<6;i++)ctx.fillRect(i*190-drift,height*(.45+(i%3)*.07),160,18+(i%2)*12);}else{for(let i=-1;i<7;i++){const x=i*190-drift,y=height*(.42+(i%3)*.08);ctx.beginPath();ctx.ellipse(x,y,160,25+(i%2)*11,0,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}

function eventTarget(id: string, x: number, y: number, r = 30) { targets.push({ id, x, y, r }); }
function isFound(id: string) { return completed.has(id); }

const surpriseSides: Record<string, number> = {
  marker: -12, mushrooms: 14, trash: 10, squirrel: -16, bird: 14, creek: -3,
  cloud: 0, deer: -18, twins: 16, cairn: 13, door: -15, flowers: 17,
  choir: 11, fox: -17, waterfall: -14, bridge: 0, moth: 3, marmot: 16,
  teatable: -15, lake: 13, boot: -5, flag: 10,
};
function drawSurprise(s: Surprise, p: Palette) {
  if(isFound(s.id)||s.x<displayProgress-18||s.x>displayProgress+90)return;
  const lift=s.id==="cloud"?132:s.id==="moth"?94:0;
  const point=project(s.x,surpriseSides[s.id]??0,lift);
  if(!point.visible||point.scale<.28)return;
  const bob=Math.sin(elapsed*2.3+s.x)*2, sc=point.scale;
  let tx=point.x,ty=point.y-(s.id==="bird"?68*sc:0);

  if(s.id==="twins"){
    const first=project(s.x,13),second=project(s.x+3,21);
    drawTreeSprite(first,s.x,58,p,4242);drawTreeSprite(second,s.x+3,58,p,4242);
    tx=(first.x+second.x)/2;ty=Math.min(first.y,second.y)-44*sc;
  }else{
    ctx.save();ctx.translate(point.x,point.y);ctx.scale(sc,sc);ctx.lineJoin="round";ctx.lineCap="round";
    if(style==="paper"){ctx.shadowColor=p.shadow;ctx.shadowOffsetX=4;ctx.shadowOffsetY=5;}
    if(s.id==="marker"){
      ctx.fillStyle=p.ink;ctx.fillRect(-3,-54,6,56);ctx.fillStyle=p.paper;ctx.fillRect(-16,-53,32,23);ctx.strokeStyle=p.ink;ctx.lineWidth=1.5;ctx.strokeRect(-16,-53,32,23);ctx.fillStyle=p.accent2;ctx.fillRect(-12,-46,24,7);ty=point.y-42*sc;
    }else if(s.id==="mushrooms"){
      [-13,0,14].forEach((dx,i)=>{const h=13+i*5;ctx.fillStyle=p.paper;ctx.fillRect(dx-2,-h,4,h);ctx.fillStyle=i===1?p.accent:p.sun;ctx.beginPath();ctx.arc(dx,-h,7+i*2,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke();});ty=point.y-14*sc;
    }else if(s.id==="trash"){
      ctx.translate(0,-5);ctx.rotate(-.12);ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(-15,-8);ctx.lineTo(-5,-12);ctx.lineTo(3,-8);ctx.lineTo(14,-12);ctx.lineTo(12,5);ctx.lineTo(-11,8);ctx.closePath();ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1.3;ctx.stroke();ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(-1,4);ctx.lineTo(7,-7);ctx.stroke();ty=point.y-5*sc;
    }else if(s.id==="squirrel"){
      ctx.translate(0,-11);ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(1,0,12,9,-.1,0,7);ctx.fill();ctx.beginPath();ctx.arc(11,-9,7,0,7);ctx.fill();ctx.beginPath();ctx.arc(-11,-9,13,-1.4,2.2);ctx.lineWidth=8;ctx.strokeStyle=p.accent;ctx.stroke();ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(13,-11,1.3,0,7);ctx.fill();ty=point.y-12*sc;
    }else if(s.id==="bird"){
      ctx.strokeStyle=p.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,-47);ctx.lineTo(28,-58);ctx.stroke();ctx.translate(0,-68+bob);ctx.fillStyle=p.accent2;ctx.beginPath();ctx.ellipse(0,0,14,10,-.12,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(10,-7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(16,-8);ctx.lineTo(24,-5);ctx.lineTo(16,-3);ctx.fill();ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(11,-9,1.5,0,Math.PI*2);ctx.fill();ty=point.y+(-68+bob)*sc;
    }else if(s.id==="creek"){
      ctx.strokeStyle=p.accent2;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-30,2);ctx.bezierCurveTo(-18,-10,-7,8,3,-3);ctx.bezierCurveTo(13,-13,20,2,31,-9);ctx.stroke();ctx.fillStyle=p.near;[-20,-3,18].forEach((dx,i)=>{ctx.beginPath();ctx.ellipse(dx,-2-i*2,6,3,0,0,7);ctx.fill();});ty=point.y-4*sc;
    }else if(s.id==="cloud"){
      ctx.translate(0,bob);ctx.fillStyle=p.paper;ctx.strokeStyle=p.ink;ctx.lineWidth=style==="paper"?0:1.5;ctx.beginPath();ctx.roundRect(-32,-26,64,52,10);ctx.fill();if(style!=="paper")ctx.stroke();ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.strokeRect(-22,-17,44,34);ctx.setLineDash([]);ty=point.y+bob*sc;
    }else if(s.id==="deer"){
      ctx.translate(0,-25);ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(-3,0,18,10,0,0,7);ctx.fill();ctx.fillRect(8,-18,5,20);ctx.beginPath();ctx.ellipse(12,-19,7,5,-.2,0,7);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=2;[-11,4].forEach(dx=>{ctx.beginPath();ctx.moveTo(dx,7);ctx.lineTo(dx-2,26);ctx.stroke();});ctx.beginPath();ctx.moveTo(13,-22);ctx.lineTo(9,-33);ctx.moveTo(13,-28);ctx.lineTo(18,-35);ctx.stroke();ty=point.y-26*sc;
    }else if(s.id==="cairn"){
      ctx.translate(0,-2);[18,14,10,7,4].forEach((w,i)=>{ctx.fillStyle=i%2?p.near:p.mid;ctx.beginPath();ctx.ellipse(0,-i*7,w,5,-.08+i*.04,0,7);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=.8;ctx.stroke();});ty=point.y-18*sc;
    }else if(s.id==="door"){
      ctx.translate(0,-18);ctx.fillStyle=p.near;ctx.beginPath();ctx.ellipse(0,0,32,24,0,Math.PI,Math.PI*2);ctx.lineTo(32,8);ctx.lineTo(-32,8);ctx.closePath();ctx.fill();ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(-9,-17,18,25,[9,9,1,1]);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1.3;ctx.stroke();ctx.fillStyle=p.sun;ctx.beginPath();ctx.arc(5,-4,1.6,0,Math.PI*2);ctx.fill();ty=point.y-18*sc;
    }else if(s.id==="flowers"){
      ctx.strokeStyle=p.near;ctx.lineWidth=2;[-16,-6,5,16].forEach((dx,i)=>{const h=12+(i%2)*8;ctx.beginPath();ctx.moveTo(dx,1);ctx.lineTo(dx,-h);ctx.stroke();ctx.fillStyle=i%2?p.accent:p.sun;ctx.beginPath();for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;ctx.moveTo(dx,-h);ctx.arc(dx+Math.cos(a)*4,-h+Math.sin(a)*4,2.5,0,7);}ctx.fill();});ty=point.y-13*sc;
    }else if(s.id==="choir"){
      ctx.translate(0,-14+bob*.3);[-21,0,22].forEach((dx,i)=>{ctx.fillStyle=i===1?p.accent2:p.near;ctx.beginPath();ctx.ellipse(dx,i===1?-3:2,13,17+i*3,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(dx-4,-3,1.3,0,7);ctx.arc(dx+4,-3,1.3,0,7);ctx.fill();ctx.beginPath();ctx.arc(dx,5,3+i,0,Math.PI);ctx.stroke();});ctx.strokeStyle=p.accent;ctx.lineWidth=1.4;for(let i=0;i<3;i++){const yy=-27-i*7;ctx.beginPath();ctx.arc(20+i*9,yy,3,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(23+i*9,yy);ctx.lineTo(23+i*9,yy-8);ctx.stroke();}ty=point.y-14*sc;
    }else if(s.id==="fox"){
      ctx.translate(0,-13);ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(-2,0,18,9,-.15,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(9,-6);ctx.lineTo(18,-18);ctx.lineTo(25,-4);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-16,0);ctx.quadraticCurveTo(-34,-13,-35,3);ctx.quadraticCurveTo(-29,13,-18,6);ctx.fill();ctx.fillStyle=p.paper;ctx.beginPath();ctx.moveTo(15,-8);ctx.lineTo(23,-4);ctx.lineTo(15,-1);ctx.fill();ty=point.y-14*sc;
    }else if(s.id==="waterfall"){
      ctx.strokeStyle=p.near;ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(-25,3);ctx.quadraticCurveTo(5,-25,17,-83);ctx.stroke();ctx.strokeStyle=p.accent2;ctx.lineWidth=5;ctx.setLineDash([10,8]);ctx.lineDashOffset=-elapsed*24;ctx.beginPath();ctx.moveTo(-20,0);ctx.quadraticCurveTo(7,-28,18,-80);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=p.accent2;ctx.beginPath();ctx.moveTo(18,-91+bob);ctx.quadraticCurveTo(8,-78,18,-72);ctx.quadraticCurveTo(28,-78,18,-91+bob);ctx.fill();ty=point.y-60*sc;
    }else if(s.id==="bridge"){
      ctx.strokeStyle=p.accent2;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-34,1);ctx.quadraticCurveTo(0,-13,34,1);ctx.stroke();ctx.strokeStyle=p.ink;ctx.lineWidth=3;[-1,7,15].forEach((yy,i)=>{ctx.beginPath();ctx.moveTo(-28+i*2,yy);ctx.lineTo(29+i*2,yy-6);ctx.stroke();});ty=point.y-3*sc;
    }else if(s.id==="moth"){
      ctx.translate(0,bob*2);ctx.fillStyle=p.sun;ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=p.paper;ctx.beginPath();ctx.ellipse(-13,0,13,8,-.5,0,7);ctx.ellipse(13,0,13,8,.5,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=p.ink;ctx.fillRect(-1,-7,2,14);ty=point.y+bob*2*sc;
    }else if(s.id==="marmot"){
      ctx.translate(0,-15);ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(0,1,15,18,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(0,-14,11,0,7);ctx.fill();ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(-4,-16,1.5,0,7);ctx.arc(4,-16,1.5,0,7);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(4,-8);ctx.stroke();ty=point.y-16*sc;
    }else if(s.id==="teatable"){
      ctx.fillStyle=p.paper;ctx.fillRect(-25,-22,50,6);ctx.fillStyle=p.ink;ctx.fillRect(-20,-16,4,18);ctx.fillRect(16,-16,4,18);ctx.strokeStyle=p.accent2;ctx.lineWidth=4;ctx.beginPath();ctx.arc(2,-29,7,0,Math.PI);ctx.stroke();ctx.fillStyle=p.accent2;ctx.fillRect(-5,-30,14,9);ctx.strokeStyle=p.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(11,-27,4,-1.5,1.5);ctx.stroke();ty=point.y-22*sc;
    }else if(s.id==="lake"){
      ctx.fillStyle=p.accent2;ctx.beginPath();ctx.ellipse(0,-3,38,12,-.1,0,7);ctx.fill();ctx.globalAlpha=.65;ctx.fillStyle=p.paper;ctx.beginPath();ctx.ellipse(7,-5,16,3,-.1,0,7);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=p.near;ctx.beginPath();ctx.moveTo(-32,-6);ctx.lineTo(-20,-24);ctx.lineTo(-8,-6);ctx.fill();ty=point.y-5*sc;
    }else if(s.id==="boot"){
      ctx.translate(0,-26+bob*2);ctx.rotate(.16);ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(-12,-18);ctx.lineTo(7,-17);ctx.lineTo(9,-3);ctx.lineTo(24,2);ctx.quadraticCurveTo(20,10,-3,7);ctx.lineTo(-12,2);ctx.closePath();ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1.5;ctx.stroke();ty=point.y+(-26+bob*2)*sc;
    }else if(s.id==="flag"){
      ctx.strokeStyle=p.ink;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-9,2);ctx.lineTo(-9,-62);ctx.stroke();ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(-7,-60);ctx.quadraticCurveTo(14,-51,30,-59);ctx.lineTo(27,-37);ctx.quadraticCurveTo(10,-32,-7,-40);ctx.closePath();ctx.fill();ty=point.y-46*sc;
    }
    ctx.restore();ctx.shadowColor="transparent";
  }
  eventTarget(s.id,tx,ty,Math.max(22,(s.id==="cloud"?43:35)*sc));
}

function drawHiker(p: Palette) {
  const point=project(displayProgress),x=width*.5,y=point.y-1,stride=walking?Math.sin(elapsed*11):0;
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=p.ink;ctx.fillStyle=p.accent;ctx.lineWidth=2.3;ctx.lineCap="round";
  if(style==="paper"){ctx.shadowColor=p.shadow;ctx.shadowOffsetX=4;ctx.shadowOffsetY=4;}
  ctx.beginPath();ctx.arc(0,-44,8,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(0,-17);ctx.lineTo(-8+stride*5,0);ctx.moveTo(0,-17);ctx.lineTo(8-stride*5,0);ctx.moveTo(-1,-31);ctx.lineTo(-12-stride*3,-20);ctx.moveTo(1,-31);ctx.lineTo(12+stride*3,-20);ctx.stroke();
  ctx.fillStyle=p.accent2;ctx.beginPath();ctx.roundRect(-9,-37,18,19,4);ctx.fill();ctx.stroke();ctx.fillStyle=p.paper;ctx.fillRect(-1,-34,2,12);
  ctx.strokeStyle=p.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12+stride*3,-20);ctx.lineTo(15+stride*3,1);ctx.stroke();
  ctx.restore();ctx.shadowColor="transparent";
}

function update(dt: number) {
  if (walking && !finished) progress = Math.min(TRAIL_LENGTH, progress + dt * WALK_SPEED * debugSpeed);
  displayProgress += (progress - displayProgress) * Math.min(1, dt * 5.5);
  const percent = Math.min(100, Math.round(progress / TRAIL_LENGTH * 100));
  progressFill.style.width = `${percent}%`;
  progressCaption.textContent = `${percent}%`;
  biomeLabel.textContent = vistaAmount(progress) > .62 ? "mountain overlook" : trailPhase(progress);

  if (progress > 12) prompt.classList.add("hidden");

  if (progress >= TRAIL_LENGTH - .5 && !finished) {
    finished = true; walking = false;
    setTimeout(() => finishCard.hidden = false, 450);
  }
}

function render() {
  const p = palettes[style];
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  drawSky(p); drawGround(p); drawMountainShoulder(p);
  drawLivingSlope(p); drawForest(p); drawFog(p);
  targets = [];
  surprises.forEach((s) => drawSurprise(s,p));
  drawHiker(p);
  if (style === "pixel") {
    pixelCanvas.width = Math.max(1, Math.round(width / 3)); pixelCanvas.height = Math.max(1, Math.round(height / 3));
    pixelCtx.imageSmoothingEnabled = false;
    pixelCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, pixelCanvas.width, pixelCanvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  canvas.style.cursor = targets.some((t) => Math.hypot(pointerX-t.x,pointerY-t.y)<t.r) ? "pointer" : "default";
}

function frame(now: number) {
  const dt = Math.min(.05, (now-lastTime)/1000); lastTime=now; elapsed+=dt;
  update(dt); render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function collect(id: string) {
  const surprise = surprises.find((s) => s.id === id);
  if (!surprise || completed.has(id) || Math.abs(progress - surprise.x) > 80) return;
  completed.add(id);
  toast.querySelector<HTMLElement>("small")!.textContent = surprise.tone === "odd" ? "Something strange" : "Trail moment";
  toast.querySelector<HTMLElement>("b")!.textContent = surprise.title;
  toast.querySelector<HTMLElement>("p")!.textContent = surprise.note;
  toast.classList.add("show");
  toast.setAttribute("aria-hidden", "false");
  prompt.classList.add("hidden");
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
    toast.setAttribute("aria-hidden", "true");
    prompt.innerHTML = `<strong>Curiosity logged.</strong> Hold to keep hiking.`;
    prompt.classList.remove("hidden");
  }, 3300);
  ping(7 + completed.size);
}

canvas.addEventListener("pointermove", (event) => {
  const rect=canvas.getBoundingClientRect(); pointerX=event.clientX-rect.left;pointerY=event.clientY-rect.top;
});
canvas.addEventListener("pointerleave",()=>{pointerX=-100;pointerY=-100;});
canvas.addEventListener("pointerdown", (event) => {
  const rect=canvas.getBoundingClientRect(); const x=event.clientX-rect.left,y=event.clientY-rect.top;
  const hit=targets.filter((t)=>Math.hypot(x-t.x,y-t.y)<t.r+12).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];
  if(hit){collect(hit.id);event.preventDefault();}
});

function setWalking(value: boolean) {
  walking = value && !finished;
  walkButton.classList.toggle("walking",walking);
  if (value) ensureAudio();
}
walkButton.addEventListener("pointerdown",(event)=>{walkButton.setPointerCapture(event.pointerId);setWalking(true);});
walkButton.addEventListener("pointerup",()=>setWalking(false));
walkButton.addEventListener("pointercancel",()=>setWalking(false));
window.addEventListener("keydown",(event)=>{if(["ArrowUp","w","W"," "].includes(event.key)){event.preventDefault();setWalking(true);}});
window.addEventListener("keyup",(event)=>{if(["ArrowUp","w","W"," "].includes(event.key))setWalking(false);});

styleToggle.addEventListener("click",()=>{
  const open=stylePanel.hasAttribute("hidden");
  if(open)stylePanel.removeAttribute("hidden");else stylePanel.setAttribute("hidden","");
  styleToggle.setAttribute("aria-expanded",String(open));
});
document.querySelectorAll<HTMLButtonElement>(".style-option").forEach((button)=>button.addEventListener("click",()=>{
  style=button.dataset.key as StyleKey; game.dataset.style=style;
  document.querySelectorAll(".style-option").forEach((b)=>b.classList.toggle("active",b===button));
  styleToggle.querySelector("strong")!.textContent=styleInfo[style].name;
  stylePanel.setAttribute("hidden",""); styleToggle.setAttribute("aria-expanded","false");
  localStorage.setItem("hike-style",style);
}));
const savedStyle=localStorage.getItem("hike-style") as StyleKey | null;
if(savedStyle && styleInfo[savedStyle]) document.querySelector<HTMLButtonElement>(`.style-option[data-key="${savedStyle}"]`)?.click();

function ensureAudio(){
  if(!musicOn)return;
  if(!audio)audio=new AudioContext();
  if(audio.state==="suspended")audio.resume();
}
function ping(offset=0){
  if(!musicOn)return;ensureAudio();if(!audio)return;
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type="sine";osc.frequency.value=220*Math.pow(2,(offset%12)/12);gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.08,audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.7);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.72);
}
function musicLoop(){
  if(musicOn && audio){const notes=[0,4,7,11,7,4];ping(notes[noteIndex++%notes.length]);}
  musicTimer=window.setTimeout(musicLoop,900);
}
musicLoop();
function updateMusicButton(){musicButton.style.opacity=musicOn?"1":".48";musicButton.setAttribute("aria-label",musicOn?"Turn music off":"Turn music on");}
updateMusicButton();
musicButton.addEventListener("click",()=>{musicOn=!musicOn;updateMusicButton();if(musicOn){ensureAudio();ping(7);}else if(audio)audio.suspend();});

document.querySelector<HTMLButtonElement>(".again")!.addEventListener("click",()=>{
  progress=0;displayProgress=0;completed=new Set();finished=false;finishCard.hidden=true;
  clearTimeout(toastTimer);toast.classList.remove("show");toast.setAttribute("aria-hidden","true");
  prompt.innerHTML="<strong>Hold to hike.</strong>";prompt.classList.remove("hidden");
});

if(debug){
  const panel=document.createElement("div"); panel.className="debug-panel";
  panel.innerHTML='<span>walk speed</span><button class="active" data-speed="1">1×</button><button data-speed="2">2×</button><button data-speed="4">4×</button><i></i><button data-action="next">Next event</button><button data-action="all">Summit</button><button data-action="reset">Reset</button>'; game.append(panel);
  panel.addEventListener("click",(event)=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>("button"); if(!button)return;
    const speed=Number(button.dataset.speed); const action=button.dataset.action;
    if(speed){debugSpeed=speed;panel.querySelectorAll("[data-speed]").forEach((item)=>item.classList.toggle("active",item===button));}
    if(action==="next"){const next=surprises.find((s)=>!completed.has(s.id)&&s.x>progress+2);if(next)progress=next.x-17;}
    if(action==="all"){surprises.forEach((s)=>completed.add(s.id));progress=TRAIL_LENGTH;}
    if(action==="reset")document.querySelector<HTMLButtonElement>(".again")!.click();
  });
}

Object.assign(window,{__HIKE_DEBUG__:{getState:()=>({progress,completed:[...completed],style,vista:vistaAmount(progress),targets,speed:debugSpeed,biome:trailPhase(progress)}),jumpTo:(id:string)=>{const s=surprises.find((item)=>item.id===id);if(s)progress=s.x-17;},jumpToProgress:(station:number)=>{progress=Math.max(0,Math.min(TRAIL_LENGTH,station));},collect,setSpeed:(speed:number)=>{if(debug&&[1,2,4].includes(speed))debugSpeed=speed;},setStyle:(key:StyleKey)=>document.querySelector<HTMLButtonElement>(`.style-option[data-key="${key}"]`)?.click()}});
