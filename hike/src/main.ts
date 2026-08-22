import "./style.css";

type StyleKey = "paper" | "pixel";
type Surprise = {
  id: string;
  x: number;
  title: string;
  clue: string;
  note: string;
  mark: string;
  sky?: boolean;
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

const surprises: Surprise[] = [
  { id: "trash", x: 118, title: "Trail Custodian", clue: "Something shiny is crinkling by the path.", note: "You packed out what someone else packed in.", mark: "01" },
  { id: "bird", x: 252, title: "A Party of One", clue: "That branch seems to be watching you.", note: "One very small bird. One extremely large opinion.", mark: "02" },
  { id: "cloud", x: 388, title: "Forecast: Unlikely", clue: "The sky has made a peculiar mistake.", note: "A cloud tied itself into a perfect square.", mark: "03", sky: true },
  { id: "twins", x: 522, title: "Copy / Paste", clue: "The trees here are never the same. Except…", note: "Two identical trees, right down to the last needle.", mark: "04" },
  { id: "door", x: 654, title: "Unreasonably Small Door", clue: "There is a little color in the cliff face.", note: "You knocked. Something much smaller knocked back.", mark: "05" },
  { id: "choir", x: 784, title: "The Stone Choir", clue: "Those rocks are humming in three-part harmony.", note: "Their encore may take several geological eras.", mark: "06" },
  { id: "waterfall", x: 916, title: "Uphill Waterfall", clue: "The stream appears to have forgotten gravity.", note: "Every drop is determined to see the summit.", mark: "07" },
  { id: "moth", x: 1044, title: "Moon, Pocket-Sized", clue: "A pale light is fluttering among the pines.", note: "The moth carried a tiny moon away on its wings.", mark: "08", sky: true },
];

const styleInfo: Record<StyleKey, { name: string; subtitle: string; swatch: string }> = {
  paper: { name: "Cut Paper", subtitle: "warm layers & soft shadows", swatch: "linear-gradient(145deg,#e9b65f 0 42%,#698761 43% 67%,#fff3d4 68%)" },
  pixel: { name: "Pocket Hike", subtitle: "bright 16-bit wilderness", swatch: "linear-gradient(135deg,#75cbe8 0 40%,#397657 41% 62%,#f5d67b 63%); image-rendering:pixelated" },
};

const palettes: Record<StyleKey, Palette> = {
  paper: { sky: "#e9b65f", sun: "#fff2c7", far: "#d9c78f", mid: "#93a478", near: "#627f60", ground: "#f5e6bd", path: "#fff7df", ink: "#26382f", accent: "#d84f3f", accent2: "#4e7583", paper: "#fff8e7", shadow: "rgba(45,52,38,.18)" },
  pixel: { sky: "#75cbe8", sun: "#fff0a8", far: "#8ab4a0", mid: "#568d72", near: "#35664f", ground: "#6d9b58", path: "#f5d67b", ink: "#172d32", accent: "#d94c45", accent2: "#277a85", paper: "#fff3c4", shadow: "rgba(23,45,50,.24)" },
};

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="game" data-style="paper">
    <canvas aria-label="A winding mountain trail"></canvas>
    <header class="brand"><h1>Hike.</h1><p>a mountain of small mysteries</p></header>
    <div class="top-controls">
      <button class="icon-button music" aria-label="Turn music on" title="Music">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
      </button>
      <button class="style-toggle" aria-expanded="false"><span>Look&nbsp; </span><strong>Cut Paper</strong></button>
    </div>
    <section class="style-panel" hidden>
      <div class="label">Choose a field of view</div>
      ${Object.entries(styleInfo).map(([key, info]) => `<button class="style-option${key === "paper" ? " active" : ""}" data-key="${key}"><span class="swatch" style="${info.swatch}"></span><span><b>${info.name}</b><span>${info.subtitle}</span></span></button>`).join("")}
    </section>
    <div class="progress-wrap" aria-label="Hike progress">
      <div class="progress-track"><div class="progress-fill"></div>${surprises.map((s) => `<i class="progress-marker" data-id="${s.id}" style="left:${s.x / 11.5}%"></i>`).join("")}</div>
      <div class="progress-caption"><span class="biome-label">young woods</span> · <span class="percent">0%</span></div>
    </div>
    <button class="walk-button" aria-label="Hold to hike">
      <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4c2 5 2 10 0 14-1 2 0 5 3 6 3 1 7-1 8-4 1-2-1-3-3-4-2-1-2-4-1-7l1-5"/><path d="M18 7c4 1 7 4 8 8 1 3-1 6-4 6h-4M8 14h7"/></svg>
      <span>hold</span>
    </button>
    <div class="prompt"><strong>Hold to hike.</strong> Keep an eye out.</div>
    <aside class="toast"><div class="toast-icon">01</div><small>Trail curiosity found</small><b>Trail Custodian</b><p></p></aside>
    <section class="finish-card" hidden>
      <div class="eyebrow">Summit log · all curiosities found</div>
      <h2>The mountain<br>noticed you, too.</h2>
      <p>You walked 1,150 very suspicious metres and left with eight stories.</p>
      <div class="finish-stamps">${surprises.map((s, i) => `<span style="--r:${i % 2 ? 8 : -7}deg">${s.mark}</span>`).join("")}</div>
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

const TRAIL_LENGTH = 1150;
const WALK_SPEED = TRAIL_LENGTH / (8 * 60);
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

function scaleX() { return Math.max(2.4, Math.min(6, width / 210)); }
function sx(worldX: number) { return width * .34 + (worldX - displayProgress) * scaleX(); }
function gy(worldX: number) { return height * .69 - (elevation(worldX) - elevation(displayProgress)) * .57; }

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
  line(points, true);
  ctx.fillStyle = color;
  if (style === "paper") { ctx.shadowColor = palettes[style].shadow; ctx.shadowOffsetY = -7; }
  ctx.fill();
  ctx.shadowColor = "transparent";
}

