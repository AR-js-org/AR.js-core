/**
 * Default Profile Policy Plugin
 * Automatically detects device capabilities and sets appropriate performance profiles
 * Uses runtime capability detection and micro-benchmarking for optimal configuration
 */

import {
  RESOURCES,
  DEVICE_PROFILES,
  QUALITY_TIERS,
} from "../../src/core/components.js";

export const defaultProfilePlugin = {
  id: "profile:default",
  name: "Default Profile Policy",
  type: "profile",

  /**
   * Initialize the plugin
   */
  async init(context) {
    // Detect device profile and set it as a resource
    const profile = this.detectProfile();
    context.ecs.setResource(RESOURCES.DEVICE_PROFILE, profile);
  },

  /**
   * Detect the appropriate device profile based on runtime capabilities
   * @returns {Object} Device profile configuration
   */
  detectProfile() {
    // Gather capability signals
    const capabilities = this._gatherCapabilities();

    // Run micro-benchmark for CPU performance signal
    const benchmarkScore = this._runMicroBenchmark();

    // Compute overall score (0-100)
    const score = this._computeScore(capabilities, benchmarkScore);

    // Map score to quality tier
    const tier = this._mapScoreToTier(score);

    // Derive profile from tier
    return this._createProfileFromTier(tier, capabilities, score);
  },

  /**
   * Get profile configuration by label
   * @param {string} label - Profile label
   * @returns {Object} Profile configuration
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
   * Gather device capability signals
   * @private
   * @returns {Object} Capability information
   */
  _gatherCapabilities() {
    const capabilities = {
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 4,
      webgl2: this._checkWebGL2Support(),
      wasmSimd: this._checkWasmSimdHint(),
      screenLongSide: Math.max(window.screen.width, window.screen.height),
      cameraConstraints: this._checkCameraConstraintsSupport(),
    };

    return capabilities;
  },

  /**
   * Check WebGL2 support
   * @private
   */
  _checkWebGL2Support() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2")
      );
    } catch (e) {
      return false;
    }
  },

  /**
   * Check WASM SIMD hint (basic feature detection)
   * @private
   */
  _checkWasmSimdHint() {
    try {
      // Basic check - WASM SIMD detection is complex, this is a hint
      return typeof WebAssembly !== "undefined" && WebAssembly.validate;
    } catch (e) {
      return false;
    }
  },

  /**
   * Check camera constraints support
   * @private
   */
  _checkCameraConstraintsSupport() {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getSupportedConstraints
      ) {
        return false;
      }
      const constraints = navigator.mediaDevices.getSupportedConstraints();
      // Check for key constraints that indicate good camera support
      return !!(
        constraints.width &&
        constraints.height &&
        constraints.frameRate
      );
    } catch (e) {
      return false;
    }
  },

  /**
   * Run a short micro-benchmark to estimate CPU performance
   * @private
   * @returns {number} Benchmark score (operations per ms)
   */
  _runMicroBenchmark() {
    const startTime = performance.now();
    const targetDuration = 8; // 8ms budget
    let operations = 0;
    const maxIterations = 10000; // Safety limit to prevent infinite loops

    // Simple computational loop
    while (
      performance.now() - startTime < targetDuration &&
      operations < maxIterations
    ) {
      // Mix of operations: math, array manipulation, object creation
      const arr = [1, 2, 3, 4, 5];
      const sum = arr.reduce((a, b) => a + b, 0);
      const sqrt = Math.sqrt(sum * sum + 100);
      const result = { value: sqrt, time: Date.now() };
      operations += result.value > 0 ? 1 : 0;
    }

    const elapsed = performance.now() - startTime;
    return elapsed > 0 ? operations / elapsed : operations; // operations per ms
  },

  /**
   * Compute overall capability score (0-100)
   * @private
   */
  _computeScore(capabilities, benchmarkScore) {
    let score = 0;

    // CPU cores contribution (0-25 points)
    score += Math.min((capabilities.cores / 8) * 25, 25);

    // Memory contribution (0-20 points)
    score += Math.min((capabilities.memory / 8) * 20, 20);

    // WebGL2 support (0-15 points)
    score += capabilities.webgl2 ? 15 : 0;

    // WASM hint (0-10 points)
    score += capabilities.wasmSimd ? 10 : 0;

    // Screen size contribution (0-10 points)
    // Larger screens often indicate more powerful devices
    const screenScore = Math.min((capabilities.screenLongSide / 2000) * 10, 10);
    score += screenScore;

    // Camera constraints support (0-5 points)
    score += capabilities.cameraConstraints ? 5 : 0;

    // Benchmark contribution (0-15 points)
    // Normalize benchmark score (typical range: 50-500 ops/ms)
    const benchmarkNormalized = Math.min(benchmarkScore / 500, 1);
    score += benchmarkNormalized * 15;

    return Math.min(Math.round(score), 100);
  },

  /**
   * Map score to quality tier
   * @private
   */
  _mapScoreToTier(score) {
    if (score >= 75) return QUALITY_TIERS.ULTRA;
    if (score >= 55) return QUALITY_TIERS.HIGH;
    if (score >= 35) return QUALITY_TIERS.MEDIUM;
    return QUALITY_TIERS.LOW;
  },

  /**
   * Create a structured DeviceProfile from quality tier
   * @private
   */
  _createProfileFromTier(tier, capabilities, score) {
    // Define capture defaults per tier
    const tierDefaults = {
      [QUALITY_TIERS.LOW]: {
        sourceWidth: 640,
        sourceHeight: 360,
        canvasWidth: 320,
        canvasHeight: 180,
        maxDetectionRate: 30,
        processingBudget: 33, // ms/frame (~30fps)
        complexityLevel: 1,
      },
      [QUALITY_TIERS.MEDIUM]: {
        sourceWidth: 800,
        sourceHeight: 450,
        canvasWidth: 400,
        canvasHeight: 225,
        maxDetectionRate: 30,
        processingBudget: 25, // ms/frame (~40fps)
        complexityLevel: 2,
      },
      [QUALITY_TIERS.HIGH]: {
        sourceWidth: 960,
        sourceHeight: 540,
        canvasWidth: 480,
        canvasHeight: 270,
        maxDetectionRate: 60,
        processingBudget: 16, // ms/frame (~60fps)
        complexityLevel: 3,
      },
      [QUALITY_TIERS.ULTRA]: {
        sourceWidth: 1280,
        sourceHeight: 720,
        canvasWidth: 640,
        canvasHeight: 360,
        maxDetectionRate: 60,
        processingBudget: 16, // ms/frame (~60fps)
        complexityLevel: 4,
      },
    };

    const defaults = tierDefaults[tier];

    // Compose structured DeviceProfile
    return {
      label: `auto-${tier}`,
      tier: tier,
      score: score,
      capabilities: {
        cores: capabilities.cores,
        memory: capabilities.memory,
        webgl2: capabilities.webgl2,
        wasmSimd: capabilities.wasmSimd,
        screenLongSide: capabilities.screenLongSide,
        cameraConstraints: capabilities.cameraConstraints,
      },
      capture: {
        sourceWidth: defaults.sourceWidth,
        sourceHeight: defaults.sourceHeight,
      },
      processing: {
        canvasWidth: defaults.canvasWidth,
        canvasHeight: defaults.canvasHeight,
        maxDetectionRate: defaults.maxDetectionRate,
        budget: defaults.processingBudget,
        complexity: defaults.complexityLevel,
      },
      // Legacy compatibility fields
      canvasWidth: defaults.canvasWidth,
      canvasHeight: defaults.canvasHeight,
      maxDetectionRate: defaults.maxDetectionRate,
      sourceWidth: defaults.sourceWidth,
      sourceHeight: defaults.sourceHeight,
    };
  },

  /**
   * Check if the current device is a mobile device
   * @private
   */
  _isMobileDevice() {
    const userAgent = navigator.userAgent;
    return !!(
      userAgent.match(/Android/i) ||
      userAgent.match(/webOS/i) ||
      userAgent.match(/iPhone/i) ||
      userAgent.match(/iPad/i) ||
      userAgent.match(/iPod/i) ||
      userAgent.match(/BlackBerry/i) ||
      userAgent.match(/Windows Phone/i)
    );
  },

  /**
   * Set a specific profile
   * @param {string} label - Profile label
   * @param {Object} context - Engine context
   */
  setProfile(label, context) {
    const profile = this.getProfile(label);
    context.ecs.setResource(RESOURCES.DEVICE_PROFILE, profile);
  },

  /**
   * Get the current profile
   * @param {Object} context - Engine context
   * @returns {Object} Current device profile
   */
  getCurrentProfile(context) {
    return context.ecs.getResource(RESOURCES.DEVICE_PROFILE);
  },

  /**
   * Dispose the plugin
   */
  async dispose() {
    // Nothing to clean up
  },
};
