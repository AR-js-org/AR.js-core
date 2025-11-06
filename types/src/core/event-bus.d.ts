/**
 * Lightweight publish-subscribe event bus
 * Allows components to communicate without tight coupling
 */
export class EventBus {
    listeners: Map<any, any>;
    /**
     * Subscribe to an event
     * @param {string} eventType
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    on(eventType: string, callback: Function): Function;
    /**
     * Subscribe to an event once (auto-unsubscribe after first trigger)
     * @param {string} eventType
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    once(eventType: string, callback: Function): Function;
    /**
     * Unsubscribe from an event
     * @param {string} eventType
     * @param {Function} callback
     */
    off(eventType: string, callback: Function): void;
    /**
     * Emit an event to all subscribers
     * @param {string} eventType
     * @param {*} data
     */
    emit(eventType: string, data: any): void;
    /**
     * Remove all listeners for a specific event type, or all listeners if no type specified
     * @param {string} [eventType]
     */
    clear(eventType?: string): void;
    /**
     * Get the number of listeners for an event type
     * @param {string} eventType
     * @returns {number}
     */
    listenerCount(eventType: string): number;
}
//# sourceMappingURL=event-bus.d.ts.map