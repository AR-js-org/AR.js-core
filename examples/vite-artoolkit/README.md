# AR.js Core ECS + ArtoolkitPlugin example

This example shows how to use the ArtoolkitPlugin with AR.js Core:

- Capture video via the webcam source plugin
- Stream frames as ImageBitmap to the worker (frame pump)
- Show the live webcam feed in a viewport
- Detect the HIRO marker and receive markerFound/Updated/Lost events

## Quick start

1. Serve the repository root so example and vendor assets resolve:

- `python3 -m http.server 8080`
- or `npx http-server -p 8080`

2. Open http://localhost:8080/examples/vite-artoolkit/index.html
3. Click “Start Webcam” to begin streaming frames and show the live video
4. Click “Load Marker” to load the HIRO pattern, then show it to the camera

## Buttons

- Start Webcam
  - Initializes capture (webcam plugin)
  - Attaches the `<video>` element to the on‑page viewport
  - Starts the FramePumpSystem to emit `ImageBitmap` frames via `engine:update`
- Stop
  - Stops the frame pump and disposes capture
- Load Marker
  - Calls `plugin.loadMarker('/examples/vite-artoolkit/data/patt.hiro', 1)`

## Video viewport

The webcam plugin creates `<video id="arjs-video">` and positions it offscreen. The example moves it into a visible container with:

```js
const frameSource = CaptureSystem.getFrameSource(ctx);
const videoEl = frameSource.element;
// detach from body, append inside #viewport, and override styles to be visible
```

## Plugin notes

- The example imports the plugin ESM from a local vendor folder. Ensure `assets/` (worker and ARToolKit chunks) sit alongside the ESM file.
- Alternatively, import from the CDN:

```js
const mod =
  await import('https://cdn.jsdelivr.net/gh/AR-js-org/arjs-plugin-artoolkit@main/dist/arjs-plugin-artoolkit.esm.js');
```

## Troubleshooting

- Load Marker is disabled:
  - Wait for “Worker ready”. The button is enabled on `ar:workerReady` or when `plugin.workerReady` is true.
- No detections:
  - Ensure the frame pump is running (Start Webcam pressed)
  - Check that the worker assets and `camera_para.dat`/`patt.hiro` URLs return 200
- Lint errors about browser APIs:
  - Use `globalThis.createImageBitmap`, `globalThis.OffscreenCanvas`, and cancel rVFC via `video.cancelVideoFrameCallback`
