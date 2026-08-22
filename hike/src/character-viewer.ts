import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createHiker, getSavedHiker, hikerAppearances, poseHiker, saveHiker, type HikerId } from "./hikers";
import "./character-viewer.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="viewer-shell">
    <header class="viewer-header">
      <a class="back-link" href="${import.meta.env.BASE_URL}" aria-label="Back to the trail"><span>←</span> Trail</a>
      <div class="wordmark"><b>Hike.</b><span>field outfitter · model viewer</span></div>
      <div class="model-count">04 / hikers</div>
    </header>

    <section class="stage" aria-label="Interactive 3D character model">
      <canvas></canvas>
      <div class="stage-grid"></div>
      <div class="stage-label"><i></i><span>drag to orbit</span><span>scroll to zoom</span></div>
      <button class="spin-toggle active" type="button" aria-pressed="true"><i></i> Auto rotate</button>
      <div class="height-markers" aria-hidden="true"><span>2.4m</span><span>1.6m</span><span>0.8m</span><span>0.0m</span></div>
    </section>

    <aside class="catalogue">
      <div class="eyebrow">Choose your hiker</div>
      <h1>Who takes<br>the strange way up?</h1>
      <p class="intro">Four different kits, four different silhouettes. Your choice follows you back onto the trail.</p>
      <div class="model-list" role="listbox" aria-label="Hiker appearances"></div>
      <div class="selection-details">
        <div><span class="role"></span><h2></h2></div>
        <p class="description"></p>
        <div class="feature-list"></div>
      </div>
      <button class="use-model" type="button">Use this hiker <span>→</span></button>
      <div class="saved-note" role="status" aria-live="polite"></div>
    </aside>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const stage = document.querySelector<HTMLElement>(".stage")!;
const list = document.querySelector<HTMLElement>(".model-list")!;
const nameLabel = document.querySelector<HTMLElement>(".selection-details h2")!;
const roleLabel = document.querySelector<HTMLElement>(".role")!;
const description = document.querySelector<HTMLElement>(".description")!;
const featureList = document.querySelector<HTMLElement>(".feature-list")!;
const useButton = document.querySelector<HTMLButtonElement>(".use-model")!;
const savedNote = document.querySelector<HTMLElement>(".saved-note")!;
const spinButton = document.querySelector<HTMLButtonElement>(".spin-toggle")!;

list.innerHTML = hikerAppearances.map((appearance, index) => `
  <button class="model-option" type="button" role="option" data-id="${appearance.id}" aria-selected="false">
    <span class="number">0${index + 1}</span>
    <span class="option-copy"><b>${appearance.name}</b><small>${appearance.role}</small></span>
    <span class="option-arrow">↗</span>
  </button>
`).join("");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
camera.position.set(4.3, 2.75, 5.1);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3.2;
controls.maxDistance = 8;
controls.minPolarAngle = Math.PI * 0.19;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.25;

scene.add(new THREE.HemisphereLight(0xffedc5, 0x445342, 2.6));
const key = new THREE.DirectionalLight(0xfff0cf, 4.2);
key.position.set(-4, 7, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 5;
key.shadow.camera.bottom = -2;
scene.add(key);
const rim = new THREE.DirectionalLight(0x7fb0b3, 2.1);
rim.position.set(5, 3, -4);
scene.add(rim);

const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xf4e4bc, roughness: 1 });
const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.85, 0.16, 48), floorMaterial);
floor.position.y = -0.12;
floor.receiveShadow = true;
scene.add(floor);
const floorRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.72, 0.022, 6, 64),
  new THREE.MeshBasicMaterial({ color: 0x26382f, transparent: true, opacity: 0.42 }),
);
floorRing.rotation.x = Math.PI / 2;
floorRing.position.y = -0.025;
scene.add(floorRing);

let displayedId: HikerId = getSavedHiker();
let savedId: HikerId = displayedId;
let model = createHiker(displayedId);
scene.add(model);

function updateCatalogue() {
  const appearance = hikerAppearances.find((item) => item.id === displayedId)!;
  nameLabel.textContent = appearance.name;
  roleLabel.textContent = appearance.role;
  description.textContent = appearance.description;
  featureList.innerHTML = appearance.features.map((feature) => `<span>${feature}</span>`).join("");
  list.querySelectorAll<HTMLButtonElement>(".model-option").forEach((button) => {
    const isDisplayed = button.dataset.id === displayedId;
    button.classList.toggle("active", isDisplayed);
    button.classList.toggle("saved", button.dataset.id === savedId);
    button.setAttribute("aria-selected", String(isDisplayed));
  });
  const alreadySaved = displayedId === savedId;
  useButton.classList.toggle("is-saved", alreadySaved);
  useButton.innerHTML = alreadySaved ? `Selected for trail <span>✓</span>` : `Use this hiker <span>→</span>`;
}

function showModel(id: HikerId) {
  if (id === displayedId) return;
  scene.remove(model);
  displayedId = id;
  model = createHiker(displayedId);
  scene.add(model);
  model.scale.setScalar(0.01);
  updateCatalogue();
  savedNote.textContent = "";
}

list.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".model-option");
  if (button?.dataset.id) showModel(button.dataset.id as HikerId);
});

list.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const current = hikerAppearances.findIndex((item) => item.id === displayedId);
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const next = (current + direction + hikerAppearances.length) % hikerAppearances.length;
  showModel(hikerAppearances[next].id);
  list.querySelector<HTMLButtonElement>(`[data-id="${hikerAppearances[next].id}"]`)?.focus();
});

useButton.addEventListener("click", () => {
  saveHiker(displayedId);
  savedId = displayedId;
  updateCatalogue();
  savedNote.innerHTML = `Packed. <a href="${import.meta.env.BASE_URL}">Return to the trail →</a>`;
});

spinButton.addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  spinButton.classList.toggle("active", controls.autoRotate);
  spinButton.setAttribute("aria-pressed", String(controls.autoRotate));
});

function resize() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

const clock = new THREE.Clock();
function frame() {
  const elapsed = clock.getElapsedTime();
  const targetScale = (model.userData.baseScale as number | undefined) ?? 1;
  const scale = THREE.MathUtils.lerp(model.scale.x, targetScale, 0.12);
  model.scale.setScalar(scale);
  model.position.y = 0;
  poseHiker(model, Math.sin(elapsed * 2.2) * 0.09);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

updateCatalogue();
requestAnimationFrame(frame);

Object.assign(window, {
  __HIKER_VIEWER__: {
    getState: () => ({ displayed: displayedId, saved: savedId, autoRotate: controls.autoRotate }),
    show: (id: string) => {
      if (hikerAppearances.some((item) => item.id === id)) showModel(id as HikerId);
    },
  },
});
