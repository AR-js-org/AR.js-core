/**
 * FramePumpSystem
 * Emits engine:update with ImageBitmap frames from the active video source.
 * - Prefers HTMLVideoElement.requestVideoFrameCallback when available
 * - Falls back to requestAnimationFrame
 * - Uses createImageBitmap(video) when possible (fast path)
 * - Falls back to drawing to a canvas and createImageBitmap(canvas)
 */
import { RESOURCES } from '../core/components.js';

export class FramePumpSystem {
  static start(context) {
    if (!context) throw new Error('FramePumpSystem.start requires a context');
    const bus = context.eventBus;
    const ref = context.ecs.getResource(RESOURCES.FRAME_SOURCE_REF);
    if (!ref?.element) {
      console.warn(
        '[FramePumpSystem] No frame source element found; did you call CaptureSystem.initialize?',
      );
      return false;
    }
    const video = ref.element;
    if (video.tagName !== 'VIDEO') {
      console.warn('[FramePumpSystem] Frame source is not a <video> element; skipping frame pump.');
      return false;
    }

    // Keep state on context to allow stop()
    context.__framePump = context.__framePump || {};
    const state = context.__framePump;
    if (state.running) return true;
    state.running = true;
    state._fid = 0;

    // Optional canvas fallback
    let offscreen = null;
    let ctx2d = null;
    function ensureCanvas(w, h) {
      if (offscreen && offscreen.width === w && offscreen.height === h) return;
      try {
        if ('OffscreenCanvas' in globalThis) {
          offscreen = new OffscreenCanvas(w, h);
          ctx2d = offscreen.getContext('2d', { willReadFrequently: true });
        } else {
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.style.display = 'none';
          document.body.appendChild(c);
          offscreen = c;
          ctx2d = c.getContext('2d', { willReadFrequently: true });
        }
      } catch {
        offscreen = null;
        ctx2d = null;
      }
    }

    async function emitFrame() {
      const w = video.videoWidth || ref.width || 640;
      const h = video.videoHeight || ref.height || 480;
      if (!w || !h) return;

      // Try the fast path: ImageBitmap directly from video
      try {
        if (globalThis.createImageBitmap) {
          const imageBitmap = await createImageBitmap(video);
          bus.emit('engine:update', { id: ++state._fid, imageBitmap, width: w, height: h });
          return;
        }
      } catch {
        // fall through to canvas path
      }

      // Canvas fallback
      try {
        ensureCanvas(w, h);
        if (!offscreen || !ctx2d) return;

        ctx2d.clearRect(0, 0, w, h);
        ctx2d.drawImage(video, 0, 0, w, h);

        if (globalThis.createImageBitmap) {
          const imageBitmap = await createImageBitmap(offscreen);
          bus.emit('engine:update', { id: ++state._fid, imageBitmap, width: w, height: h });
        } else {
          // As a last resort, emit without ImageBitmap (worker will try a slower fallback)
          bus.emit('engine:update', { id: ++state._fid, width: w, height: h });
        }
      } catch {
        // ignore transient failures
      }
    }

    // Use requestVideoFrameCallback when available
    if (typeof video.requestVideoFrameCallback === 'function') {
      const step = async (_now, _metadata) => {
        if (!state.running) return;
        await emitFrame();
        state._rvfc = video.requestVideoFrameCallback(step);
      };
      state._rvfc = video.requestVideoFrameCallback(step);
    } else {
      const loop = async () => {
        if (!state.running) return;
        await emitFrame();
        state._raf = requestAnimationFrame(loop);
      };
      state._raf = requestAnimationFrame(loop);
    }

    return true;
  }

  static stop(context) {
    const state = context?.__framePump;
    if (!state || !state.running) return;
    state.running = false;
    if (state._rvfc && typeof cancelVideoFrameCallback === 'function') {
      try {
        cancelVideoFrameCallback(state._rvfc);
      } catch {}
    }
    if (state._raf) {
      try {
        cancelAnimationFrame(state._raf);
      } catch {}
    }
    context.__framePump = undefined;
  }
}
