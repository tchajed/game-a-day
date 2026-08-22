import * as THREE from "three";

export const trailScoutDetails = {
  id: "trail-scout",
  name: "Trail Scout",
  role: "The familiar day hiker",
  description: "A compact red jacket, knit cap, sturdy boots, and a square blue trail pack with its own mountain badge.",
  features: ["Classic pack", "Mountain badge", "Knit beanie"],
} as const;

type WalkPart = { joint: THREE.Group; direction: number; amplitude: number };
type HikerData = { walkParts: WalkPart[]; baseScale: number };

const palette = {
  ink: 0x26382f,
  cream: 0xf4e4bc,
  red: 0xd95543,
  blue: 0x4c7e89,
  gold: 0xf3cf72,
  trunk: 0x504639,
  skin: 0xc7845a,
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
  (root.userData as HikerData).walkParts.push({ joint: pivot, direction, amplitude });
  return pivot;
}

function leg(root: THREE.Group, x: number, direction: number) {
  const pivot = joint(root, [x, 0.83, 0], direction);
  part(pivot, cylinder, materials.ink, [0, -0.36, 0], [0.105, 0.36, 0.105]);
  part(pivot, box, materials.trunk, [0, -0.74, 0.07], [0.25, 0.14, 0.32]);
}

function arm(root: THREE.Group, x: number, direction: number) {
  const pivot = joint(root, [x, 1.61, 0], direction, 0.52);
  pivot.rotation.z = x > 0 ? -0.1 : 0.1;
  part(pivot, cylinder, materials.red, [0, -0.31, 0], [0.085, 0.31, 0.085]);
  part(pivot, lowSphere, materials.skin, [0, -0.65, 0], [0.11, 0.11, 0.11]);
}

function head(root: THREE.Group) {
  part(root, sphere, materials.skin, [0, 2.04, 0], [0.34, 0.35, 0.34]);
  for (const x of [-0.13, 0.13]) part(root, lowSphere, materials.ink, [x, 2.06, 0.306], [0.035, 0.035, 0.025]);
}

function classicPack(root: THREE.Group) {
  const bag = new THREE.Group();
  bag.position.set(0, 1.38, -0.35);
  bag.scale.setScalar(1.04);
  root.add(bag);

  part(bag, box, materials.blue, [0, 0, 0], [0.56, 0.7, 0.28]);
  part(bag, box, materials.blue, [0, -0.08, -0.17], [0.46, 0.34, 0.1]);
  part(bag, box, materials.blue, [0, 0.24, -0.16], [0.5, 0.16, 0.12]);
  part(bag, box, materials.ink, [0, 0.17, -0.225], [0.39, 0.025, 0.025]);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 12, Math.PI), materials.ink);
  handle.position.set(0, 0.35, 0);
  handle.castShadow = true;
  bag.add(handle);

  part(bag, box, materials.ink, [-0.17, -0.02, 0.16], [0.07, 0.54, 0.035], [0, 0, -0.08]);
  part(bag, box, materials.ink, [0.17, -0.02, 0.16], [0.07, 0.54, 0.035], [0, 0, 0.08]);
  part(bag, cylinder, materials.cream, [0, -0.06, -0.235], [0.12, 0.025, 0.12], [Math.PI / 2, 0, 0]);
  part(bag, cone, materials.ink, [0, -0.045, -0.263], [0.07, 0.075, 0.02]);
}

export function createHiker() {
  const root = new THREE.Group();
  root.name = trailScoutDetails.id;
  root.userData = { walkParts: [], baseScale: 1 } satisfies HikerData;

  leg(root, -0.22, 1);
  leg(root, 0.22, -1);
  part(root, box, materials.red, [0, 1.34, 0], [0.64, 0.86, 0.43]);
  part(root, box, materials.cream, [0, 1.71, 0.23], [0.35, 0.12, 0.08]);
  arm(root, -0.42, -1);
  arm(root, 0.42, 1);
  head(root);
  part(root, cylinder, materials.red, [0, 2.33, 0], [0.34, 0.12, 0.34]);
  part(root, lowSphere, materials.red, [0, 2.43, 0], [0.11, 0.11, 0.11]);
  classicPack(root);
  return root;
}

export function poseHiker(root: THREE.Group, stride: number) {
  const data = root.userData as HikerData;
  data.walkParts.forEach(({ joint: pivot, direction, amplitude }) => {
    pivot.rotation.x = direction * stride * amplitude;
  });
  root.position.y += Math.abs(stride) * 0.035;
}
