import Source from './arjs-source';
import Profile from './arjs-profile';
import Session from './new-api/arjs-session';
import { SessionDebugUI } from './new-api/arjs-debugui';

// New ECS Core exports
export { Engine } from './core/engine.js';
export { ECS } from './core/ecs.js';
export { EventBus } from './core/event-bus.js';
export { PluginManager } from './core/plugin-manager.js';
export {
  COMPONENTS,
  RESOURCES,
  EVENTS,
  CAPTURE_STATES,
  SOURCE_TYPES,
  DEVICE_PROFILES,
  QUALITY_TIERS,
} from './core/components.js';

// Systems
export { CaptureSystem } from './systems/capture-system.js';

// Legacy API (backward compatibility)
export { Source, Profile, Session, SessionDebugUI };
