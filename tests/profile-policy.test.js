import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defaultProfilePlugin } from "../plugins/profile/default-policy.js";
import {
  DEVICE_PROFILES,
  QUALITY_TIERS,
  RESOURCES,
} from "../src/core/components.js";

function installMinimalBrowserStubs() {
  // Navigator stubs
  globalThis.navigator = {
    hardwareConcurrency: 4,
    deviceMemory: 4,
    userAgent: "Mozilla/5.0 (Test Browser)",
    mediaDevices: {
      getSupportedConstraints: vi.fn(() => ({
        width: true,
        height: true,
        frameRate: true,
      })),
    },
  };

  // Window stubs
  globalThis.window = {
    screen: {
      width: 1920,
      height: 1080,
    },
  };

  // Performance API stub
  globalThis.performance = {
    now: vi.fn(() => Date.now()),
  };

  // Document stub for WebGL2 check
  globalThis.document = {
    createElement: vi.fn((tag) => {
      if (tag === "canvas") {
        return {
          getContext: vi.fn((type) => {
            if (type === "webgl2") return {}; // Simulate WebGL2 support
            return null;
          }),
        };
      }
      return {};
    }),
  };

  // WebAssembly stub
  globalThis.WebAssembly = {
    validate: vi.fn(() => true),
  };

  // Date stub
  globalThis.Date = {
    now: vi.fn(() => 1000000),
  };
}

