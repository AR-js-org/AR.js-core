// File: 'examples/vite-artoolkit/main.js'
import { Engine } from '../../src/core/engine.js';
import { CaptureSystem } from '../../src/systems/capture-system.js';
import { FramePumpSystem } from '../../src/systems/frame-pump-system.js';

import { SOURCE_TYPES } from '../../src/core/components.js';

import { webcamPlugin } from '../../plugins/source/webcam.js';
import { defaultProfilePlugin } from '../../plugins/profile/default-policy.js';
import { imagePlugin as artookit } from '../../plugins';

const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');

function log(message) {
  const ts = new Date().toISOString();
  const el = document.createElement('div');
  el.textContent = `[${ts}] ${message}`;
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
  console.log(message);
}

function setStatus(msg, type = 'normal') {
  statusEl.textContent = msg;
  statusEl.className = 'status';
  if (type === 'success') statusEl.classList.add('success');
  if (type === 'error') statusEl.classList.add('error');
}

async function main() {
  const engine = new Engine();
  console.log('Engine : ', engine);

  // Registra i plugin locali (profilo + webcam)
  engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);
  engine.pluginManager.register(webcamPlugin.id, webcamPlugin);

  // Carica ArtoolkitPlugin dal CDN e configura "simple-marker" (HIRO)
  const mod = await import('./vendor/arjs-plugin-artoolkit/arjs-plugin-artoolkit.esm.js');
  //await import('https://cdn.jsdelivr.net/gh/AR-js-org/arjs-plugin-artoolkit@main/dist/assets/worker-NSCgfIFP.js')
  const ArtoolkitPlugin = mod.ArtoolkitPlugin || mod.default;

  const artoolkit = new ArtoolkitPlugin({
    cameraParametersUrl: '/examples/vite-artoolkit/data/camera_para.dat',
    patternUrl: '/examples/vite-artoolkit/data/patt.hiro',
    detectionMode: 'mono',
  });
  console.log(artoolkit);

  const arId = artoolkit.id || 'arjs-artoolkit';
  engine.pluginManager.register(arId, artoolkit);

  // Abilita i plugin nell’ordine raccomandato
  const ctx = engine.getContext();
  await engine.pluginManager.enable(defaultProfilePlugin.id, ctx);
  await engine.pluginManager.enable(webcamPlugin.id, ctx);
  await engine.pluginManager.enable(arId, ctx);

  // Inizializza la cattura webcam
  await CaptureSystem.initialize(
    {
      sourceType: SOURCE_TYPES.WEBCAM,
      sourceWidth: 640,
      sourceHeight: 480,
    },
    ctx,
  );

  // Avvia l’engine ECS
  engine.start();

  FramePumpSystem.start(ctx);

  engine.eventBus.on('ar:workerReady', () => {
    log('Worker ready');
    setStatus('Worker ready. Start camera and then load marker.', 'success');
    //loadMarkerBtn.disabled = false;
  });
  engine.eventBus.on('ar:workerError', (e) => {
    log(`workerError: ${JSON.stringify(e)}`);
    setStatus('Worker error (see console)', 'error');
  });
  engine.eventBus.on('ar:getMarker', (e) => console.log('[example] ar:getMarker', e));
  engine.eventBus.on('ar:markerFound', (d) => log(`markerFound: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerUpdated', (d) => log(`markerUpdated: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerLost', (d) => log(`markerLost: ${JSON.stringify(d)}`));

  await artookit.init(ctx);
  await artoolkit.enable();

  const res = await artoolkit.loadMarker(artoolkit.options.patternUrl, 1);
  log(`loadMarker result: ${JSON.stringify(res)}`);

  if (artoolkit.workerReady) {
    log('Worker was already ready (post-enable).');
    setStatus('Worker ready. Start camera and then load marker.', 'success');
    //loadMarkerBtn.disabled = false;
  } else {
    setStatus('Plugin initialized. Waiting for worker…', 'normal');
  }
}

main().catch((e) => console.error('[artoolkit] bootstrap error:', e));
