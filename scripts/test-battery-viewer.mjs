import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import * as Three from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const html = fs.readFileSync('site/index.html', 'utf8');
const source = fs.readFileSync('content/knowledge/battery-viewer.mjs', 'utf8').replace(/^import .+;\n/gm, '');
const results = [];
function harness(query = '', failure = false) {
  const { document, window } = parseHTML(html);
  const stage = document.querySelector('[data-viewer-stage]');
  Object.defineProperty(stage, 'clientWidth', { value: 350 });
  Object.defineProperty(stage, 'clientHeight', { value: 220 });
  stage.setPointerCapture = () => {};
  const frames = new Map(); let frameId = 0; let clock = 0; let lastScene;
  class Renderer {
    constructor() { if (failure) throw Error('WebGL unavailable'); this.domElement = document.createElement('canvas'); }
    setPixelRatio() {} setClearColor() {} setSize() {}
    render(scene) { lastScene = scene; }
  }
  class Observer { constructor(callback) { this.callback = callback; } observe() { this.callback(); } }
  const runtime = { location: { search: query }, devicePixelRatio: 2, matchMedia: () => ({ matches: false }) };
  vm.runInNewContext(source, { document, window: runtime, THREE: { ...Three, WebGLRenderer: Renderer }, RoundedBoxGeometry,
    URLSearchParams, ResizeObserver: Observer, performance: { now: () => clock },
    requestAnimationFrame: callback => { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id) });
  function event(selector, type, fields = {}) {
    const e = new window.Event(type, { cancelable: true });
    Object.assign(e, fields); document.querySelector(selector).dispatchEvent(e); return e;
  }
  function tick(now) { clock = now; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); }
  return { document, stage, event, tick, rotation: () => lastScene.children.find(object => object.type === 'Group').rotation.y };
}
for (const model of ['enphase', 'tesla']) {
  const h = harness(`?battery=${model}&angle=0`);
  assert.equal(h.document.querySelector('[data-battery-viewer]').dataset.viewerReady, 'true');
  assert.equal(h.stage.dataset.model, model);
  assert.equal(h.stage.dataset.angle, '0');
  assert.equal(h.document.querySelectorAll('[data-battery-model][aria-pressed="true"]').length, 1);
  h.event('[data-rotate-right]', 'click'); assert.equal(h.stage.dataset.angle, '45');
  h.event('[data-rotate-left]', 'click'); assert.equal(h.stage.dataset.angle, '0');
  h.event('[data-viewer-stage]', 'keydown', { key: 'ArrowRight' }); assert.equal(h.stage.dataset.angle, '15');
  const beforeDrag = h.rotation();
  h.event('[data-viewer-stage]', 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 0 });
  h.event('[data-viewer-stage]', 'pointermove', { pointerId: 1, clientX: 480 });
  h.event('[data-viewer-stage]', 'pointerup', { pointerId: 1 });
  assert(Math.abs(h.rotation() - beforeDrag - Math.PI * 2) < 1e-10);
  h.event('[data-viewer-reset]', 'click'); assert.equal(h.stage.dataset.angle, '340');
  const beforeSpin = h.rotation();
  h.event('[data-spin]', 'click');
  assert.equal(h.document.querySelector('[data-spin]').getAttribute('aria-pressed'), 'true');
  h.tick(3500); assert(Math.abs(h.rotation() - beforeSpin - Math.PI) < 1e-10);
  h.tick(7000); assert(Math.abs(h.rotation() - beforeSpin - Math.PI * 2) < 1e-10);
  assert.equal(h.document.querySelector('[data-spin]').getAttribute('aria-pressed'), 'false');
  h.event(`[data-battery-model="${model === 'enphase' ? 'tesla' : 'enphase'}"]`, 'click');
  assert.notEqual(h.stage.dataset.model, model);
  h.event('canvas', 'webglcontextlost');
  assert.equal(h.document.querySelector('[data-viewer-fallback]').hidden, false);
  assert.equal(h.document.querySelector('[data-viewer-controls]').hidden, true);
  results.push(`${model}: left/right, keyboard, 360-degree drag, full spin, reset, switch, context-loss fallback`);
}
const noGL = harness('', true);
assert.equal(noGL.document.querySelector('[data-viewer-fallback]').hidden, false);
assert.equal(noGL.document.querySelector('[data-viewer-controls]').hidden, true);
results.push('WebGL-unavailable fallback preserves product image and reports unavailable controls');
for (const angle of [0, 90, 180, 270, 360, -90]) {
  const h = harness(`?battery=tesla&angle=${angle}`);
  assert.equal(Number(h.stage.dataset.angle), ((angle % 360) + 360) % 360);
}
results.push('Front, side, rear, and normalized-angle links initialize correctly');
const report = { passed: true, checkedAt: new Date().toISOString(), checks: results,
  method: 'Real Three.js scene geometry plus simulated WebGL renderer and DOM; visual rendering checked separately via remote screenshots' };
fs.mkdirSync('outputs/knowledge-base/news-mobile-20260924', { recursive: true });
fs.writeFileSync('outputs/knowledge-base/news-mobile-20260924/viewer-tests.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
