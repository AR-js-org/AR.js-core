import Source from "./arjs-source";
import Profile from "./arjs-profile";
// TODO: Session and SessionDebugUI require 'three' dependency - needs to be fixed separately
// import Session from "./new-api/arjs-session";
// import { SessionDebugUI } from "./new-api/arjs-debugui";

// ECS Core
import { Engine } from "./core/engine";
import { ECS } from "./core/ecs";
import { EventBus } from "./core/event-bus";
import { PluginManager } from "./core/plugin-manager";

// ECS Components and Resources
import {
  ComponentType,
  ResourceType,
  ProcessingConfig,
  CaptureState,
  FrameSourceRef,
  DeviceProfile,
} from "./core/components";

// ECS Systems
import { CaptureSystem, createCaptureSystem } from "./systems/capture-system";

export {
  // Legacy API
  Source,
  Profile,
  // Session,        // Temporarily disabled - requires 'three' dependency
  // SessionDebugUI, // Temporarily disabled - requires 'three' dependency
  // ECS Core
  Engine,
  ECS,
  EventBus,
  PluginManager,
  // ECS Components
  ComponentType,
  ResourceType,
  ProcessingConfig,
  CaptureState,
  FrameSourceRef,
  DeviceProfile,
  // ECS Systems
  CaptureSystem,
  createCaptureSystem,
};
