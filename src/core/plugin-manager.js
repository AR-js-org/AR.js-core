/**
 * Plugin Manager
 * Handles registration, enabling, and disabling of plugins
 * Plugins can hook into the engine lifecycle and provide functionality
 */

export class PluginManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.plugins = new Map(); // Map<pluginId, pluginInstance>
    this.enabledPlugins = new Set(); // Set of enabled plugin IDs
  }

  /**
   * Register a plugin
   * @param {string} pluginId - Unique identifier for the plugin
   * @param {Object} plugin - Plugin instance
   * @param {Function} [plugin.init] - Initialize plugin (called on enable)
   * @param {Function} [plugin.dispose] - Cleanup plugin (called on disable)
   * @param {Function} [plugin.update] - Called each frame if implemented
   * @returns {boolean} Success
   */
  register(pluginId, plugin) {
    if (this.plugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already registered`);
      return false;
    }

    // Validate plugin structure
    if (typeof plugin !== "object") {
      console.error(`Plugin ${pluginId} must be an object`);
      return false;
    }

    this.plugins.set(pluginId, plugin);

    if (this.eventBus) {
      this.eventBus.emit("plugin:registered", { pluginId, plugin });
    }

    return true;
  }

  /**
   * Unregister a plugin
   * @param {string} pluginId
   * @returns {boolean} Success
   */
  unregister(pluginId) {
    if (!this.plugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is not registered`);
      return false;
    }

    // Disable if currently enabled
    if (this.enabledPlugins.has(pluginId)) {
      this.disable(pluginId);
    }

    this.plugins.delete(pluginId);
    return true;
  }

  /**
   * Enable a plugin
   * @param {string} pluginId
   * @param {Object} context - Engine context (ecs, eventBus, etc.)
   * @returns {Promise<boolean>} Success
   */
  async enable(pluginId, context) {
    if (!this.plugins.has(pluginId)) {
      console.error(`Plugin ${pluginId} is not registered`);
      return false;
    }

    if (this.enabledPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already enabled`);
      return false;
    }

    const plugin = this.plugins.get(pluginId);

    try {
      // Call plugin's init method if it exists
      if (typeof plugin.init === "function") {
        await plugin.init(context);
      }

      this.enabledPlugins.add(pluginId);

      if (this.eventBus) {
        this.eventBus.emit("plugin:enabled", { pluginId, plugin });
      }

      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginId
   * @returns {Promise<boolean>} Success
   */
  async disable(pluginId) {
    if (!this.enabledPlugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is not enabled`);
      return false;
    }

    const plugin = this.plugins.get(pluginId);

    try {
      // Call plugin's dispose method if it exists
      if (typeof plugin.dispose === "function") {
        await plugin.dispose();
      }

      this.enabledPlugins.delete(pluginId);

      if (this.eventBus) {
        this.eventBus.emit("plugin:disabled", { pluginId, plugin });
      }

      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Get a plugin instance
   * @param {string} pluginId
   * @returns {Object|undefined}
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if a plugin is registered
   * @param {string} pluginId
   * @returns {boolean}
   */
  isRegistered(pluginId) {
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
   * @returns {Array<string>}
   */
  getRegisteredPlugins() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all enabled plugin IDs
   * @returns {Array<string>}
   */
  getEnabledPlugins() {
    return Array.from(this.enabledPlugins);
  }

  /**
   * Update all enabled plugins that have an update method
   * @param {number} deltaTime - Time since last frame in milliseconds
   * @param {Object} context - Engine context
   */
  update(deltaTime, context) {
    for (const pluginId of this.enabledPlugins) {
      const plugin = this.plugins.get(pluginId);
      if (plugin && typeof plugin.update === "function") {
        try {
          plugin.update(deltaTime, context);
        } catch (error) {
          console.error(`Error updating plugin ${pluginId}:`, error);
        }
      }
    }
  }

  /**
   * Disable all plugins and clear registry
   */
  async clear() {
    // Disable all enabled plugins
    const enabledPluginIds = Array.from(this.enabledPlugins);
    for (const pluginId of enabledPluginIds) {
      await this.disable(pluginId);
    }

    this.plugins.clear();
    this.enabledPlugins.clear();
  }
}
