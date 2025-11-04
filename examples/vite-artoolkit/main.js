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
const viewport = document.getElementById('viewport');

function attachVideoToViewport(ctx) {
  const frameSource = CaptureSystem.getFrameSource(ctx);
  const videoEl = frameSource?.element;
  if (!videoEl) return;

  const viewport = document.getElementById('viewport');
  if (!viewport) return;

  try {
    // Detach from body if plugin appended it
    if (videoEl.parentNode && videoEl.parentNode !== viewport) {
      videoEl.parentNode.removeChild(videoEl);
    }
  } catch {}

  // Ensure attributes optimal for inline playback
  try {
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('autoplay', '');
    videoEl.muted = true;
    videoEl.controls = false;
  } catch {}

  // Override any offscreen styles the source plugin applied
  Object.assign(videoEl.style, {
    position: 'relative',
    top: '0px',
    left: '0px',
    zIndex: '1',
    width: '100%',
    height: 'auto',
    display: 'block',
  });

  viewport.innerHTML = '';
  viewport.appendChild(videoEl);
}

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
let pumping = false;
let cameraStarted = false;

async function bootstrap() {
  engine = new Engine();

  // Register core/source plugins
  engine.pluginManager.register(defaultProfilePlugin.id, defaultProfilePlugin);
  engine.pluginManager.register(webcamPlugin.id, webcamPlugin);

  // Load ArtoolkitPlugin ESM from bundled vendor (ensure assets folder is present and served)
  const mod = await import('./vendor/arjs-plugin-artoolkit/arjs-plugin-artoolkit.esm.js');
  const ArtoolkitPlugin = mod.ArtoolkitPlugin || mod.default;

  // Set up UI listeners BEFORE enable to avoid missing early 'ready'
  engine.eventBus.on('ar:workerReady', () => {
    log('Worker ready');
    setStatus('Worker ready. You can start the webcam and load the marker.', 'success');
    loadBtn.disabled = false; // allow loading even before camera (matches minimal example)
  });
  engine.eventBus.on('ar:workerError', (e) => {
    log(`workerError: ${JSON.stringify(e)}`);
    setStatus('Worker error (see console)', 'error');
  });
  engine.eventBus.on('ar:getMarker', (e) => console.log('[example] ar:getMarker', e));
  engine.eventBus.on('ar:markerFound', (d) => log(`markerFound: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerUpdated', (d) => log(`markerUpdated: ${JSON.stringify(d)}`));
  engine.eventBus.on('ar:markerLost', (d) => log(`markerLost: ${JSON.stringify(d)}`));

  // Enable core plugins via manager
  ctx = engine.getContext();
  await engine.pluginManager.enable(defaultProfilePlugin.id, ctx);
  await engine.pluginManager.enable(webcamPlugin.id, ctx);

  // Create ARToolKit plugin and wire it EXPLICITLY to this engine context
  artoolkit = new ArtoolkitPlugin({
    cameraParametersUrl: '/examples/vite-artoolkit/data/camera_para.dat',
    minConfidence: 0.6,
  });

  // IMPORTANT: bind to engine context so events go to engine.eventBus
  await artoolkit.init(ctx);
  await artoolkit.enable();

  // Start ECS loop (systems/plugins tick)
  engine.start();

  // Fallback: if worker became ready during enable, honor it
  if (artoolkit.workerReady) {
    log('Worker was already ready (post-enable).');
    setStatus('Worker ready. You can start the webcam and load the marker.', 'success');
    loadBtn.disabled = false;
  } else {
    setStatus('Plugin initialized. Waiting for worker…', 'normal');
    // Tiny watchdog in case the ready event is missed due to external wiring
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (artoolkit.workerReady) {
        loadBtn.disabled = false;
        setStatus('Worker ready. You can start the webcam and load the marker.', 'success');
        clearInterval(iv);
      } else if (Date.now() - t0 > 5000) {
        clearInterval(iv);
      }
    }, 100);
  }

  // UI initial state
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

async function startWebcam() {
  if (cameraStarted) return;
  try {
    startBtn.disabled = true;
    stopBtn.disabled = true;
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

    attachVideoToViewport(ctx);

    // Start frame pump (streams ImageBitmap frames into engine:update)
    if (!pumping) {
      FramePumpSystem.start(ctx);
      pumping = true;
    }

    cameraStarted = true;
    setStatus('Webcam started. You can now show the marker.', 'success');
    log('Webcam started.');
    stopBtn.disabled = false;
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
    if (viewport) viewport.innerHTML = '';
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
  } catch (err) {
    log('loadMarker failed: ' + (err?.message || err));
    setStatus('Failed to load marker', 'error');
  } finally {
    // Re-enable for retry/replace
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
