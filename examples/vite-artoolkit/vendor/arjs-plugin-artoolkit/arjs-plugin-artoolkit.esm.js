class a {
  constructor(g = {}) {
    ((this.options = g),
      (this.core = null),
      (this.enabled = !1),
      (this._worker = null),
      (this._onWorkerMessage = this._onWorkerMessage.bind(this)),
      (this._onEngineUpdate = this._onEngineUpdate.bind(this)),
      (this._markers = /* @__PURE__ */ new Map()),
      (this.lostThreshold = g.lostThreshold ?? 5),
      (this.frameDurationMs = g.frameDurationMs ?? 200),
      (this.sweepIntervalMs = g.sweepIntervalMs ?? 100),
      (this.workerEnabled = g.worker !== !1),
      (this._pendingMarkerLoads = /* @__PURE__ */ new Map()),
      (this._nextLoadRequestId = 0),
      (this.workerReady = !1));
  }
  async init(g) {
    return ((this.core = g), this);
  }
  async enable() {
    if (!this.core) throw new Error('Plugin not initialized');
    return this.enabled
      ? this
      : ((this.enabled = !0),
        this.core.eventBus.on('engine:update', this._onEngineUpdate),
        this.workerEnabled && (await this._startWorker()),
        (this._sweepInterval = setInterval(() => this._sweepMarkers(), this.sweepIntervalMs)),
        this);
  }
  async disable() {
    return this.enabled
      ? ((this.enabled = !1),
        this.core.eventBus.off('engine:update', this._onEngineUpdate),
        this._worker && this._stopWorker(),
        this._sweepInterval && (clearInterval(this._sweepInterval), (this._sweepInterval = null)),
        this)
      : this;
  }
  dispose() {
    return this.disable();
  }
  // Engine frame handler: forward frame info or ImageBitmap to the worker
  _onEngineUpdate(g) {
    if (g) {
      if (this._worker && g.imageBitmap) {
        try {
          typeof Worker < 'u'
            ? this._worker.postMessage(
                {
                  type: 'processFrame',
                  payload: {
                    frameId: g.id,
                    imageBitmap: g.imageBitmap,
                    width: g.width,
                    height: g.height,
                  },
                },
                // transfer list: ImageBitmap is transferable
                [g.imageBitmap],
              )
            : this._worker.postMessage({
                type: 'processFrame',
                payload: { frameId: g.id, width: g.width, height: g.height },
              });
        } catch (C) {
          console.warn(
            'Artoolkit worker postMessage (ImageBitmap) failed, falling back to frameId only',
            C,
          );
          try {
            this._worker.postMessage({ type: 'processFrame', payload: { frameId: g.id } });
          } catch (A) {
            console.warn('worker postMessage failed', A);
          }
        }
        return;
      }
      if (this._worker)
        try {
          this._worker.postMessage({ type: 'processFrame', payload: { frameId: g.id } });
        } catch (C) {
          console.warn('Artoolkit worker postMessage failed', C);
        }
    }
  }
  // Worker lifecycle (cross-platform)
  async _startWorker() {
    if (!this._worker) {
      if (typeof Worker < 'u')
        this._worker = new Worker(
          new URL(
            /* @vite-ignore */
            '' + new URL('assets/worker-NSCgfIFP.js', import.meta.url).href,
            import.meta.url,
          ),
          { type: 'module' },
        );
      else {
        const { Worker: g } = await Promise.resolve().then(() => i),
          C = new URL(
            'data:text/javascript;base64,Ly8gQ3Jvc3MtcGxhdGZvcm0gd29ya2VyIGludGVncmF0aW5nIEFSVG9vbEtpdCBpbiBicm93c2VyIFdvcmtlcnMuDQovLyAtIEJyb3dzZXI6IHByb2Nlc3NlcyBJbWFnZUJpdG1hcCDihpIgT2Zmc2NyZWVuQ2FudmFzIOKGkiBBUlRvb2xLaXQucHJvY2VzcyhjYW52YXMpDQovLyBOb3RlOiBOb2RlIHBhdGggcmVtb3ZlZCBmb3Igbm93IHRvIGtlZXAgYnJvd3NlciB3b3JrZXIgc3RhcnR1cCByb2J1c3QuDQpsZXQgYXJDb250cm9sbGVyID0gbnVsbDsNCmxldCBhckNvbnRyb2xsZXJJbml0aWFsaXplZCA9IGZhbHNlOw0KbGV0IGdldE1hcmtlckZvcndhcmRlckF0dGFjaGVkID0gZmFsc2U7DQoNCmxldCBvZmZzY3JlZW5DYW52YXMgPSBudWxsOw0KbGV0IG9mZnNjcmVlbkN0eCA9IG51bGw7DQpsZXQgY2FudmFzVyA9IDA7DQpsZXQgY2FudmFzSCA9IDA7DQoNCi8vIE1hcmtlciBhbmQgZmlsdGVyaW5nIHN0YXRlDQpjb25zdCBsb2FkZWRNYXJrZXJzID0gbmV3IE1hcCgpOyAgICAvLyBwYXR0ZXJuVXJsIC0+IG1hcmtlcklkDQpjb25zdCBsb2FkaW5nTWFya2VycyA9IG5ldyBNYXAoKTsgICAvLyBwYXR0ZXJuVXJsIC0+IFByb21pc2U8bWFya2VySWQ+DQpjb25zdCB0cmFja2VkUGF0dGVybklkcyA9IG5ldyBTZXQoKTsgLy8gU2V0PG51bWJlcj4NCmxldCBQQVRURVJOX01BUktFUl9UWVBFID0gMDsgICAgICAgIC8vIHdpbGwgYmUgcmVhZCBmcm9tIEFSVG9vbGtpdCBpZiBhdmFpbGFibGUNCmxldCBNSU5fQ09ORklERU5DRSA9IDAuNjsgICAgICAgICAgIC8vIGNvbmZpZ3VyYWJsZSB2aWEgaW5pdCBwYXlsb2FkDQoNCi8vIEluaXQgYmFja29mZiBzdGF0ZQ0KbGV0IGluaXRJblByb2dyZXNzID0gbnVsbDsNCmxldCBpbml0RmFpbENvdW50ID0gMDsNCmxldCBpbml0RmFpbGVkVW50aWwgPSAwOw0KDQovLyBJbml0LXRpbWUgb3B0aW9ucyAob3ZlcnJpZGFibGUgZnJvbSBtYWluIHRocmVhZCkNCmxldCBJTklUX09QVFMgPSB7DQogICAgbW9kdWxlVXJsOiBudWxsLA0KICAgIGNhbWVyYVBhcmFtZXRlcnNVcmw6IG51bGwsDQogICAgd2FzbUJhc2VVcmw6IG51bGwsDQogICAgbWluQ29uZmlkZW5jZTogbnVsbA0KfTsNCg0KLy8gQW5ub3VuY2UtcmVhZHkgZ3VhcmQNCmxldCBoYXNBbm5vdW5jZWRSZWFkeSA9IGZhbHNlOw0KDQpmdW5jdGlvbiBvbk1lc3NhZ2UoZm4pIHsNCiAgICAvLyBCcm93c2VyIHdvcmtlciBwYXRoDQogICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2KSA9PiBmbihldi5kYXRhKSk7DQp9DQoNCmZ1bmN0aW9uIHNlbmRNZXNzYWdlKG1zZykgew0KICAgIHNlbGYucG9zdE1lc3NhZ2UobXNnKTsNCn0NCg0KLy8gU2VyaWFsaXplIEFSLmpzLXN0eWxlIGdldE1hcmtlciBldmVudCBpbnRvIGEgdHJhbnNmZXJhYmxlIHBheWxvYWQNCmZ1bmN0aW9uIHNlcmlhbGl6ZUdldE1hcmtlckV2ZW50KGV2KSB7DQogICAgdHJ5IHsNCiAgICAgICAgY29uc3QgZGF0YSA9IGV2Py5kYXRhIHx8IHt9Ow0KICAgICAgICBjb25zdCBtYXJrZXIgPSBkYXRhLm1hcmtlciB8fCB7fTsNCiAgICAgICAgY29uc3QgbWF0cml4ID0gQXJyYXkuaXNBcnJheShkYXRhLm1hdHJpeCkgPyBkYXRhLm1hdHJpeC5zbGljZSgwLCAxNikNCiAgICAgICAgICAgIDogKGRhdGEubWF0cml4ICYmIGRhdGEubWF0cml4Lmxlbmd0aCA/IEFycmF5LmZyb20oZGF0YS5tYXRyaXgpLnNsaWNlKDAsIDE2KSA6IG51bGwpOw0KICAgICAgICBjb25zdCB2ZXJ0ZXggPSBtYXJrZXIudmVydGV4DQogICAgICAgICAgICA/IChBcnJheS5pc0FycmF5KG1hcmtlci52ZXJ0ZXgpID8gbWFya2VyLnZlcnRleC5zbGljZSgpIDogbnVsbCkNCiAgICAgICAgICAgIDogKG1hcmtlci5jb3JuZXJzID8gbWFya2VyLmNvcm5lcnMuZmxhdE1hcChjID0+IFtjLnggPz8gY1swXSwgYy55ID8/IGNbMV1dKSA6IG51bGwpOw0KDQogICAgICAgIHJldHVybiB7DQogICAgICAgICAgICB0eXBlOiBkYXRhLnR5cGUsIC8vIGUuZy4sIEFSVG9vbGtpdC5QQVRURVJOX01BUktFUg0KICAgICAgICAgICAgbWF0cml4LA0KICAgICAgICAgICAgbWFya2VyOiB7DQogICAgICAgICAgICAgICAgaWRQYXR0OiBtYXJrZXIuaWRQYXR0ID8/IG1hcmtlci5wYXR0ZXJuSWQgPz8gbWFya2VyLnBhdHRlcm5faWQgPz8gbnVsbCwNCiAgICAgICAgICAgICAgICBpZE1hdHJpeDogbWFya2VyLmlkTWF0cml4ID8/IG51bGwsDQogICAgICAgICAgICAgICAgY2ZQYXR0OiBtYXJrZXIuY2ZQYXR0ID8/IG1hcmtlci5jb25maWRlbmNlID8/IG51bGwsDQogICAgICAgICAgICAgICAgY2ZNYXRyaXg6IG1hcmtlci5jZk1hdHJpeCA/PyBudWxsLA0KICAgICAgICAgICAgICAgIHZlcnRleDogdmVydGV4IHx8IG51bGwNCiAgICAgICAgICAgIH0NCiAgICAgICAgfTsNCiAgICB9IGNhdGNoIHsNCiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgbWF0cml4OiBudWxsLCBtYXJrZXI6IHt9IH07DQogICAgfQ0KfQ0KDQpmdW5jdGlvbiBzaG91bGRGb3J3YXJkR2V0TWFya2VyKGV2ZW50KSB7DQogICAgY29uc3QgZGF0YSA9IGV2ZW50Py5kYXRhIHx8IHt9Ow0KICAgIGNvbnN0IHR5cGUgPSBkYXRhLnR5cGU7DQogICAgY29uc3QgbWFya2VyID0gZGF0YS5tYXJrZXIgfHwge307DQogICAgY29uc3QgaWQgPSBtYXJrZXIuaWRQYXR0ID8/IG1hcmtlci5wYXR0ZXJuSWQgPz8gbWFya2VyLnBhdHRlcm5faWQgPz8gbnVsbDsNCiAgICBjb25zdCBjb25mID0gbWFya2VyLmNmUGF0dCA/PyBtYXJrZXIuY29uZmlkZW5jZSA/PyAwOw0KICAgIGNvbnN0IG1hdHJpeCA9IGRhdGEubWF0cml4Ow0KDQogICAgLy8gVHlwZSBtdXN0IGJlIFBBVFRFUk5fTUFSS0VSIChmYWxsYmFjayBudW1lcmljIDAgaWYgY29uc3RhbnRzIG5vdCBhdmFpbGFibGUpDQogICAgaWYgKHR5cGUgIT09IFBBVFRFUk5fTUFSS0VSX1RZUEUpIHJldHVybiBmYWxzZTsNCg0KICAgIC8vIENvbmZpZGVuY2UgZ2F0ZQ0KICAgIGlmICghKE51bWJlci5pc0Zpbml0ZShjb25mKSAmJiBjb25mID49IE1JTl9DT05GSURFTkNFKSkgcmV0dXJuIGZhbHNlOw0KDQogICAgLy8gTWF0cml4IG11c3QgZXhpc3Qgd2l0aCBhdCBsZWFzdCAxNiB2YWx1ZXMNCiAgICBjb25zdCBtID0gQXJyYXkuaXNBcnJheShtYXRyaXgpID8gbWF0cml4IDogKG1hdHJpeCAmJiBBcnJheS5mcm9tKG1hdHJpeCkpIHx8IG51bGw7DQogICAgaWYgKCFtIHx8IG0ubGVuZ3RoIDwgMTYpIHJldHVybiBmYWxzZTsNCg0KICAgIC8vIElmIHdlIGhhdmUgdHJhY2tlZCBJRHMsIG9ubHkgZm9yd2FyZCB0aG9zZSBJRHMNCiAgICBpZiAodHJhY2tlZFBhdHRlcm5JZHMuc2l6ZSAmJiBpZCAhPSBudWxsICYmICF0cmFja2VkUGF0dGVybklkcy5oYXMoaWQpKSByZXR1cm4gZmFsc2U7DQoNCiAgICByZXR1cm4gdHJ1ZTsNCn0NCg0KZnVuY3Rpb24gYXR0YWNoR2V0TWFya2VyRm9yd2FyZGVyKCkgew0KICAgIGlmICghYXJDb250cm9sbGVyIHx8IHR5cGVvZiBhckNvbnRyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJyB8fCBnZXRNYXJrZXJGb3J3YXJkZXJBdHRhY2hlZCkgcmV0dXJuOw0KICAgIGFyQ29udHJvbGxlci5hZGRFdmVudExpc3RlbmVyKCdnZXRNYXJrZXInLCAoZXZlbnQpID0+IHsNCiAgICAgICAgaWYgKCFzaG91bGRGb3J3YXJkR2V0TWFya2VyKGV2ZW50KSkgcmV0dXJuOw0KICAgICAgICBjb25zdCBwYXlsb2FkID0gc2VyaWFsaXplR2V0TWFya2VyRXZlbnQoZXZlbnQpOw0KICAgICAgICB0cnkgeyBjb25zb2xlLmxvZygnW1dvcmtlcl0gZ2V0TWFya2VyIChmaWx0ZXJlZCknLCBwYXlsb2FkKTsgfSBjYXRjaCB7fQ0KICAgICAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICdnZXRNYXJrZXInLCBwYXlsb2FkIH0pOw0KICAgIH0pOw0KICAgIGdldE1hcmtlckZvcndhcmRlckF0dGFjaGVkID0gdHJ1ZTsNCn0NCg0KLy8gR3VhcmRlZCBpbml0IHdpdGggYmFja29mZg0KYXN5bmMgZnVuY3Rpb24gaW5pdEFydG9vbGtpdCh3aWR0aCA9IDY0MCwgaGVpZ2h0ID0gNDgwKSB7DQogICAgaWYgKGFyQ29udHJvbGxlckluaXRpYWxpemVkKSByZXR1cm4gdHJ1ZTsNCg0KICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7DQogICAgaWYgKG5vdyA8IGluaXRGYWlsZWRVbnRpbCkgew0KICAgICAgICBjb25zdCB3YWl0TXMgPSBpbml0RmFpbGVkVW50aWwgLSBub3c7DQogICAgICAgIGNvbnNvbGUud2FybignW1dvcmtlcl0gaW5pdEFydG9vbGtpdCBza2lwcGVkIGR1ZSB0byBiYWNrb2ZmIChtcyk6Jywgd2FpdE1zKTsNCiAgICAgICAgcmV0dXJuIGZhbHNlOw0KICAgIH0NCg0KICAgIGlmIChpbml0SW5Qcm9ncmVzcykgew0KICAgICAgICB0cnkgew0KICAgICAgICAgICAgYXdhaXQgaW5pdEluUHJvZ3Jlc3M7DQogICAgICAgICAgICByZXR1cm4gYXJDb250cm9sbGVySW5pdGlhbGl6ZWQ7DQogICAgICAgIH0gY2F0Y2ggew0KICAgICAgICAgICAgcmV0dXJuIGZhbHNlOw0KICAgICAgICB9DQogICAgfQ0KDQogICAgaW5pdEluUHJvZ3Jlc3MgPSAoYXN5bmMgKCkgPT4gew0KICAgICAgICB0cnkgew0KICAgICAgICAgICAgY29uc3QganNhcnRvb2xraXQgPSBhd2FpdCAoYXN5bmMgKCkgPT4gew0KICAgICAgICAgICAgICAgIGlmIChJTklUX09QVFMubW9kdWxlVXJsKSB7DQogICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV29ya2VyXSBMb2FkaW5nIGFydG9vbGtpdCBmcm9tIG1vZHVsZVVybDonLCBJTklUX09QVFMubW9kdWxlVXJsKTsNCiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGltcG9ydChJTklUX09QVFMubW9kdWxlVXJsKTsNCiAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgLy8gSWYgeW91ciBlbnZpcm9ubWVudCBzdXBwb3J0cyBiYXJlIGltcG9ydCAoaW1wb3J0IG1hcC9idW5kbGVyKSwgdGhpcyB3aWxsIHdvcms6DQogICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGltcG9ydCgnQGFyLWpzLW9yZy9hcnRvb2xraXQ1LWpzJyk7DQogICAgICAgICAgICB9KSgpOw0KDQogICAgICAgICAgICAvLyBTYWZlbHkgZXh0cmFjdCBleHBvcnRzIChzdXBwb3J0cyBib3RoIG5hbWVkIGFuZCBkZWZhdWx0IGV4cG9ydHMpDQogICAgICAgICAgICBjb25zdCBBUkNvbnRyb2xsZXIgPQ0KICAgICAgICAgICAgICAgIGpzYXJ0b29sa2l0LkFSQ29udHJvbGxlciA/PyBqc2FydG9vbGtpdC5kZWZhdWx0Py5BUkNvbnRyb2xsZXI7DQogICAgICAgICAgICBjb25zdCBBUlRvb2xraXQgPQ0KICAgICAgICAgICAgICAgIGpzYXJ0b29sa2l0LkFSVG9vbGtpdCA/PyBqc2FydG9vbGtpdC5kZWZhdWx0Py5BUlRvb2xraXQ7DQoNCiAgICAgICAgICAgIGlmICghQVJDb250cm9sbGVyKSB7DQogICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBUkNvbnRyb2xsZXIgZXhwb3J0IG5vdCBmb3VuZCBpbiBBUlRvb2xLaXQgbW9kdWxlJyk7DQogICAgICAgICAgICB9DQoNCiAgICAgICAgICAgIC8vIFJlYWQgdGhlIGNvbnN0YW50IGlmIGF2YWlsYWJsZTsgZWxzZSBrZWVwIGRlZmF1bHQgMA0KICAgICAgICAgICAgaWYgKEFSVG9vbGtpdCAmJiB0eXBlb2YgQVJUb29sa2l0LlBBVFRFUk5fTUFSS0VSID09PSAnbnVtYmVyJykgew0KICAgICAgICAgICAgICAgIFBBVFRFUk5fTUFSS0VSX1RZUEUgPSBBUlRvb2xraXQuUEFUVEVSTl9NQVJLRVI7DQogICAgICAgICAgICB9DQoNCiAgICAgICAgICAgIGlmIChJTklUX09QVFMud2FzbUJhc2VVcmwgJiYgQVJDb250cm9sbGVyKSB7DQogICAgICAgICAgICAgICAgdHJ5IHsNCiAgICAgICAgICAgICAgICAgICAgQVJDb250cm9sbGVyLmJhc2VVUkwgPSBJTklUX09QVFMud2FzbUJhc2VVcmwuZW5kc1dpdGgoJy8nKSA/IElOSVRfT1BUUy53YXNtQmFzZVVybCA6IElOSVRfT1BUUy53YXNtQmFzZVVybCArICcvJzsNCiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9DQogICAgICAgICAgICB9DQoNCiAgICAgICAgICAgIGlmICh0eXBlb2YgSU5JVF9PUFRTLm1pbkNvbmZpZGVuY2UgPT09ICdudW1iZXInKSB7DQogICAgICAgICAgICAgICAgTUlOX0NPTkZJREVOQ0UgPSBJTklUX09QVFMubWluQ29uZmlkZW5jZTsNCiAgICAgICAgICAgIH0NCg0KICAgICAgICAgICAgY29uc3QgY2FtVXJsID0gSU5JVF9PUFRTLmNhbWVyYVBhcmFtZXRlcnNVcmwNCiAgICAgICAgICAgICAgICB8fCAnaHR0cHM6Ly9yYXcuZ2l0aGFjay5jb20vQVItanMtb3JnL0FSLmpzL21hc3Rlci9kYXRhL2RhdGEvY2FtZXJhX3BhcmEuZGF0JzsNCg0KICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXb3JrZXJdIEFSVG9vbEtpdCBpbml0JywgeyB3aWR0aCwgaGVpZ2h0LCBjYW1VcmwsIG1pbkNvbmZpZGVuY2U6IE1JTl9DT05GSURFTkNFLCBwYXR0ZXJuVHlwZTogUEFUVEVSTl9NQVJLRVJfVFlQRSB9KTsNCiAgICAgICAgICAgIGFyQ29udHJvbGxlciA9IGF3YWl0IEFSQ29udHJvbGxlci5pbml0V2l0aERpbWVuc2lvbnMod2lkdGgsIGhlaWdodCwgY2FtVXJsLCB7fSk7DQogICAgICAgICAgICBhckNvbnRyb2xsZXJJbml0aWFsaXplZCA9ICEhYXJDb250cm9sbGVyOw0KICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXb3JrZXJdIEFSVG9vbEtpdCBpbml0aWFsaXplZDonLCBhckNvbnRyb2xsZXJJbml0aWFsaXplZCk7DQoNCiAgICAgICAgICAgIGlmICghYXJDb250cm9sbGVySW5pdGlhbGl6ZWQpIHRocm93IG5ldyBFcnJvcignQVJDb250cm9sbGVyLmluaXRXaXRoRGltZW5zaW9ucyByZXR1cm5lZCBmYWxzeSBjb250cm9sbGVyJyk7DQoNCiAgICAgICAgICAgIGF0dGFjaEdldE1hcmtlckZvcndhcmRlcigpOw0KDQogICAgICAgICAgICBpbml0RmFpbENvdW50ID0gMDsNCiAgICAgICAgICAgIGluaXRGYWlsZWRVbnRpbCA9IDA7DQogICAgICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dvcmtlcl0gQVJUb29sS2l0IGluaXQgZmFpbGVkOicsIGVycik7DQogICAgICAgICAgICBhckNvbnRyb2xsZXIgPSBudWxsOw0KICAgICAgICAgICAgYXJDb250cm9sbGVySW5pdGlhbGl6ZWQgPSBmYWxzZTsNCg0KICAgICAgICAgICAgaW5pdEZhaWxDb3VudCA9IE1hdGgubWluKGluaXRGYWlsQ291bnQgKyAxLCA2KTsNCiAgICAgICAgICAgIGNvbnN0IGRlbGF5ID0gTWF0aC5taW4oMzAwMDAsIDEwMDAgKiBNYXRoLnBvdygyLCBpbml0RmFpbENvdW50KSk7DQogICAgICAgICAgICBpbml0RmFpbGVkVW50aWwgPSBEYXRlLm5vdygpICsgZGVsYXk7DQoNCiAgICAgICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ2Vycm9yJywgcGF5bG9hZDogeyBtZXNzYWdlOiBgQVJUb29sS2l0IGluaXQgZmFpbGVkICgke2Vycj8ubWVzc2FnZSB8fCBlcnJ9KS4gUmV0cnlpbmcgaW4gJHtkZWxheX1tcy5gIH0gfSk7DQogICAgICAgICAgICB0aHJvdyBlcnI7DQogICAgICAgIH0gZmluYWxseSB7DQogICAgICAgICAgICBpbml0SW5Qcm9ncmVzcyA9IG51bGw7DQogICAgICAgIH0NCiAgICB9KSgpOw0KDQogICAgdHJ5IHsNCiAgICAgICAgYXdhaXQgaW5pdEluUHJvZ3Jlc3M7DQogICAgfSBjYXRjaCB7fQ0KICAgIHJldHVybiBhckNvbnRyb2xsZXJJbml0aWFsaXplZDsNCn0NCg0KLy8gRGVkdXBlIG1hcmtlciBsb2FkaW5nIGJ5IFVSTCBhbmQgcmVjb3JkIHRyYWNrZWQgSURzDQphc3luYyBmdW5jdGlvbiBsb2FkUGF0dGVybk9uY2UocGF0dGVyblVybCkgew0KICAgIGlmIChsb2FkZWRNYXJrZXJzLmhhcyhwYXR0ZXJuVXJsKSkgcmV0dXJuIGxvYWRlZE1hcmtlcnMuZ2V0KHBhdHRlcm5VcmwpOw0KICAgIGlmIChsb2FkaW5nTWFya2Vycy5oYXMocGF0dGVyblVybCkpIHJldHVybiBsb2FkaW5nTWFya2Vycy5nZXQocGF0dGVyblVybCk7DQoNCiAgICBjb25zdCBwID0gKGFzeW5jICgpID0+IHsNCiAgICAgICAgY29uc3QgaWQgPSBhd2FpdCBhckNvbnRyb2xsZXIubG9hZE1hcmtlcihwYXR0ZXJuVXJsKTsNCiAgICAgICAgbG9hZGVkTWFya2Vycy5zZXQocGF0dGVyblVybCwgaWQpOw0KICAgICAgICB0cmFja2VkUGF0dGVybklkcy5hZGQoaWQpOw0KICAgICAgICBsb2FkaW5nTWFya2Vycy5kZWxldGUocGF0dGVyblVybCk7DQogICAgICAgIHJldHVybiBpZDsNCiAgICB9KSgpLmNhdGNoKChlKSA9PiB7DQogICAgICAgIGxvYWRpbmdNYXJrZXJzLmRlbGV0ZShwYXR0ZXJuVXJsKTsNCiAgICAgICAgdGhyb3cgZTsNCiAgICB9KTsNCg0KICAgIGxvYWRpbmdNYXJrZXJzLnNldChwYXR0ZXJuVXJsLCBwKTsNCiAgICByZXR1cm4gcDsNCn0NCg0Kb25NZXNzYWdlKGFzeW5jIChldikgPT4gew0KICAgIGNvbnN0IHsgdHlwZSwgcGF5bG9hZCB9ID0gZXYgfHwge307DQogICAgdHJ5IHsNCiAgICAgICAgaWYgKHR5cGUgPT09ICdpbml0Jykgew0KICAgICAgICAgICAgaWYgKHBheWxvYWQgJiYgdHlwZW9mIHBheWxvYWQgPT09ICdvYmplY3QnKSB7DQogICAgICAgICAgICAgICAgSU5JVF9PUFRTLm1vZHVsZVVybCA9IHBheWxvYWQubW9kdWxlVXJsID8/IElOSVRfT1BUUy5tb2R1bGVVcmw7DQogICAgICAgICAgICAgICAgSU5JVF9PUFRTLmNhbWVyYVBhcmFtZXRlcnNVcmwgPSBwYXlsb2FkLmNhbWVyYVBhcmFtZXRlcnNVcmwgPz8gSU5JVF9PUFRTLmNhbWVyYVBhcmFtZXRlcnNVcmw7DQogICAgICAgICAgICAgICAgSU5JVF9PUFRTLndhc21CYXNlVXJsID0gcGF5bG9hZC53YXNtQmFzZVVybCA/PyBJTklUX09QVFMud2FzbUJhc2VVcmw7DQogICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXlsb2FkLm1pbkNvbmZpZGVuY2UgPT09ICdudW1iZXInKSB7DQogICAgICAgICAgICAgICAgICAgIElOSVRfT1BUUy5taW5Db25maWRlbmNlID0gcGF5bG9hZC5taW5Db25maWRlbmNlOw0KICAgICAgICAgICAgICAgICAgICBNSU5fQ09ORklERU5DRSA9IHBheWxvYWQubWluQ29uZmlkZW5jZTsNCiAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICB9DQogICAgICAgICAgICBpZiAoIWhhc0Fubm91bmNlZFJlYWR5KSB7DQogICAgICAgICAgICAgICAgc2VuZE1lc3NhZ2UoeyB0eXBlOiAncmVhZHknIH0pOw0KICAgICAgICAgICAgICAgIGhhc0Fubm91bmNlZFJlYWR5ID0gdHJ1ZTsNCiAgICAgICAgICAgIH0NCiAgICAgICAgICAgIHJldHVybjsNCiAgICAgICAgfQ0KDQogICAgICAgIGlmICh0eXBlID09PSAnbG9hZE1hcmtlcicpIHsNCiAgICAgICAgICAgIGNvbnN0IHsgcGF0dGVyblVybCwgc2l6ZSA9IDEsIHJlcXVlc3RJZCB9ID0gcGF5bG9hZCB8fCB7fTsNCiAgICAgICAgICAgIGlmICghcGF0dGVyblVybCkgew0KICAgICAgICAgICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ2xvYWRNYXJrZXJSZXN1bHQnLCBwYXlsb2FkOiB7IG9rOiBmYWxzZSwgZXJyb3I6ICdNaXNzaW5nIHBhdHRlcm5VcmwgcGFyYW1ldGVyJywgcmVxdWVzdElkIH0gfSk7DQogICAgICAgICAgICAgICAgcmV0dXJuOw0KICAgICAgICAgICAgfQ0KICAgICAgICAgICAgdHJ5IHsNCiAgICAgICAgICAgICAgICBjb25zdCBvayA9IGF3YWl0IGluaXRBcnRvb2xraXQoNjQwLCA0ODApOw0KICAgICAgICAgICAgICAgIGlmICghb2spIHRocm93IG5ldyBFcnJvcignQVJUb29sS2l0IG5vdCBpbml0aWFsaXplZCcpOw0KDQogICAgICAgICAgICAgICAgY29uc3QgbWFya2VySWQgPSBhd2FpdCBsb2FkUGF0dGVybk9uY2UocGF0dGVyblVybCk7DQogICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhckNvbnRyb2xsZXIudHJhY2tQYXR0ZXJuTWFya2VySWQgPT09ICdmdW5jdGlvbicpIHsNCiAgICAgICAgICAgICAgICAgICAgYXJDb250cm9sbGVyLnRyYWNrUGF0dGVybk1hcmtlcklkKG1hcmtlcklkLCBzaXplKTsNCiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhckNvbnRyb2xsZXIudHJhY2tQYXR0ZXJuTWFya2VyID09PSAnZnVuY3Rpb24nKSB7DQogICAgICAgICAgICAgICAgICAgIGFyQ29udHJvbGxlci50cmFja1BhdHRlcm5NYXJrZXIobWFya2VySWQsIHNpemUpOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICdsb2FkTWFya2VyUmVzdWx0JywgcGF5bG9hZDogeyBvazogdHJ1ZSwgbWFya2VySWQsIHNpemUsIHJlcXVlc3RJZCB9IH0pOw0KICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7DQogICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dvcmtlcl0gbG9hZE1hcmtlciBlcnJvcjonLCBlcnIpOw0KICAgICAgICAgICAgICAgIHNlbmRNZXNzYWdlKHsgdHlwZTogJ2xvYWRNYXJrZXJSZXN1bHQnLCBwYXlsb2FkOiB7IG9rOiBmYWxzZSwgZXJyb3I6IGVycj8ubWVzc2FnZSB8fCBTdHJpbmcoZXJyKSwgcmVxdWVzdElkIH0gfSk7DQogICAgICAgICAgICB9DQogICAgICAgICAgICByZXR1cm47DQogICAgICAgIH0NCg0KICAgICAgICBpZiAodHlwZSA9PT0gJ3Byb2Nlc3NGcmFtZScpIHsNCiAgICAgICAgICAgIGNvbnN0IHsgaW1hZ2VCaXRtYXAsIHdpZHRoLCBoZWlnaHQgfSA9IHBheWxvYWQgfHwge307DQogICAgICAgICAgICBpZiAoaW1hZ2VCaXRtYXApIHsNCiAgICAgICAgICAgICAgICB0cnkgew0KICAgICAgICAgICAgICAgICAgICBjb25zdCB3ID0gd2lkdGggfHwgaW1hZ2VCaXRtYXAud2lkdGggfHwgNjQwOw0KICAgICAgICAgICAgICAgICAgICBjb25zdCBoID0gaGVpZ2h0IHx8IGltYWdlQml0bWFwLmhlaWdodCB8fCA0ODA7DQoNCiAgICAgICAgICAgICAgICAgICAgYXdhaXQgaW5pdEFydG9vbGtpdCh3LCBoKTsNCg0KICAgICAgICAgICAgICAgICAgICBpZiAoIW9mZnNjcmVlbkNhbnZhcyB8fCBjYW52YXNXICE9PSB3IHx8IGNhbnZhc0ggIT09IGgpIHsNCiAgICAgICAgICAgICAgICAgICAgICAgIGNhbnZhc1cgPSB3OyBjYW52YXNIID0gaDsNCiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNjcmVlbkNhbnZhcyA9IG5ldyBPZmZzY3JlZW5DYW52YXMoY2FudmFzVywgY2FudmFzSCk7DQogICAgICAgICAgICAgICAgICAgICAgICBvZmZzY3JlZW5DdHggPSBvZmZzY3JlZW5DYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IHdpbGxSZWFkRnJlcXVlbnRseTogdHJ1ZSB9KTsNCiAgICAgICAgICAgICAgICAgICAgfQ0KDQogICAgICAgICAgICAgICAgICAgIG9mZnNjcmVlbkN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzVywgY2FudmFzSCk7DQogICAgICAgICAgICAgICAgICAgIG9mZnNjcmVlbkN0eC5kcmF3SW1hZ2UoaW1hZ2VCaXRtYXAsIDAsIDAsIGNhbnZhc1csIGNhbnZhc0gpOw0KICAgICAgICAgICAgICAgICAgICB0cnkgeyBpbWFnZUJpdG1hcC5jbG9zZT8uKCk7IH0gY2F0Y2gge30NCg0KICAgICAgICAgICAgICAgICAgICBpZiAoYXJDb250cm9sbGVySW5pdGlhbGl6ZWQgJiYgYXJDb250cm9sbGVyKSB7DQogICAgICAgICAgICAgICAgICAgICAgICB0cnkgew0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyQ29udHJvbGxlci5wcm9jZXNzKG9mZnNjcmVlbkNhbnZhcyk7DQogICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nRGF0YSA9IG9mZnNjcmVlbkN0eC5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzVywgY2FudmFzSCk7DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyQ29udHJvbGxlci5wcm9jZXNzKGltZ0RhdGEpOw0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGlubmVyKSB7DQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW1dvcmtlcl0gQVJUb29sS2l0IHByb2Nlc3MgZmFsbGJhY2sgZmFpbGVkOicsIGlubmVyKTsNCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgICAgICB9DQogICAgICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHsNCiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dvcmtlcl0gcHJvY2Vzc0ZyYW1lIGVycm9yOicsIGVycik7DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgIHJldHVybjsNCiAgICAgICAgICAgIH0NCg0KICAgICAgICAgICAgLy8gTm9uLUltYWdlQml0bWFwIHBhdGg6IG5vb3ANCiAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIDUpKTsNCiAgICAgICAgICAgIHJldHVybjsNCiAgICAgICAgfQ0KICAgIH0gY2F0Y2ggKGVycikgew0KICAgICAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICdlcnJvcicsIHBheWxvYWQ6IHsgbWVzc2FnZTogZXJyPy5tZXNzYWdlIHx8IFN0cmluZyhlcnIpIH0gfSk7DQogICAgfQ0KfSk7DQoNCi8vIEFubm91bmNlIHJlYWR5IHJpZ2h0IGFmdGVyIGxvYWQsIGluIGNhc2UgJ2luaXQnIGlzIGRlbGF5ZWQNCnRyeSB7DQogICAgaWYgKCFoYXNBbm5vdW5jZWRSZWFkeSkgew0KICAgICAgICBzZW5kTWVzc2FnZSh7IHR5cGU6ICdyZWFkeScgfSk7DQogICAgICAgIGhhc0Fubm91bmNlZFJlYWR5ID0gdHJ1ZTsNCiAgICB9DQp9IGNhdGNoIHt9',
            import.meta.url,
          ),
          { fileURLToPath: A } = await Promise.resolve().then(() => i),
          I = A(C);
        this._worker = new g(I, { type: 'module' });
      }
      this._worker.addEventListener
        ? this._worker.addEventListener('message', this._onWorkerMessage)
        : this._worker.on && this._worker.on('message', this._onWorkerMessage);
      try {
        (this._worker.postMessage?.({
          type: 'init',
          payload: {
            moduleUrl: this.options.artoolkitModuleUrl || null,
            cameraParametersUrl: this.options.cameraParametersUrl || null,
            wasmBaseUrl: this.options.wasmBaseUrl || null,
          },
        }),
          setTimeout(() => {
            if (!this.workerReady)
              try {
                this._worker?.postMessage?.({ type: 'init', payload: {} });
              } catch {}
          }, 500));
      } catch {}
    }
  }
  _stopWorker() {
    if (this._worker) {
      this._worker.removeEventListener
        ? this._worker.removeEventListener('message', this._onWorkerMessage)
        : this._worker.off && this._worker.off('message', this._onWorkerMessage);
      try {
        typeof Worker < 'u' ? this._worker.terminate() : this._worker.terminate?.();
      } catch {}
      this._worker = null;
    }
  }
  // NEW: Normalize detection updates and emit markerFound/Updated
  _applyDetections(g) {
    if (!(!g || !Array.isArray(g)))
      for (const C of g) {
        const A = C?.id;
        if (A == null) continue;
        const I = Date.now(),
          e = new Float32Array(C.poseMatrix || []),
          c = C.confidence ?? 0,
          l = C.corners ?? [],
          s = this._markers.get(A);
        !s || !s.visible
          ? (this._markers.set(A, { lastSeen: I, visible: !0, lostCount: 0 }),
            this.core?.eventBus?.emit('ar:markerFound', {
              id: A,
              poseMatrix: e,
              confidence: c,
              corners: l,
              timestamp: I,
            }))
          : ((s.lastSeen = I),
            (s.lostCount = 0),
            this._markers.set(A, s),
            this.core?.eventBus?.emit('ar:markerUpdated', {
              id: A,
              poseMatrix: e,
              confidence: c,
              corners: l,
              timestamp: I,
            }));
      }
  }
  _onWorkerMessage(g) {
    const C = g && g.data !== void 0 ? g.data : g,
      { type: A, payload: I } = C || {};
    if (A === 'ready')
      (console.log('[Plugin] Worker ready'),
        (this.workerReady = !0),
        this.core?.eventBus?.emit('ar:workerReady', {}));
    else if (A === 'detectionResult') {
      if (
        (console.log('[Plugin] Received detectionResult:', I), !I || !Array.isArray(I.detections))
      )
        return;
      this._applyDetections(I.detections);
    } else if (A === 'getMarker') {
      try {
        console.log('[Plugin] getMarker', I);
      } catch {}
      this.core?.eventBus?.emit('ar:getMarker', I);
      try {
        const e = I?.marker || {},
          c = e.idPatt ?? e.patternId ?? e.pattern_id ?? null;
        let l = null;
        Array.isArray(I?.matrix)
          ? (l = I.matrix.slice(0, 16))
          : I?.matrix &&
            typeof I.matrix.length == 'number' &&
            (l = Array.from(I.matrix).slice(0, 16));
        let s = [];
        const t = e.vertex;
        if (Array.isArray(t)) for (let b = 0; b + 1 < t.length; b += 2) s.push([t[b], t[b + 1]]);
        const d = e.cfPatt ?? e.confidence ?? 0;
        c != null &&
          l &&
          l.length === 16 &&
          this._applyDetections([
            {
              id: c,
              confidence: d,
              poseMatrix: l,
              corners: s,
            },
          ]);
      } catch {}
    } else if (A === 'loadMarkerResult') {
      console.log('[Plugin] Received loadMarkerResult:', I);
      const { requestId: e, ok: c, error: l, markerId: s, size: t } = I || {};
      if (e !== void 0) {
        const d = this._pendingMarkerLoads.get(e);
        d &&
          (this._pendingMarkerLoads.delete(e),
          c
            ? d.resolve({ markerId: s, size: t })
            : d.reject(new Error(l || 'Failed to load marker')));
      }
    } else
      A === 'error' &&
        (console.error('Artoolkit worker error', I),
        this.core?.eventBus?.emit('ar:workerError', I));
  }
  // sweep markers and emit lost events for markers not seen recently
  _sweepMarkers() {
    const g = Date.now(),
      C = this.lostThreshold * this.frameDurationMs;
    for (const [A, I] of this._markers.entries())
      g - (I.lastSeen || 0) > C &&
        (this._markers.delete(A),
        this.core.eventBus.emit('ar:markerLost', { id: A, timestamp: g }));
  }
  // public helper to get marker state
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
      throw new Error('Worker not available. Ensure plugin is enabled and worker is running.');
    return (
      console.log(`[Plugin] Loading marker: ${g} with size ${C}`),
      new Promise((A, I) => {
        const e = this._nextLoadRequestId++;
        this._pendingMarkerLoads.set(e, { resolve: A, reject: I });
        try {
          this._worker.postMessage({
            type: 'loadMarker',
            payload: { patternUrl: g, size: C, requestId: e },
          });
        } catch (c) {
          (this._pendingMarkerLoads.delete(e),
            I(new Error(`Failed to send loadMarker message: ${c.message}`)));
        }
        setTimeout(() => {
          this._pendingMarkerLoads.has(e) &&
            (this._pendingMarkerLoads.delete(e), I(new Error('loadMarker request timed out')));
        }, 1e4);
      })
    );
  }
}
function r(o) {
  const g = new Float32Array(16);
  for (let C = 0; C < 16; C++) g[C] = o[C];
  return g;
}
const i = /* @__PURE__ */ Object.freeze(
  /* @__PURE__ */ Object.defineProperty(
    {
      __proto__: null,
    },
    Symbol.toStringTag,
    { value: 'Module' },
  ),
);
export { a as ArtoolkitPlugin, r as convertModelViewToThreeMatrix };
//# sourceMappingURL=arjs-plugin-artoolkit.esm.js.map
