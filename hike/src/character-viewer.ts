import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createHiker, poseHiker, trailScoutDetails } from "./hikers";
import "./character-viewer.css";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <main class="viewer-shell">
    <header class="viewer-header">
      <a class="back-link" href="${import.meta.env.BASE_URL}" aria-label="Back to the trail"><span>←</span> Trail</a>
      <div class="wordmark"><b>Hike.</b><span>field outfitter · model viewer</span></div>
      <div class="model-count">01 / final hiker</div>
    </header>

    <section class="stage" aria-label="Interactive 3D model of the Trail Scout">
      <canvas></canvas>
      <div class="stage-grid"></div>
      <div class="stage-label"><i></i><span>drag to orbit</span><span>scroll to zoom</span></div>
      <button class="spin-toggle active" type="button" aria-pressed="true"><i></i> Auto rotate</button>
      <div class="height-markers" aria-hidden="true"><span>2.4m</span><span>1.6m</span><span>0.8m</span><span>0.0m</span></div>
    </section>

    <aside class="catalogue">
      <div class="eyebrow">The trail's hiker</div>
      <h1>Meet the<br>Trail Scout.</h1>
      <p class="intro">The search is over. One compact, curious hiker is taking the strange way up.</p>
      <div class="profile-rule"><span>01 / character model</span><b>locked in</b></div>
      <div class="selection-details">
        <div><span class="role">${trailScoutDetails.role}</span><h2>${trailScoutDetails.name}</h2></div>
        <p class="description">${trailScoutDetails.description}</p>
        <div class="feature-list">${trailScoutDetails.features.map((feature) => `<span>${feature}</span>`).join("")}</div>
      </div>
      <dl class="gear-notes">
        <div><dt>Pack</dt><dd>Connected classic shell · trail badge</dd></div>
        <div><dt>Layer</dt><dd>Red all-weather trail jacket</dd></div>
        <div><dt>Footing</dt><dd>Dark trousers · sturdy brown boots</dd></div>
      </dl>
      <a class="return-trail" href="${import.meta.env.BASE_URL}">Take the Trail Scout hiking <span>→</span></a>
    </aside>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const stage = document.querySelector<HTMLElement>(".stage")!;
const spinButton = document.querySelector<HTMLButtonElement>(".spin-toggle")!;

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
controls.autoRotate = new URLSearchParams(location.search).get("spin") !== "off";
controls.autoRotateSpeed = 1.25;
spinButton.classList.toggle("active", controls.autoRotate);
spinButton.setAttribute("aria-pressed", String(controls.autoRotate));

function setViewerAzimuth(azimuth: number) {
  controls.autoRotate = false;
  spinButton.classList.remove("active");
  spinButton.setAttribute("aria-pressed", "false");
  const orbit = new THREE.Spherical(camera.position.distanceTo(controls.target), controls.getPolarAngle(), azimuth);
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));
  controls.update();
}

const initialView = new URLSearchParams(location.search).get("view");
if (initialView === "back") setViewerAzimuth(Math.PI);
if (initialView === "side") setViewerAzimuth(Math.PI / 2);

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

const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.65, 1.85, 0.16, 48),
  new THREE.MeshStandardMaterial({ color: 0xf4e4bc, roughness: 1 }),
);
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

const model = createHiker();
scene.add(model);

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
  model.position.y = 0;
  poseHiker(model, Math.sin(clock.getElapsedTime() * 2.2) * 0.09);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

Object.assign(window, {
  __HIKER_VIEWER__: {
    getState: () => ({ model: trailScoutDetails.id, autoRotate: controls.autoRotate }),
    setView: setViewerAzimuth,
  },
});