describe("Default Profile Policy Plugin", () => {
  let context;

  beforeEach(() => {
    installMinimalBrowserStubs();
    context = {
      ecs: {
        setResource: vi.fn(),
        getResource: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Basic plugin structure", () => {
    it("has required plugin properties", () => {
      expect(defaultProfilePlugin.id).toBe("profile:default");
      expect(defaultProfilePlugin.name).toBe("Default Profile Policy");
      expect(defaultProfilePlugin.type).toBe("profile");
    });

    it("has required plugin methods", () => {
      expect(typeof defaultProfilePlugin.init).toBe("function");
      expect(typeof defaultProfilePlugin.detectProfile).toBe("function");
      expect(typeof defaultProfilePlugin.getProfile).toBe("function");
      expect(typeof defaultProfilePlugin.dispose).toBe("function");
    });
  });

  describe("Legacy profile compatibility", () => {
    it("getProfile returns legacy DESKTOP_FAST profile", () => {
      const profile = defaultProfilePlugin.getProfile(
        DEVICE_PROFILES.DESKTOP_FAST,
      );
      expect(profile.label).toBe(DEVICE_PROFILES.DESKTOP_FAST);
      expect(profile.canvasWidth).toBe(640 * 3);
      expect(profile.canvasHeight).toBe(480 * 3);
    });

    it("getProfile returns legacy DESKTOP_NORMAL profile", () => {
      const profile = defaultProfilePlugin.getProfile(
        DEVICE_PROFILES.DESKTOP_NORMAL,
      );
      expect(profile.label).toBe(DEVICE_PROFILES.DESKTOP_NORMAL);
      expect(profile.canvasWidth).toBe(640);
      expect(profile.canvasHeight).toBe(480);
    });

    it("getProfile returns legacy PHONE_NORMAL profile", () => {
      const profile = defaultProfilePlugin.getProfile(
        DEVICE_PROFILES.PHONE_NORMAL,
      );
      expect(profile.label).toBe(DEVICE_PROFILES.PHONE_NORMAL);
      expect(profile.canvasWidth).toBe(80 * 4);
      expect(profile.canvasHeight).toBe(60 * 4);
    });

    it("getProfile returns legacy PHONE_SLOW profile", () => {
      const profile = defaultProfilePlugin.getProfile(
        DEVICE_PROFILES.PHONE_SLOW,
      );
      expect(profile.label).toBe(DEVICE_PROFILES.PHONE_SLOW);
      expect(profile.canvasWidth).toBe(80 * 3);
      expect(profile.canvasHeight).toBe(60 * 3);
    });

    it("getProfile falls back to DESKTOP_NORMAL for unknown labels", () => {
      const profile = defaultProfilePlugin.getProfile("unknown-profile");
      expect(profile.label).toBe(DEVICE_PROFILES.DESKTOP_NORMAL);
    });
  });

  describe("Capability-based profiling", () => {
    it("detectProfile returns a structured DeviceProfile", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile).toBeTruthy();
      expect(profile.label).toMatch(/^auto-/);
      expect(profile.tier).toBeDefined();
      expect(profile.score).toBeGreaterThanOrEqual(0);
      expect(profile.score).toBeLessThanOrEqual(100);
    });

    it("detected profile has capability information", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities).toBeDefined();
      expect(profile.capabilities.cores).toBeDefined();
      expect(profile.capabilities.memory).toBeDefined();
      expect(profile.capabilities.webgl2).toBeDefined();
      expect(profile.capabilities.wasmSimd).toBeDefined();
      expect(profile.capabilities.screenLongSide).toBeDefined();
      expect(profile.capabilities.cameraConstraints).toBeDefined();
    });

    it("detected profile has capture settings", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capture).toBeDefined();
      expect(profile.capture.sourceWidth).toBeGreaterThan(0);
      expect(profile.capture.sourceHeight).toBeGreaterThan(0);
    });

    it("detected profile has processing settings", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.processing).toBeDefined();
      expect(profile.processing.canvasWidth).toBeGreaterThan(0);
      expect(profile.processing.canvasHeight).toBeGreaterThan(0);
      expect(profile.processing.maxDetectionRate).toBeGreaterThan(0);
      expect(profile.processing.budget).toBeGreaterThan(0);
      expect(profile.processing.complexity).toBeGreaterThanOrEqual(1);
      expect(profile.processing.complexity).toBeLessThanOrEqual(4);
    });

    it("detected profile has legacy compatibility fields", () => {
      const profile = defaultProfilePlugin.detectProfile();

      // Legacy fields should be present for backward compatibility
      expect(profile.canvasWidth).toBeDefined();
      expect(profile.canvasHeight).toBeDefined();
      expect(profile.maxDetectionRate).toBeDefined();
      expect(profile.sourceWidth).toBeDefined();
      expect(profile.sourceHeight).toBeDefined();
    });

    it("detected profile tier is one of QUALITY_TIERS", () => {
      const profile = defaultProfilePlugin.detectProfile();

      const validTiers = Object.values(QUALITY_TIERS);
      expect(validTiers).toContain(profile.tier);
    });
  });

  describe("Capability detection", () => {
    it("detects high-end device capabilities", () => {
      navigator.hardwareConcurrency = 8;
      navigator.deviceMemory = 8;
      window.screen.width = 2560;
      window.screen.height = 1440;

      const profile = defaultProfilePlugin.detectProfile();

      // High-end device should get HIGH or ULTRA tier
      expect([QUALITY_TIERS.HIGH, QUALITY_TIERS.ULTRA]).toContain(profile.tier);
      expect(profile.capabilities.cores).toBe(8);
      expect(profile.capabilities.memory).toBe(8);
    });

    it("detects low-end device capabilities", () => {
      navigator.hardwareConcurrency = 2;
      navigator.deviceMemory = 2;
      window.screen.width = 800;
      window.screen.height = 600;
      document.createElement = vi.fn(() => ({
        getContext: vi.fn(() => null), // No WebGL2
      }));

      const profile = defaultProfilePlugin.detectProfile();

      // Low-end device should get LOW or MEDIUM tier
      expect([QUALITY_TIERS.LOW, QUALITY_TIERS.MEDIUM]).toContain(profile.tier);
      expect(profile.capabilities.cores).toBe(2);
      expect(profile.capabilities.memory).toBe(2);
    });

    it("handles missing hardwareConcurrency gracefully", () => {
      delete navigator.hardwareConcurrency;

      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.cores).toBe(2); // Default fallback
    });

    it("handles missing deviceMemory gracefully", () => {
      delete navigator.deviceMemory;

      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.memory).toBe(4); // Default fallback
    });

    it("detects WebGL2 support", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.webgl2).toBe(true);
    });

    it("detects lack of WebGL2 support", () => {
      document.createElement = vi.fn(() => ({
        getContext: vi.fn(() => null),
      }));

      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.webgl2).toBe(false);
    });

    it("detects camera constraints support", () => {
      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.cameraConstraints).toBe(true);
    });

    it("detects lack of camera constraints support", () => {
      navigator.mediaDevices.getSupportedConstraints = vi.fn(() => ({}));

      const profile = defaultProfilePlugin.detectProfile();

      expect(profile.capabilities.cameraConstraints).toBe(false);
    });
  });

  describe("Tier-based profiles", () => {
    it("LOW tier has appropriate settings", () => {
      // Force low-end device
      navigator.hardwareConcurrency = 2;
      navigator.deviceMemory = 1;
      window.screen.width = 640;
      window.screen.height = 480;
      document.createElement = vi.fn(() => ({
        getContext: vi.fn(() => null),
      }));

      const profile = defaultProfilePlugin.detectProfile();

      if (profile.tier === QUALITY_TIERS.LOW) {
        expect(profile.capture.sourceWidth).toBe(640);
        expect(profile.capture.sourceHeight).toBe(360);
        expect(profile.processing.complexity).toBe(1);
      }
    });

    it("ULTRA tier has appropriate settings", () => {
      // Force high-end device
      navigator.hardwareConcurrency = 16;
      navigator.deviceMemory = 16;
      window.screen.width = 3840;
      window.screen.height = 2160;

      const profile = defaultProfilePlugin.detectProfile();

      if (profile.tier === QUALITY_TIERS.ULTRA) {
        expect(profile.capture.sourceWidth).toBe(1280);
        expect(profile.capture.sourceHeight).toBe(720);
        expect(profile.processing.complexity).toBe(4);
      }
    });
  });

  describe("Plugin initialization", () => {
    it("init sets device profile as a resource", async () => {
      await defaultProfilePlugin.init(context);

      expect(context.ecs.setResource).toHaveBeenCalledWith(
        RESOURCES.DEVICE_PROFILE,
        expect.objectContaining({
          label: expect.any(String),
          tier: expect.any(String),
          score: expect.any(Number),
        }),
      );
    });

    it("setProfile updates the device profile resource", () => {
      defaultProfilePlugin.setProfile(DEVICE_PROFILES.DESKTOP_FAST, context);

      expect(context.ecs.setResource).toHaveBeenCalledWith(
        RESOURCES.DEVICE_PROFILE,
        expect.objectContaining({
          label: DEVICE_PROFILES.DESKTOP_FAST,
        }),
      );
    });

    it("getCurrentProfile retrieves the device profile resource", () => {
      const mockProfile = { label: "test-profile" };
      context.ecs.getResource.mockReturnValue(mockProfile);

      const profile = defaultProfilePlugin.getCurrentProfile(context);

      expect(context.ecs.getResource).toHaveBeenCalledWith(
        RESOURCES.DEVICE_PROFILE,
      );
      expect(profile).toBe(mockProfile);
    });
  });

  describe("Micro-benchmark", () => {
    it("micro-benchmark runs and returns a score", () => {
      let callCount = 0;
      performance.now = vi.fn(() => {
        callCount++;
        // Simulate 8ms elapsed after enough calls
        return callCount < 10 ? 0 : 8;
      });

      const score = defaultProfilePlugin._runMicroBenchmark();

      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe("number");
    });
  });

  describe("Score computation", () => {
    it("computes score from capabilities and benchmark", () => {
      const capabilities = {
        cores: 4,
        memory: 4,
        webgl2: true,
        wasmSimd: true,
        screenLongSide: 1920,
        cameraConstraints: true,
      };
      const benchmarkScore = 100;

      const score = defaultProfilePlugin._computeScore(
        capabilities,
        benchmarkScore,
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("higher capabilities result in higher score", () => {
      const lowCapabilities = {
        cores: 2,
        memory: 2,
        webgl2: false,
        wasmSimd: false,
        screenLongSide: 800,
        cameraConstraints: false,
      };

      const highCapabilities = {
        cores: 8,
        memory: 8,
        webgl2: true,
        wasmSimd: true,
        screenLongSide: 2560,
        cameraConstraints: true,
      };

      const lowScore = defaultProfilePlugin._computeScore(lowCapabilities, 50);
      const highScore = defaultProfilePlugin._computeScore(
        highCapabilities,
        300,
      );

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe("Backward compatibility", () => {
    it("maintains compatibility with DEVICE_PROFILES constants", () => {
      expect(DEVICE_PROFILES.DESKTOP_FAST).toBeDefined();
      expect(DEVICE_PROFILES.DESKTOP_NORMAL).toBeDefined();
      expect(DEVICE_PROFILES.PHONE_NORMAL).toBeDefined();
      expect(DEVICE_PROFILES.PHONE_SLOW).toBeDefined();
    });

    it("new QUALITY_TIERS constants are defined", () => {
      expect(QUALITY_TIERS.LOW).toBe("low");
      expect(QUALITY_TIERS.MEDIUM).toBe("medium");
      expect(QUALITY_TIERS.HIGH).toBe("high");
      expect(QUALITY_TIERS.ULTRA).toBe("ultra");
    });

    it("can still set and get legacy profiles", () => {
      defaultProfilePlugin.setProfile(DEVICE_PROFILES.PHONE_NORMAL, context);

      expect(context.ecs.setResource).toHaveBeenCalledWith(
        RESOURCES.DEVICE_PROFILE,
        expect.objectContaining({
          label: DEVICE_PROFILES.PHONE_NORMAL,
          canvasWidth: 80 * 4,
          canvasHeight: 60 * 4,
        }),
      );
    });
  });
});
