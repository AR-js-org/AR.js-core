/**
 * AR.js Core Engine
 * Orchestrates ECS, event bus, plugin manager, and game loop
 */

import { ECS } from './ecs.js';
import { EventBus } from './event-bus.js';
import { PluginManager } from './plugin-manager.js';
import { EVENTS } from './components.js';

export class Engine {
  constructor() {
    this.ecs = new ECS();
    this.eventBus = new EventBus();
    this.pluginManager = new PluginManager(this.eventBus);
    this.systems = [];
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
  }

  /**
   * Add a system to the engine
   * Systems are functions that run each frame: (deltaTime, context) => void
   * @param {Function} system - System function
   */
  addSystem(system) {
    if (typeof system !== 'function') {
      console.error('System must be a function');
      return;
    }
    this.systems.push(system);
  }

  /**
   * Remove a system from the engine
   * @param {Function} system
   */
  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Start the engine and game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Engine is already running');
      return;
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();

    this.eventBus.emit(EVENTS.ENGINE_START, { engine: this });

    // Start the game loop
    this.animationFrameId = requestAnimationFrame(this.#gameLoop.bind(this));
  }

  /**
   * Stop the engine and game loop
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.eventBus.emit(EVENTS.ENGINE_STOP, { engine: this });
  }

  /**
   * Game loop - runs each frame
   * @private
   */
  #gameLoop(currentTime) {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Create context for systems and plugins
    const context = {
      ecs: this.ecs,
      eventBus: this.eventBus,
      pluginManager: this.pluginManager,
      engine: this,
    };

    // Update all systems
    for (const system of this.systems) {
      try {
        system(deltaTime, context);
      } catch (error) {
        console.error('Error in system:', error);
      }
    }

    // Update all enabled plugins
    this.pluginManager.update(deltaTime, context);

    // Emit update event
    this.eventBus.emit(EVENTS.ENGINE_UPDATE, { deltaTime, context });

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.#gameLoop.bind(this));
  }

  /**
   * Run a single update manually (useful for testing or non-realtime scenarios)
   * @param {number} [deltaTime=16.67] - Time delta in milliseconds
   */
  update(deltaTime = 16.67) {
    const context = {
      ecs: this.ecs,
      eventBus: this.eventBus,
      pluginManager: this.pluginManager,
      engine: this,
    };

    for (const system of this.systems) {
      try {
        system(deltaTime, context);
      } catch (error) {
        console.error('Error in system:', error);
      }
    }

    this.pluginManager.update(deltaTime, context);
    this.eventBus.emit(EVENTS.ENGINE_UPDATE, { deltaTime, context });
  }

  /**
   * Get the current context
   * @returns {Object}
   */
  getContext() {
    return {
      ecs: this.ecs,
      eventBus: this.eventBus,
      pluginManager: this.pluginManager,
      engine: this,
    };
  }

  /**
   * Dispose the engine and clean up resources
   */
  async dispose() {
    this.stop();

    // Disable all plugins
    await this.pluginManager.clear();

    // Clear all systems
    this.systems = [];

    // Clear ECS
    this.ecs.clear();

    // Clear event listeners
    this.eventBus.clear();
  }
}
