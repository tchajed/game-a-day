import "./styles.css";

type NpcId = "maribel" | "bix";
type DialogueLine = { speaker: string; text: string; option: string };
type Npc = { id: NpcId; name: string; role: string; x: number; dialogue: DialogueLine[] };

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing app root");

app.innerHTML = `
  <section class="game-shell" aria-label="Psychopomps onboarding scene">
    <canvas id="scene" aria-label="A side-scrolling hellish onboarding concourse"></canvas>
    <div class="grain"></div>
    <header class="topbar">
      <div class="assignment">
        <span class="assignment__kicker">Department of Passage · Intake 6C</span>
        <strong class="assignment__title">New Hire Orientation</strong>
        <span class="assignment__detail">NIX · PSYCHOPOMP L6 · Talk to your cohort</span>
      </div>
      <div class="progress" aria-label="Two people to meet">
        <span class="progress__mark" data-progress="maribel" title="Maribel">M</span>
        <span class="progress__mark" data-progress="bix" title="Bix">B</span>
      </div>
    </header>
    <div class="interact-prompt" hidden><kbd>E</kbd><span>Speak</span></div>
    <aside class="dialogue" role="dialog" aria-live="polite" hidden>
      <div class="dialogue__copy">
        <h2 class="dialogue__speaker"></h2>
        <p class="dialogue__text"></p>
      </div>
      <button class="dialogue__option" type="button">Continue</button>
    </aside>
    <div class="controls" aria-label="Touch controls">
      <div class="controls__move">
        <button type="button" data-move="left" aria-label="Walk left">←</button>
        <button type="button" data-move="right" aria-label="Walk right">→</button>
      </div>
      <button class="controls__talk" type="button" data-talk>Talk</button>
    </div>
  </section>
`;

const shell = document.querySelector<HTMLElement>(".game-shell")!;
const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const ctx = canvas.getContext("2d")!;
const prompt = document.querySelector<HTMLElement>(".interact-prompt")!;
const promptText = prompt.querySelector<HTMLElement>("span")!;
const dialogueEl = document.querySelector<HTMLElement>(".dialogue")!;
const speakerEl = document.querySelector<HTMLElement>(".dialogue__speaker")!;
const textEl = document.querySelector<HTMLElement>(".dialogue__text")!;
const optionEl = document.querySelector<HTMLButtonElement>(".dialogue__option")!;

const WORLD_WIDTH = 2180;
const WALK_SPEED = 270;
const TALK_RANGE = 170;
const player = { x: 1080, facing: 1, walking: false };
const keys = new Set<string>();
const met = new Set<NpcId>();
const npcs: Npc[] = [
  {
    id: "maribel",
    name: "Maribel Voss",
    role: "Onboarding Facilitator · Human",
    x: 570,
    dialogue: [
      {
        speaker: "MARIBEL · ONBOARDING FACILITATOR",
        text: "Nix! Wonderful. You found Intake 6C. Ignore the screaming—Facilities has a ticket open.",
        option: "Continue",
      },
      {
        speaker: "NIX · PSYCHOPOMP L6",
        text: "The screaming is not coming from the lava.",
        option: "Continue",
      },
      {
        speaker: "MARIBEL · ONBOARDING FACILITATOR",
        text: "Excellent situational awareness. That's why you're our first L6 new hire in three centuries. Speak to Bix, then report back for scythe ergonomics.",
        option: "Return to concourse",
      },
    ],
  },
  {
    id: "bix",
    name: "Bix",
    role: "Psychopomp L2 · Good dog",
    x: 1580,
    dialogue: [
      {
        speaker: "BIX · PSYCHOPOMP L2",
        text: "Hi! I'm Bix. I can smell eleven kinds of ghost and one sandwich in your coat.",
        option: "Continue",
      },
      {
        speaker: "NIX · PSYCHOPOMP L6",
        text: "The sandwich died some time ago. I was escorting it.",
        option: "Continue",
      },
      {
        speaker: "BIX · PSYCHOPOMP L2",
        text: "That's incredibly senior of you. Do you think the scythes come in mouth size? Never mind—don't tell me. I love surprises.",
        option: "Return to concourse",
      },
    ],
  },
];

let width = 0;
let height = 0;
let dpr = 1;
let lastTime = performance.now();
let activeNpc: Npc | null = null;
let lineIndex = 0;
let nearbyNpc: Npc | null = null;
let cameraX = 0;

function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

