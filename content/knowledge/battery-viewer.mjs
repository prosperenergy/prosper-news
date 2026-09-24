import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.querySelector('[data-battery-viewer]');
if (host) setupViewer(host);

function setupViewer(host) {
  const stage = host.querySelector('[data-viewer-stage]');
  const fallback = host.querySelector('[data-viewer-fallback]');
  const status = host.querySelector('[data-viewer-status]');
  const tabs = [...host.querySelectorAll('[data-battery-model]')];
  const spinButton = host.querySelector('[data-spin]');
  const controls = host.querySelector('[data-viewer-controls]');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    status.textContent = '3D is unavailable on this device. Product image shown.';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xFFFFFF, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.appendChild(renderer.domElement);
  fallback.hidden = true;
  controls.hidden = false;
  tabs.forEach(tab => { tab.disabled = false; });
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Rotate the battery with left and right arrow keys, or drag horizontally. Up and down arrows tilt the view.');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  camera.position.set(0, .1, 4.9);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb3a99c, 2.6));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2.0);
  rim.position.set(4, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(-3, -1, -4); scene.add(fill);

  const group = new THREE.Group(); scene.add(group);
  const materials = {
    white: new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: .34, metalness: .1 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xc9cdcf, roughness: .48, metalness: .35 }),
    back: new THREE.MeshStandardMaterial({ color: 0x73787b, roughness: .65, metalness: .2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x252729, roughness: .5, metalness: .2 }),
    indicator: new THREE.MeshStandardMaterial({ color: 0x83bd74, roughness: .5 }),
  };
  function box(parent, width, height, depth, material, x = 0, y = 0, z = 0, radius = .045) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 4, Math.min(radius, depth / 3)), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  // Simplified enclosure illustrations. No ports, exact dimensions or installation details are asserted.
  const models = new Map();
  const enphase = new THREE.Group();
  box(enphase, 1.05, 1.8, .30, materials.back);
  box(enphase, 1.03, 1.78, .11, materials.silver, 0, 0, .14);
  box(enphase, .86, 1.55, .035, materials.back, 0, 0, -.17);
  box(enphase, .35, .04, .012, materials.dark, .1, .23, .201, .006);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.023, .005, 8, 24), materials.indicator);
  ring.position.set(-.3, .23, .207); enphase.add(ring);
  models.set('enphase', enphase);
  const tesla = new THREE.Group();
  box(tesla, 1.12, 1.82, .28, materials.dark);
  box(tesla, 1.10, 1.8, .07, materials.white, 0, 0, .15);
  box(tesla, .94, 1.6, .035, materials.back, 0, 0, -.157);
  box(tesla, .30, .014, .012, materials.silver, 0, .51, .19, .003);
  models.set('tesla', tesla);
  models.forEach(model => group.add(model));

  const params = new URLSearchParams(window.location.search);
  let selected = params.get('battery') === 'tesla' ? 'tesla' : 'enphase';
  let angle = params.has('angle') ? Number(params.get('angle')) : -20;
  angle = Number.isFinite(angle) ? angle % 360 : -20;
  let tilt = -.06;
  let spinStart = null;
  let spinFrom = angle;
  let animationId = null;
  let pointer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const names = { enphase: 'Enphase IQ Battery', tesla: 'Tesla Powerwall' };

  function render() {
    group.rotation.set(tilt, angle * Math.PI / 180, 0);
    stage.dataset.angle = String(Math.round(((angle % 360) + 360) % 360));
    stage.dataset.model = selected;
    renderer.render(scene, camera);
  }
  function announce() {
    const degrees = Math.round(((angle % 360) + 360) % 360);
    status.textContent = `${names[selected]} · ${degrees}° · Illustrative model`;
  }
  function stopSpin() {
    if (animationId !== null) cancelAnimationFrame(animationId);
    animationId = null; spinStart = null;
    spinButton.textContent = '360° spin';
    spinButton.setAttribute('aria-pressed', 'false');
  }
  function selectModel(name) {
    stopSpin(); selected = name; angle = -20; tilt = -.06;
    models.forEach((model, key) => { model.visible = key === name; });
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.batteryModel === name)));
    host.querySelector('[data-battery-name]').textContent = names[name];
    render(); announce();
  }
  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); render();
  }
  const initialAngle = angle;
  selectModel(selected); angle = initialAngle;
  new ResizeObserver(resize).observe(stage);
  resize(); announce();
  host.dataset.viewerReady = 'true';
  tabs.forEach(tab => tab.addEventListener('click', () => selectModel(tab.dataset.batteryModel)));
  host.querySelector('[data-rotate-left]').addEventListener('click', () => { stopSpin(); angle -= 45; render(); announce(); });
  host.querySelector('[data-rotate-right]').addEventListener('click', () => { stopSpin(); angle += 45; render(); announce(); });
  host.querySelector('[data-viewer-reset]').addEventListener('click', () => { stopSpin(); angle = -20; tilt = -.06; render(); announce(); });
  spinButton.addEventListener('click', () => {
    if (spinStart !== null) { stopSpin(); announce(); return; }
    spinFrom = angle; spinStart = performance.now();
    spinButton.textContent = 'Pause';
    spinButton.setAttribute('aria-pressed', 'true');
    const duration = reducedMotion.matches ? 12000 : 7000;
    function tick(now) {
      if (spinStart === null) return;
      const progress = Math.min((now - spinStart) / duration, 1);
      angle = spinFrom + progress * 360; render();
      if (progress < 1) animationId = requestAnimationFrame(tick);
      else { stopSpin(); announce(); }
    }
    animationId = requestAnimationFrame(tick);
  });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopSpin(); pointer = { id: event.pointerId, x: event.clientX, from: angle };
    stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    angle = pointer.from + (event.clientX - pointer.x) * .75; render();
  });
  const release = () => { pointer = null; stage.classList.remove('is-dragging'); announce(); };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault(); stopSpin();
    if (event.key === 'ArrowLeft') angle -= 15;
    if (event.key === 'ArrowRight') angle += 15;
    if (event.key === 'ArrowUp') tilt = Math.max(-.45, tilt - .08);
    if (event.key === 'ArrowDown') tilt = Math.min(.45, tilt + .08);
    if (event.key === 'Home') { angle = -20; tilt = -.06; }
    render(); announce();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpin(); });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stopSpin(); renderer.domElement.hidden = true;
    fallback.hidden = false; controls.hidden = true; tabs.forEach(tab => { tab.disabled = true; });
    status.textContent = '3D paused by this device. Product image shown. Reload to retry.';
  });
}
