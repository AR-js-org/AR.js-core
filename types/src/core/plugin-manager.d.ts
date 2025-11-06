/**
 * Plugin Manager
 * Handles registration, enabling, and disabling of plugins
 * Plugins can hook into the engine lifecycle and provide functionality
 */
export class PluginManager {
    constructor(eventBus: any);
    eventBus: any;
    plugins: Map<any, any>;
    enabledPlugins: Set<any>;
    /**
     * Register a plugin
     * @param {string} pluginId - Unique identifier for the plugin
     * @param {Object} plugin - Plugin instance
     * @param {Function} [plugin.init] - Initialize plugin (called on enable)
     * @param {Function} [plugin.dispose] - Cleanup plugin (called on disable)
     * @param {Function} [plugin.update] - Called each frame if implemented
     * @returns {boolean} Success
     */
    register(pluginId: string, plugin: {
        init?: Function;
        dispose?: Function;
        update?: Function;
    }): boolean;
    /**
     * Unregister a plugin
     * @param {string} pluginId
     * @returns {boolean} Success
     */
    unregister(pluginId: string): boolean;
    /**
     * Enable a plugin
     * @param {string} pluginId
     * @param {Object} context - Engine context (ecs, eventBus, etc.)
     * @returns {Promise<boolean>} Success
     */
    enable(pluginId: string, context: any): Promise<boolean>;
    /**
     * Disable a plugin
     * @param {string} pluginId
     * @returns {Promise<boolean>} Success
     */
    disable(pluginId: string): Promise<boolean>;
    /**
     * Get a plugin instance
     * @param {string} pluginId
     * @returns {Object|undefined}
     */
    getPlugin(pluginId: string): any | undefined;
    /**
     * Check if a plugin is registered
     * @param {string} pluginId
     * @returns {boolean}
     */
    isRegistered(pluginId: string): boolean;
    /**
     * Check if a plugin is enabled
     * @param {string} pluginId
     * @returns {boolean}
     */
    isEnabled(pluginId: string): boolean;
    /**
     * Get all registered plugin IDs
     * @returns {Array<string>}
     */
    getRegisteredPlugins(): Array<string>;
    /**
     * Get all enabled plugin IDs
     * @returns {Array<string>}
     */
    getEnabledPlugins(): Array<string>;
    /**
     * Update all enabled plugins that have an update method
     * @param {number} deltaTime - Time since last frame in milliseconds
     * @param {Object} context - Engine context
     */
    update(deltaTime: number, context: any): void;
    /**
     * Disable all plugins and clear registry
     */
    clear(): Promise<void>;
}
//# sourceMappingURL=plugin-manager.d.ts.map