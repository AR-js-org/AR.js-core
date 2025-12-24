let s = null, d = !1, T = !1, p = null, w = null, u = 0, m = 0;
const P = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map(), x = /* @__PURE__ */ new Set();
let C = 0, g = 0.6, k = null, h = 0, M = 0, l = {
  moduleUrl: null,
  cameraParametersUrl: null,
  wasmBaseUrl: null,
  minConfidence: null
}, A = !1;
function E(a) {
  self.addEventListener("message", (t) => a(t.data));
}
function f(a) {
  self.postMessage(a);
}
function I(a) {
  try {
    const t = a?.data || {}, e = t.marker || {}, r = Array.isArray(t.matrix) ? t.matrix.slice(0, 16) : t.matrix && t.matrix.length ? Array.from(t.matrix).slice(0, 16) : null, o = e.vertex ? Array.isArray(e.vertex) ? e.vertex.slice() : null : e.corners ? e.corners.flatMap((i) => [i.x ?? i[0], i.y ?? i[1]]) : null;
    return {
      type: t.type,
      // e.g., ARToolkit.PATTERN_MARKER
      matrix: r,
      marker: {
        idPatt: e.idPatt ?? e.patternId ?? e.pattern_id ?? null,
        idMatrix: e.idMatrix ?? null,
        cfPatt: e.cfPatt ?? e.confidence ?? null,
        cfMatrix: e.cfMatrix ?? null,
        vertex: o || null
      }
    };
  } catch {
    return { type: null, matrix: null, marker: {} };
  }
}
function W(a) {
  const t = a?.data || {}, e = t.type, r = t.marker || {}, o = r.idPatt ?? r.patternId ?? r.pattern_id ?? null, i = r.cfPatt ?? r.confidence ?? 0, n = t.matrix;
  if (e !== C || !(Number.isFinite(i) && i >= g)) return !1;
  const c = Array.isArray(n) ? n : n && Array.from(n) || null;
  return !(!c || c.length < 16 || x.size && o != null && !x.has(o));
}
function v() {
  !s || typeof s.addEventListener != "function" || T || (s.addEventListener("getMarker", (a) => {
    if (!W(a)) return;
    const t = I(a);
    try {
      console.log("[Worker] getMarker (filtered)", t);
    } catch {
    }
    f({ type: "getMarker", payload: t });
  }), T = !0);
}
async function U(a = 640, t = 480) {
  if (d) return !0;
  const e = Date.now();
  if (e < M) {
    const r = M - e;
    return console.warn("[Worker] initArtoolkit skipped due to backoff (ms):", r), !1;
  }
  if (k)
    try {
      return await k, d;
    } catch {
      return !1;
    }
  k = (async () => {
    try {
      const r = await (async () => l.moduleUrl ? (console.log(
        "[Worker] Loading artoolkit from moduleUrl:",
        l.moduleUrl
      ), await import(l.moduleUrl)) : await import("./ARToolkit-Q5ek8CTR.js").then(function(c) {
        return c.A;
      }))(), o = r.ARController ?? r.default?.ARController, i = r.ARToolkit ?? r.default?.ARToolkit;
      if (!o)
        throw new Error("ARController export not found in ARToolKit module");
      if (i && typeof i.PATTERN_MARKER == "number" && (C = i.PATTERN_MARKER), l.wasmBaseUrl && o)
        try {
          o.baseURL = l.wasmBaseUrl.endsWith("/") ? l.wasmBaseUrl : l.wasmBaseUrl + "/";
        } catch {
        }
      typeof l.minConfidence == "number" && (g = l.minConfidence);
      const n = l.cameraParametersUrl || "https://raw.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat";
      if (console.log("[Worker] ARToolKit init", {
        width: a,
        height: t,
        camUrl: n,
        minConfidence: g,
        patternType: C
      }), s = await o.initWithDimensions(
        a,
        t,
        n,
        {}
      ), d = !!s, console.log("[Worker] ARToolKit initialized:", d), !d)
        throw new Error(
          "ARController.initWithDimensions returned falsy controller"
        );
      v(), h = 0, M = 0;
    } catch (r) {
      console.error("[Worker] ARToolKit init failed:", r), s = null, d = !1, h = Math.min(h + 1, 6);
      const o = Math.min(3e4, 1e3 * Math.pow(2, h));
      throw M = Date.now() + o, f({
        type: "error",
        payload: {
          message: `ARToolKit init failed (${r?.message || r}). Retrying in ${o}ms.`
        }
      }), r;
    } finally {
      k = null;
    }
  })();
  try {
    await k;
  } catch {
  }
  return d;
}
async function F(a) {
  if (P.has(a)) return P.get(a);
  if (y.has(a)) return y.get(a);
  const t = (async () => {
    const e = await s.loadMarker(a);
    return P.set(a, e), x.add(e), y.delete(a), e;
  })().catch((e) => {
    throw y.delete(a), e;
  });
  return y.set(a, t), t;
}
E(async (a) => {
  const { type: t, payload: e } = a || {};
  try {
    if (t === "init") {
      e && typeof e == "object" && (l.moduleUrl = e.moduleUrl ?? l.moduleUrl, l.cameraParametersUrl = e.cameraParametersUrl ?? l.cameraParametersUrl, l.wasmBaseUrl = e.wasmBaseUrl ?? l.wasmBaseUrl, typeof e.minConfidence == "number" && (l.minConfidence = e.minConfidence, g = e.minConfidence)), A || (f({ type: "ready" }), A = !0);
      return;
    }
    if (t === "loadMarker") {
      const { patternUrl: r, size: o = 1, requestId: i } = e || {};
      if (!r) {
        f({
          type: "loadMarkerResult",
          payload: {
            ok: !1,
            error: "Missing patternUrl parameter",
            requestId: i
          }
        });
        return;
      }
      try {
        if (!await U(640, 480)) throw new Error("ARToolKit not initialized");
        const c = await F(r);
        typeof s.trackPatternMarkerId == "function" ? s.trackPatternMarkerId(c, o) : typeof s.trackPatternMarker == "function" && s.trackPatternMarker(c, o), f({
          type: "loadMarkerResult",
          payload: { ok: !0, markerId: c, size: o, requestId: i }
        });
      } catch (n) {
        console.error("[Worker] loadMarker error:", n), f({
          type: "loadMarkerResult",
          payload: { ok: !1, error: n?.message || String(n), requestId: i }
        });
      }
      return;
    }
    if (t === "processFrame") {
      const { imageBitmap: r, width: o, height: i } = e || {};
      if (r) {
        try {
          const n = o || r.width || 640, c = i || r.height || 480;
          await U(n, c), (!p || u !== n || m !== c) && (u = n, m = c, p = new OffscreenCanvas(u, m), w = p.getContext("2d", {
            willReadFrequently: !0
          })), w.clearRect(0, 0, u, m), w.drawImage(r, 0, 0, u, m);
          try {
            r.close?.();
          } catch {
          }
          if (d && s)
            try {
              s.process(p);
            } catch {
              try {
                const R = w.getImageData(
                  0,
                  0,
                  u,
                  m
                );
                s.process(R);
              } catch (R) {
                console.warn(
                  "[Worker] ARToolKit process fallback failed:",
                  R
                );
              }
            }
        } catch (n) {
          console.error("[Worker] processFrame error:", n);
        }
        return;
      }
      await new Promise((n) => setTimeout(n, 5));
      return;
    }
  } catch (r) {
    f({
      type: "error",
      payload: { message: r?.message || String(r) }
    });
  }
});
try {
  A || (f({ type: "ready" }), A = !0);
} catch {
}
//# sourceMappingURL=worker-C6Ps5-k4.js.map
