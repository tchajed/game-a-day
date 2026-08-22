import * as THREE from "three";
import { createHiker, poseHiker } from "./hikers";
import "./style.css";

type Tone = "trail" | "odd";
type Surprise = { id: string; x: number; title: string; note: string; tone: Tone };

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

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="game">
    <canvas aria-label="A low-poly 3D mountain trail"></canvas>
    <div class="vignette"></div>
    <header class="brand"><h1>Hike.</h1><span>take the strange way up</span></header>
    <div class="top-controls">
      <a class="character-link" href="${import.meta.env.BASE_URL}character.html" aria-label="Open character model viewer" title="Choose hiker">Hiker</a>
      <button class="icon-button music" aria-label="Turn music on" title="Music">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
      </button>
      <div class="engine-badge"><span>render</span><strong>Three.js · 3D</strong></div>
    </div>
    <div class="progress-wrap" aria-label="Hike progress">
      <div class="progress-track"><div class="progress-fill"></div><i class="progress-boot"></i></div>
      <div class="progress-caption"><span class="biome-label">young woods</span><span class="percent">0%</span></div>
    </div>
    <button class="walk-button" aria-label="Hold to hike">
      <svg viewBox="0 0 32 28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4c2 5 2 10 0 14-1 2 0 5 3 6 3 1 7-1 8-4 1-2-1-3-3-4-2-1-2-4-1-7l1-5"/><path d="M18 7c4 1 7 4 8 8 1 3-1 6-4 6h-4M8 14h7"/></svg>
      <span>hold</span>
    </button>
    <div class="prompt"><strong>Hold to hike.</strong><small>Watch the woods. Click what you notice.</small></div>
    <aside class="toast" aria-hidden="true"><div class="toast-icon">✦</div><small>Noticed</small><b></b><p></p></aside>
    <section class="finish-card" hidden>
      <div class="eyebrow">Summit log · <span class="found-count"></span></div>
      <h2>You made it.</h2>
      <p>You walked 720 metres from the young woods to the snowline.</p>
      <button class="again">Hike it again</button>
    </section>
    <div class="loading"><i></i><span>Growing the forest…</span></div>
  </main>`;

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const game = document.querySelector<HTMLElement>(".game")!;
const walkButton = document.querySelector<HTMLButtonElement>(".walk-button")!;
const prompt = document.querySelector<HTMLElement>(".prompt")!;
const toast = document.querySelector<HTMLElement>(".toast")!;
const progressFill = document.querySelector<HTMLElement>(".progress-fill")!;
const progressBoot = document.querySelector<HTMLElement>(".progress-boot")!;
const progressCaption = document.querySelector<HTMLElement>(".percent")!;
const biomeLabel = document.querySelector<HTMLElement>(".biome-label")!;
const musicButton = document.querySelector<HTMLButtonElement>(".music")!;
const finishCard = document.querySelector<HTMLElement>(".finish-card")!;
const loading = document.querySelector<HTMLElement>(".loading")!;

const C = {
  sky: 0xe6b866, fog: 0xe9c98b, ink: 0x26382f, cream: 0xf4e4bc, red: 0xd95543,
  blue: 0x4c7e89, darkBlue: 0x315965, trunk: 0x504639, pine: 0x4f7255,
  pineLight: 0x6f8a61, moss: 0x78835c, stone: 0x82877b, snow: 0xf4f1e6,
  gold: 0xf3cf72, water: 0x66a2ab, black: 0x1e2d28,
};

const mat = (color: number, roughness = .9, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity: emissive ? .22 : 0 });
const mats = {
  ink: mat(C.ink), cream: mat(C.cream), red: mat(C.red), blue: mat(C.blue), darkBlue: mat(C.darkBlue),
  trunk: mat(C.trunk), pine: mat(C.pine), pineLight: mat(C.pineLight), moss: mat(C.moss), stone: mat(C.stone),
  snow: mat(C.snow), gold: mat(C.gold, .75, C.gold), water: new THREE.MeshStandardMaterial({ color: C.water, roughness: .25, transparent: true, opacity: .82 }),
  black: mat(C.black), white: mat(0xfff9e8),
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.sky);
scene.fog = new THREE.FogExp2(C.fog, .0125);
const camera = new THREE.PerspectiveCamera(46, 1, .1, 240);
camera.position.set(0, 7, -12);

scene.add(new THREE.HemisphereLight(0xffedc5, 0x445342, 2.2));
const sun = new THREE.DirectionalLight(0xffefd0, 3.2);
sun.position.set(-35, 70, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -55; sun.shadow.camera.right = 55; sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 150;
sun.shadow.bias = -.00045;
scene.add(sun);

const TRAIL_LENGTH = 720;
const WALK_SPEED = 1150 / (8 * 60);
const routeTurns = [0, -18, 36, 78, 24, -64, -88, -6, 76, 98, 18, -82, -58, 42, 82, 12, -24];
const vistaStations = [207, 441, 636];
const surpriseSides: Record<string, number> = {
  marker: -7, mushrooms: 7, cloud: 6, squirrel: -8, bird: 8, creek: -1, trash: 7,
  deer: -10, twins: 9, cairn: 7, door: -8, flowers: 8, choir: 7, fox: -9,
  waterfall: -9, bridge: 0, moth: 6, marmot: 8, teatable: -8, lake: 9, boot: -3, flag: 7,
};

function seeded(n: number) { const x = Math.sin(n * 91.931 + 17.13) * 43758.5453; return x - Math.floor(x); }
function smoothstep(from: number, to: number, value: number) { const t = THREE.MathUtils.clamp((value - from) / (to - from), 0, 1); return t * t * (3 - 2 * t); }
function elevation(x: number) { return x * .17 + Math.sin(x * .017) * 16 + Math.sin(x * .051) * 5; }
function routeCenter(station: number) {
  const position = THREE.MathUtils.clamp(station / TRAIL_LENGTH * (routeTurns.length - 1), 0, routeTurns.length - 1);
  const i = Math.floor(position), t = position - i;
  const a = routeTurns[Math.max(0, i - 1)], b = routeTurns[i], c = routeTurns[Math.min(routeTurns.length - 1, i + 1)], d = routeTurns[Math.min(routeTurns.length - 1, i + 2)];
  return .38 * .5 * ((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t*t*t);
}
function terrainHeight(x: number, z: number) {
  const centre = routeCenter(z);
  const crossSlope = (centre - x) * .045;
  const texture = Math.sin(x*.17 + z*.043)*.24 + Math.sin(x*.07-z*.061)*.18;
  return elevation(z) * .16 + crossSlope + texture;
}
function routePoint(station: number, lateral = 0, lift = 0) {
  const x0 = routeCenter(station), dx = (routeCenter(station + .5) - routeCenter(station - .5));
  const right = new THREE.Vector2(1, -dx).normalize();
  const x = x0 + right.x * lateral, z = station + right.y * lateral;
  return new THREE.Vector3(x, terrainHeight(x, z) + .16 + lift, z);
}
function trailPhase(station: number) {
  const t = station / TRAIL_LENGTH;
  return t < .24 ? "young woods" : t < .5 ? "old-growth forest" : t < .74 ? "cloud forest" : "snowline";
}
function vistaAmount(station: number) { return vistaStations.reduce((v,c) => Math.max(v, 1-smoothstep(18,55,Math.abs(station-c))), 0); }
function cliffOpening(station: number) { return vistaStations.reduce((v,c) => Math.max(v, 1-smoothstep(34,95,Math.abs(station-c))), 0); }

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, cast = true, receive = true) {
  const m = new THREE.Mesh(geometry, material); m.castShadow = cast; m.receiveShadow = receive; return m;
}
function addPart(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number,number,number], scale: [number,number,number] = [1,1,1], rotation: [number,number,number] = [0,0,0]) {
  const m = mesh(geometry, material); m.position.set(...position); m.scale.set(...scale); m.rotation.set(...rotation); group.add(m); return m;
}
const boxGeo = new THREE.BoxGeometry(1,1,1);
const sphereGeo = new THREE.IcosahedronGeometry(1,1);
const ballGeo = new THREE.SphereGeometry(1,10,7);
const cylinderGeo = new THREE.CylinderGeometry(1,1,1,7);
const coneGeo = new THREE.ConeGeometry(1,1,7);
const torusGeo = new THREE.TorusGeometry(1,.12,6,16);

function buildTerrain() {
  const geo = new THREE.PlaneGeometry(270, 820, 54, 164);
  geo.rotateX(-Math.PI/2); geo.translate(15,0,365);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), z=pos.getZ(i), y=terrainHeight(x,z); pos.setY(i,y);
    const snow=smoothstep(490,610,z), noise=seeded(Math.floor(x*2+z*7));
    color.set(snow>.15 ? C.snow : noise>.55 ? C.moss : 0x8d9066);
    if (snow>0 && snow<1) color.lerp(new THREE.Color(C.snow),snow);
    color.offsetHSL(0,0,(noise-.5)*.045); colors.push(color.r,color.g,color.b);
  }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals();
  const ground=mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}),false,true);
  scene.add(ground);

  const pathGeo=new THREE.BufferGeometry(), positions:number[]=[], pathColors:number[]=[];
  for(let z=-12;z<TRAIL_LENGTH;z+=2){
    const a=routePoint(z,-3.4),b=routePoint(z,3.4),c=routePoint(z+2,-3.4),d=routePoint(z+2,3.4);
    for(const p of [a,b,c,b,d,c])positions.push(p.x,p.y+.04,p.z);
    const snow=smoothstep(525,640,z), pc=new THREE.Color(C.cream).lerp(new THREE.Color(0xdde4da),snow*.5);
    for(let i=0;i<6;i++)pathColors.push(pc.r,pc.g,pc.b);
  }
  pathGeo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  pathGeo.setAttribute("color",new THREE.Float32BufferAttribute(pathColors,3)); pathGeo.computeVertexNormals();
  scene.add(mesh(pathGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}),false,true));

  // Soft trail-edge stones make the path readable through the ground fog.
  const pebbleGeo=new THREE.DodecahedronGeometry(.28,0), matrices:THREE.Matrix4[]=[], colors2:THREE.Color[]=[];
  for(let z=7;z<TRAIL_LENGTH;z+=5){for(const side of [-1,1]){if(seeded(z*3+side)<.44)continue;const p=routePoint(z+(seeded(z+side)-.5)*2,side*(3.7+seeded(z*5)*.7));p.y=terrainHeight(p.x,p.z)+.22;const s=.45+seeded(z*9+side)*.8;matrices.push(new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(new THREE.Euler(seeded(z)*2,seeded(z+2)*2,0)),new THREE.Vector3(s,.5*s,s)));colors2.push(new THREE.Color(z>540?0xaeb6ae:C.stone));}}
  const pebbles=new THREE.InstancedMesh(pebbleGeo,mats.stone,matrices.length); matrices.forEach((m,i)=>{pebbles.setMatrixAt(i,m);pebbles.setColorAt(i,colors2[i]);}); pebbles.receiveShadow=true;pebbles.castShadow=true;pebbles.computeBoundingSphere();scene.add(pebbles);
}

function buildForest() {
  type Tree={p:THREE.Vector3;s:number;c:THREE.Color;snow:boolean}; const trees:Tree[]=[];
  for(let z=4;z<TRAIL_LENGTH-8;z+=7){
    for(const side of [-1,1])for(let row=0;row<4;row++){
      const seed=z*19+side*31+row*103, opening=side>0?cliffOpening(z):0;
      if(opening>.1&&seeded(seed+9)<opening*(row?.98:.78))continue;
      if(seeded(seed)<.15)continue;
      const lateral=side*(8.5+row*10+seeded(seed+4)*9),p=routePoint(z+(seeded(seed+8)-.5)*5,lateral);
      p.y=terrainHeight(p.x,p.z); const alpine=smoothstep(525,690,z),s=(3.7+seeded(seed+2)*2.7)*(1-alpine*.38);
      const c=new THREE.Color(seeded(seed+5)>.52?C.pine:C.pineLight);c.lerp(new THREE.Color(0x65755d),alpine*.35);trees.push({p,s,c,snow:z>510&&seeded(seed+3)>.25});
    }
  }
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.28,1,6),mats.trunk,trees.length);
  const crownGeo=new THREE.ConeGeometry(1,2,7), crown1=new THREE.InstancedMesh(crownGeo,mats.pine,trees.length),crown2=new THREE.InstancedMesh(crownGeo,mats.pine,trees.length);
  const snowy=trees.filter(t=>t.snow), snowCaps=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1.15,7),mats.snow,snowy.length);
  let snowIndex=0;
  trees.forEach((t,i)=>{
    const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),seeded(i)*Math.PI*2);
    trunk.setMatrixAt(i,new THREE.Matrix4().compose(t.p.clone().add(new THREE.Vector3(0,t.s*.46,0)),q,new THREE.Vector3(t.s*.11,t.s*.92,t.s*.11)));
    crown1.setMatrixAt(i,new THREE.Matrix4().compose(t.p.clone().add(new THREE.Vector3(0,t.s*.82,0)),q,new THREE.Vector3(t.s*.48,t.s*.55,t.s*.48)));
    crown2.setMatrixAt(i,new THREE.Matrix4().compose(t.p.clone().add(new THREE.Vector3(0,t.s*1.25,0)),q,new THREE.Vector3(t.s*.36,t.s*.48,t.s*.36)));
    crown1.setColorAt(i,t.c);crown2.setColorAt(i,t.c.clone().offsetHSL(0,0,.035));
    if(t.snow){snowCaps.setMatrixAt(snowIndex++,new THREE.Matrix4().compose(t.p.clone().add(new THREE.Vector3(0,t.s*1.43,0)),q,new THREE.Vector3(t.s*.27,t.s*.23,t.s*.27)));}
  });
  for(const inst of [trunk,crown1,crown2,snowCaps]){inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}

  const rocks:THREE.Matrix4[]=[],shrubs:THREE.Matrix4[]=[];
  for(let z=5;z<TRAIL_LENGTH;z+=4){for(const side of [-1,1]){const seed=z*41+side;if(seeded(seed)>.43){const p=routePoint(z,side*(5+seeded(seed+2)*25));p.y=terrainHeight(p.x,p.z)+.14;const s=.25+seeded(seed+8)*.65;rocks.push(new THREE.Matrix4().compose(p,new THREE.Quaternion(),new THREE.Vector3(s,s*.55,s)));}if(z<625&&seeded(seed+5)>.58){const p=routePoint(z+1,side*(6+seeded(seed+7)*27));p.y=terrainHeight(p.x,p.z)+.3;const s=.35+seeded(seed+4)*.7;shrubs.push(new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),seeded(seed)*6),new THREE.Vector3(s,s,s)));}}}
  const rockMesh=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),mats.stone,rocks.length);rocks.forEach((m,i)=>rockMesh.setMatrixAt(i,m));
  const shrubMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mats.pineLight,shrubs.length);shrubs.forEach((m,i)=>shrubMesh.setMatrixAt(i,m));
  for(const inst of [rockMesh,shrubMesh]){inst.castShadow=true;inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}
}

function buildMountainsAndSky() {
  for(const centre of vistaStations){for(let i=0;i<4;i++){
    const peak=mesh(new THREE.ConeGeometry(20+i*3,38+i*8,5),new THREE.MeshStandardMaterial({color:i%2?0x738a75:0x93a183,roughness:1,flatShading:true}),false,true);
    const anchor=routePoint(centre+60+i*10,42+i*16);
    peak.position.set(anchor.x,terrainHeight(anchor.x,anchor.z)+8,anchor.z);peak.rotation.y=seeded(centre+i)*2;scene.add(peak);
    const cap=mesh(new THREE.ConeGeometry((20+i*3)*.43,(38+i*8)*.35,5),mats.snow,false,true);cap.position.set(peak.position.x,peak.position.y+(38+i*8)*.34,peak.position.z);cap.rotation.y=peak.rotation.y;scene.add(cap);
  }}
  const sunDisc=mesh(new THREE.SphereGeometry(5,20,12),new THREE.MeshBasicMaterial({color:0xffedb0}),false,false);sunDisc.position.set(55,48,120);scene.add(sunDisc);
  for(let i=0;i<7;i++){const cloud=new THREE.Group();for(let p=0;p<4;p++)addPart(cloud,sphereGeo,mats.white,[(p-1.5)*3,Math.sin(p)*.4,0],[2.8,1.25,1.1]);cloud.position.set(-70+i*29,28+(i%3)*5,50+i*86);cloud.userData.speed=.25+seeded(i)*.25;scene.add(cloud);skyClouds.push(cloud);}
}
const skyClouds:THREE.Group[]=[];

function miniTree(group:THREE.Group,x:number,z:number,scale=1){addPart(group,cylinderGeo,mats.trunk,[x,.65,z],[.14,.9,.14]);addPart(group,coneGeo,mats.pine,[x,1.55,z],[.8,1.5,.8]);addPart(group,coneGeo,mats.pineLight,[x,2.35,z],[.58,1.25,.58]);}
function eye(group:THREE.Group,x:number,y:number,z:number){addPart(group,sphereGeo,mats.black,[x,y,z],[.08,.08,.08],undefined).castShadow=false;}
function animal(group:THREE.Group,color:THREE.Material,tail=false){addPart(group,ballGeo,color,[0,.7,0],[.78,.48,.4]);addPart(group,sphereGeo,color,[.65,1.05,0],[.35,.35,.32]);addPart(group,coneGeo,color,[.48,1.42,-.18],[.12,.35,.12],[0,0,-.2]);addPart(group,coneGeo,color,[.48,1.42,.18],[.12,.35,.12],[0,0,-.2]);for(const z of [-.23,.23])for(const x of [-.4,.4])addPart(group,cylinderGeo,mats.ink,[x,.27,z],[.06,.45,.06]);eye(group,.89,1.11,-.18);if(tail)addPart(group,torusGeo,color,[-.72,.91,0],[.42,.55,.42],[Math.PI/2,0,0]);}

function makeDiscovery(s:Surprise){
  const g=new THREE.Group(), red=mats.red, blue=mats.blue, cream=mats.cream;
  if(s.id==="marker"){addPart(g,cylinderGeo,mats.trunk,[0,1,0],[.12,1,.12]);addPart(g,boxGeo,cream,[0,1.85,0],[1.25,.72,.16]);addPart(g,boxGeo,blue,[0,1.88,-.1],[.9,.18,.05]);}
  else if(s.id==="mushrooms"){[-.55,0,.55].forEach((x,i)=>{addPart(g,cylinderGeo,cream,[x,.25,0],[.09,.3+.1*i,.09]);addPart(g,ballGeo,i===1?red:mats.gold,[x,.55+.1*i,0],[.35,.16,.35]);});}
  else if(s.id==="cloud"){for(let x=-1;x<=1;x++)for(let y=0;y<=1;y++)addPart(g,boxGeo,mats.white,[x*.8,5+y*.65,0],[.82,.68,.7]);const frame=mesh(new THREE.BoxGeometry(3,2.2,1.1),new THREE.MeshBasicMaterial({color:C.red,wireframe:true}),false,false);frame.position.y=5.35;g.add(frame);}
  else if(s.id==="squirrel"){animal(g,red,true);g.scale.setScalar(.75);}
  else if(s.id==="bird"){addPart(g,ballGeo,blue,[0,3,0],[.48,.3,.3]);addPart(g,coneGeo,red,[.58,3,0],[.25,.45,.2],[0,0,-Math.PI/2]);addPart(g,coneGeo,blue,[0,3,.42],[.4,.7,.15],[Math.PI/2,0,.7]);eye(g,.31,3.1,-.25);}
  else if(s.id==="creek"){for(let i=-3;i<=3;i++)addPart(g,boxGeo,mats.water,[i*.75,.08,Math.sin(i)*.45],[.62,.08,1.1],[0,-.2*i,0]);}
  else if(s.id==="trash"){addPart(g,new THREE.IcosahedronGeometry(1,0),red,[0,.45,0],[.7,.45,.55],[0,.4,.2]);}
  else if(s.id==="deer"){animal(g,mat(0x9d6245));g.scale.setScalar(1.25);addPart(g,cylinderGeo,mats.trunk,[1.05,1.85,0],[.07,.55,.07],[0,0,-.35]);}
  else if(s.id==="twins"){miniTree(g,-.65,0,.7);miniTree(g,.65,0,.7);}
  else if(s.id==="cairn"){for(let i=0;i<5;i++)addPart(g,sphereGeo,i%2?mats.stone:mats.ink,[0,.18+i*.28,0],[.65-i*.1,.19,.48-i*.06],[0,i*.4,0]);}
  else if(s.id==="door"){addPart(g,boxGeo,mats.stone,[0,.75,.2],[2,1.5,.55]);addPart(g,boxGeo,red,[0,.63,-.15],[.65,1.15,.12]);addPart(g,sphereGeo,mats.gold,[.22,.65,-.29],[.07,.07,.07]);}
  else if(s.id==="flowers"){for(let i=0;i<7;i++){const x=(i-3)*.3,z=(i%2)*.32;addPart(g,cylinderGeo,mats.pine,[x,.35,z],[.025,.35,.025]);addPart(g,sphereGeo,i%2?red:mats.gold,[x,.73,z],[.14,.14,.14]);}}
  else if(s.id==="choir"){[-.8,0,.8].forEach((x,i)=>{addPart(g,sphereGeo,i===1?blue:mats.stone,[x,.65,0],[.55,.75+i*.12,.5]);eye(g,x-.14,.8,-.47);eye(g,x+.14,.8,-.47);addPart(g,torusGeo,mats.black,[x,.55,-.48],[.12,.1,.12],[Math.PI/2,0,0]);});}
  else if(s.id==="fox"){animal(g,red,true);g.scale.setScalar(.9);}
  else if(s.id==="waterfall"){addPart(g,new THREE.DodecahedronGeometry(1,0),mats.stone,[0,1,0],[1.5,1.4,1]);for(let i=0;i<5;i++)addPart(g,sphereGeo,mats.water,[.15,1.2+i*.55,0],[.22,.32,.22]);}
  else if(s.id==="bridge"){for(let i=-2;i<=2;i++)addPart(g,cylinderGeo,mats.trunk,[i*.46,.24,0],[.15,2.25,.15],[Math.PI/2,0,0]);}
  else if(s.id==="moth"){addPart(g,sphereGeo,mats.gold,[0,3,0],[.72,.72,.3]);addPart(g,ballGeo,mats.white,[-.72,3,0],[.8,.48,.15],[0,0,-.35]);addPart(g,ballGeo,mats.white,[.72,3,0],[.8,.48,.15],[0,0,.35]);addPart(g,cylinderGeo,mats.ink,[0,3,0],[.06,.55,.06]);}
  else if(s.id==="marmot"){addPart(g,ballGeo,mat(0x9b6848),[0,.7,0],[.65,.9,.55]);addPart(g,sphereGeo,mat(0x9b6848),[0,1.45,0],[.48,.48,.45]);eye(g,-.16,1.52,-.4);eye(g,.16,1.52,-.4);}
  else if(s.id==="teatable"){addPart(g,boxGeo,cream,[0,1,0],[2,.16,1.2]);for(const x of [-.75,.75])for(const z of [-.42,.42])addPart(g,cylinderGeo,mats.trunk,[x,.5,z],[.08,.5,.08]);addPart(g,cylinderGeo,blue,[0,1.25,0],[.28,.3,.28]);addPart(g,torusGeo,blue,[.3,1.3,0],[.2,.2,.2],[Math.PI/2,0,0]);}
  else if(s.id==="lake"){addPart(g,new THREE.CylinderGeometry(1,1,.08,24),mats.water,[0,.08,0],[2.3,1,1.2]);for(let i=0;i<3;i++)addPart(g,coneGeo,mats.stone,[-1.7+i*1.6,.55,.6],[.55,1,.55]);}
  else if(s.id==="boot"){addPart(g,boxGeo,red,[0,1.3,0],[.65,1.15,.65],[0,0,-.18]);addPart(g,ballGeo,red,[.45,.8,0],[.85,.4,.65]);}
  else if(s.id==="flag"){addPart(g,cylinderGeo,mats.ink,[0,2,0],[.08,2,.08]);const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.05,3.8,0),new THREE.Vector3(1.8,3.45,0),new THREE.Vector3(.05,3.05,0)]);geo.setIndex([0,1,2]);geo.computeVertexNormals();g.add(mesh(geo,new THREE.MeshStandardMaterial({color:C.red,side:THREE.DoubleSide}),true,false));}

  const glint=mesh(new THREE.OctahedronGeometry(.16,0),mats.gold,false,false);
  glint.name="glint";glint.position.y=s.id==="cloud"?7:s.id==="bird"||s.id==="moth"?4.2:2.65;g.add(glint);
  const p=routePoint(s.x,surpriseSides[s.id]??7);p.y=terrainHeight(p.x,p.z)+.08;g.position.copy(p);
  const heading=Math.atan2(routeCenter(s.x+.5)-routeCenter(s.x-.5),1);g.rotation.y=heading+(surpriseSides[s.id]<0?Math.PI*.35:-Math.PI*.35);
  g.userData.discoveryId=s.id;g.userData.baseY=p.y;g.userData.phase=seeded(s.x)*6.28;
  g.traverse(o=>o.userData.discoveryId=s.id);scene.add(g);discoveryGroups.set(s.id,g);
}
const discoveryGroups=new Map<string,THREE.Group>();

const hiker = createHiker();
scene.add(hiker);

buildTerrain();buildMountainsAndSky();buildForest();surprises.forEach(makeDiscovery);

let progress=0,displayProgress=0,walking=false,finished=false,elapsed=0,lastTime=performance.now(),debugSpeed=1;
let completed=new Set<string>(),toastTimer=0,hoveredId:string|null=null;
const debug=new URLSearchParams(location.search).get("debug")==="true";
let musicOn=new URLSearchParams(location.search).get("music")!=="off",audio:AudioContext|null=null,musicTimer=0,noteIndex=0;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(-2,-2);
const cameraTarget=new THREE.Vector3(),cameraLook=new THREE.Vector3();

function updateCamera(dt:number){
  const behind=routePoint(displayProgress-10),ahead=routePoint(displayProgress+13);
  const side=routePoint(displayProgress-10,1.3).sub(behind);
  const ideal=behind.add(new THREE.Vector3(0,6.2,0)).add(side);
  const look=ahead.add(new THREE.Vector3(0,1.55,0));
  const ease=1-Math.exp(-dt*4.2);cameraTarget.lerp(ideal,ease);cameraLook.lerp(look,ease);camera.position.copy(cameraTarget);camera.lookAt(cameraLook);
  sun.position.copy(camera.position).add(new THREE.Vector3(-35,65,-25));sun.target.position.copy(look);scene.add(sun.target);
}
function updateHiker(){
  const p=routePoint(displayProgress);hiker.position.copy(p);hiker.rotation.y=Math.atan2(routeCenter(displayProgress+.5)-routeCenter(displayProgress-.5),1);
  const stride=walking?Math.sin(elapsed*9):0;poseHiker(hiker,stride);
}
function updateDiscoveries(){
  for(const s of surprises){const g=discoveryGroups.get(s.id)!;if(completed.has(s.id)){g.visible=false;continue;}const distance=Math.abs(s.x-displayProgress);g.visible=distance<105;const bob=(s.id==="cloud"||s.id==="bird"||s.id==="moth"||s.id==="boot")?Math.sin(elapsed*1.8+g.userData.phase)*.18:0;g.position.y=g.userData.baseY+bob;const glint=g.getObjectByName("glint");if(glint){glint.visible=distance<58;glint.rotation.y=elapsed*2.2;glint.rotation.z=elapsed*1.4;glint.scale.setScalar(.78+Math.sin(elapsed*3+g.userData.phase)*.2);}}
  skyClouds.forEach((c,i)=>{c.position.x+=Math.sin(elapsed*.08+i)*.001;c.rotation.y=Math.sin(elapsed*.05+i)*.08;});
}
function update(dt:number){
  if(walking&&!finished)progress=Math.min(TRAIL_LENGTH,progress+dt*WALK_SPEED*debugSpeed);
  displayProgress+=(progress-displayProgress)*(1-Math.exp(-dt*5));
  const percent=Math.min(100,Math.round(progress/TRAIL_LENGTH*100));progressFill.style.width=`${percent}%`;progressBoot.style.left=`${percent}%`;progressCaption.textContent=`${percent}%`;
  biomeLabel.textContent=vistaAmount(progress)>.62?"mountain overlook":trailPhase(progress);
  if(progress>12)prompt.classList.add("hidden");
  if(progress>=TRAIL_LENGTH-.5&&!finished){finished=true;walking=false;document.querySelector<HTMLElement>(".found-count")!.textContent=`${completed.size} of ${surprises.length} curiosities`;setTimeout(()=>finishCard.hidden=false,500);}
  (scene.fog as THREE.FogExp2).density=.0125-vistaAmount(displayProgress)*.0045;
  updateHiker();updateCamera(dt);updateDiscoveries();
}
function updateHover(){
  raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...discoveryGroups.values()].filter(g=>g.visible),true);
  hoveredId=null;for(const hit of hits){const id=hit.object.userData.discoveryId as string|undefined;if(id){const s=surprises.find(item=>item.id===id)!;if(Math.abs(s.x-progress)<80){hoveredId=id;break;}}}
  canvas.style.cursor=hoveredId?"pointer":"default";
}
function frame(now:number){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;elapsed+=dt;update(dt);updateHover();renderer.render(scene,camera);requestAnimationFrame(frame);}

function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<600?54:46;camera.updateProjectionMatrix();}
window.addEventListener("resize",resize);resize();
updateHiker();cameraTarget.copy(routePoint(-10)).add(new THREE.Vector3(1,6.2,0));cameraLook.copy(routePoint(13)).add(new THREE.Vector3(0,1.5,0));camera.position.copy(cameraTarget);camera.lookAt(cameraLook);
requestAnimationFrame(frame);requestAnimationFrame(()=>loading.classList.add("done"));

function collect(id:string){
  const surprise=surprises.find(s=>s.id===id);if(!surprise||completed.has(id)||Math.abs(progress-surprise.x)>80)return;
  completed.add(id);const group=discoveryGroups.get(id);if(group)group.visible=false;
  toast.querySelector<HTMLElement>("small")!.textContent=surprise.tone==="odd"?"Something strange":"Trail moment";toast.querySelector<HTMLElement>("b")!.textContent=surprise.title;toast.querySelector<HTMLElement>("p")!.textContent=surprise.note;
  toast.classList.add("show");toast.setAttribute("aria-hidden","false");prompt.classList.add("hidden");clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>{toast.classList.remove("show");toast.setAttribute("aria-hidden","true");prompt.innerHTML="<strong>Curiosity logged.</strong><small>Hold to keep hiking.</small>";prompt.classList.remove("hidden");},3300);ping(7+completed.size);
}
function pointerPosition(event:PointerEvent){const rect=canvas.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;}
canvas.addEventListener("pointermove",pointerPosition);canvas.addEventListener("pointerleave",()=>pointer.set(-2,-2));canvas.addEventListener("pointerdown",event=>{pointerPosition(event);updateHover();if(hoveredId){collect(hoveredId);event.preventDefault();}});

function ensureAudio(){if(!musicOn)return;if(!audio)audio=new AudioContext();if(audio.state==="suspended")void audio.resume();}
function ping(offset=0){if(!musicOn)return;ensureAudio();if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type="sine";osc.frequency.value=220*Math.pow(2,(offset%12)/12);gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.07,audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.7);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.72);}
function musicLoop(){if(musicOn&&audio){const notes=[0,4,7,11,7,4];ping(notes[noteIndex++%notes.length]);}musicTimer=window.setTimeout(musicLoop,900);}
function updateMusicButton(){musicButton.style.opacity=musicOn?"1":".48";musicButton.setAttribute("aria-label",musicOn?"Turn music off":"Turn music on");}
updateMusicButton();musicLoop();musicButton.addEventListener("click",()=>{musicOn=!musicOn;updateMusicButton();if(musicOn){ensureAudio();ping(7);}else if(audio)void audio.suspend();});

function setWalking(value:boolean){walking=value&&!finished;walkButton.classList.toggle("walking",walking);if(value)ensureAudio();}
walkButton.addEventListener("pointerdown",event=>{walkButton.setPointerCapture(event.pointerId);setWalking(true);});walkButton.addEventListener("pointerup",()=>setWalking(false));walkButton.addEventListener("pointercancel",()=>setWalking(false));
window.addEventListener("keydown",event=>{if(["ArrowUp","w","W"," "].includes(event.key)){event.preventDefault();setWalking(true);}});window.addEventListener("keyup",event=>{if(["ArrowUp","w","W"," "].includes(event.key))setWalking(false);});

document.querySelector<HTMLButtonElement>(".again")!.addEventListener("click",()=>{progress=0;displayProgress=0;completed=new Set();finished=false;finishCard.hidden=true;discoveryGroups.forEach(g=>g.visible=true);clearTimeout(toastTimer);toast.classList.remove("show");toast.setAttribute("aria-hidden","true");prompt.innerHTML="<strong>Hold to hike.</strong><small>Watch the woods. Click what you notice.</small>";prompt.classList.remove("hidden");});

if(debug){const panel=document.createElement("div");panel.className="debug-panel";panel.innerHTML='<span>walk speed</span><button class="active" data-speed="1">1×</button><button data-speed="2">2×</button><button data-speed="4">4×</button><i></i><button data-action="next">Next event</button><button data-action="all">Summit</button><button data-action="reset">Reset</button>';game.append(panel);panel.addEventListener("click",event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>("button");if(!button)return;const speed=Number(button.dataset.speed),action=button.dataset.action;if(speed){debugSpeed=speed;panel.querySelectorAll("[data-speed]").forEach(item=>item.classList.toggle("active",item===button));}if(action==="next"){const next=surprises.find(s=>!completed.has(s.id)&&s.x>progress+2);if(next)progress=next.x-15;}if(action==="all")progress=TRAIL_LENGTH;if(action==="reset")document.querySelector<HTMLButtonElement>(".again")!.click();});}

Object.assign(window,{__HIKE_DEBUG__:{getState:()=>({progress,completed:[...completed],engine:"three.js",hiker:"trail-scout",vista:vistaAmount(progress),speed:debugSpeed,biome:trailPhase(progress),hovered:hoveredId}),jumpTo:(id:string)=>{const s=surprises.find(item=>item.id===id);if(s)progress=s.x-15;},jumpToProgress:(station:number)=>{progress=THREE.MathUtils.clamp(station,0,TRAIL_LENGTH);},screenPosition:(id:string)=>{const g=discoveryGroups.get(id);if(!g)return null;const p=g.position.clone().add(new THREE.Vector3(0,1.2,0)).project(camera);return{x:(p.x+1)*canvas.clientWidth/2,y:(1-p.y)*canvas.clientHeight/2,visible:g.visible&&p.z<1};},collect,setSpeed:(speed:number)=>{if(debug&&[1,2,4].includes(speed))debugSpeed=speed;}}});
