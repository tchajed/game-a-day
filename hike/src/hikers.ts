import * as THREE from "three";

export const HIKER_STORAGE_KEY = "hike.character";

export const hikerAppearances = [
  {
    id: "trail-scout",
    name: "Trail Scout",
    role: "The familiar day hiker",
    description: "A compact jacket, knit cap, bedroll, and a square blue trail pack with its own mountain badge.",
    features: ["Classic pack", "Bedroll", "Beanie"],
  },
  {
    id: "ridge-runner",
    name: "Ridge Runner",
    role: "Fast, but still prepared",
    description: "A lean trail runner with bare knees, a sun visor, low shoes, and a compact red classic pack.",
    features: ["Classic pack", "Shorts", "Visor"],
  },
  {
    id: "creek-guide",
    name: "Creek Guide",
    role: "Knows every crossing",
    description: "A rain-shell regular with a square face, round glasses, cloudlike curls, and a bottle-pocket roll-top pack.",
    features: ["Roll-top pack", "Round glasses", "Rain shell"],
  },
  {
    id: "crag-climber",
    name: "Crag Climber",
    role: "Always finds the high route",
    description: "An angular helmet, climbing harness, sturdy boots, and a rope-loaded summit pack built for exposed ground.",
    features: ["Climbing pack", "Helmet", "Coiled rope"],
  },
] as const;

export type HikerId = (typeof hikerAppearances)[number]["id"];

type WalkPart = { joint: THREE.Group; direction: number; amplitude: number; baseZ?: number };
type HikerData = { walkParts: WalkPart[]; baseScale: number };

const palette = {
  ink: 0x26382f,
  cream: 0xf4e4bc,
  paper: 0xfff8e7,
  red: 0xd95543,
  blue: 0x4c7e89,
  darkBlue: 0x315965,
  moss: 0x667b59,
  gold: 0xf3cf72,
  trunk: 0x504639,
  skin: 0xc7845a,
  skinDark: 0x8f583f,
  slate: 0x667879,
};

const materials = Object.fromEntries(
  Object.entries(palette).map(([key, color]) => [
    key,
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true }),
  ]),
) as Record<keyof typeof palette, THREE.MeshStandardMaterial>;

const box = new THREE.BoxGeometry(1, 1, 1);
const sphere = new THREE.IcosahedronGeometry(1, 2);
const lowSphere = new THREE.IcosahedronGeometry(1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
const cone = new THREE.ConeGeometry(1, 1, 8);

function part(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  scale: [number, number, number] = [1, 1, 1],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

function joint(root: THREE.Group, position: [number, number, number], direction: number, amplitude = 0.62) {
  const pivot = new THREE.Group();
  pivot.position.set(...position);
  root.add(pivot);
  (root.userData as HikerData).walkParts.push({ joint: pivot, direction, amplitude, baseZ: 0 });
  return pivot;
}

function leg(root: THREE.Group, x: number, material: THREE.Material, direction: number, options: { length?: number; width?: number; boot?: THREE.Material; bare?: boolean; gaiter?: boolean } = {}) {
  const length = options.length ?? 0.72;
  const width = options.width ?? 0.105;
  const pivot = joint(root, [x, 0.83, 0], direction);
  part(pivot, cylinder, material, [0, -length / 2, 0], [width, length / 2, width]);
  if (options.bare) part(pivot, cylinder, materials.skin, [0, -length * 0.72, 0], [width * 0.8, length * 0.25, width * 0.8]);
  if (options.gaiter) part(pivot, cylinder, materials.cream, [0, -length * 0.77, 0], [width * 1.22, length * 0.25, width * 1.22]);
  part(pivot, box, options.boot ?? materials.ink, [0, -length - 0.02, 0.07], [width * 2.35, 0.14, 0.32]);
}

function arm(root: THREE.Group, x: number, material: THREE.Material, direction: number, options: { length?: number; width?: number; bend?: number; gloves?: boolean } = {}) {
  const length = options.length ?? 0.62;
  const width = options.width ?? 0.085;
  const pivot = joint(root, [x, 1.61, 0], direction, 0.52);
  pivot.rotation.z = x > 0 ? -0.1 : 0.1;
  part(pivot, cylinder, material, [0, -length / 2, 0], [width, length / 2, width], [options.bend ?? 0, 0, 0]);
  part(pivot, lowSphere, options.gloves ? materials.ink : materials.skin, [0, -length - 0.03, 0], [0.11, 0.11, 0.11]);
}

function head(root: THREE.Group, y = 2.05, scale = 0.34) {
  part(root, sphere, materials.skin, [0, y, 0], [scale, scale * 1.03, scale]);
  part(root, lowSphere, materials.ink, [-0.13, y + 0.02, scale * 0.9], [0.035, 0.035, 0.025]);
  part(root, lowSphere, materials.ink, [0.13, y + 0.02, scale * 0.9], [0.035, 0.035, 0.025]);
}

function pack(root: THREE.Group, y: number, material: THREE.Material, scale: [number, number, number]) {
  part(root, box, material, [0, y, -0.38], scale, [-0.05, 0, 0]);
  part(root, box, materials.ink, [0, y + scale[1] * 0.72, -0.42], [scale[0] * 0.84, 0.08, scale[2] * 1.04]);
}

function classicPack(root: THREE.Group, y: number, material: THREE.Material, scale = 1) {
  const back = -0.55;
  part(root, box, material, [0, y, -0.4], [0.5 * scale, 0.62 * scale, 0.25 * scale]);
  part(root, box, material, [0, y + 0.2 * scale, back - 0.11 * scale], [0.43 * scale, 0.19 * scale, 0.035]);
  part(root, box, materials.ink, [0, y - 0.02 * scale, back - 0.125 * scale], [0.4 * scale, 0.025, 0.025]);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.15 * scale, 0.025, 6, 12, Math.PI), materials.ink);
  handle.position.set(0, y + 0.66 * scale, -0.43);
  handle.rotation.z = Math.PI;
  handle.castShadow = true;
  root.add(handle);
  part(root, cylinder, materials.cream, [0, y + 0.08 * scale, back - 0.165 * scale], [0.13 * scale, 0.026, 0.13 * scale], [Math.PI / 2, 0, 0]);
  part(root, cone, materials.ink, [0, y + 0.09 * scale, back - 0.195 * scale], [0.075 * scale, 0.08 * scale, 0.022]);
}

