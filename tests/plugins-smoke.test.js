import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../src/core/event-bus.js';
import { imagePlugin } from '../plugins/source/image.js';
import { videoPlugin } from '../plugins/source/video.js';
import { webcamPlugin } from '../plugins/source/webcam.js';

function installGlobalDomStubs() {
  // Minimal CustomEvent + window.dispatchEvent
  globalThis.CustomEvent = function CustomEvent(type, options) {
    return { type, detail: options?.detail ?? null };
  };
  globalThis.window = globalThis.window || {};
  globalThis.window.dispatchEvent = vi.fn();

  // Minimal document with element factories
  const body = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  };

  function makeImageElement() {
    const el = {
      id: '',
      style: {},
      width: 0,
      height: 0,
      naturalWidth: 640,
      naturalHeight: 480,
      setAttribute: vi.fn((name, value) => {
        if (name === 'id') el.id = value;
      }),
      onload: null,
      onerror: null,
      _src: '',
      set src(val) {
        this._src = val;
        // Simulate successful load on next tick
        setTimeout(() => {
          if (typeof this.onload === 'function') this.onload();
        }, 0);
      },
      get src() {
        return this._src;
      },
    };
    return el;
  }

  function makeVideoElement() {
    const listeners = new Map();
    const el = {
      id: '',
      style: {},
      videoWidth: 640,
      videoHeight: 480,
      setAttribute: vi.fn((name, value) => {
        if (name === 'id') el.id = value;
      }),
      addEventListener: vi.fn((evt, cb) => {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(cb);
      }),
      removeEventListener: vi.fn((evt, cb) => {
        const arr = listeners.get(evt) || [];
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }),
      dispatchEvent: vi.fn((evt) => {
        const arr = listeners.get(evt?.type || evt) || [];
        for (const cb of arr) cb();
      }),
      onloadedmetadata: null,
      onloadeddata: null,
      onerror: null,
      play: vi.fn(() => Promise.resolve()),
      _srcObject: null,
      set srcObject(val) {
        this._srcObject = val;
        // Fire loadedmetadata after srcObject is set (async)
        setTimeout(() => {
          if (typeof this.onloadedmetadata === 'function') this.onloadedmetadata();
          if (typeof this.onloadeddata === 'function') this.onloadeddata();
        }, 0);
      },
      get srcObject() {
        return this._srcObject;
      },
      _src: '',
      set src(val) {
        this._src = val;
        // Fire loadeddata/metadata for video file load (async)
        setTimeout(() => {
          if (typeof this.onloadeddata === 'function') this.onloadeddata();
          if (typeof this.onloadedmetadata === 'function') this.onloadedmetadata();
          el.dispatchEvent({ type: 'loadeddata' });
          el.dispatchEvent({ type: 'loadedmetadata' });
        }, 0);
      },
      get src() {
        return this._src;
      },
    };
    return el;
  }

  globalThis.document = {
    body,
    createElement: (tag) => {
      if (tag === 'img') return makeImageElement();
      if (tag === 'video') return makeVideoElement();
      return { setAttribute: vi.fn(), style: {} };
    },
  };

  return { body };
}

describe('Capture plugins smoke tests (with minimal mocks)', () => {
  let eventBus;
  let context;
  let dom;

  beforeEach(() => {
    dom = installGlobalDomStubs();
    eventBus = new EventBus();
    context = { eventBus };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('imagePlugin.capture returns element with type=image and appends to body', async () => {
    await imagePlugin.init(context);
    const frame = await imagePlugin.capture(
      {
        sourceUrl: 'https://example.com/fake.jpg',
        sourceWidth: 320,
        sourceHeight: 240,
        displayWidth: 320,
        displayHeight: 240,
      },
      context,
    );

    expect(frame).toBeTruthy();
    expect(frame.type).toBe('image');
    expect(frame.element).toBeTruthy();
    // The plugin appends to body on load
    expect(dom.body.appendChild).toHaveBeenCalled();
  });

  it('videoPlugin.capture returns element with type=video and appends to body', async () => {
    await videoPlugin.init?.(context);

    const frame = await videoPlugin.capture?.(
      {
        sourceUrl: 'https://example.com/video.mp4',
        sourceWidth: 320,
        sourceHeight: 240,
        displayWidth: 320,
        displayHeight: 240,
        autoplay: true,
        loop: true,
        muted: true,
      },
      context,
    );

    // Some plugin versions may export without init/capture; guard to avoid false negatives
    expect(frame).toBeTruthy();
    expect(frame.type).toBe('video');
    expect(frame.element).toBeTruthy();
    expect(dom.body.appendChild).toHaveBeenCalled();
  });

  it('webcamPlugin.capture returns element+stream with type=webcam and dispose stops tracks', async () => {
    // Minimal MediaDevices mock
    const stopped = { value: false };
    const track = {
      stop: () => {
        stopped.value = true;
      },
      getCapabilities: () => ({}),
    };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    };

    // Stub navigator con enumerateDevices + getUserMedia
    vi.stubGlobal('navigator', {
      mediaDevices: {
        enumerateDevices: vi.fn(async () => []),
        getUserMedia: vi.fn(async () => stream),
      },
    });

    await webcamPlugin.init(context);
    const frame = await webcamPlugin.capture(
      {
        sourceWidth: 320,
        sourceHeight: 240,
        displayWidth: 320,
        displayHeight: 240,
      },
      context,
    );

    expect(frame).toBeTruthy();
    expect(frame.type).toBe('webcam');
    expect(frame.element).toBeTruthy();
    expect(frame.stream).toBe(stream);
    expect(dom.body.appendChild).toHaveBeenCalled();

    // Dispose should stop the track and remove element
    await webcamPlugin.dispose();
    expect(stopped.value).toBe(true);
  });
});
