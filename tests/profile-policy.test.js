import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultProfilePlugin } from '../plugins/profile/default-policy.js';
import { DEVICE_PROFILES, QUALITY_TIERS, RESOURCES } from '../src/core/components.js';

// Utilities to safely stub internal methods without mutating global navigator/window/screen
function withStubbedCaps(caps, fn) {
  const orig = defaultProfilePlugin._getCaps;
  defaultProfilePlugin._getCaps = () => caps;
  try {
    return fn();
  } finally {
    defaultProfilePlugin._getCaps = orig;
  }
}
function withStubbedBench(value, fn) {
  const orig = defaultProfilePlugin._microBenchmark;
  defaultProfilePlugin._microBenchmark = async () => value;
  try {
    return fn();
  } finally {
    defaultProfilePlugin._microBenchmark = orig;
  }
}

describe('Default Profile Policy Plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic plugin structure', () => {
    it('has required plugin properties', () => {
      expect(defaultProfilePlugin.id).toBe('profile:default');
      expect(typeof defaultProfilePlugin.name).toBe('string');
      expect(defaultProfilePlugin.type).toBe('profile');
    });

    it('has required plugin methods', () => {
      expect(typeof defaultProfilePlugin.init).toBe('function');
      expect(typeof defaultProfilePlugin.detectProfile).toBe('function');
      expect(typeof defaultProfilePlugin.getProfile).toBe('function');
      expect(typeof defaultProfilePlugin.setProfile).toBe('function');
      expect(typeof defaultProfilePlugin.getCurrentProfile).toBe('function');
      expect(typeof defaultProfilePlugin._computeAutoProfile).toBe('function');
      expect(typeof defaultProfilePlugin._getCaps).toBe('function');
      expect(typeof defaultProfilePlugin._microBenchmark).toBe('function');
      expect(typeof defaultProfilePlugin._scoreCaps).toBe('function');
      expect(typeof defaultProfilePlugin._pickTier).toBe('function');
    });
  });

  describe('Legacy profile compatibility', () => {
    it('getProfile returns legacy DESKTOP_FAST profile', () => {
      const p = defaultProfilePlugin.getProfile(DEVICE_PROFILES.DESKTOP_FAST);
      expect(p.label).toBe(DEVICE_PROFILES.DESKTOP_FAST);
      expect(p.sourceWidth).toBe(640);
      expect(p.sourceHeight).toBe(480);
    });

    it('getProfile returns legacy DESKTOP_NORMAL profile', () => {
      const p = defaultProfilePlugin.getProfile(DEVICE_PROFILES.DESKTOP_NORMAL);
      expect(p.label).toBe(DEVICE_PROFILES.DESKTOP_NORMAL);
    });

    it('getProfile returns legacy PHONE_NORMAL profile', () => {
      const p = defaultProfilePlugin.getProfile(DEVICE_PROFILES.PHONE_NORMAL);
      expect(p.label).toBe(DEVICE_PROFILES.PHONE_NORMAL);
    });

    it('getProfile returns legacy PHONE_SLOW profile', () => {
      const p = defaultProfilePlugin.getProfile(DEVICE_PROFILES.PHONE_SLOW);
      expect(p.label).toBe(DEVICE_PROFILES.PHONE_SLOW);
    });

    it('getProfile falls back to DESKTOP_NORMAL for unknown labels', () => {
      const p = defaultProfilePlugin.getProfile('unknown');
      expect(p.label).toBe(DEVICE_PROFILES.DESKTOP_NORMAL);
    });
  });

  describe('Capability-based profiling', () => {
    it('detectProfile returns a structured DeviceProfile', async () => {
      const profile = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 4,
            memoryGB: 4,
            webgl2: true,
            wasmSIMD: false,
            screenLongSide: 1200,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin.detectProfile(),
        ),
      );
      expect(profile).toBeTruthy();
      expect(profile.label).toMatch(/^auto-/);
      expect(Object.values(QUALITY_TIERS)).toContain(profile.qualityTier);
      expect(typeof profile.score).toBe('number');
    });

    it('detected profile has capability information', async () => {
      const profile = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 2,
            memoryGB: 2,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 800,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect(profile.caps).toBeTruthy();
      expect(typeof profile.caps.cores).toBe('number');
      expect(typeof profile.caps.memoryGB).toBe('number');
      expect(typeof profile.caps.webgl2).toBe('boolean');
      expect(profile.caps.camera).toBeTruthy();
    });

    it('detected profile has capture settings', async () => {
      const p = await defaultProfilePlugin._computeAutoProfile();
      expect(p.capture).toBeTruthy();
      expect(typeof p.capture.sourceWidth).toBe('number');
      expect(typeof p.capture.sourceHeight).toBe('number');
    });

    it('detected profile has processing settings', async () => {
      const p = await defaultProfilePlugin._computeAutoProfile();
      expect(p.processing).toBeTruthy();
      expect(typeof p.processing.budgetMsPerFrame).toBe('number');
    });

    it('detected profile has legacy compatibility fields', async () => {
      const p = await defaultProfilePlugin._computeAutoProfile();
      expect(typeof p.sourceWidth).toBe('number');
      expect(typeof p.displayWidth).toBe('number');
      expect(typeof p.canvasWidth).toBe('number');
      expect(typeof p.maxDetectionRate).toBe('number');
    });

    it('detected profile tier is one of QUALITY_TIERS', async () => {
      const p = await defaultProfilePlugin._computeAutoProfile();
      expect(Object.values(QUALITY_TIERS)).toContain(p.qualityTier);
    });
  });

  describe('Capability detection', () => {
    it('detects high-end device capabilities', async () => {
      const p = await withStubbedBench(1000, () =>
        withStubbedCaps(
          {
            cores: 8,
            memoryGB: 8,
            webgl2: true,
            wasmSIMD: true,
            screenLongSide: 2500,
            camera: { torch: true, focusMode: 'supported' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect([QUALITY_TIERS.HIGH, QUALITY_TIERS.ULTRA]).toContain(p.qualityTier);
    });

    it('detects low-end device capabilities', async () => {
      const p = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 1,
            memoryGB: 1,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 600,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect([QUALITY_TIERS.LOW, QUALITY_TIERS.MEDIUM]).toContain(p.qualityTier);
    });

    it('handles missing hardwareConcurrency gracefully', async () => {
      const p = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            memoryGB: 2,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 800,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect(p).toBeTruthy();
    });

    it('handles missing deviceMemory gracefully', async () => {
      const p = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 2,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 800,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect(p).toBeTruthy();
    });

    it('detects WebGL2 support', () => {
      const s1 = defaultProfilePlugin._scoreCaps(
        {
          cores: 2,
          memoryGB: 2,
          webgl2: false,
          wasmSIMD: false,
          screenLongSide: 800,
        },
        0,
      );
      const s2 = defaultProfilePlugin._scoreCaps(
        {
          cores: 2,
          memoryGB: 2,
          webgl2: true,
          wasmSIMD: false,
          screenLongSide: 800,
        },
        0,
      );
      expect(s2).toBeGreaterThan(s1);
    });

    it('detects lack of WebGL2 support', () => {
      const s1 = defaultProfilePlugin._scoreCaps(
        {
          cores: 2,
          memoryGB: 2,
          webgl2: true,
          wasmSIMD: false,
          screenLongSide: 800,
        },
        0,
      );
      const s2 = defaultProfilePlugin._scoreCaps(
        {
          cores: 2,
          memoryGB: 2,
          webgl2: false,
          wasmSIMD: false,
          screenLongSide: 800,
        },
        0,
      );
      expect(s1).toBeGreaterThan(s2);
    });

    it('detects camera constraints support', async () => {
      const p = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 2,
            memoryGB: 2,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 800,
            camera: { torch: true, focusMode: 'supported' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect(p.caps.camera.torch).toBe(true);
    });

    it('detects lack of camera constraints support', async () => {
      const p = await withStubbedBench(0, () =>
        withStubbedCaps(
          {
            cores: 2,
            memoryGB: 2,
            webgl2: false,
            wasmSIMD: false,
            screenLongSide: 800,
            camera: { torch: false, focusMode: 'unknown' },
          },
          () => defaultProfilePlugin._computeAutoProfile(),
        ),
      );
      expect(p.caps.camera.torch).toBe(false);
    });
  });

  describe('Tier-based profiles', () => {
    it('LOW tier has appropriate settings', () => {
      const t = defaultProfilePlugin._pickTier(10);
      expect(t.tier).toBe(QUALITY_TIERS.LOW);
      expect(t.capture[0]).toBeLessThanOrEqual(640);
    });

    it('ULTRA tier has appropriate settings', () => {
      const t = defaultProfilePlugin._pickTier(95);
      expect(t.tier).toBe(QUALITY_TIERS.ULTRA);
      expect(t.capture[0]).toBeGreaterThanOrEqual(1280);
    });
  });

  describe('Plugin initialization', () => {
    it('init sets device profile as a resource', async () => {
      const setResource = vi.fn();
      const context = { ecs: { setResource }, eventBus: { emit: vi.fn() } };
      await defaultProfilePlugin.init(context);
      expect(setResource).toHaveBeenCalledWith(
        RESOURCES.DEVICE_PROFILE,
        expect.objectContaining({ label: expect.stringMatching(/^auto-/) }),
      );
    });

    it('setProfile updates the device profile resource', () => {
      const setResource = vi.fn();
      const context = { ecs: { setResource } };
      defaultProfilePlugin.setProfile(DEVICE_PROFILES.DESKTOP_NORMAL, context);
      expect(setResource).toHaveBeenCalled();
    });

    it('getCurrentProfile retrieves the device profile resource', () => {
      const p = { label: 'auto-high' };
      const context = { ecs: { getResource: () => p } };
      expect(defaultProfilePlugin.getCurrentProfile(context)).toBe(p);
    });
  });

  describe('Micro-benchmark', () => {
    it('micro-benchmark runs and returns a score', async () => {
      const v = await defaultProfilePlugin._microBenchmark(1);
      expect(typeof v).toBe('number');
    });
  });

  describe('Score computation', () => {
    it('computes score from capabilities and benchmark', () => {
      const s = defaultProfilePlugin._scoreCaps(
        {
          cores: 2,
          memoryGB: 2,
          webgl2: false,
          wasmSIMD: false,
          screenLongSide: 800,
        },
        123,
      );
      expect(typeof s).toBe('number');
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    });

    it('higher capabilities result in higher score', () => {
      const low = defaultProfilePlugin._scoreCaps(
        {
          cores: 1,
          memoryGB: 1,
          webgl2: false,
          wasmSIMD: false,
          screenLongSide: 600,
        },
        0,
      );
      const high = defaultProfilePlugin._scoreCaps(
        {
          cores: 8,
          memoryGB: 8,
          webgl2: true,
          wasmSIMD: true,
          screenLongSide: 2400,
        },
        1000,
      );
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('Backward compatibility', () => {
    it('maintains compatibility with DEVICE_PROFILES constants', () => {
      expect(DEVICE_PROFILES.DESKTOP_NORMAL).toBeDefined();
      expect(DEVICE_PROFILES.PHONE_SLOW).toBeDefined();
    });

    it('new QUALITY_TIERS constants are defined', () => {
      expect(QUALITY_TIERS.LOW).toBe('low');
      expect(QUALITY_TIERS.ULTRA).toBe('ultra');
    });

    it('can still set and get legacy profiles', () => {
      const p = defaultProfilePlugin.getProfile(DEVICE_PROFILES.PHONE_NORMAL);
      expect(p.label).toBe(DEVICE_PROFILES.PHONE_NORMAL);
    });
  });
});
