// Example: AR.js Core ECS + ArtoolkitPlugin with Start/Stop/Load buttons

import { Engine } from '../../src/core/engine.js';
import { CaptureSystem } from '../../src/systems/capture-system.js';
import { SOURCE_TYPES } from '../../src/core/components.js';
import { FramePumpSystem } from '../../src/systems/frame-pump-system.js';

import { webcamPlugin } from '../../plugins/source/webcam.js';
import { defaultProfilePlugin } from '../../plugins/profile/default-policy.js';
import { imagePlugin as artookit } from '../../plugins';

// UI
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const loadBtn = document.getElementById('loadBtn');

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

// Engine/plugin state
let engine;
let ctx;
let artoolkit;
let arPluginId;
let pumping = false;
let cameraStarted = false;
let markerLoaded = false;

async function bootstrap() {
  engine = new Engine();

  // Register core/source plugins
  engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);
  engine.pluginManager.register(webcamPlugin.id, webcamPlugin);

  // Load ArtoolkitPlugin ESM from bundled vendor (ensure assets folder is present and served)
  const mod = await import('./vendor/arjs-plugin-artoolkit/arjs-plugin-artoolkit.esm.js');
  const ArtoolkitPlugin = mod.ArtoolkitPlugin || mod.default;

  artoolkit = new ArtoolkitPlugin({
    cameraParametersUrl: '/examples/vite-artoolkit/data/camera_para.dat',
    minConfidence: 0.6,
  });

  arPluginId = artoolkit.id || 'arjs-artoolkit';
  engine.pluginManager.register(arPluginId, artoolkit);

  // Register events BEFORE enabling to avoid missing early 'ready'
  engine.eventBus.on('ar:workerReady', () => {
    log('Worker ready');
    setStatus('Worker ready. You can start the webcam and load the marker.', 'success');
    loadBtn.disabled = false;
  });
  engine.eventBus.on('ar:workerError', (e) => {
    log(`workerError: ${JSON.stringify(e)}`);
    setStatus('Worker error (see console)', 'error');
  });
  engine.eventBus.on('ar:getMarker', (e) => console.log('[example] ar:getMarker', e));
  engine.eventBus.on('ar:markerFound', (d) => log(`markerFound: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerUpdated', (d) => log(`markerUpdated: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerLost', (d) => log(`markerLost: ${JSON.stringify(d)}`));

  // Enable plugins
  ctx = engine.getContext();
  await engine.pluginManager.enable(defaultProfilePlugin.id, ctx);
  await engine.pluginManager.enable(webcamPlugin.id, ctx);
  await engine.pluginManager.enable(arPluginId, ctx);

  // Start ECS (systems/plugins tick)
  engine.start();

  // UI initial state
  startBtn.disabled = false;
  stopBtn.disabled = true;
  loadBtn.disabled = !artoolkit.workerReady;

  setStatus('Initialized. Click “Start Webcam” to begin streaming frames.', 'normal');
}

async function startWebcam() {
  if (cameraStarted) return;
  try {
    startBtn.disabled = true;
    stopBtn.disabled = true; // re-enable after init
    setStatus('Starting webcam…', 'normal');
    log('Initializing webcam capture');

    // Initialize webcam capture
    await CaptureSystem.initialize(
      {
        sourceType: SOURCE_TYPES.WEBCAM,
        sourceWidth: 640,
        sourceHeight: 480,
      },
      ctx,
    );

    // Start frame pump (streams ImageBitmap frames into engine:update)
    if (!pumping) {
      FramePumpSystem.start(ctx);
      pumping = true;
    }

    cameraStarted = true;
    setStatus('Webcam started. You can load the marker.', 'success');
    log('Webcam started.');
    stopBtn.disabled = false;
    // Leave loadBtn as-is (enabled when workerReady)
  } catch (err) {
    log('Camera error: ' + (err?.message || err));
    setStatus('Camera error (see console)', 'error');
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

async function stopWebcam() {
  if (!cameraStarted) return;
  try {
    setStatus('Stopping webcam…', 'normal');
    log('Stopping frame pump and capture');

    if (pumping) {
      FramePumpSystem.stop(ctx);
      pumping = false;
    }
    await CaptureSystem.dispose(ctx);
    cameraStarted = false;

    setStatus('Webcam stopped.', 'success');
    log('Webcam stopped.');
    startBtn.disabled = false;
    stopBtn.disabled = true;
  } catch (err) {
    log('Stop error: ' + (err?.message || err));
    setStatus('Stop error (see console)', 'error');
  }
}

async function loadMarker() {
  if (!artoolkit) return;
  try {
    loadBtn.disabled = true;
    setStatus('Loading marker…', 'normal');

    const patternUrl = '/examples/vite-artoolkit/data/patt.hiro';
    const res = await artoolkit.loadMarker(patternUrl, 1);
    log(`loadMarker result: ${JSON.stringify(res)}`);
    setStatus(`Marker loaded (id=${res.markerId}). Show the marker to the camera.`, 'success');
    markerLoaded = true;
  } catch (err) {
    log('loadMarker failed: ' + (err?.message || err));
    setStatus('Failed to load marker', 'error');
  } finally {
    // Allow re-press in case user wants to reload/replace; or keep disabled if you prefer single load
    loadBtn.disabled = false;
  }
}

// Wire up UI events
startBtn.addEventListener('click', () => startWebcam());
stopBtn.addEventListener('click', () => stopWebcam());
loadBtn.addEventListener('click', () => loadMarker());

// Bootstrap on load
bootstrap().catch((e) => {
  console.error('[artoolkit] bootstrap error:', e);
  setStatus('Initialization error', 'error');
});
