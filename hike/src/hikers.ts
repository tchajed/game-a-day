import * as THREE from "three";

export const HIKER_STORAGE_KEY = "hike.character";

export const hikerAppearances = [
  {
    id: "trail-scout",
    name: "Trail Scout",
    role: "The familiar day hiker",
    description: "A compact jacket, knit cap, bedroll, and a practical blue daypack.",
    features: ["Daypack", "Bedroll", "Beanie"],
  },
  {
    id: "ridge-runner",
    name: "Ridge Runner",
    role: "Fast and lightly packed",
    description: "A lean trail runner with bare knees, a sun visor, hydration vest, and low shoes.",
    features: ["Running vest", "Shorts", "Visor"],
  },
  {
    id: "field-naturalist",
    name: "Field Naturalist",
    role: "Here to notice everything",
    description: "A long field coat, broad hat, binoculars, and a specimen satchel change the silhouette completely.",
    features: ["Field coat", "Binoculars", "Satchel"],
  },
  {
    id: "storm-keeper",
    name: "Storm Keeper",
    role: "Built for the snowline",
    description: "A broad hooded parka, goggles, snow gaiters, and an expedition pack for bad weather.",
    features: ["Parka", "Goggles", "Expedition pack"],
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
  pack(root, 1.38, materials.blue, [0.53, 0.66, 0.24]);
  part(root, cylinder, materials.gold, [0, 1.07, -0.53], [0.34, 0.34, 0.34], [0, 0, Math.PI / 2]);
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
  part(root, box, materials.red, [0, 1.5, -0.29], [0.38, 0.46, 0.12]);
  return root;
}

function fieldNaturalist() {
  const root = createBase();
  leg(root, -0.2, materials.trunk, 1, { width: 0.09, boot: materials.ink });
  leg(root, 0.2, materials.trunk, -1, { width: 0.09, boot: materials.ink });
  part(root, cone, materials.moss, [0, 1.34, 0], [0.68, 1.16, 0.58], [0, 0, Math.PI]);
  part(root, box, materials.cream, [0, 1.54, 0.38], [0.11, 0.62, 0.05]);
  part(root, box, materials.trunk, [0.35, 1.05, 0.32], [0.32, 0.35, 0.13], [0, 0, -0.08]);
  part(root, box, materials.trunk, [0.13, 1.55, 0.25], [0.04, 0.78, 0.04], [0, 0, -0.35]);
  arm(root, -0.48, materials.moss, -1, { length: 0.67 });
  arm(root, 0.48, materials.moss, 1, { length: 0.67 });
  head(root, 2.09, 0.33);
  part(root, cylinder, materials.trunk, [0, 2.34, 0], [0.57, 0.055, 0.57]);
  part(root, cylinder, materials.trunk, [0, 2.49, 0], [0.3, 0.17, 0.3]);
  for (const x of [-0.13, 0.13]) {
    part(root, cylinder, materials.darkBlue, [x, 1.82, 0.39], [0.12, 0.17, 0.12], [Math.PI / 2, 0, 0]);
  }
  part(root, box, materials.ink, [0, 1.83, 0.38], [0.1, 0.08, 0.08]);
  part(root, cylinder, materials.ink, [0, 1.96, 0.16], [0.025, 0.26, 0.025]);
  return root;
}

function stormKeeper() {
  const root = createBase();
  (root.userData as HikerData).baseScale = 0.98;
  leg(root, -0.24, materials.slate, 1, { width: 0.13, boot: materials.ink, gaiter: true });
  leg(root, 0.24, materials.slate, -1, { width: 0.13, boot: materials.ink, gaiter: true });
  part(root, lowSphere, materials.darkBlue, [0, 1.43, 0], [0.73, 0.76, 0.5]);
  part(root, box, materials.blue, [0, 1.27, 0.38], [0.5, 0.09, 0.08]);
  part(root, box, materials.blue, [0, 1.55, 0.43], [0.53, 0.07, 0.08]);
  arm(root, -0.55, materials.darkBlue, -1, { length: 0.68, width: 0.11, gloves: true });
  arm(root, 0.55, materials.darkBlue, 1, { length: 0.68, width: 0.11, gloves: true });
  pack(root, 1.48, materials.red, [0.65, 0.8, 0.32]);
  part(root, cylinder, materials.cream, [0, 2.04, -0.07], [0.46, 0.17, 0.46]);
  head(root, 2.09, 0.3);
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.1, 7, 14, Math.PI * 1.5), materials.darkBlue);
  hood.position.set(0, 2.11, -0.04);
  hood.rotation.z = Math.PI * 0.25;
  hood.castShadow = true;
  root.add(hood);
  part(root, box, materials.gold, [0, 2.13, 0.3], [0.3, 0.09, 0.055]);
  part(root, box, materials.ink, [0, 2.13, 0.34], [0.035, 0.1, 0.025]);
  part(root, cylinder, materials.cream, [0, 0.84, -0.48], [0.4, 0.4, 0.4], [0, 0, Math.PI / 2]);
  return root;
}

const builders: Record<HikerId, () => THREE.Group> = {
  "trail-scout": trailScout,
  "ridge-runner": ridgeRunner,
  "field-naturalist": fieldNaturalist,
  "storm-keeper": stormKeeper,
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