function drawSky(p: Palette) {
  ctx.fillStyle = p.sky;
  ctx.fillRect(0, 0, width, height);

  if (style === "pixel") {
    ctx.fillStyle = "rgba(255,255,255,.72)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 223 - displayProgress * .04) % (width + 180)) - 90, y = 55 + (i % 3) * 46;
      ctx.fillRect(Math.round(x), y, 72, 12); ctx.fillRect(Math.round(x + 14), y - 8, 34, 8);
    }
  }

  const sunX = width * .72 - displayProgress * .025;
  const sunY = height * .2;
  if (style === "pixel") {
    ctx.fillStyle = p.sun; ctx.fillRect(Math.round(sunX - 28), Math.round(sunY - 28), 56, 56);
  } else {
    ctx.beginPath(); ctx.arc(sunX, sunY, Math.min(58, width * .075), 0, Math.PI * 2); ctx.fillStyle = p.sun; ctx.fill();
  }

  mountainLayer(height * .49, height * .1, p.far, .035, 30);
  mountainLayer(height * .58, height * .115, p.mid, .07, 38);
  mountainLayer(height * .68, height * .13, p.near, .12, 46);
}

function drawGround(p: Palette) {
  const top: [number, number][] = [];
  for (let x = -60; x <= width + 60; x += style === "pixel" ? 10 : 24) {
    const world = displayProgress + (x - width * .34) / scaleX();
    const y = gy(world);
    top.push([x, style === "pixel" ? Math.round(y / 4) * 4 : y]);
  }
  const shape = [...top, [width + 60, height + 30] as [number, number], [-60, height + 30] as [number, number]];
  line(shape, true); ctx.fillStyle = p.ground;
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetY = -8; }
  ctx.fill(); ctx.shadowColor = "transparent";

  const snowy = top.filter(([x]) => {
    const world = displayProgress + (x - width * .34) / scaleX();
    return world > 790 + Math.sin(world * .035) * 28;
  });
  if (snowy.length > 1) {
    line([...snowy, [snowy[snowy.length - 1][0], height + 30], [snowy[0][0], height + 30]], true);
    ctx.fillStyle = style === "pixel" ? "#e8f1e8" : "#f8f5e9";
    if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetY = -5; }
    ctx.fill(); ctx.shadowColor = "transparent";
  }

  ctx.strokeStyle = p.path; ctx.lineWidth = style === "pixel" ? 8 : Math.max(9, height * .018); ctx.lineCap = style === "pixel" ? "butt" : "round";
  ctx.beginPath();
  for (let x = -20; x <= width + 30; x += 18) {
    const world = displayProgress + (x - width * .34) / scaleX();
    const y = gy(world) + 11 + Math.sin(world * .11) * 2;
    x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.shadowColor = "transparent";
  if (style === "pixel") {
    ctx.fillStyle = "rgba(26,77,55,.28)";
    for (let i = 0; i < width / 12; i++) ctx.fillRect(i * 17 + (i % 3) * 3, height - 18 - (i % 5) * 7, 5, 3);
  }
}