function rollTopPack(root: THREE.Group) {
  pack(root, 1.43, materials.gold, [0.53, 0.72, 0.28]);
  part(root, cylinder, materials.cream, [0, 1.91, -0.41], [0.27, 0.27, 0.27], [0, 0, Math.PI / 2]);
  part(root, cylinder, materials.blue, [-0.58, 1.33, -0.43], [0.1, 0.28, 0.1]);
  part(root, box, materials.ink, [0, 1.54, -0.69], [0.32, 0.035, 0.035]);
}

function climbingPack(root: THREE.Group) {
  pack(root, 1.46, materials.moss, [0.57, 0.78, 0.3]);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 7, 20), materials.gold);
  rope.position.set(0, 1.4, -0.72);
  rope.castShadow = true;
  root.add(rope);
  part(root, box, materials.red, [0, 1.88, -0.56], [0.32, 0.1, 0.12]);
}

function createBase() {
  const root = new THREE.Group();
  root.userData = { walkParts: [], baseScale: 1 } satisfies HikerData;
  return root;
}

function trailScout() {
  const root = createBase();
  leg(root, -0.22, materials.ink, 1, { boot: materials.trunk });
  leg(root, 0.22, materials.ink, -1, { boot: materials.trunk });
  part(root, box, materials.red, [0, 1.34, 0], [0.64, 0.86, 0.43]);
  part(root, box, materials.cream, [0, 1.71, 0.23], [0.35, 0.12, 0.08]);
  arm(root, -0.42, materials.red, -1);
  arm(root, 0.42, materials.red, 1);
  head(root, 2.04, 0.34);
  part(root, cylinder, materials.red, [0, 2.33, 0], [0.34, 0.12, 0.34]);
  part(root, lowSphere, materials.red, [0, 2.43, 0], [0.11, 0.11, 0.11]);
  classicPack(root, 1.38, materials.blue, 1.04);
  part(root, cylinder, materials.gold, [0, 1.08, -0.53], [0.16, 0.4, 0.16], [0, 0, Math.PI / 2]);
  return root;
}

function ridgeRunner() {
  const root = createBase();
  (root.userData as HikerData).baseScale = 1.02;
  leg(root, -0.17, materials.skin, 1, { length: 0.78, width: 0.085, bare: true, boot: materials.blue });
  leg(root, 0.17, materials.skin, -1, { length: 0.78, width: 0.085, bare: true, boot: materials.blue });
  part(root, box, materials.ink, [0, 1.03, 0], [0.42, 0.28, 0.32]);
  part(root, box, materials.blue, [0, 1.42, 0], [0.48, 0.62, 0.3]);
  part(root, box, materials.gold, [0, 1.48, 0.31], [0.1, 0.42, 0.055]);
  for (const x of [-0.18, 0.18]) part(root, box, materials.darkBlue, [x, 1.42, 0.34], [0.12, 0.42, 0.07]);
  arm(root, -0.34, materials.skin, -1, { length: 0.56, width: 0.06, bend: -0.15 });
  arm(root, 0.34, materials.skin, 1, { length: 0.56, width: 0.06, bend: -0.15 });
  head(root, 2.0, 0.31);
  part(root, cylinder, materials.cream, [0, 2.25, 0], [0.33, 0.07, 0.33]);
  part(root, box, materials.cream, [0, 2.25, 0.3], [0.36, 0.04, 0.25], [-0.08, 0, 0]);
  classicPack(root, 1.43, materials.red, 0.86);
  return root;
}

