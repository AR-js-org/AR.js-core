/**
 * Default Profile Plugin
 * Provides device performance profiling and automatic configuration
 * Based on device capabilities (mobile vs desktop)
 */

import { ResourceType, DeviceProfile } from "../../src/core/components.js";

export class DefaultProfilePlugin {
  constructor() {
    this.engine = null;
  }

  /**
   * Initialize the plugin
   * @param {Engine} engine
   */
  init(engine) {
    this.engine = engine;
    this.#applyDefaultProfile();
  }

  /**
   * Enable the plugin
   */
  enable() {
    // Plugin is enabled
  }

  /**
   * Disable the plugin
   */
  disable() {
    // Plugin is disabled
  }

  /**
   * Apply default device profile based on detected device type
   * @private
   */
  #applyDefaultProfile() {
    const isMobile = this.#detectMobile();
    const profileLabel = isMobile ? "phone-normal" : "desktop-normal";

    const profile = new DeviceProfile({
      profileLabel,
    });

    // Set profile-specific values
    if (profileLabel === "desktop-normal") {
      profile.sourceWidth = 640;
      profile.sourceHeight = 480;
      profile.displayWidth = 640;
      profile.displayHeight = 480;
    } else if (profileLabel === "phone-normal") {
      profile.sourceWidth = 320; // 80 * 4
      profile.sourceHeight = 240; // 60 * 4
      profile.displayWidth = 320;
      profile.displayHeight = 240;
    }

    // Store in ECS as a resource
    this.engine.ecs.setResource(ResourceType.DEVICE_PROFILE, profile);

    // Emit event
    this.engine.events.emit("profile:applied", { profile });
  }

  /**
   * Detect if running on mobile device
   * @private
   * @returns {boolean}
   */
  #detectMobile() {
    return (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    );
  }

  /**
   * Update profile based on label
   * @param {string} label - Profile label (desktop-fast, desktop-normal, phone-normal, phone-slow)
   */
  applyProfile(label) {
    const profile = this.engine.ecs.getResource(ResourceType.DEVICE_PROFILE);
    if (!profile) return;

    profile.profileLabel = label;

    switch (label) {
      case "desktop-fast":
        profile.sourceWidth = 640 * 3;
        profile.sourceHeight = 480 * 3;
        profile.displayWidth = 640 * 3;
        profile.displayHeight = 480 * 3;
        break;

      case "desktop-normal":
        profile.sourceWidth = 640;
        profile.sourceHeight = 480;
        profile.displayWidth = 640;
        profile.displayHeight = 480;
        break;

      case "phone-normal":
        profile.sourceWidth = 320; // 80 * 4
        profile.sourceHeight = 240; // 60 * 4
        profile.displayWidth = 320;
        profile.displayHeight = 240;
        break;

      case "phone-slow":
        profile.sourceWidth = 240; // 80 * 3
        profile.sourceHeight = 180; // 60 * 3
        profile.displayWidth = 240;
        profile.displayHeight = 180;
        break;

      default:
        console.warn(`Unknown profile label: ${label}`);
        return;
    }

    // Emit event
    this.engine.events.emit("profile:updated", { profile, label });
  }

  /**
   * Destroy the plugin
   */
  destroy() {
    this.engine = null;
  }
}
