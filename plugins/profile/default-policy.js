/**
 * Default Profile Policy Plugin
 * Automatically computes a capability-based device profile at runtime.
 * Backward-compatible: legacy DEVICE_PROFILES mappings still supported.
 */

import {
  RESOURCES,
  DEVICE_PROFILES,
  QUALITY_TIERS,
} from "../../src/core/components.js";

export const defaultProfilePlugin = {
  id: "profile:default",
  name: "Default Profile Policy (auto)",
  type: "profile",

  /**
   * Initialize the plugin: compute auto profile and publish it
   */
  async init(context) {
    const profile = await this._computeAutoProfile();
    context.ecs.setResource(RESOURCES.DEVICE_PROFILE, profile);
    // Emit a profile-applied event for observers (optional)
    context?.eventBus?.emit?.("profile:applied", { profile });
  },

  /**
   * Preferred: detect a structured capability-based profile
   */
  async detectProfile() {
    return this._computeAutoProfile();
  },

  /**
   * Compute a capability-based profile
   * Returns a structured profile with backward-compatible fields.
   */
  async _computeAutoProfile() {
    const caps = this._getCaps();
    const bench = await this._microBenchmark(8); // ~8ms probe
    const score = this._scoreCaps(caps, bench);
    const tierInfo = this._pickTier(score);
    const [w, h] = tierInfo.capture;

    // Backward-compat top-level fields used in older examples:
    const legacyCompatible = {
      label: `auto-${tierInfo.tier}`,
      sourceWidth: w,
      sourceHeight: h,
      displayWidth: w,
      displayHeight: h,
      canvasWidth: w,
      canvasHeight: h,
      maxDetectionRate: 60,
    };

    // New structured fields:
    const structured = {
      qualityTier: tierInfo.tier, // QUALITY_TIERS value
      score,
      caps,
      capture: {
        sourceWidth: w,
        sourceHeight: h,
        displayWidth: w,
        displayHeight: h,
        fpsHint: 30,
      },
      processing: {
        budgetMsPerFrame: tierInfo.budget,
        complexity: tierInfo.complexity,
      },
    };

    return { ...legacyCompatible, ...structured };
  },

  /**
   * Get device capability signals (defensive checks for non-browser envs)
   */
  _getCaps() {
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const win = typeof window !== "undefined" ? window : {};
    const scr = typeof screen !== "undefined" ? screen : {};

    const userAgentHint = typeof nav.userAgent === "string" ? nav.userAgent : "";
    const cores = Math.max(1, Number(nav.hardwareConcurrency || 2));
    const memoryGB = Math.max(0.5, Number(nav.deviceMemory || 2));
    const webgl2 = !!win.WebGL2RenderingContext;
    const wasmSIMD = typeof WebAssembly === "object" && typeof WebAssembly.validate === "function";
    const screenLongSide = Math.max(Number(scr.width || 0), Number(scr.height || 0)) || 0;

    let torch = false;
    let focusMode = "unknown";
    try {
      const getSC = nav.mediaDevices?.getSupportedConstraints?.bind(nav.mediaDevices);
      const sc = getSC ? getSC() : {};
      torch = !!sc?.torch;
      focusMode = sc?.focusMode ? "supported" : "unknown";
    } catch {
      // ignore
    }

    return {
      userAgentHint,
      cores,
      memoryGB,
      webgl2,
      wasmSIMD,
      screenLongSide,
      camera: { torch, focusMode },
    };
  },

  /**
   * Very small CPU probe to approximate budget
   */
  async _microBenchmark(msTarget = 8) {
    if (typeof performance === "undefined" || typeof performance.now !== "function") {
      return 0;
    }
    const start = performance.now();
    let acc = 0;
    while (performance.now() - start < msTarget) {
      // Cheap floating math
      for (let i = 0; i < 1000; i++) acc += Math.sqrt(i + (acc % 5));
      // Safety: don't run too long if timers behave oddly
      if (performance.now() - start > msTarget * 2) break;
    }
    return acc;
  },

  /**
   * Convert caps + bench signal into a 0..100 score
   */
  _scoreCaps(caps, benchSignal) {
    let score = 0;
    // Cores: up to 6 cores -> 30 pts
    score += Math.min(30, (caps.cores || 0) * 5);
    // Memory: up to ~7.5 GB -> 30 pts
    score += Math.min(30, (caps.memoryGB || 0) * 4);
    // WebGL2: 10 pts
    if (caps.webgl2) score += 10;
    // WASM SIMD hint: 10 pts
    if (caps.wasmSIMD) score += 10;
    // Screen long side: up to ~6000 px -> 10 pts (rough indicator of class)
    score += Math.min(10, Math.floor((caps.screenLongSide || 0) / 600));

    // Normalize bench signal into ~0..10
    if (typeof benchSignal === "number") {
      const norm = Math.max(0, Math.log10(Math.max(10, benchSignal)));
      score += Math.min(10, 5 + norm);
    }

    score = Math.round(Math.max(0, Math.min(100, score)));
    return score;
  },

  /**
   * Map score to a quality tier and capture/budget hints
   */
  _pickTier(score) {
    if (score >= 85) {
      return { tier: QUALITY_TIERS.ULTRA, capture: [1280, 720], budget: 12, complexity: "high" };
    }
    if (score >= 65) {
      return { tier: QUALITY_TIERS.HIGH, capture: [960, 540], budget: 10, complexity: "high" };
    }
    if (score >= 45) {
      return { tier: QUALITY_TIERS.MEDIUM, capture: [800, 450], budget: 8, complexity: "medium" };
    }
    return { tier: QUALITY_TIERS.LOW, capture: [640, 360], budget: 6, complexity: "low" };
  },

  /**
   * Legacy mapping: return a minimal legacy profile by label
   */
  getProfile(label) {
    const profiles = {
      [DEVICE_PROFILES.DESKTOP_FAST]: {
        label: DEVICE_PROFILES.DESKTOP_FAST,
        canvasWidth: 640 * 3,
        canvasHeight: 480 * 3,
        maxDetectionRate: 30,
        sourceWidth: 640,
        sourceHeight: 480,
      },
      [DEVICE_PROFILES.DESKTOP_NORMAL]: {
        label: DEVICE_PROFILES.DESKTOP_NORMAL,
        canvasWidth: 640,
        canvasHeight: 480,
        maxDetectionRate: 60,
        sourceWidth: 640,
        sourceHeight: 480,
      },
      [DEVICE_PROFILES.PHONE_NORMAL]: {
        label: DEVICE_PROFILES.PHONE_NORMAL,
        canvasWidth: 80 * 4,
        canvasHeight: 60 * 4,
        maxDetectionRate: 30,
        sourceWidth: 640,
        sourceHeight: 480,
      },
      [DEVICE_PROFILES.PHONE_SLOW]: {
        label: DEVICE_PROFILES.PHONE_SLOW,
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3,
        maxDetectionRate: 30,
        sourceWidth: 640,
        sourceHeight: 480,
      },
    };

    return profiles[label] || profiles[DEVICE_PROFILES.DESKTOP_NORMAL];
  },

  /**
   * Keep legacy setter: If a legacy label is passed, set that profile.
   */
  setProfile(label, context) {
    const profile = this.getProfile(label);
    context.ecs.setResource(RESOURCES.DEVICE_PROFILE, profile);
  },

  /**
   * Read currently applied profile
   */
  getCurrentProfile(context) {
    return context.ecs.getResource(RESOURCES.DEVICE_PROFILE);
  },

  /**
   * Legacy mobile detection retained (unused by default)
   * Enhanced to cover additional mobile devices and tablets
   * @private
   */
  _isMobileDevice() {
    const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    return !!(
      ua.match(/Android/i) ||
      ua.match(/webOS/i) ||
      ua.match(/iPhone/i) ||
      ua.match(/iPad/i) ||
      ua.match(/iPod/i) ||
      ua.match(/BlackBerry/i) ||
      ua.match(/Windows Phone/i) ||
      ua.match(/Opera Mini/i) ||
      ua.match(/Opera Mobi/i) ||
      ua.match(/IEMobile/i) ||
      ua.match(/Mobile/i) ||
      ua.match(/Kindle/i) ||
      ua.match(/Silk/i) ||
      ua.match(/PlayStation/i) ||
      ua.match(/Nintendo/i)
    );
  },

  /**
   * Dispose hook
   */
  async dispose() {
    // Nothing to clean up
  },
};