function creekGuide() {
  const root = createBase();
  leg(root, -0.21, materials.darkBlue, 1, { width: 0.1, boot: materials.trunk });
  leg(root, 0.21, materials.darkBlue, -1, { width: 0.1, boot: materials.trunk });
  part(root, box, materials.gold, [0, 1.34, 0], [0.62, 0.82, 0.42]);
  part(root, box, materials.blue, [0, 1.34, 0.43], [0.48, 0.08, 0.055]);
  arm(root, -0.43, materials.gold, -1, { length: 0.62 });
  arm(root, 0.43, materials.gold, 1, { length: 0.62 });

  // A broad square face and clustered curls give the guide a head unlike the round-headed hikers.
  part(root, box, materials.skinDark, [0, 2.05, 0], [0.58, 0.62, 0.5], [0, 0.08, 0]);
  for (const [x, y, z, size] of [
    [-0.29, 2.22, -0.08, 0.18], [0, 2.36, -0.06, 0.2], [0.29, 2.22, -0.08, 0.18],
    [-0.31, 2.03, -0.12, 0.17], [0.31, 2.03, -0.12, 0.17], [0, 2.28, -0.24, 0.2],
  ] as const) part(root, lowSphere, materials.ink, [x, y, z], [size, size, size]);
  for (const x of [-0.15, 0.15]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 6, 14), materials.blue);
    lens.position.set(x, 2.07, 0.27);
    lens.castShadow = true;
    root.add(lens);
    part(root, lowSphere, materials.ink, [x, 2.07, 0.275], [0.03, 0.03, 0.02]);
  }
  part(root, box, materials.blue, [0, 2.07, 0.27], [0.1, 0.025, 0.025]);
  rollTopPack(root);
  return root;
}

function cragClimber() {
  const root = createBase();
  (root.userData as HikerData).baseScale = 1.01;
  leg(root, -0.22, materials.slate, 1, { width: 0.12, boot: materials.ink, gaiter: true });
  leg(root, 0.22, materials.slate, -1, { width: 0.12, boot: materials.ink, gaiter: true });
  part(root, box, materials.cream, [0, 1.36, 0], [0.62, 0.82, 0.4]);
  part(root, box, materials.red, [0, 1.08, 0.43], [0.54, 0.12, 0.07]);
  for (const x of [-0.24, 0.24]) part(root, cylinder, materials.red, [x, 1.04, 0.39], [0.045, 0.2, 0.045], [0, 0, x > 0 ? -0.35 : 0.35]);
  arm(root, -0.44, materials.cream, -1, { length: 0.65, width: 0.09, gloves: true });
  arm(root, 0.44, materials.cream, 1, { length: 0.65, width: 0.09, gloves: true });

  // The climber has an elongated, faceted face under a geometric hard shell.
  part(root, lowSphere, materials.skinDark, [0, 2.06, 0], [0.29, 0.39, 0.3]);
  part(root, lowSphere, materials.red, [0, 2.23, -0.015], [0.38, 0.29, 0.37]);
  part(root, box, materials.red, [0, 2.2, 0.29], [0.38, 0.07, 0.19], [-0.08, 0, 0]);
  for (const x of [-0.12, 0.12]) part(root, lowSphere, materials.ink, [x, 2.04, 0.28], [0.034, 0.034, 0.022]);
  part(root, box, materials.ink, [-0.3, 1.98, 0.02], [0.025, 0.33, 0.025], [0, 0, -0.18]);
  part(root, box, materials.ink, [0.3, 1.98, 0.02], [0.025, 0.33, 0.025], [0, 0, 0.18]);
  climbingPack(root);
  return root;
}

const builders: Record<HikerId, () => THREE.Group> = {
  "trail-scout": trailScout,
  "ridge-runner": ridgeRunner,
  "creek-guide": creekGuide,
  "crag-climber": cragClimber,
};

export function isHikerId(value: string | null): value is HikerId {
  return hikerAppearances.some((appearance) => appearance.id === value);
}

export function getSavedHiker(): HikerId {
  try {
    const value = localStorage.getItem(HIKER_STORAGE_KEY);
    return isHikerId(value) ? value : "trail-scout";
  } catch {
    return "trail-scout";
  }
}

export function saveHiker(id: HikerId) {
  try {
    localStorage.setItem(HIKER_STORAGE_KEY, id);
  } catch {
    // The model still works when storage is unavailable.
  }
}

export function createHiker(id: HikerId) {
  const root = builders[id]();
  root.name = id;
  root.scale.setScalar((root.userData as HikerData).baseScale);
  return root;
}

export function poseHiker(root: THREE.Group, stride: number) {
  const data = root.userData as HikerData;
  data.walkParts.forEach(({ joint: pivot, direction, amplitude }) => {
    pivot.rotation.x = direction * stride * amplitude;
  });
  root.position.y += Math.abs(stride) * 0.035;
}
