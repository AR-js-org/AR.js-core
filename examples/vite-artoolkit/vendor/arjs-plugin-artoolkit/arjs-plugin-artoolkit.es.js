const d = "0.1.3";
class m {
  constructor(g = {}) {
    this.options = {
      worker: !0,
      lostThreshold: 5,
      frameDurationMs: 200,
      sweepIntervalMs: 100,
      artoolkitModuleUrl: void 0,
      cameraParametersUrl: void 0,
      wasmBaseUrl: void 0,
      ...g
    }, this.core = null, this.enabled = !1, this._worker = null, this._onWorkerMessage = this._onWorkerMessage.bind(this), this._onEngineUpdate = this._onEngineUpdate.bind(this), this._markers = /* @__PURE__ */ new Map(), this.lostThreshold = this.options.lostThreshold, this.frameDurationMs = this.options.frameDurationMs, this.sweepIntervalMs = this.options.sweepIntervalMs, this.workerEnabled = this.options.worker, this._pendingMarkerLoads = /* @__PURE__ */ new Map(), this._nextLoadRequestId = 0, this.workerReady = !1, this.version = d;
  }
  /**
   * Initialize the plugin with the engine core.
   *
   * Stores the core reference and prepares the plugin.
   * Heavy initialization (worker setup) is deferred to enable().
   *
   * @param {Object} core - Engine core with eventBus
   * @param {Object} core.eventBus - Event bus for plugin communication
   * @returns {Promise<ArtoolkitPlugin>} This plugin instance
   */
  async init(g) {
    return this.core = g, console.log(
      `[ArtoolkitPlugin] ${this.version} Initialized with core`,
      g
    ), this;
  }
  /**
   * Enable the plugin and start marker detection.
   *
   * - Subscribes to engine:update events for frame processing
   * - Starts the detection worker (if workerEnabled)
   * - Begins marker sweep interval for lost-marker detection
   *
   * @returns {Promise<ArtoolkitPlugin>} This plugin instance
   * @throws {Error} If plugin not initialized via init()
   */
  async enable() {
    if (!this.core) throw new Error("Plugin not initialized");
    return this.enabled ? this : (this.enabled = !0, this.core.eventBus.on("engine:update", this._onEngineUpdate), this.workerEnabled && await this._startWorker(), this._sweepInterval = setInterval(
      () => this._sweepMarkers(),
      this.sweepIntervalMs
    ), this);
  }
  /**
   * Disable the plugin and stop marker detection.
   *
   * - Unsubscribes from engine:update events
   * - Stops and terminates the detection worker
   * - Clears the marker sweep interval
   *
   * @returns {Promise<ArtoolkitPlugin>} This plugin instance
   */
  async disable() {
    return this.enabled ? (this.enabled = !1, this.core.eventBus.off("engine:update", this._onEngineUpdate), this._worker && this._stopWorker(), this._sweepInterval && (clearInterval(this._sweepInterval), this._sweepInterval = null), this) : this;
  }
  /**
   * Dispose of the plugin and clean up resources.
   *
   * Alias for disable() - stops detection and terminates worker.
   *
   * @returns {Promise<ArtoolkitPlugin>} This plugin instance
   */
  dispose() {
    return this.disable();
  }
  /**
   * Engine frame update handler - forwards frames to the worker for processing.
   *
   * Receives frame data from the capture system and sends it to the detection worker.
   * In browsers, uses transferable ImageBitmap for zero-copy performance.
   *
   * @param {Object} frame - Frame data from capture system
   * @param {number} frame.id - Frame identifier
   * @param {number} frame.timestamp - Frame timestamp
   * @param {ImageBitmap} [frame.imageBitmap] - Browser-only transferable image data
   * @param {number} frame.width - Frame width in pixels
   * @param {number} frame.height - Frame height in pixels
   * @param {*} [frame.sourceRef] - Optional reference to source
   *
   * @private
   * @note After ImageBitmap transfer, the main thread's bitmap is neutered and cannot be reused
   */
  _onEngineUpdate(g) {
    if (g) {
      if (this._worker && g.imageBitmap) {
        try {
          typeof Worker < "u" ? this._worker.postMessage(
            {
              type: "processFrame",
              payload: {
                frameId: g.id,
                imageBitmap: g.imageBitmap,
                width: g.width,
                height: g.height
              }
            },
            // transfer list: ImageBitmap is transferable
            [g.imageBitmap]
          ) : this._worker.postMessage({
            type: "processFrame",
            payload: {
              frameId: g.id,
              width: g.width,
              height: g.height
            }
          });
        } catch (C) {
          console.warn(
            "Artoolkit worker postMessage (ImageBitmap) failed, falling back to frameId only",
            C
          );
          try {
            this._worker.postMessage({
              type: "processFrame",
              payload: { frameId: g.id }
            });
          } catch (l) {
            console.warn("worker postMessage failed", l);
          }
        }
        return;
      }
      if (this._worker)
        try {
          this._worker.postMessage({
            type: "processFrame",
            payload: { frameId: g.id }
          });
        } catch (C) {
          console.warn("Artoolkit worker postMessage failed", C);
        }
    }
  }
  /**
   * Start the detection worker (cross-platform).
   *
   * Creates and initializes a Web Worker (browser) or worker_threads.Worker (Node.js).
   * Attaches message handlers and sends initial configuration to the worker.
   *
   * **Browser:** Uses `new Worker(new URL(...), { type: 'module' })`
   * **Node.js:** Uses `worker_threads.Worker` with file path resolution
   *
   * Sends init message with:
   * - artoolkitModuleUrl: Custom ARToolKit module URL
   * - cameraParametersUrl: Camera calibration parameters
   * - wasmBaseUrl: Base URL for WASM files
   *
   * Includes watchdog timer to resend init if worker doesn't respond within 500ms.
   *
   * @private
   * @returns {Promise<void>}
   */
  async _startWorker() {
    if (!this._worker) {
      if (typeof Worker < "u")
        this._worker = new Worker(
          new URL(
            /* @vite-ignore */
            "" + new URL("assets/worker-C6Ps5-k4.js", import.meta.url).href,
            import.meta.url
          ),
          { type: "module" }
        );
      else {
        const { Worker: g } = await Promise.resolve().then(() => t), C = new URL("data:text/javascript;base64,LyoqCiAqIEBmaWxlb3ZlcnZpZXcgQVJUb29sS2l0IERldGVjdGlvbiBXb3JrZXIKICoKICogQ3Jvc3MtcGxhdGZvcm0gd2ViIHdvcmtlciBmb3IgbWFya2VyIGRldGVjdGlvbiB1c2luZyBBUlRvb2xLaXQuCiAqIFJ1bnMgbWFya2VyIHRyYWNraW5nIG9mZiB0aGUgbWFpbiB0aHJlYWQgZm9yIG9wdGltYWwgcGVyZm9ybWFuY2UuCiAqCiAqICoqQnJvd3NlciBQYXRoOioqCiAqIC0gUmVjZWl2ZXMgSW1hZ2VCaXRtYXAgdmlhIHRyYW5zZmVyYWJsZSBvYmplY3RzICh6ZXJvLWNvcHkpCiAqIC0gRHJhd3MgdG8gT2Zmc2NyZWVuQ2FudmFzIGZvciBwcm9jZXNzaW5nCiAqIC0gUnVucyBBUlRvb2xLaXQucHJvY2VzcygpIG9uIGNhbnZhcy9JbWFnZURhdGEKICogLSBGb3J3YXJkcyBmaWx0ZXJlZCBnZXRNYXJrZXIgZXZlbnRzIHRvIG1haW4gdGhyZWFkCiAqCiAqICoqRmVhdHVyZXM6KioKICogLSBMYXp5IGluaXRpYWxpemF0aW9uIHdpdGggZXhwb25lbnRpYWwgYmFja29mZiBvbiBmYWlsdXJlcwogKiAtIE1hcmtlciBsb2FkaW5nIGFuZCBkZWR1cGxpY2F0aW9uIGJ5IHBhdHRlcm4gVVJMCiAqIC0gQ29uZmlkZW5jZS1iYXNlZCBmaWx0ZXJpbmcgKGNvbmZpZ3VyYWJsZSB2aWEgaW5pdCkKICogLSBTZWxlY3RpdmUgZXZlbnQgZm9yd2FyZGluZyBmb3IgdHJhY2tlZCBwYXR0ZXJuIElEcyBvbmx5CiAqCiAqICoqTWVzc2FnZSBQcm90b2NvbDoqKgogKiAtIGBpbml0YDogQ29uZmlndXJlIHdvcmtlciAobW9kdWxlVXJsLCBjYW1lcmFQYXJhbWV0ZXJzVXJsLCB3YXNtQmFzZVVybCwgbWluQ29uZmlkZW5jZSkKICogLSBgbG9hZE1hcmtlcmA6IExvYWQgYSBwYXR0ZXJuIG1hcmtlciBieSBVUkwKICogLSBgcHJvY2Vzc0ZyYW1lYDogUHJvY2VzcyBJbWFnZUJpdG1hcCBmb3IgbWFya2VyIGRldGVjdGlvbgogKgogKiAqKkVtaXR0ZWQgRXZlbnRzOioqCiAqIC0gYHJlYWR5YDogV29ya2VyIGluaXRpYWxpemVkIGFuZCByZWFkeQogKiAtIGBnZXRNYXJrZXJgOiBGaWx0ZXJlZCBtYXJrZXIgZGV0ZWN0aW9uIGV2ZW50CiAqIC0gYGxvYWRNYXJrZXJSZXN1bHRgOiBSZXN1bHQgb2YgbG9hZE1hcmtlciByZXF1ZXN0CiAqIC0gYGVycm9yYDogRXJyb3Igb2NjdXJyZWQgZHVyaW5nIHByb2Nlc3NpbmcKICoKICogQG1vZHVsZSB3b3JrZXIvd29ya2VyCiAqLwoKbGV0IGFyQ29udHJvbGxlciA9IG51bGw7CmxldCBhckNvbnRyb2xsZXJJbml0aWFsaXplZCA9IGZhbHNlOwpsZXQgZ2V0TWFya2VyRm9yd2FyZGVyQXR0YWNoZWQgPSBmYWxzZTsKCmxldCBvZmZzY3JlZW5DYW52YXMgPSBudWxsOwpsZXQgb2Zmc2NyZWVuQ3R4ID0gbnVsbDsKbGV0IGNhbnZhc1cgPSAwOwpsZXQgY2FudmFzSCA9IDA7CgovLyBNYXJrZXIgYW5kIGZpbHRlcmluZyBzdGF0ZQpjb25zdCBsb2FkZWRNYXJrZXJzID0gbmV3IE1hcCgpOyAvLyBwYXR0ZXJuVXJsIC0+IG1hcmtlcklkCmNvbnN0IGxvYWRpbmdNYXJrZXJzID0gbmV3IE1hcCgpOyAvLyBwYXR0ZXJuVXJsIC0+IFByb21pc2U8bWFya2VySWQ+CmNvbnN0IHRyYWNrZWRQYXR0ZXJuSWRzID0gbmV3IFNldCgpOyAvLyBTZXQ8bnVtYmVyPgpsZXQgUEFUVEVSTl9NQVJLRVJfVFlQRSA9IDA7IC8vIHdpbGwgYmUgcmVhZCBmcm9tIEFSVG9vbGtpdCBpZiBhdmFpbGFibGUKbGV0IE1JTl9DT05GSURFTkNFID0gMC42OyAvLyBjb25maWd1cmFibGUgdmlhIGluaXQgcGF5bG9hZAoKLy8gSW5pdCBiYWNrb2ZmIHN0YXRlCmxldCBpbml0SW5Qcm9ncmVzcyA9IG51bGw7CmxldCBpbml0RmFpbENvdW50ID0gMDsKbGV0IGluaXRGYWlsZWRVbnRpbCA9IDA7CgovLyBJbml0LXRpbWUgb3B0aW9ucyAob3ZlcnJpZGFibGUgZnJvbSBtYWluIHRocmVhZCkKbGV0IElOSVRfT1BUUyA9IHsKICBtb2R1bGVVcmw6IG51bGwsCiAgY2FtZXJhUGFyYW1ldGVyc1VybDogbnVsbCwKICB3YXNtQmFzZVVybDogbnVsbCwKICBtaW5Db25maWRlbmNlOiBudWxsLAp9OwoKLy8gQW5ub3VuY2UtcmVhZHkgZ3VhcmQKbGV0IGhhc0Fubm91bmNlZFJlYWR5ID0gZmFsc2U7CgovKioKICogQ3Jvc3MtcGxhdGZvcm0gbWVzc2FnZSBsaXN0ZW5lciByZWdpc3RyYXRpb24uCiAqCiAqIEF0dGFjaGVzIGEgbWVzc2FnZSBoYW5kbGVyIGZvciB0aGUgd29ya2VyJ3MgbWVzc2FnZSBldmVudHMuCiAqIE5vcm1hbGl6ZXMgYnJvd3NlciB3b3JrZXIgbWVzc2FnZSBldmVudHMgKGV4dHJhY3RzIGV2LmRhdGEpLgogKgogKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIEhhbmRsZXIgZnVuY3Rpb24gcmVjZWl2aW5nIG1lc3NhZ2UgZGF0YQogKiBAcHJpdmF0ZQogKi8KZnVuY3Rpb24gb25NZXNzYWdlKGZuKSB7CiAgLy8gQnJvd3NlciB3b3JrZXIgcGF0aAogIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcigibWVzc2FnZSIsIChldikgPT4gZm4oZXYuZGF0YSkpOwp9CgovKioKICogU2VuZCBhIG1lc3NhZ2UgdG8gdGhlIG1haW4gdGhyZWFkLgogKgogKiBAcGFyYW0ge09iamVjdH0gbXNnIC0gTWVzc2FnZSBvYmplY3QgdG8gc2VuZAogKiBAcGFyYW0ge3N0cmluZ30gbXNnLnR5cGUgLSBNZXNzYWdlIHR5cGUgaWRlbnRpZmllcgogKiBAcGFyYW0geyp9IFttc2cucGF5bG9hZF0gLSBPcHRpb25hbCBtZXNzYWdlIHBheWxvYWQKICogQHByaXZhdGUKICovCmZ1bmN0aW9uIHNlbmRNZXNzYWdlKG1zZykgewogIHNlbGYucG9zdE1lc3NhZ2UobXNnKTsKfQoKLyoqCiAqIFNlcmlhbGl6ZSBBUi5qcy1zdHlsZSBnZXRNYXJrZXIgZXZlbnQgaW50byBhIHRyYW5zZmVyYWJsZSBwYXlsb2FkLgogKgogKiBDb252ZXJ0cyB0aGUgbWFya2VyIGV2ZW50IGludG8gYSBwbGFpbiBvYmplY3QgdGhhdCBjYW4gYmUgc2VudCB2aWEgcG9zdE1lc3NhZ2UsCiAqIGV4dHJhY3RpbmcgbWF0cml4LCBtYXJrZXIgcHJvcGVydGllcywgYW5kIHZlcnRleCBkYXRhLgogKgogKiBAcGFyYW0ge09iamVjdH0gZXYgLSBSYXcgZ2V0TWFya2VyIGV2ZW50IGZyb20gQVJUb29sS2l0CiAqIEByZXR1cm5zIHtPYmplY3R9IFNlcmlhbGl6ZWQgcGF5bG9hZCB3aXRoIHR5cGUsIG1hdHJpeCwgYW5kIG1hcmtlciBwcm9wZXJ0aWVzCiAqIEBwcml2YXRlCiAqLwpmdW5jdGlvbiBzZXJpYWxpemVHZXRNYXJrZXJFdmVudChldikgewogIHRyeSB7CiAgICBjb25zdCBkYXRhID0gZXY/LmRhdGEgfHwge307CiAgICBjb25zdCBtYXJrZXIgPSBkYXRhLm1hcmtlciB8fCB7fTsKICAgIGNvbnN0IG1hdHJpeCA9IEFycmF5LmlzQXJyYXkoZGF0YS5tYXRyaXgpCiAgICAgID8gZGF0YS5tYXRyaXguc2xpY2UoMCwgMTYpCiAgICAgIDogZGF0YS5tYXRyaXggJiYgZGF0YS5tYXRyaXgubGVuZ3RoCiAgICAgICAgPyBBcnJheS5mcm9tKGRhdGEubWF0cml4KS5zbGljZSgwLCAxNikKICAgICAgICA6IG51bGw7CiAgICBjb25zdCB2ZXJ0ZXggPSBtYXJrZXIudmVydGV4CiAgICAgID8gQXJyYXkuaXNBcnJheShtYXJrZXIudmVydGV4KQogICAgICAgID8gbWFya2VyLnZlcnRleC5zbGljZSgpCiAgICAgICAgOiBudWxsCiAgICAgIDogbWFya2VyLmNvcm5lcnMKICAgICAgICA/IG1hcmtlci5jb3JuZXJzLmZsYXRNYXAoKGMpID0+IFtjLnggPz8gY1swXSwgYy55ID8/IGNbMV1dKQogICAgICAgIDogbnVsbDsKCiAgICByZXR1cm4gewogICAgICB0eXBlOiBkYXRhLnR5cGUsIC8vIGUuZy4sIEFSVG9vbGtpdC5QQVRURVJOX01BUktFUgogICAgICBtYXRyaXgsCiAgICAgIG1hcmtlcjogewogICAgICAgIGlkUGF0dDogbWFya2VyLmlkUGF0dCA/PyBtYXJrZXIucGF0dGVybklkID8/IG1hcmtlci5wYXR0ZXJuX2lkID8/IG51bGwsCiAgICAgICAgaWRNYXRyaXg6IG1hcmtlci5pZE1hdHJpeCA/PyBudWxsLAogICAgICAgIGNmUGF0dDogbWFya2VyLmNmUGF0dCA/PyBtYXJrZXIuY29uZmlkZW5jZSA/PyBudWxsLAogICAgICAgIGNmTWF0cml4OiBtYXJrZXIuY2ZNYXRyaXggPz8gbnVsbCwKICAgICAgICB2ZXJ0ZXg6IHZlcnRleCB8fCBudWxsLAogICAgICB9LAogICAgfTsKICB9IGNhdGNoIHsKICAgIHJldHVybiB7IHR5cGU6IG51bGwsIG1hdHJpeDogbnVsbCwgbWFya2VyOiB7fSB9OwogIH0KfQoKLyoqCiAqIEZpbHRlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgaWYgYSBtYXJrZXIgZXZlbnQgc2hvdWxkIGJlIGZvcndhcmRlZCB0byBtYWluIHRocmVhZC4KICoKICogQXBwbGllcyBtdWx0aXBsZSBmaWx0ZXJzOgogKiAtIFR5cGUgbXVzdCBtYXRjaCBQQVRURVJOX01BUktFUgogKiAtIENvbmZpZGVuY2UgbXVzdCBtZWV0IE1JTl9DT05GSURFTkNFIHRocmVzaG9sZAogKiAtIE1hdHJpeCBtdXN0IGV4aXN0IHdpdGggMTYrIHZhbHVlcwogKiAtIElmIHRyYWNraW5nIHNwZWNpZmljIElEcywgbWFya2VyIElEIG11c3QgYmUgaW4gdHJhY2tlZFBhdHRlcm5JZHMKICoKICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gTWFya2VyIGV2ZW50IGZyb20gQVJUb29sS2l0CiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIGV2ZW50IHNob3VsZCBiZSBmb3J3YXJkZWQKICogQHByaXZhdGUKICovCmZ1bmN0aW9uIHNob3VsZEZvcndhcmRHZXRNYXJrZXIoZXZlbnQpIHsKICBjb25zdCBkYXRhID0gZXZlbnQ/LmRhdGEgfHwge307CiAgY29uc3QgdHlwZSA9IGRhdGEudHlwZTsKICBjb25zdCBtYXJrZXIgPSBkYXRhLm1hcmtlciB8fCB7fTsKICBjb25zdCBpZCA9IG1hcmtlci5pZFBhdHQgPz8gbWFya2VyLnBhdHRlcm5JZCA/PyBtYXJrZXIucGF0dGVybl9pZCA/PyBudWxsOwogIGNvbnN0IGNvbmYgPSBtYXJrZXIuY2ZQYXR0ID8/IG1hcmtlci5jb25maWRlbmNlID8/IDA7CiAgY29uc3QgbWF0cml4ID0gZGF0YS5tYXRyaXg7CgogIC8vIFR5cGUgbXVzdCBiZSBQQVRURVJOX01BUktFUiAoZmFsbGJhY2sgbnVtZXJpYyAwIGlmIGNvbnN0YW50cyBub3QgYXZhaWxhYmxlKQogIGlmICh0eXBlICE9PSBQQVRURVJOX01BUktFUl9UWVBFKSByZXR1cm4gZmFsc2U7CgogIC8vIENvbmZpZGVuY2UgZ2F0ZQogIGlmICghKE51bWJlci5pc0Zpbml0ZShjb25mKSAmJiBjb25mID49IE1JTl9DT05GSURFTkNFKSkgcmV0dXJuIGZhbHNlOwoKICAvLyBNYXRyaXggbXVzdCBleGlzdCB3aXRoIGF0IGxlYXN0IDE2IHZhbHVlcwogIGNvbnN0IG0gPSBBcnJheS5pc0FycmF5KG1hdHJpeCkKICAgID8gbWF0cml4CiAgICA6IChtYXRyaXggJiYgQXJyYXkuZnJvbShtYXRyaXgpKSB8fCBudWxsOwogIGlmICghbSB8fCBtLmxlbmd0aCA8IDE2KSByZXR1cm4gZmFsc2U7CgogIC8vIElmIHdlIGhhdmUgdHJhY2tlZCBJRHMsIG9ubHkgZm9yd2FyZCB0aG9zZSBJRHMKICBpZiAodHJhY2tlZFBhdHRlcm5JZHMuc2l6ZSAmJiBpZCAhPSBudWxsICYmICF0cmFja2VkUGF0dGVybklkcy5oYXMoaWQpKQogICAgcmV0dXJuIGZhbHNlOwoKICByZXR1cm4gdHJ1ZTsKfQoKLyoqCiAqIEF0dGFjaCBhIGZpbHRlcmVkIGV2ZW50IGZvcndhcmRlciB0byBBUkNvbnRyb2xsZXIncyBnZXRNYXJrZXIgZXZlbnRzLgogKgogKiBTZXRzIHVwIGEgbGlzdGVuZXIgdGhhdCBmaWx0ZXJzIG1hcmtlciBldmVudHMgYmFzZWQgb24gY29uZmlkZW5jZSwgdHlwZSwKICogYW5kIHRyYWNrZWQgcGF0dGVybiBJRHMgYmVmb3JlIGZvcndhcmRpbmcgdG8gdGhlIG1haW4gdGhyZWFkLgogKgogKiBPbmx5IGF0dGFjaGVzIG9uY2UgKGd1YXJkZWQgYnkgZ2V0TWFya2VyRm9yd2FyZGVyQXR0YWNoZWQgZmxhZykuCiAqCiAqIEBwcml2YXRlCiAqLwpmdW5jdGlvbiBhdHRhY2hHZXRNYXJrZXJGb3J3YXJkZXIoKSB7CiAgaWYgKAogICAgIWFyQ29udHJvbGxlciB8fAogICAgdHlwZW9mIGFyQ29udHJvbGxlci5hZGRFdmVudExpc3RlbmVyICE9PSAiZnVuY3Rpb24iIHx8CiAgICBnZXRNYXJrZXJGb3J3YXJkZXJBdHRhY2hlZAogICkKICAgIHJldHVybjsKICBhckNvbnRyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcigiZ2V0TWFya2VyIiwgKGV2ZW50KSA9PiB7CiAgICBpZiAoIXNob3VsZEZvcndhcmRHZXRNYXJrZXIoZXZlbnQpKSByZXR1cm47CiAgICBjb25zdCBwYXlsb2FkID0gc2VyaWFsaXplR2V0TWFya2VyRXZlbnQoZXZlbnQpOwogICAgdHJ5IHsKICAgICAgY29uc29sZS5sb2coIltXb3JrZXJdIGdldE1hcmtlciAoZmlsdGVyZWQpIiwgcGF5bG9hZCk7CiAgICB9IGNhdGNoIHt9CiAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICJnZXRNYXJrZXIiLCBwYXlsb2FkIH0pOwogIH0pOwogIGdldE1hcmtlckZvcndhcmRlckF0dGFjaGVkID0gdHJ1ZTsKfQoKLyoqCiAqIEluaXRpYWxpemUgQVJUb29sS2l0IHdpdGggZXhwb25lbnRpYWwgYmFja29mZiBvbiBmYWlsdXJlcy4KICoKICogTG9hZHMgdGhlIEFSVG9vbEtpdCBtb2R1bGUsIGNvbmZpZ3VyZXMgaXQgd2l0aCBpbml0IG9wdGlvbnMsCiAqIGNyZWF0ZXMgYW4gQVJDb250cm9sbGVyLCBhbmQgYXR0YWNoZXMgdGhlIGdldE1hcmtlciBldmVudCBmb3J3YXJkZXIuCiAqCiAqICoqQmFja29mZiBTdHJhdGVneToqKgogKiAtIE9uIGZhaWx1cmUsIGRlbGF5cyByZXRyeSB3aXRoIGV4cG9uZW50aWFsIGJhY2tvZmYgKHVwIHRvIDMwIHNlY29uZHMpCiAqIC0gUHJldmVudHMgcmVwZWF0ZWQgaW5pdGlhbGl6YXRpb24gYXR0ZW1wdHMgd2hlbiBsaWJyYXJ5IGlzIHVuYXZhaWxhYmxlCiAqCiAqIEBwYXJhbSB7bnVtYmVyfSBbd2lkdGg9NjQwXSAtIFZpZGVvL2NhbnZhcyB3aWR0aCBmb3IgQVJDb250cm9sbGVyCiAqIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0PTQ4MF0gLSBWaWRlby9jYW52YXMgaGVpZ2h0IGZvciBBUkNvbnRyb2xsZXIKICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IFRydWUgaWYgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5CiAqIEBwcml2YXRlCiAqLwphc3luYyBmdW5jdGlvbiBpbml0QXJ0b29sa2l0KHdpZHRoID0gNjQwLCBoZWlnaHQgPSA0ODApIHsKICBpZiAoYXJDb250cm9sbGVySW5pdGlhbGl6ZWQpIHJldHVybiB0cnVlOwoKICBjb25zdCBub3cgPSBEYXRlLm5vdygpOwogIGlmIChub3cgPCBpbml0RmFpbGVkVW50aWwpIHsKICAgIGNvbnN0IHdhaXRNcyA9IGluaXRGYWlsZWRVbnRpbCAtIG5vdzsKICAgIGNvbnNvbGUud2FybigiW1dvcmtlcl0gaW5pdEFydG9vbGtpdCBza2lwcGVkIGR1ZSB0byBiYWNrb2ZmIChtcyk6Iiwgd2FpdE1zKTsKICAgIHJldHVybiBmYWxzZTsKICB9CgogIGlmIChpbml0SW5Qcm9ncmVzcykgewogICAgdHJ5IHsKICAgICAgYXdhaXQgaW5pdEluUHJvZ3Jlc3M7CiAgICAgIHJldHVybiBhckNvbnRyb2xsZXJJbml0aWFsaXplZDsKICAgIH0gY2F0Y2ggewogICAgICByZXR1cm4gZmFsc2U7CiAgICB9CiAgfQoKICBpbml0SW5Qcm9ncmVzcyA9IChhc3luYyAoKSA9PiB7CiAgICB0cnkgewogICAgICBjb25zdCBqc2FydG9vbGtpdCA9IGF3YWl0IChhc3luYyAoKSA9PiB7CiAgICAgICAgaWYgKElOSVRfT1BUUy5tb2R1bGVVcmwpIHsKICAgICAgICAgIGNvbnNvbGUubG9nKAogICAgICAgICAgICAiW1dvcmtlcl0gTG9hZGluZyBhcnRvb2xraXQgZnJvbSBtb2R1bGVVcmw6IiwKICAgICAgICAgICAgSU5JVF9PUFRTLm1vZHVsZVVybCwKICAgICAgICAgICk7CiAgICAgICAgICByZXR1cm4gYXdhaXQgaW1wb3J0KElOSVRfT1BUUy5tb2R1bGVVcmwpOwogICAgICAgIH0KICAgICAgICAvLyBJZiB5b3VyIGVudmlyb25tZW50IHN1cHBvcnRzIGJhcmUgaW1wb3J0IChpbXBvcnQgbWFwL2J1bmRsZXIpLCB0aGlzIHdpbGwgd29yazoKICAgICAgICByZXR1cm4gYXdhaXQgaW1wb3J0KCJAYXItanMtb3JnL2FydG9vbGtpdDUtanMiKTsKICAgICAgfSkoKTsKCiAgICAgIC8vIFNhZmVseSBleHRyYWN0IGV4cG9ydHMgKHN1cHBvcnRzIGJvdGggbmFtZWQgYW5kIGRlZmF1bHQgZXhwb3J0cykKICAgICAgY29uc3QgQVJDb250cm9sbGVyID0KICAgICAgICBqc2FydG9vbGtpdC5BUkNvbnRyb2xsZXIgPz8ganNhcnRvb2xraXQuZGVmYXVsdD8uQVJDb250cm9sbGVyOwogICAgICBjb25zdCBBUlRvb2xraXQgPSBqc2FydG9vbGtpdC5BUlRvb2xraXQgPz8ganNhcnRvb2xraXQuZGVmYXVsdD8uQVJUb29sa2l0OwoKICAgICAgaWYgKCFBUkNvbnRyb2xsZXIpIHsKICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIkFSQ29udHJvbGxlciBleHBvcnQgbm90IGZvdW5kIGluIEFSVG9vbEtpdCBtb2R1bGUiKTsKICAgICAgfQoKICAgICAgLy8gUmVhZCB0aGUgY29uc3RhbnQgaWYgYXZhaWxhYmxlOyBlbHNlIGtlZXAgZGVmYXVsdCAwCiAgICAgIGlmIChBUlRvb2xraXQgJiYgdHlwZW9mIEFSVG9vbGtpdC5QQVRURVJOX01BUktFUiA9PT0gIm51bWJlciIpIHsKICAgICAgICBQQVRURVJOX01BUktFUl9UWVBFID0gQVJUb29sa2l0LlBBVFRFUk5fTUFSS0VSOwogICAgICB9CgogICAgICBpZiAoSU5JVF9PUFRTLndhc21CYXNlVXJsICYmIEFSQ29udHJvbGxlcikgewogICAgICAgIHRyeSB7CiAgICAgICAgICBBUkNvbnRyb2xsZXIuYmFzZVVSTCA9IElOSVRfT1BUUy53YXNtQmFzZVVybC5lbmRzV2l0aCgiLyIpCiAgICAgICAgICAgID8gSU5JVF9PUFRTLndhc21CYXNlVXJsCiAgICAgICAgICAgIDogSU5JVF9PUFRTLndhc21CYXNlVXJsICsgIi8iOwogICAgICAgIH0gY2F0Y2gge30KICAgICAgfQoKICAgICAgaWYgKHR5cGVvZiBJTklUX09QVFMubWluQ29uZmlkZW5jZSA9PT0gIm51bWJlciIpIHsKICAgICAgICBNSU5fQ09ORklERU5DRSA9IElOSVRfT1BUUy5taW5Db25maWRlbmNlOwogICAgICB9CgogICAgICBjb25zdCBjYW1VcmwgPQogICAgICAgIElOSVRfT1BUUy5jYW1lcmFQYXJhbWV0ZXJzVXJsIHx8CiAgICAgICAgImh0dHBzOi8vcmF3LmdpdGhhY2suY29tL0FSLWpzLW9yZy9BUi5qcy9tYXN0ZXIvZGF0YS9kYXRhL2NhbWVyYV9wYXJhLmRhdCI7CgogICAgICBjb25zb2xlLmxvZygiW1dvcmtlcl0gQVJUb29sS2l0IGluaXQiLCB7CiAgICAgICAgd2lkdGgsCiAgICAgICAgaGVpZ2h0LAogICAgICAgIGNhbVVybCwKICAgICAgICBtaW5Db25maWRlbmNlOiBNSU5fQ09ORklERU5DRSwKICAgICAgICBwYXR0ZXJuVHlwZTogUEFUVEVSTl9NQVJLRVJfVFlQRSwKICAgICAgfSk7CiAgICAgIGFyQ29udHJvbGxlciA9IGF3YWl0IEFSQ29udHJvbGxlci5pbml0V2l0aERpbWVuc2lvbnMoCiAgICAgICAgd2lkdGgsCiAgICAgICAgaGVpZ2h0LAogICAgICAgIGNhbVVybCwKICAgICAgICB7fSwKICAgICAgKTsKICAgICAgYXJDb250cm9sbGVySW5pdGlhbGl6ZWQgPSAhIWFyQ29udHJvbGxlcjsKICAgICAgY29uc29sZS5sb2coIltXb3JrZXJdIEFSVG9vbEtpdCBpbml0aWFsaXplZDoiLCBhckNvbnRyb2xsZXJJbml0aWFsaXplZCk7CgogICAgICBpZiAoIWFyQ29udHJvbGxlckluaXRpYWxpemVkKQogICAgICAgIHRocm93IG5ldyBFcnJvcigKICAgICAgICAgICJBUkNvbnRyb2xsZXIuaW5pdFdpdGhEaW1lbnNpb25zIHJldHVybmVkIGZhbHN5IGNvbnRyb2xsZXIiLAogICAgICAgICk7CgogICAgICBhdHRhY2hHZXRNYXJrZXJGb3J3YXJkZXIoKTsKCiAgICAgIGluaXRGYWlsQ291bnQgPSAwOwogICAgICBpbml0RmFpbGVkVW50aWwgPSAwOwogICAgfSBjYXRjaCAoZXJyKSB7CiAgICAgIGNvbnNvbGUuZXJyb3IoIltXb3JrZXJdIEFSVG9vbEtpdCBpbml0IGZhaWxlZDoiLCBlcnIpOwogICAgICBhckNvbnRyb2xsZXIgPSBudWxsOwogICAgICBhckNvbnRyb2xsZXJJbml0aWFsaXplZCA9IGZhbHNlOwoKICAgICAgaW5pdEZhaWxDb3VudCA9IE1hdGgubWluKGluaXRGYWlsQ291bnQgKyAxLCA2KTsKICAgICAgY29uc3QgZGVsYXkgPSBNYXRoLm1pbigzMDAwMCwgMTAwMCAqIE1hdGgucG93KDIsIGluaXRGYWlsQ291bnQpKTsKICAgICAgaW5pdEZhaWxlZFVudGlsID0gRGF0ZS5ub3coKSArIGRlbGF5OwoKICAgICAgc2VuZE1lc3NhZ2UoewogICAgICAgIHR5cGU6ICJlcnJvciIsCiAgICAgICAgcGF5bG9hZDogewogICAgICAgICAgbWVzc2FnZTogYEFSVG9vbEtpdCBpbml0IGZhaWxlZCAoJHtlcnI/Lm1lc3NhZ2UgfHwgZXJyfSkuIFJldHJ5aW5nIGluICR7ZGVsYXl9bXMuYCwKICAgICAgICB9LAogICAgICB9KTsKICAgICAgdGhyb3cgZXJyOwogICAgfSBmaW5hbGx5IHsKICAgICAgaW5pdEluUHJvZ3Jlc3MgPSBudWxsOwogICAgfQogIH0pKCk7CgogIHRyeSB7CiAgICBhd2FpdCBpbml0SW5Qcm9ncmVzczsKICB9IGNhdGNoIHt9CiAgcmV0dXJuIGFyQ29udHJvbGxlckluaXRpYWxpemVkOwp9CgovKioKICogTG9hZCBhIHBhdHRlcm4gbWFya2VyLCBkZWR1cGxpY2F0aW5nIHJlcXVlc3RzIGJ5IFVSTC4KICoKICogRW5zdXJlcyBlYWNoIHBhdHRlcm4gVVJMIGlzIGxvYWRlZCBvbmx5IG9uY2UsIGV2ZW4gaWYgcmVxdWVzdGVkIG11bHRpcGxlIHRpbWVzLgogKiBUcmFja3MgdGhlIGxvYWRlZCBtYXJrZXIgSUQgaW4gdHJhY2tlZFBhdHRlcm5JZHMgZm9yIGV2ZW50IGZpbHRlcmluZy4KICoKICogQHBhcmFtIHtzdHJpbmd9IHBhdHRlcm5VcmwgLSBVUkwgdG8gdGhlIHBhdHRlcm4gZmlsZSAoLnBhdHQpCiAqIEByZXR1cm5zIHtQcm9taXNlPG51bWJlcj59IE1hcmtlciBJRCBhc3NpZ25lZCBieSBBUlRvb2xLaXQKICogQHRocm93cyB7RXJyb3J9IElmIG1hcmtlciBsb2FkaW5nIGZhaWxzCiAqIEBwcml2YXRlCiAqLwphc3luYyBmdW5jdGlvbiBsb2FkUGF0dGVybk9uY2UocGF0dGVyblVybCkgewogIGlmIChsb2FkZWRNYXJrZXJzLmhhcyhwYXR0ZXJuVXJsKSkgcmV0dXJuIGxvYWRlZE1hcmtlcnMuZ2V0KHBhdHRlcm5VcmwpOwogIGlmIChsb2FkaW5nTWFya2Vycy5oYXMocGF0dGVyblVybCkpIHJldHVybiBsb2FkaW5nTWFya2Vycy5nZXQocGF0dGVyblVybCk7CgogIGNvbnN0IHAgPSAoYXN5bmMgKCkgPT4gewogICAgY29uc3QgaWQgPSBhd2FpdCBhckNvbnRyb2xsZXIubG9hZE1hcmtlcihwYXR0ZXJuVXJsKTsKICAgIGxvYWRlZE1hcmtlcnMuc2V0KHBhdHRlcm5VcmwsIGlkKTsKICAgIHRyYWNrZWRQYXR0ZXJuSWRzLmFkZChpZCk7CiAgICBsb2FkaW5nTWFya2Vycy5kZWxldGUocGF0dGVyblVybCk7CiAgICByZXR1cm4gaWQ7CiAgfSkoKS5jYXRjaCgoZSkgPT4gewogICAgbG9hZGluZ01hcmtlcnMuZGVsZXRlKHBhdHRlcm5VcmwpOwogICAgdGhyb3cgZTsKICB9KTsKCiAgbG9hZGluZ01hcmtlcnMuc2V0KHBhdHRlcm5VcmwsIHApOwogIHJldHVybiBwOwp9Cgpvbk1lc3NhZ2UoYXN5bmMgKGV2KSA9PiB7CiAgY29uc3QgeyB0eXBlLCBwYXlsb2FkIH0gPSBldiB8fCB7fTsKICB0cnkgewogICAgaWYgKHR5cGUgPT09ICJpbml0IikgewogICAgICBpZiAocGF5bG9hZCAmJiB0eXBlb2YgcGF5bG9hZCA9PT0gIm9iamVjdCIpIHsKICAgICAgICBJTklUX09QVFMubW9kdWxlVXJsID0gcGF5bG9hZC5tb2R1bGVVcmwgPz8gSU5JVF9PUFRTLm1vZHVsZVVybDsKICAgICAgICBJTklUX09QVFMuY2FtZXJhUGFyYW1ldGVyc1VybCA9CiAgICAgICAgICBwYXlsb2FkLmNhbWVyYVBhcmFtZXRlcnNVcmwgPz8gSU5JVF9PUFRTLmNhbWVyYVBhcmFtZXRlcnNVcmw7CiAgICAgICAgSU5JVF9PUFRTLndhc21CYXNlVXJsID0gcGF5bG9hZC53YXNtQmFzZVVybCA/PyBJTklUX09QVFMud2FzbUJhc2VVcmw7CiAgICAgICAgaWYgKHR5cGVvZiBwYXlsb2FkLm1pbkNvbmZpZGVuY2UgPT09ICJudW1iZXIiKSB7CiAgICAgICAgICBJTklUX09QVFMubWluQ29uZmlkZW5jZSA9IHBheWxvYWQubWluQ29uZmlkZW5jZTsKICAgICAgICAgIE1JTl9DT05GSURFTkNFID0gcGF5bG9hZC5taW5Db25maWRlbmNlOwogICAgICAgIH0KICAgICAgfQogICAgICBpZiAoIWhhc0Fubm91bmNlZFJlYWR5KSB7CiAgICAgICAgc2VuZE1lc3NhZ2UoeyB0eXBlOiAicmVhZHkiIH0pOwogICAgICAgIGhhc0Fubm91bmNlZFJlYWR5ID0gdHJ1ZTsKICAgICAgfQogICAgICByZXR1cm47CiAgICB9CgogICAgaWYgKHR5cGUgPT09ICJsb2FkTWFya2VyIikgewogICAgICBjb25zdCB7IHBhdHRlcm5VcmwsIHNpemUgPSAxLCByZXF1ZXN0SWQgfSA9IHBheWxvYWQgfHwge307CiAgICAgIGlmICghcGF0dGVyblVybCkgewogICAgICAgIHNlbmRNZXNzYWdlKHsKICAgICAgICAgIHR5cGU6ICJsb2FkTWFya2VyUmVzdWx0IiwKICAgICAgICAgIHBheWxvYWQ6IHsKICAgICAgICAgICAgb2s6IGZhbHNlLAogICAgICAgICAgICBlcnJvcjogIk1pc3NpbmcgcGF0dGVyblVybCBwYXJhbWV0ZXIiLAogICAgICAgICAgICByZXF1ZXN0SWQsCiAgICAgICAgICB9LAogICAgICAgIH0pOwogICAgICAgIHJldHVybjsKICAgICAgfQogICAgICB0cnkgewogICAgICAgIGNvbnN0IG9rID0gYXdhaXQgaW5pdEFydG9vbGtpdCg2NDAsIDQ4MCk7CiAgICAgICAgaWYgKCFvaykgdGhyb3cgbmV3IEVycm9yKCJBUlRvb2xLaXQgbm90IGluaXRpYWxpemVkIik7CgogICAgICAgIGNvbnN0IG1hcmtlcklkID0gYXdhaXQgbG9hZFBhdHRlcm5PbmNlKHBhdHRlcm5VcmwpOwogICAgICAgIGlmICh0eXBlb2YgYXJDb250cm9sbGVyLnRyYWNrUGF0dGVybk1hcmtlcklkID09PSAiZnVuY3Rpb24iKSB7CiAgICAgICAgICBhckNvbnRyb2xsZXIudHJhY2tQYXR0ZXJuTWFya2VySWQobWFya2VySWQsIHNpemUpOwogICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyQ29udHJvbGxlci50cmFja1BhdHRlcm5NYXJrZXIgPT09ICJmdW5jdGlvbiIpIHsKICAgICAgICAgIGFyQ29udHJvbGxlci50cmFja1BhdHRlcm5NYXJrZXIobWFya2VySWQsIHNpemUpOwogICAgICAgIH0KICAgICAgICBzZW5kTWVzc2FnZSh7CiAgICAgICAgICB0eXBlOiAibG9hZE1hcmtlclJlc3VsdCIsCiAgICAgICAgICBwYXlsb2FkOiB7IG9rOiB0cnVlLCBtYXJrZXJJZCwgc2l6ZSwgcmVxdWVzdElkIH0sCiAgICAgICAgfSk7CiAgICAgIH0gY2F0Y2ggKGVycikgewogICAgICAgIGNvbnNvbGUuZXJyb3IoIltXb3JrZXJdIGxvYWRNYXJrZXIgZXJyb3I6IiwgZXJyKTsKICAgICAgICBzZW5kTWVzc2FnZSh7CiAgICAgICAgICB0eXBlOiAibG9hZE1hcmtlclJlc3VsdCIsCiAgICAgICAgICBwYXlsb2FkOiB7IG9rOiBmYWxzZSwgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSwgcmVxdWVzdElkIH0sCiAgICAgICAgfSk7CiAgICAgIH0KICAgICAgcmV0dXJuOwogICAgfQoKICAgIGlmICh0eXBlID09PSAicHJvY2Vzc0ZyYW1lIikgewogICAgICBjb25zdCB7IGltYWdlQml0bWFwLCB3aWR0aCwgaGVpZ2h0IH0gPSBwYXlsb2FkIHx8IHt9OwogICAgICBpZiAoaW1hZ2VCaXRtYXApIHsKICAgICAgICB0cnkgewogICAgICAgICAgY29uc3QgdyA9IHdpZHRoIHx8IGltYWdlQml0bWFwLndpZHRoIHx8IDY0MDsKICAgICAgICAgIGNvbnN0IGggPSBoZWlnaHQgfHwgaW1hZ2VCaXRtYXAuaGVpZ2h0IHx8IDQ4MDsKCiAgICAgICAgICBhd2FpdCBpbml0QXJ0b29sa2l0KHcsIGgpOwoKICAgICAgICAgIGlmICghb2Zmc2NyZWVuQ2FudmFzIHx8IGNhbnZhc1cgIT09IHcgfHwgY2FudmFzSCAhPT0gaCkgewogICAgICAgICAgICBjYW52YXNXID0gdzsKICAgICAgICAgICAgY2FudmFzSCA9IGg7CiAgICAgICAgICAgIG9mZnNjcmVlbkNhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMoY2FudmFzVywgY2FudmFzSCk7CiAgICAgICAgICAgIG9mZnNjcmVlbkN0eCA9IG9mZnNjcmVlbkNhbnZhcy5nZXRDb250ZXh0KCIyZCIsIHsKICAgICAgICAgICAgICB3aWxsUmVhZEZyZXF1ZW50bHk6IHRydWUsCiAgICAgICAgICAgIH0pOwogICAgICAgICAgfQoKICAgICAgICAgIG9mZnNjcmVlbkN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzVywgY2FudmFzSCk7CiAgICAgICAgICBvZmZzY3JlZW5DdHguZHJhd0ltYWdlKGltYWdlQml0bWFwLCAwLCAwLCBjYW52YXNXLCBjYW52YXNIKTsKICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgIGltYWdlQml0bWFwLmNsb3NlPy4oKTsKICAgICAgICAgIH0gY2F0Y2gge30KCiAgICAgICAgICBpZiAoYXJDb250cm9sbGVySW5pdGlhbGl6ZWQgJiYgYXJDb250cm9sbGVyKSB7CiAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgYXJDb250cm9sbGVyLnByb2Nlc3Mob2Zmc2NyZWVuQ2FudmFzKTsKICAgICAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgICAgIHRyeSB7CiAgICAgICAgICAgICAgICBjb25zdCBpbWdEYXRhID0gb2Zmc2NyZWVuQ3R4LmdldEltYWdlRGF0YSgKICAgICAgICAgICAgICAgICAgMCwKICAgICAgICAgICAgICAgICAgMCwKICAgICAgICAgICAgICAgICAgY2FudmFzVywKICAgICAgICAgICAgICAgICAgY2FudmFzSCwKICAgICAgICAgICAgICAgICk7CiAgICAgICAgICAgICAgICBhckNvbnRyb2xsZXIucHJvY2VzcyhpbWdEYXRhKTsKICAgICAgICAgICAgICB9IGNhdGNoIChpbm5lcikgewogICAgICAgICAgICAgICAgY29uc29sZS53YXJuKAogICAgICAgICAgICAgICAgICAiW1dvcmtlcl0gQVJUb29sS2l0IHByb2Nlc3MgZmFsbGJhY2sgZmFpbGVkOiIsCiAgICAgICAgICAgICAgICAgIGlubmVyLAogICAgICAgICAgICAgICAgKTsKICAgICAgICAgICAgICB9CiAgICAgICAgICAgIH0KICAgICAgICAgIH0KICAgICAgICB9IGNhdGNoIChlcnIpIHsKICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIltXb3JrZXJdIHByb2Nlc3NGcmFtZSBlcnJvcjoiLCBlcnIpOwogICAgICAgIH0KICAgICAgICByZXR1cm47CiAgICAgIH0KCiAgICAgIC8vIE5vbi1JbWFnZUJpdG1hcCBwYXRoOiBub29wCiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDUpKTsKICAgICAgcmV0dXJuOwogICAgfQogIH0gY2F0Y2ggKGVycikgewogICAgc2VuZE1lc3NhZ2UoewogICAgICB0eXBlOiAiZXJyb3IiLAogICAgICBwYXlsb2FkOiB7IG1lc3NhZ2U6IGVycj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSB9LAogICAgfSk7CiAgfQp9KTsKCi8vIEFubm91bmNlIHJlYWR5IHJpZ2h0IGFmdGVyIGxvYWQsIGluIGNhc2UgJ2luaXQnIGlzIGRlbGF5ZWQKdHJ5IHsKICBpZiAoIWhhc0Fubm91bmNlZFJlYWR5KSB7CiAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICJyZWFkeSIgfSk7CiAgICBoYXNBbm5vdW5jZWRSZWFkeSA9IHRydWU7CiAgfQp9IGNhdGNoIHt9Cg==", import.meta.url), { fileURLToPath: l } = await Promise.resolve().then(() => t), I = l(C);
        this._worker = new g(I, { type: "module" });
      }
      this._worker.addEventListener ? this._worker.addEventListener("message", this._onWorkerMessage) : this._worker.on && this._worker.on("message", this._onWorkerMessage);
      try {
        this._worker.postMessage?.({
          type: "init",
          payload: {
            moduleUrl: this.options.artoolkitModuleUrl || null,
            cameraParametersUrl: this.options.cameraParametersUrl || null,
            wasmBaseUrl: this.options.wasmBaseUrl || null
          }
        }), setTimeout(() => {
          if (!this.workerReady)
            try {
              this._worker?.postMessage?.({ type: "init", payload: {} });
            } catch {
            }
        }, 500);
      } catch {
      }
    }
  }
  /**
   * Stop and terminate the detection worker.
   *
   * Removes message event handlers and terminates the worker thread.
   * Works for both browser Workers and Node.js worker_threads.
   *
   * @private
   */
  _stopWorker() {
    if (this._worker) {
      this._worker.removeEventListener ? this._worker.removeEventListener("message", this._onWorkerMessage) : this._worker.off && this._worker.off("message", this._onWorkerMessage);
      try {
        typeof Worker < "u" ? this._worker.terminate() : this._worker.terminate?.();
      } catch {
      }
      this._worker = null;
    }
  }
  /**
   * Apply detection results and emit appropriate marker events.
   *
   * Normalizes detection data and determines whether to emit markerFound or markerUpdated.
   * Updates internal marker tracking state (lastSeen, visible, lostCount).
   *
   * **Event Logic:**
   * - First detection or previously invisible → emits `ar:markerFound`
   * - Already visible → emits `ar:markerUpdated`
   *
   * @param {Array<Object>} detections - Array of detection results from worker
   * @param {number} detections[].id - Marker ID
   * @param {Array<number>} detections[].poseMatrix - 16-element pose matrix
   * @param {number} [detections[].confidence=0] - Detection confidence (0-1)
   * @param {Array<Array<number>>} [detections[].corners=[]] - Marker corner coordinates
   *
   * @private
   */
  _applyDetections(g) {
    if (!(!g || !Array.isArray(g)))
      for (const C of g) {
        const l = C?.id;
        if (l == null) continue;
        const I = Date.now(), A = new Float32Array(C.poseMatrix || []), b = C.confidence ?? 0, i = C.corners ?? [], e = this._markers.get(l);
        !e || !e.visible ? (this._markers.set(l, { lastSeen: I, visible: !0, lostCount: 0 }), this.core?.eventBus?.emit("ar:markerFound", {
          id: l,
          poseMatrix: A,
          confidence: b,
          corners: i,
          timestamp: I
        })) : (e.lastSeen = I, e.lostCount = 0, this._markers.set(l, e), this.core?.eventBus?.emit("ar:markerUpdated", {
          id: l,
          poseMatrix: A,
          confidence: b,
          corners: i,
          timestamp: I
        }));
      }
  }
  /**
   * Handle messages from the detection worker.
   *
   * Processes different message types and routes them appropriately:
   * - `ready`: Worker initialized, sets workerReady flag
   * - `detectionResult`: Normalized detection data, applies via _applyDetections
   * - `getMarker`: AR.js-style marker event, forwards to event bus and converts to detection
   * - `loadMarkerResult`: Response to loadMarker request, resolves/rejects promise
   * - `error`: Worker error, emits ar:workerError event
   *
   * **Cross-platform handling:**
   * - Browser workers wrap messages in `event.data`
   * - Node.js worker_threads pass raw payload
   *
   * @param {Object|MessageEvent} ev - Message event from worker
   * @param {Object} [ev.data] - Message data (browser workers)
   * @param {string} ev.data.type - Message type
   * @param {*} ev.data.payload - Message payload
   *
   * @private
   */
  _onWorkerMessage(g) {
    const C = g && g.data !== void 0 ? g.data : g, { type: l, payload: I } = C || {};
    if (l === "ready")
      console.log("[Plugin] Worker ready"), this.workerReady = !0, this.core?.eventBus?.emit("ar:workerReady", {});
    else if (l === "detectionResult") {
      if (console.log("[Plugin] Received detectionResult:", I), !I || !Array.isArray(I.detections)) return;
      this._applyDetections(I.detections);
    } else if (l === "getMarker") {
      try {
        console.log("[Plugin] getMarker", I);
      } catch {
      }
      this.core?.eventBus?.emit("ar:getMarker", I);
      try {
        const A = I?.marker || {}, b = A.idPatt ?? A.patternId ?? A.pattern_id ?? null;
        let i = null;
        Array.isArray(I?.matrix) ? i = I.matrix.slice(0, 16) : I?.matrix && typeof I.matrix.length == "number" && (i = Array.from(I.matrix).slice(0, 16));
        let e = [];
        const Z = A.vertex;
        if (Array.isArray(Z))
          for (let c = 0; c + 1 < Z.length; c += 2)
            e.push([Z[c], Z[c + 1]]);
        const o = A.cfPatt ?? A.confidence ?? 0;
        b != null && i && i.length === 16 && this._applyDetections([
          {
            id: b,
            confidence: o,
            poseMatrix: i,
            corners: e
          }
        ]);
      } catch {
      }
    } else if (l === "loadMarkerResult") {
      console.log("[Plugin] Received loadMarkerResult:", I);
      const { requestId: A, ok: b, error: i, markerId: e, size: Z } = I || {};
      if (A !== void 0) {
        const o = this._pendingMarkerLoads.get(A);
        o && (this._pendingMarkerLoads.delete(A), b ? o.resolve({ markerId: e, size: Z }) : o.reject(new Error(i || "Failed to load marker")));
      }
    } else l === "error" && (console.error("Artoolkit worker error", I), this.core?.eventBus?.emit("ar:workerError", I));
  }
  /**
   * Internal sweep to detect and emit lost markers.
   *
   * Checks all tracked markers against the lost threshold.
   * Markers not seen recently are removed and ar:markerLost is emitted.
   *
   * @private
   */
  _sweepMarkers() {
    const g = Date.now(), C = this.lostThreshold * this.frameDurationMs;
    for (const [l, I] of this._markers.entries())
      g - (I.lastSeen || 0) > C && (this._markers.delete(l), this.core.eventBus.emit("ar:markerLost", { id: l, timestamp: g }));
  }
  /**
   * Get the current tracking state of a marker.
   *
   * @param {number} markerId - Marker ID to query
   * @returns {Object|null} Marker state object with lastSeen, visible, lostCount, or null if not tracked
   *
   * @example
   * const state = plugin.getMarkerState(42);
   * if (state && state.visible) {
   *   console.log('Marker 42 last seen:', state.lastSeen);
   * }
   */
  getMarkerState(g) {
    return this._markers.get(g) || null;
  }
  /**
   * Load a pattern marker from a URL
   * @param {string} patternUrl - URL to the pattern file (absolute or repo-relative)
   * @param {number} size - Size of the marker in world units (default: 1)
   * @returns {Promise<{markerId: number, size: number}>} - Resolves with marker info when loaded
   */
  async loadMarker(g, C = 1) {
    if (!this._worker)
      throw new Error(
        "Worker not available. Ensure plugin is enabled and worker is running."
      );
    return console.log(`[Plugin] Loading marker: ${g} with size ${C}`), new Promise((l, I) => {
      const A = this._nextLoadRequestId++;
      this._pendingMarkerLoads.set(A, { resolve: l, reject: I });
      try {
        this._worker.postMessage({
          type: "loadMarker",
          payload: { patternUrl: g, size: C, requestId: A }
        });
      } catch (b) {
        this._pendingMarkerLoads.delete(A), I(new Error(`Failed to send loadMarker message: ${b.message}`));
      }
      setTimeout(() => {
        this._pendingMarkerLoads.has(A) && (this._pendingMarkerLoads.delete(A), I(new Error("loadMarker request timed out")));
      }, 1e4);
    });
  }
}
function G(s) {
  const g = new Float32Array(16);
  for (let C = 0; C < 16; C++) g[C] = s[C];
  return g;
}
const t = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
export {
  d as ARTOOLKIT_PLUGIN_VERSION,
  m as ArtoolkitPlugin,
  G as convertModelViewToThreeMatrix
};
//# sourceMappingURL=arjs-plugin-artoolkit.es.js.map
