/**
 * Engine - Main orchestrator for the ECS architecture
 * Wires together ECS, events, plugin manager, and systems
 * Provides game loop functionality
 */

import { ECS } from "./ecs.js";
import { EventBus } from "./event-bus.js";
import { PluginManager } from "./plugin-manager.js";

export class Engine {
  constructor() {
    this.ecs = new ECS();
    this.events = new EventBus();
    this.plugins = new PluginManager(this);
    this.systems = [];
    this.running = false;
    this.lastTime = 0;
    this.animationFrameId = null;
  }

  /**
   * Register a system
   * Systems are functions that process entities each frame
   * @param {Function} system - function(engine, deltaTime)
   */
  addSystem(system) {
    if (typeof system !== "function") {
      console.error("System must be a function");
      return;
    }
    this.systems.push(system);
  }

  /**
   * Remove a system
   * @param {Function} system
   */
  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Start the engine loop
   */
  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.events.emit("engine:start");
    this.#loop();
  }

  /**
   * Stop the engine loop
   */
  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.events.emit("engine:stop");
  }

  /**
   * Execute one frame update (useful for manual stepping)
   * @param {number} deltaTime - time since last update in seconds
   */
  update(deltaTime) {
    this.events.emit("engine:beforeUpdate", { deltaTime });

    // Execute all systems
    for (const system of this.systems) {
      try {
        system(this, deltaTime);
      } catch (error) {
        console.error("Error in system:", error);
      }
    }

    this.events.emit("engine:afterUpdate", { deltaTime });
  }

  /**
   * Main loop function
   * @private
   */
  #loop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    this.update(deltaTime);

    this.animationFrameId = requestAnimationFrame(() => this.#loop());
  }

  /**
   * Reset the engine to initial state
   */
  reset() {
    this.stop();
    this.systems = [];
    this.plugins.clear();
    this.ecs.clear();
    this.events.clear();
  }

  /**
   * Destroy the engine and clean up resources
   */
  destroy() {
    this.reset();
  }
}
