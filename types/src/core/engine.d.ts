export class Engine {
    static NAME: string;
    static VERSION: any;
    static REVISION: any;
    ecs: ECS;
    eventBus: EventBus;
    pluginManager: PluginManager;
    systems: any[];
    isRunning: boolean;
    lastFrameTime: number;
    animationFrameId: number;
    /**
     * Add a system to the engine
     * Systems are functions that run each frame: (deltaTime, context) => void
     * @param {Function} system - System function
     */
    addSystem(system: Function): void;
    /**
     * Remove a system from the engine
     * @param {Function} system
     */
    removeSystem(system: Function): void;
    /**
     * Start the engine and game loop
     */
    start(): void;
    /**
     * Stop the engine and game loop
     */
    stop(): void;
    /**
     * Run a single update manually (useful for testing or non-realtime scenarios)
     * @param {number} [deltaTime=16.67] - Time delta in milliseconds
     */
    update(deltaTime?: number): void;
    /**
     * Get the current context
     * @returns {Object}
     */
    getContext(): any;
    /**
     * Dispose the engine and clean up resources
     */
    dispose(): Promise<void>;
    #private;
}
import { ECS } from './ecs.js';
import { EventBus } from './event-bus.js';
import { PluginManager } from './plugin-manager.js';
//# sourceMappingURL=engine.d.ts.map