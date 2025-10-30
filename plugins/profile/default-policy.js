/**
 * Default Profile Policy Plugin
 * Automatically detects device type and sets appropriate performance profiles
 * Provides device profile configuration for AR processing
 */

import { RESOURCES, DEVICE_PROFILES } from "../../src/core/components.js";

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
   * Detect the appropriate device profile based on user agent and hardware
   * @returns {Object} Device profile configuration
   */
  detectProfile() {
    const isMobile = this._isMobileDevice();
    const profileLabel = isMobile ? "phone-normal" : "desktop-normal";

    return this.getProfile(profileLabel);
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
