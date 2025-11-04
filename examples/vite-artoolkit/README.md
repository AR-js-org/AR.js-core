# AR.js Core ECS + ArtoolkitPlugin example

## This example shows how to use the ArtoolkitPlugin with AR.js Core:

- Capture video via the webcam source plugin
- Stream frames as ImageBitmap to the worker (frame pump)
- Detect the HIRO marker and receive markerFound/Updated/Lost events

## Quick start

1. Serve the repository root so example and vendor assets resolve:

- `python3 -m http.server 8080`
- or `npx http-server -p 8080`

2. Open http://localhost:8080/examples/vite-artoolkit/index.html
3. Wait for “Worker ready”, then show the HIRO marker

## Key integration points

- Webcam plugin (plugins/source/webcam.js)
  - Provides a playing `<video>` element via getUserMedia
  - Emits SOURCE_LOADED / SOURCE_PLAYING events

- Frame pump (in this example)
  - Converts the `<video>` into ImageBitmap frames each tick
  - Prefers `HTMLVideoElement.requestVideoFrameCallback`, falls back to `requestAnimationFrame`
  - Emits `engine:update` with `{ id, imageBitmap, width, height }` every frame

- ArtoolkitPlugin (vendor ESM)
  - Listens to `engine:update` and forwards ImageBitmaps to the worker
  - Emits:
    - `ar:workerReady`, `ar:workerError`
    - `ar:getMarker` (raw ARToolKit payload)
    - `ar:markerFound`, `ar:markerUpdated`, `ar:markerLost`

## Asset paths

- Use absolute URLs when serving from repo root:
  - `cameraParametersUrl: '/examples/vite-artoolkit/data/camera_para.dat'`
  - `await plugin.loadMarker('/examples/vite-artoolkit/data/patt.hiro', 1)`

## Troubleshooting

- No detections?
  - Ensure the frame pump is running and emitting ImageBitmaps
  - Check that the worker assets (vendor plugin ESM + assets folder) are reachable
  - Confirm correct paths for `camera_para.dat` and `patt.hiro`
- Worker not ready?
  - Serve via HTTP/HTTPS (not `file://`)
  - Check the console for network or module resolution errors
