/**
 * Plugin Manager
 * Handles registration, enabling, and disabling of plugins
 * Plugins can extend engine functionality in a modular way
 */

export class PluginManager {
  constructor(engine) {
    this.engine = engine;
    this.plugins = new Map(); // pluginId -> plugin instance
    this.enabledPlugins = new Set();
  }

  /**
   * Register a plugin
   * @param {string} pluginId - unique plugin identifier
   * @param {Object} plugin - plugin instance with init/enable/disable/destroy methods
   * @returns {boolean} success
   */
  register(pluginId, plugin) {
    if (this.plugins.has(pluginId)) {
      console.warn(`Plugin '${pluginId}' is already registered`);
      return false;
    }

    // Validate plugin structure
    if (typeof plugin.init !== "function") {
      console.error(`Plugin '${pluginId}' must have an init() method`);
      return false;
    }

    this.plugins.set(pluginId, plugin);

    // Initialize plugin
    try {
      plugin.init(this.engine);
    } catch (error) {
      console.error(`Error initializing plugin '${pluginId}':`, error);
      this.plugins.delete(pluginId);
      return false;
    }

    return true;
  }

  /**
   * Unregister a plugin
   * @param {string} pluginId
   */
  unregister(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Disable first if enabled
    if (this.enabledPlugins.has(pluginId)) {
      this.disable(pluginId);
    }

    // Call destroy if available
    if (typeof plugin.destroy === "function") {
      try {
        plugin.destroy();
      } catch (error) {
        console.error(`Error destroying plugin '${pluginId}':`, error);
      }
    }

    this.plugins.delete(pluginId);
  }

  /**
   * Enable a plugin
   * @param {string} pluginId
   * @returns {boolean} success
   */
  enable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin '${pluginId}' is not registered`);
      return false;
    }

    if (this.enabledPlugins.has(pluginId)) {
      return true; // Already enabled
    }

    // Call enable method if available
    if (typeof plugin.enable === "function") {
      try {
        plugin.enable();
      } catch (error) {
        console.error(`Error enabling plugin '${pluginId}':`, error);
        return false;
      }
    }

    this.enabledPlugins.add(pluginId);
    this.engine.events.emit("plugin:enabled", { pluginId });
    return true;
  }

  /**
   * Disable a plugin
   * @param {string} pluginId
   * @returns {boolean} success
   */
  disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin '${pluginId}' is not registered`);
      return false;
    }

    if (!this.enabledPlugins.has(pluginId)) {
      return true; // Already disabled
    }

    // Call disable method if available
    if (typeof plugin.disable === "function") {
      try {
        plugin.disable();
      } catch (error) {
        console.error(`Error disabling plugin '${pluginId}':`, error);
        return false;
      }
    }

    this.enabledPlugins.delete(pluginId);
    this.engine.events.emit("plugin:disabled", { pluginId });
    return true;
  }

  /**
   * Get a plugin instance
   * @param {string} pluginId
   * @returns {Object|undefined}
   */
  get(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if a plugin is registered
   * @param {string} pluginId
   * @returns {boolean}
   */
  has(pluginId) {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if a plugin is enabled
   * @param {string} pluginId
   * @returns {boolean}
   */
  isEnabled(pluginId) {
    return this.enabledPlugins.has(pluginId);
  }

  /**
   * Get all registered plugin IDs
   * @returns {string[]}
   */
  list() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all enabled plugin IDs
   * @returns {string[]}
   */
  listEnabled() {
    return Array.from(this.enabledPlugins);
  }

  /**
   * Disable and unregister all plugins
   */
  clear() {
    // Disable all enabled plugins
    for (const pluginId of this.enabledPlugins) {
      this.disable(pluginId);
    }

    // Unregister all plugins
    for (const pluginId of this.plugins.keys()) {
      this.unregister(pluginId);
    }
  }
}
