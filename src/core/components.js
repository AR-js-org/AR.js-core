/**
 * Shared component and resource keys
 * These are used to identify different types of data in the ECS
 */

// Component Keys (entity-specific data)
export const COMPONENTS = {
  // Marker or tracking target component
  TRACKING_TARGET: 'TrackingTarget',

  // Transform component (position, rotation, scale)
  TRANSFORM: 'Transform',

  // Visibility state
  VISIBLE: 'Visible',
};

// Resource Keys (global singleton data)
export const RESOURCES = {
  // Configuration for AR processing
  PROCESSING_CONFIG: 'ProcessingConfig',

  // Current state of capture (ready, error, etc.)
  CAPTURE_STATE: 'CaptureState',

  // Reference to the frame source (video element, image, etc.)
  FRAME_SOURCE_REF: 'FrameSourceRef',

  // Device profile (desktop-normal, phone-normal, etc.)
  DEVICE_PROFILE: 'DeviceProfile',

  // Enabled plugins
  ENABLED_PLUGINS: 'EnabledPlugins',
};

// Event Types
export const EVENTS = {
  // Capture lifecycle events
  CAPTURE_INIT_START: 'capture:init:start',
  CAPTURE_INIT_SUCCESS: 'capture:init:success',
  CAPTURE_INIT_ERROR: 'capture:init:error',
  CAPTURE_READY: 'capture:ready',
  CAPTURE_DISPOSED: 'capture:disposed',

  // Source lifecycle events
  SOURCE_LOADED: 'source:loaded',
  SOURCE_ERROR: 'source:error',
  SOURCE_PLAYING: 'source:playing',
  SOURCE_PAUSED: 'source:paused',

  // Frame processing events
  FRAME_PROCESSED: 'frame:processed',

  // Engine lifecycle events
  ENGINE_START: 'engine:start',
  ENGINE_STOP: 'engine:stop',
  ENGINE_UPDATE: 'engine:update',

  // Plugin lifecycle events
  PLUGIN_REGISTERED: 'plugin:registered',
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
};

// Capture States
export const CAPTURE_STATES = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  DISPOSED: 'disposed',
};

// Source Types
export const SOURCE_TYPES = {
  WEBCAM: 'webcam',
  VIDEO: 'video',
  IMAGE: 'image',
};

// Device Profiles (legacy presets; retained for backward compatibility)
export const DEVICE_PROFILES = {
  DESKTOP_FAST: 'desktop-fast',
  DESKTOP_NORMAL: 'desktop-normal',
  PHONE_NORMAL: 'phone-normal',
  PHONE_SLOW: 'phone-slow',
};

// New capability/quality-based tiers (preferred going forward)
export const QUALITY_TIERS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ULTRA: 'ultra',
};