function poly(points: [number, number][], fill: string, stroke?: string, lineWidth = 2) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function line(points: [number, number][], stroke: string, lineWidth = 2) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function worldToScreen(x: number, parallax = 1) {
  return x - cameraX * parallax;
}

function drawSky(t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#241727");
  sky.addColorStop(0.48, "#7b3d48");
  sky.addColorStop(1, "#c36946");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * .64, height * .45, 5, width * .64, height * .45, height * .48);
  glow.addColorStop(0, "rgba(251,170,87,.4)");
  glow.addColorStop(1, "rgba(130,54,63,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // distant bureaucratic citadel
  const cx = worldToScreen(1290, .13);
  const baseY = height * .53;
  poly([[cx - 240, baseY], [cx - 180, baseY - 95], [cx - 125, baseY - 70], [cx - 88, baseY - 220], [cx - 54, baseY - 290], [cx - 22, baseY - 145], [cx + 5, baseY - 350], [cx + 35, baseY - 405], [cx + 62, baseY - 175], [cx + 92, baseY - 315], [cx + 120, baseY - 350], [cx + 154, baseY - 120], [cx + 220, baseY],], "#352635");
  poly([[cx - 160, baseY], [cx - 112, baseY - 92], [cx + 146, baseY - 92], [cx + 198, baseY]], "#46303b");
  for (let i = -4; i <= 5; i++) {
    const wx = cx + i * 25;
    ctx.fillStyle = i % 2 ? "#b56b4c" : "#d18b57";
    ctx.fillRect(wx, baseY - 72, 9, 28);
  }

  // slow smoke bands
  for (let i = 0; i < 4; i++) {
    const x = ((i * 480 + t * (3 + i)) % (width + 700)) - 350;
    ctx.fillStyle = `rgba(35,22,34,${.12 + i * .025})`;
    ctx.beginPath();
    ctx.ellipse(x, height * (.18 + i * .08), 270, 45 + i * 8, -.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountains() {
  const y = height * .66;
  const p = .3;
  const x = worldToScreen(0, p) - 360;
  poly([[x, y], [x + 260, y - 220], [x + 460, y - 80], [x + 720, y - 280], [x + 980, y - 75], [x + 1240, y - 240], [x + 1510, y - 55], [x + 1780, y - 210], [x + 2160, y],], "#4a2b3b");
  const x2 = worldToScreen(180, .48) - 500;
  poly([[x2, y + 80], [x2 + 300, y - 80], [x2 + 590, y + 8], [x2 + 910, y - 165], [x2 + 1210, y + 5], [x2 + 1500, y - 120], [x2 + 1900, y + 80]], "#683849");
}

function drawLava(t: number) {
  const y = height * .71;
  ctx.fillStyle = "#2a1721";
  ctx.fillRect(0, y, width, height - y);
  poly([[0, y + 40], [width * .22, y + 15], [width * .46, y + 58], [width * .73, y + 20], [width, y + 38], [width, height], [0, height]], "#51242d");
  ctx.fillStyle = "#e56b3f";
  ctx.beginPath();
  ctx.moveTo(0, y + 62);
  for (let x = 0; x <= width + 50; x += 55) {
    ctx.lineTo(x, y + 67 + Math.sin(x * .017 + t * 1.4) * 10);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
  ctx.fillStyle = "#f2aa59";
  for (let i = 0; i < 9; i++) {
    const bx = ((i * 211 - cameraX * .18 + t * 20) % (width + 120)) - 60;
    const by = y + 96 + Math.sin(i * 5.2 + t) * 18;
    ctx.beginPath();
    ctx.ellipse(bx, by, 42 + (i % 3) * 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function groundY() { return Math.min(height * .74, height - 150); }

function drawConcourse() {
  const y = groundY();
  ctx.fillStyle = "#211820";
  ctx.fillRect(0, y + 16, width, height - y);
  poly([[0, y + 11], [width, y - 10], [width, y + 52], [0, y + 68]], "#3a2930", "#110c11", 4);
  ctx.fillStyle = "#b15b3e";
  ctx.fillRect(0, y + 12, width, 5);

  // tiled perspective and tiny employee forms blowing around
  ctx.strokeStyle = "rgba(223,163,98,.14)";
  ctx.lineWidth = 1;
  for (let x = -300; x < width + 300; x += 180) {
    ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x + 80, height); ctx.stroke();
  }
  for (let yy = y + 55; yy < height; yy += 44) {
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(width, yy); ctx.stroke();
  }

  const signs = [280, 920, 1900];
  for (const sx of signs) drawSign(worldToScreen(sx), y);
}

function drawSign(x: number, y: number) {
  if (x < -140 || x > width + 140) return;
  ctx.fillStyle = "#171218";
  ctx.fillRect(x - 3, y - 146, 6, 146);
  poly([[x - 74, y - 174], [x + 82, y - 185], [x + 72, y - 135], [x - 70, y - 128]], "#d8b06f", "#251721", 4);
  ctx.save();
  ctx.translate(x, y - 156);
  ctx.rotate(-.035);
  ctx.fillStyle = "#2b1922";
  ctx.font = "500 11px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(x < 500 ? "INTAKE 6C  →" : x < 1300 ? "NO RETURN QUEUE" : "←  ETHEREAL HR", 0, 0);
  ctx.restore();
}

function drawClipboardHuman(x: number, y: number, t: number) {
  const bob = Math.sin(t * 2.2) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  // shadow
  ctx.fillStyle = "rgba(10,6,9,.35)";
  ctx.beginPath(); ctx.ellipse(0, 6, 48, 10, 0, 0, Math.PI * 2); ctx.fill();
  // legs and shoes
  poly([[-22, -69], [-3, -69], [-8, -8], [-27, -7]], "#372433", "#171018", 3);
  poly([[4, -68], [24, -65], [31, -10], [11, -7]], "#4b2b37", "#171018", 3);
  poly([[-34, -12], [-7, -12], [-4, 0], [-38, 0]], "#171318");
  poly([[10, -12], [39, -9], [39, 1], [8, 0]], "#171318");
  // jacket
  poly([[-38, -154], [-20, -178], [23, -179], [43, -147], [26, -68], [-27, -69]], "#d06b48", "#26141d", 4);
  poly([[-20, -178], [0, -155], [23, -179], [11, -116], [-8, -116]], "#ee9a58");
  // arm + clipboard
  poly([[31, -153], [55, -111], [42, -103], [18, -139]], "#c85f42", "#26141d", 3);
  ctx.save(); ctx.translate(48, -102); ctx.rotate(-.14);
  ctx.fillStyle = "#f0d39b"; ctx.fillRect(-18, -24, 37, 49);
  ctx.strokeStyle = "#3b2530"; ctx.lineWidth = 2; ctx.strokeRect(-18, -24, 37, 49);
  ctx.fillStyle = "#7b3e3c"; ctx.fillRect(-8, -28, 17, 7);
  line([[-10, -12], [12, -12]], "#8a6b5d", 2); line([[-10, -3], [9, -3]], "#8a6b5d", 2); line([[-10, 6], [13, 6]], "#8a6b5d", 2);
  ctx.restore();
  // neck/head/hair
  poly([[-10, -188], [12, -188], [13, -170], [-8, -170]], "#a95a46");
  poly([[-23, -224], [-4, -239], [21, -224], [18, -188], [-4, -176], [-25, -194]], "#bd6f54", "#26141d", 4);
  poly([[-27, -217], [-12, -239], [15, -235], [27, -218], [14, -212], [7, -226], [-21, -213]], "#36202c");
  ctx.fillStyle = "#36202c"; ctx.beginPath(); ctx.arc(23, -229, 14, 0, Math.PI * 2); ctx.fill();
  // features
  poly([[-8, -209], [-1, -212], [2, -207], [-5, -205]], "#2b1821");
  line([[4, -192], [13, -194], [16, -199]], "#6c2f32", 2);
  // badge
  ctx.fillStyle = "#f5c671"; ctx.fillRect(-25, -146, 25, 16);
  ctx.fillStyle = "#2b1720"; ctx.font = "600 9px 'DM Mono'"; ctx.fillText("HR", -20, -135);
  ctx.restore();
}

function drawDog(x: number, y: number, t: number) {
  const bob = Math.sin(t * 4) * 2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(10,6,9,.35)"; ctx.beginPath(); ctx.ellipse(0, 5, 62, 11, 0, 0, Math.PI * 2); ctx.fill();
  // wagging tail
  const wag = Math.sin(t * 8) * .38;
  ctx.save(); ctx.translate(45, -62); ctx.rotate(wag);
  poly([[0, 0], [29, -39], [43, -36], [23, 1]], "#cc814a", "#24151c", 4); ctx.restore();
  // legs
  poly([[-37, -47], [-17, -46], [-20, 0], [-39, 0]], "#b96842", "#24151c", 3);
  poly([[20, -47], [39, -43], [40, 0], [20, 0]], "#c87845", "#24151c", 3);
  // body and vest
  poly([[-47, -92], [28, -99], [52, -72], [40, -36], [-35, -37], [-58, -62]], "#d58b4d", "#24151c", 4);
  poly([[-25, -97], [25, -99], [45, -70], [35, -50], [-22, -49]], "#7d3c43", "#24151c", 3);
  poly([[-20, -90], [5, -90], [1, -67], [-24, -68]], "#edb85f");
  ctx.fillStyle = "#30202a"; ctx.font = "600 10px 'DM Mono'"; ctx.fillText("L2", -17, -75);
  // neck/head
  poly([[-49, -95], [-38, -126], [-8, -141], [22, -121], [26, -89], [-4, -71], [-38, -78]], "#d78a4e", "#24151c", 4);
  // ears
  poly([[-42, -122], [-48, -170], [-15, -139]], "#b86443", "#24151c", 4);
  poly([[-5, -141], [18, -172], [20, -121]], "#c67345", "#24151c", 4);
  poly([[-39, -132], [-43, -158], [-25, -140]], "#6f3940");
  poly([[3, -141], [15, -160], [15, -131]], "#6f3940");
  // muzzle and face
  poly([[-34, -111], [-10, -121], [14, -108], [5, -88], [-24, -88]], "#edb86e", "#24151c", 3);
  poly([[7, -111], [18, -104], [7, -98], [0, -104]], "#24151c");
  poly([[-28, -125], [-19, -131], [-12, -124], [-20, -120]], "#24151c");
  line([[-13, -94], [-5, -89], [3, -94]], "#7b3335", 2);
  ctx.restore();
}

function drawNix(x: number, y: number, t: number) {
  const stride = player.walking ? Math.sin(t * 10) : 0;
  const bob = player.walking ? Math.abs(Math.sin(t * 10)) * -3 : Math.sin(t * 1.6) * 1.2;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(player.facing, 1);
  ctx.fillStyle = "rgba(8,4,8,.42)"; ctx.beginPath(); ctx.ellipse(0, 7, 51, 11, 0, 0, Math.PI * 2); ctx.fill();
  // long, deliberate legs
  poly([[-25, -84], [-4, -84], [-7 + stride * 8, -5], [-30 + stride * 9, -4]], "#121217", "#08080b", 3);
  poly([[1, -84], [24, -82], [31 - stride * 8, -5], [7 - stride * 9, -4]], "#1b1920", "#08080b", 3);
  // angular coat/body
  poly([[-38, -198], [-18, -222], [19, -220], [39, -194], [31, -87], [4, -70], [-31, -88]], "#121218", "#08080b", 4);
  poly([[-34, -191], [-56, -125], [-44, -118], [-17, -174]], "#17171d", "#08080b", 3);
  poly([[33, -190], [48, -127], [36, -119], [17, -173]], "#0d0e13", "#08080b", 3);
  // coat facets
  poly([[-18, -216], [1, -177], [19, -220], [29, -100], [2, -77]], "#1e1d24");
  poly([[-34, -193], [1, -177], [-29, -91]], "#090b0f");
  // pointed head and geometric mask
  poly([[-22, -226], [-2, -284], [22, -226], [17, -193], [-17, -194]], "#111218", "#07080b", 4);
  poly([[-16, -226], [0, -244], [17, -225], [8, -207], [-8, -207]], "#29262c");
  poly([[-13, -225], [-4, -232], [-1, -223], [-7, -218]], "#e3964f");
  poly([[3, -223], [7, -232], [14, -225], [8, -218]], "#e3964f");
  line([[-4, -211], [4, -211]], "#8b664e", 2);
  // L6 badge as one warm interruption
  poly([[18, -173], [37, -168], [34, -148], [16, -153]], "#e89a4d");
  ctx.save(); ctx.translate(22, -156); ctx.scale(player.facing, 1); ctx.fillStyle = "#20131b"; ctx.font = "600 9px 'DM Mono'"; ctx.fillText("L6", 0, 0); ctx.restore();
  ctx.restore();
}

function drawLabels(y: number) {
  for (const npc of npcs) {
    const x = worldToScreen(npc.x);
    if (x < -120 || x > width + 120) continue;
    const labelY = y - (npc.id === "maribel" ? 278 : 210);
    ctx.textAlign = "center";
    ctx.font = "600 12px 'DM Mono', monospace";
    ctx.fillStyle = "rgba(19,12,18,.82)";
    const labelWidth = ctx.measureText(npc.name.toUpperCase()).width + 24;
    ctx.fillRect(x - labelWidth / 2, labelY - 16, labelWidth, 25);
    ctx.fillStyle = "#f3d4a3";
    ctx.fillText(npc.name.toUpperCase(), x, labelY + 1);
    if (nearbyNpc?.id === npc.id && !activeNpc) {
      ctx.strokeStyle = "#ef944f"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 20, 78 + Math.sin(performance.now() * .004) * 3, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    }
  }
}

function render(now: number) {
  const t = now / 1000;
  const maxCamera = Math.max(0, WORLD_WIDTH - width);
  cameraX += (Math.max(0, Math.min(maxCamera, player.x - width * .5)) - cameraX) * .1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawSky(t);
  drawMountains();
  drawLava(t);
  drawConcourse();
  const y = groundY();
  drawClipboardHuman(worldToScreen(npcs[0].x), y, t);
  drawDog(worldToScreen(npcs[1].x), y, t);
  drawNix(worldToScreen(player.x), y, t);
  drawLabels(y);
  requestAnimationFrame(tick);
}

function nearestNpc(): Npc | null {
  let best: Npc | null = null;
  let distance = TALK_RANGE;
  for (const npc of npcs) {
    const d = Math.abs(player.x - npc.x);
    if (d < distance) { best = npc; distance = d; }
  }
  return best;
}

function updatePrompt() {
  nearbyNpc = nearestNpc();
  prompt.hidden = !nearbyNpc || !!activeNpc;
  if (nearbyNpc) promptText.textContent = `Speak to ${nearbyNpc.name}`;
}

function tick(now: number) {
  const dt = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  let direction = 0;
  if (!activeNpc) {
    if (keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("touch-left")) direction -= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD") || keys.has("touch-right")) direction += 1;
  }
  player.walking = direction !== 0;
  if (direction) {
    player.facing = direction;
    player.x = Math.max(130, Math.min(WORLD_WIDTH - 130, player.x + direction * WALK_SPEED * dt));
  }
  updatePrompt();
  render(now);
}

function talk() {
  if (activeNpc) { advanceDialogue(); return; }
  const npc = nearestNpc();
  if (!npc) return;
  activeNpc = npc;
  lineIndex = 0;
  shell.classList.add("is-talking");
  showDialogueLine();
}

function showDialogueLine() {
  if (!activeNpc) return;
  const line = activeNpc.dialogue[lineIndex];
  speakerEl.textContent = line.speaker;
  textEl.textContent = line.text;
  optionEl.textContent = line.option;
  dialogueEl.hidden = false;
  prompt.hidden = true;
  optionEl.focus({ preventScroll: true });
}

function advanceDialogue() {
  if (!activeNpc) return;
  lineIndex += 1;
  if (lineIndex < activeNpc.dialogue.length) {
    showDialogueLine();
    return;
  }
  met.add(activeNpc.id);
  document.querySelector(`[data-progress="${activeNpc.id}"]`)?.classList.add("done");
  activeNpc = null;
  dialogueEl.hidden = true;
  shell.classList.remove("is-talking");
  updatePrompt();
  canvas.focus();
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  if ((event.code === "KeyE" || event.code === "Enter" || event.code === "Space") && !event.repeat) talk();
  keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
optionEl.addEventListener("click", advanceDialogue);
document.querySelector<HTMLButtonElement>("[data-talk]")!.addEventListener("click", talk);

document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((button) => {
  const key = `touch-${button.dataset.move}`;
  const start = (event: PointerEvent) => { event.preventDefault(); button.setPointerCapture(event.pointerId); keys.add(key); };
  const stop = () => keys.delete(key);
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
});

if (new URLSearchParams(location.search).get("debug") === "true") {
  const panel = document.createElement("div");
  panel.className = "debug-panel";
  panel.innerHTML = `<button type="button" data-jump="570">Jump to Maribel</button><button type="button" data-jump="1580">Jump to Bix</button>`;
  panel.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-jump]");
    if (target) player.x = Number(target.dataset.jump) + 80;
  });
  shell.append(panel);
}

resize();
requestAnimationFrame((now) => { lastTime = now; tick(now); });
