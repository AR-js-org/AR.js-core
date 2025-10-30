/**
 * Lightweight publish/subscribe event bus
 * Allows decoupled communication between systems and plugins
 */

export class EventBus {
  constructor() {
    this.listeners = new Map(); // eventType -> Set of callbacks
  }

  /**
   * Subscribe to an event
   * @param {string} eventType
   * @param {Function} callback - function(eventData)
   * @returns {Function} unsubscribe function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Subscribe to an event for one-time execution
   * @param {string} eventType
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  once(eventType, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(eventType, wrapper);
    };
    return this.on(eventType, wrapper);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventType
   * @param {Function} callback
   */
  off(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventType
   * @param {*} data - event data
   */
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      // Create a copy to avoid issues if callbacks modify listeners
      const callbacksCopy = Array.from(callbacks);
      for (const callback of callbacksCopy) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${eventType}':`, error);
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event type or all events
   * @param {string} [eventType] - if omitted, clears all listeners
   */
  clear(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event type
   * @param {string} eventType
   * @returns {number}
   */
  listenerCount(eventType) {
    const callbacks = this.listeners.get(eventType);
    return callbacks ? callbacks.size : 0;
  }
}