function drawTree(worldX: number, size: number, p: Palette, identicalSeed?: number) {
  const x = sx(worldX), y = gy(worldX) + 1;
  if (x < -90 || x > width + 90) return;
  const seed = identicalSeed ?? Math.floor(worldX * 3);
  const lean = (seeded(seed) - .5) * 7;
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean * Math.PI / 180);
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5; }

  if (style === "pixel") {
    const unit = Math.max(2, Math.round(size / 15));
    ctx.fillStyle = "#5a4432"; ctx.fillRect(-unit, -size * .55, unit * 2, size * .58);
    ctx.fillStyle = seed % 2 ? p.near : p.mid;
    for (let i = 0; i < 4; i++) { const yy = -size * (.35 + i * .18), spread = Math.round(size * (.28 - i * .04)); ctx.fillRect(-spread, Math.round(yy), spread * 2, unit * 3); }
  } else {
    ctx.fillStyle = p.ink; ctx.fillRect(-1.5, -size * .42, 3, size * .45);
    const tiers = 3 + Math.floor(seeded(seed + 2) * 2);
    for (let i = 0; i < tiers; i++) {
      const yy = -size * .35 - i * size * .19, spread = size * (.27 - i * .035);
      ctx.beginPath(); ctx.moveTo(0, yy - size * .31); ctx.lineTo(-spread, yy + size * .13); ctx.lineTo(spread, yy + size * .13); ctx.closePath();
      ctx.fillStyle = i % 2 ? p.near : p.mid; ctx.fill();
    }
  }
  const snow = smoothstep(760, 920, worldX);
  if (snow > .03) {
    ctx.globalAlpha = snow * .92;
    ctx.strokeStyle = style === "pixel" ? "#edf6e8" : "#faf8ef";
    ctx.lineWidth = style === "pixel" ? 4 : Math.max(2, size * .045); ctx.lineCap = style === "pixel" ? "butt" : "round";
    for (let i = 0; i < 4; i++) { const yy = -size * (.28 + i * .18), spread = size * (.2 - i * .025); ctx.beginPath(); ctx.moveTo(-spread, yy); ctx.lineTo(spread * .7, yy + 1); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  ctx.restore(); ctx.shadowColor = "transparent";
}

function drawShrub(worldX: number, size: number, p: Palette, seed: number) {
  const x = sx(worldX), y = gy(worldX);
  if (x < -40 || x > width + 40 || worldX > 950) return;
  ctx.save(); ctx.translate(x, y);
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3; }
  const leaves = 3 + Math.floor(seeded(seed + 4) * 4);
  for (let i = 0; i < leaves; i++) {
    const angle = -Math.PI + (i / Math.max(1, leaves - 1)) * Math.PI;
    const lx = Math.cos(angle) * size * .42, ly = -Math.sin(angle) * size * .28 - size * .18;
    if (style === "pixel") {
      ctx.fillStyle = i % 2 ? p.near : p.mid; ctx.fillRect(Math.round(lx - size*.18), Math.round(ly - size*.14), Math.round(size*.36), Math.round(size*.24));
    } else {
      ctx.beginPath(); ctx.ellipse(lx, ly, size * .24, size * .15, angle * .25, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? p.near : p.mid; ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.restore(); ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

function drawGroundDetail(worldX: number, p: Palette, seed: number) {
  const x = sx(worldX), y = gy(worldX) + 1;
  if (x < -30 || x > width + 30) return;
  const snow = smoothstep(790, 930, worldX);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = "round";
  if (seed % 7 === 0) {
    ctx.fillStyle = snow > .35 ? "#d7ddd5" : p.near;
    if (style === "pixel") ctx.fillRect(-7, -4, 14, 5);
    else { ctx.beginPath(); ctx.ellipse(0, -3, 7 + seeded(seed) * 5, 4 + seeded(seed+2) * 3, -.1, Math.PI, Math.PI*2); ctx.fill(); }
  } else {
    ctx.strokeStyle = p.near; ctx.lineWidth = style === "pixel" ? 2 : 1.2;
    const blades = snow > .45 ? 2 : 3 + seed % 4;
    for (let i = 0; i < blades; i++) { const dx = (i - blades / 2) * 3; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + (seeded(seed+i)-.5)*7, -(5 + seeded(seed+i+8)*11) * (1-snow*.55)); ctx.stroke(); }
    if (snow < .18 && seed % 11 === 2) { ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(0, -10, style === "pixel" ? 2.5 : 1.8, 0, Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}

function drawForest(p: Palette) {
  const worldSpan = width / scaleX();
  const minWorld = displayProgress - worldSpan * .45 - 70;
  const maxWorld = displayProgress + worldSpan * .8 + 70;
  ctx.save(); ctx.globalAlpha = .65;
  const backStart = Math.floor(minWorld / 29);
  for (let i = backStart; i * 29 < maxWorld; i++) {
    const wx = i * 29 + (seeded(i + 400) - .5) * 17;
    if (wx < 12 || wx > 1125 || (wx > 930 && i % 3 !== 0)) continue;
    const growth = smoothstep(20, 470, wx), size = 18 + growth * 66 + seeded(i+81) * 18;
    drawTree(wx, size * .72, p);
  }
  ctx.restore();

  const treeStart = Math.floor(minWorld / 23);
  for (let i = treeStart; i * 23 < maxWorld; i++) {
    const wx = i * 23 + (seeded(i + 90) - .5) * 13;
    if (wx < 18 || wx > 1125 || (wx > 900 && i % 2 === 0)) continue;
    const growth = smoothstep(15, 455, wx), highAlpine = smoothstep(900, 1120, wx);
    const size = 22 + growth * 76 + seeded(i + 9) * 19 - highAlpine * 24;
    drawTree(wx, size, p);
  }

  const shrubStart = Math.floor(minWorld / 16);
  for (let i = shrubStart; i * 16 < maxWorld; i++) {
    const wx = i * 16 + (seeded(i + 170) - .5) * 8;
    if (wx > 15 && wx < 980 && i % 5 !== 0) drawShrub(wx, 10 + seeded(i+3) * 12, p, i);
  }
  const detailStart = Math.floor(minWorld / 9);
  for (let i = detailStart; i * 9 < maxWorld; i++) {
    const wx = i * 9 + (seeded(i + 710) - .5) * 5;
    if (wx > 10 && wx < 1135 && !surprises.some((s) => Math.abs(s.x - wx) < 8)) drawGroundDetail(wx, p, i);
  }
}

function drawFog(p: Palette) {
  const fog = smoothstep(500, 650, displayProgress) * (1 - smoothstep(850, 990, displayProgress));
  if (fog < .01) return;
  ctx.save(); ctx.globalAlpha = fog * .24;
  ctx.fillStyle = style === "pixel" ? "#e6f1e8" : "#f5f1df";
  const drift = (elapsed * 9) % 180;
  if (style === "pixel") {
    for (let i = -1; i < 6; i++) ctx.fillRect(i * 190 - drift, height * (.45 + (i%3)*.07), 160, 18 + (i%2)*12);
  } else {
    for (let i = -1; i < 7; i++) {
      const x = i * 190 - drift, y = height * (.42 + (i % 3) * .08);
      ctx.beginPath(); ctx.ellipse(x, y, 160, 25 + (i%2)*11, 0, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.restore();
}

function eventTarget(id: string, x: number, y: number, r = 30) { targets.push({ id, x, y, r }); }
function isFound(id: string) { return completed.has(id); }

function drawSpark(x: number, y: number, p: Palette, scale = 1) {
  const pulse = 1 + Math.sin(elapsed * 4) * .12;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * pulse, scale * pulse); ctx.rotate(elapsed * .2);
  ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke(); ctx.restore();
}

function drawSurprise(s: Surprise, p: Palette) {
  const x = sx(s.x), ground = gy(s.x);
  if (x < -110 || x > width + 110 || isFound(s.id)) return;
  const bob = Math.sin(elapsed * 2.3 + s.x) * 2;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  if (style === "paper") { ctx.shadowColor = p.shadow; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5; }
  let tx = x, ty = ground - 20;

  if (s.id === "trash") {
    ty = ground - 5;
    ctx.translate(x, ty); ctx.rotate(-.12);
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(-15,-8); ctx.lineTo(-5,-12); ctx.lineTo(3,-8); ctx.lineTo(14,-12); ctx.lineTo(12,5); ctx.lineTo(-11,8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5,-8); ctx.lineTo(-1,4); ctx.lineTo(7,-7); ctx.stroke();
  } else if (s.id === "bird") {
    ty = ground - 71 + bob;
    ctx.strokeStyle = p.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x-30, ground-47); ctx.lineTo(x+28, ground-58); ctx.stroke();
    ctx.translate(x, ty); ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, -.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(10,-7,7,0,Math.PI*2); ctx.fill(); ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(16,-8); ctx.lineTo(24,-5); ctx.lineTo(16,-3); ctx.fill();
    ctx.fillStyle = p.ink; ctx.beginPath(); ctx.arc(11,-9,1.5,0,Math.PI*2); ctx.fill();
  } else if (s.id === "cloud") {
    ty = Math.max(120, ground - 185) + bob;
    ctx.translate(x, ty); ctx.fillStyle = p.paper; ctx.strokeStyle = p.ink; ctx.lineWidth = style === "paper" ? 0 : 1.5;
    ctx.beginPath(); ctx.roundRect(-32,-26,64,52,10); ctx.fill(); if (style !== "paper") ctx.stroke();
    ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.setLineDash([4,5]); ctx.strokeRect(-22,-17,44,34); ctx.setLineDash([]);
  } else if (s.id === "twins") {
    drawTree(s.x + 2, 51, p, 4242); drawTree(s.x + 28, 51, p, 4242); tx = sx(s.x + 15); ty = ground - 49;
  } else if (s.id === "door") {
    ty = ground - 18;
    ctx.translate(x, ty); ctx.fillStyle = p.near; ctx.beginPath(); ctx.ellipse(0,0,32,24,0,Math.PI,Math.PI*2); ctx.lineTo(32,8); ctx.lineTo(-32,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.roundRect(-9,-17,18,25,9,9,1,1); ctx.fill(); ctx.strokeStyle = p.ink; ctx.lineWidth = 1.3; ctx.stroke(); ctx.fillStyle = p.sun; ctx.beginPath(); ctx.arc(5,-4,1.6,0,Math.PI*2); ctx.fill();
  } else if (s.id === "choir") {
    ty = ground - 14 + bob * .3;
    [-21,0,22].forEach((dx,i) => { ctx.fillStyle = i === 1 ? p.accent2 : p.near; ctx.beginPath(); ctx.ellipse(x+dx, ty + (i===1?-3:2), 13, 17+i*3, 0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke(); ctx.fillStyle=p.ink;ctx.beginPath();ctx.arc(x+dx-4,ty-3,1.3,0,7);ctx.arc(x+dx+4,ty-3,1.3,0,7);ctx.fill();ctx.beginPath();ctx.arc(x+dx,ty+5,3+i,0,Math.PI);ctx.stroke(); });
    ctx.strokeStyle = p.accent; ctx.lineWidth=1.4; for(let i=0;i<3;i++){const yy=ty-27-i*7;ctx.beginPath();ctx.arc(x+20+i*9,yy,3,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(x+23+i*9,yy);ctx.lineTo(x+23+i*9,yy-8);ctx.stroke();}
  } else if (s.id === "waterfall") {
    ty = ground - 60;
    ctx.strokeStyle = p.near; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(x-25,ground+3);ctx.quadraticCurveTo(x+5,ground-25,x+17,ground-83);ctx.stroke();
    ctx.strokeStyle = p.accent2; ctx.lineWidth = 5; ctx.setLineDash([10,8]); ctx.lineDashOffset = -elapsed*24; ctx.beginPath();ctx.moveTo(x-20,ground);ctx.quadraticCurveTo(x+7,ground-28,x+18,ground-80);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=p.accent2;ctx.beginPath();ctx.moveTo(x+18,ground-91+bob);ctx.quadraticCurveTo(x+8,ground-78,x+18,ground-72);ctx.quadraticCurveTo(x+28,ground-78,x+18,ground-91+bob);ctx.fill();
  } else if (s.id === "moth") {
    ty = Math.max(145, ground - 135) + bob * 2;
    ctx.translate(x,ty); ctx.fillStyle=p.sun;ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.fill();ctx.strokeStyle=p.ink;ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=p.paper;ctx.beginPath();ctx.ellipse(-13,0,13,8,-.5,0,7);ctx.ellipse(13,0,13,8,.5,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=p.ink;ctx.fillRect(-1,-7,2,14);
  }
  ctx.restore(); ctx.shadowColor = "transparent";
  eventTarget(s.id, tx, ty, s.id === "cloud" ? 43 : 34);
  if (Math.abs(progress - s.x) < 70) drawSpark(tx + 31, ty - 25, p, .7);
}

function drawHiker(p: Palette) {
  const x = width * .34, y = gy(displayProgress) - 1;
  const stride = walking ? Math.sin(elapsed * 11) : 0;
  ctx.save(); ctx.translate(x,y); ctx.strokeStyle=p.ink;ctx.fillStyle=p.accent;ctx.lineWidth=2.3;ctx.lineCap="round";
  if(style==="paper"){ctx.shadowColor=p.shadow;ctx.shadowOffsetX=4;ctx.shadowOffsetY=4;}
  ctx.beginPath();ctx.arc(0,-44,8,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(-1,-17);ctx.lineTo(-10+stride*6,0);ctx.moveTo(-1,-17);ctx.lineTo(9-stride*6,0);ctx.moveTo(-1,-32);ctx.lineTo(-13-stride*5,-19);ctx.moveTo(-1,-31);ctx.lineTo(12+stride*5,-21);ctx.stroke();
  ctx.fillStyle=p.accent2;ctx.beginPath();ctx.roundRect(-11,-37,8,17,3);ctx.fill();ctx.stroke();
  ctx.strokeStyle=p.ink;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12+stride*5,-21);ctx.lineTo(15+stride*5,1);ctx.stroke();
  ctx.restore();ctx.shadowColor="transparent";
}

function update(dt: number) {
  if (walking && !finished) {
    const next = surprises.find((s) => !isFound(s.id) && s.x >= progress - 1);
    const barrier = next ? next.x - 17 : 1150;
    progress = Math.min(barrier, progress + dt * WALK_SPEED * debugSpeed);
    if (progress >= barrier - .01) walking = false;
  }
  displayProgress += (progress - displayProgress) * Math.min(1, dt * 5.5);
  const percent = Math.min(100, Math.round(progress / 11.5));
  progressFill.style.width = `${percent}%`;
  progressCaption.textContent = `${percent}%`;
  biomeLabel.textContent = trailPhase(progress);

  const next = surprises.find((s) => !isFound(s.id) && Math.abs(progress - (s.x - 17)) < 1);
  if (next) {
    prompt.innerHTML = `<strong>Something is odd.</strong> ${next.clue}`;
    prompt.classList.remove("hidden");
  } else if (progress > 12) prompt.classList.add("hidden");

  if (progress >= 1149.5 && completed.size === surprises.length && !finished) {
    finished = true; walking = false;
    setTimeout(() => finishCard.hidden = false, 450);
  }
}

function render() {
  const p = palettes[style];
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  drawSky(p); drawGround(p); drawForest(p); drawFog(p);
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
  document.querySelector(`.progress-marker[data-id="${id}"]`)?.classList.add("done");
  toast.querySelector<HTMLElement>(".toast-icon")!.textContent = surprise.mark;
  toast.querySelector<HTMLElement>("b")!.textContent = surprise.title;
  toast.querySelector<HTMLElement>("p")!.textContent = surprise.note;
  toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3300);
  prompt.innerHTML = `<strong>Curiosity logged.</strong> Hold to keep hiking.`;
  prompt.classList.remove("hidden");
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
window.addEventListener("keydown",(event)=>{if(["ArrowRight","d","D"," "].includes(event.key)){event.preventDefault();setWalking(true);}});
window.addEventListener("keyup",(event)=>{if(["ArrowRight","d","D"," "].includes(event.key))setWalking(false);});

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
  document.querySelectorAll(".progress-marker").forEach((m)=>m.classList.remove("done"));
  prompt.innerHTML="<strong>Hold to hike.</strong> Keep an eye out.";prompt.classList.remove("hidden");
});

if(debug){
  const panel=document.createElement("div"); panel.className="debug-panel";
  panel.innerHTML='<span>walk speed</span><button class="active" data-speed="1">1×</button><button data-speed="2">2×</button><button data-speed="4">4×</button><i></i><button data-action="next">Next surprise</button><button data-action="all">Summit</button><button data-action="reset">Reset</button>'; game.append(panel);
  panel.addEventListener("click",(event)=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>("button"); if(!button)return;
    const speed=Number(button.dataset.speed); const action=button.dataset.action;
    if(speed){debugSpeed=speed;panel.querySelectorAll("[data-speed]").forEach((item)=>item.classList.toggle("active",item===button));}
    if(action==="next"){const next=surprises.find((s)=>!completed.has(s.id));if(next)progress=next.x-17;}
    if(action==="all"){surprises.forEach((s)=>completed.add(s.id));progress=TRAIL_LENGTH;document.querySelectorAll(".progress-marker").forEach((m)=>m.classList.add("done"));}
    if(action==="reset")document.querySelector<HTMLButtonElement>(".again")!.click();
  });
}

Object.assign(window,{__HIKE_DEBUG__:{getState:()=>({progress,completed:[...completed],style,targets,speed:debugSpeed,biome:trailPhase(progress)}),jumpTo:(id:string)=>{const s=surprises.find((item)=>item.id===id);if(s)progress=s.x-17;},collect,setSpeed:(speed:number)=>{if(debug&&[1,2,4].includes(speed))debugSpeed=speed;},setStyle:(key:StyleKey)=>document.querySelector<HTMLButtonElement>(`.style-option[data-key="${key}"]`)?.click()}});
