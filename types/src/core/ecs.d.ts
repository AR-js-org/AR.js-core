/**
 * Minimal Entity-Component-System (ECS) implementation
 * Entities are simple numeric IDs
 * Components are data containers stored in Maps keyed by entity ID
 * Queries allow systems to iterate over entities with specific components
 */
export class ECS {
    nextEntityId: number;
    entities: Set<any>;
    components: Map<any, any>;
    resources: Map<any, any>;
    /**
     * Create a new entity
     * @returns {number} The entity ID
     */
    createEntity(): number;
    /**
     * Destroy an entity and all its components
     * @param {number} entityId
     */
    destroyEntity(entityId: number): void;
    /**
     * Add or update a component for an entity
     * @param {number} entityId
     * @param {string} componentKey
     * @param {*} data
     */
    setComponent(entityId: number, componentKey: string, data: any): void;
    /**
     * Get a component for an entity
     * @param {number} entityId
     * @param {string} componentKey
     * @returns {*} The component data or undefined
     */
    getComponent(entityId: number, componentKey: string): any;
    /**
     * Check if an entity has a component
     * @param {number} entityId
     * @param {string} componentKey
     * @returns {boolean}
     */
    hasComponent(entityId: number, componentKey: string): boolean;
    /**
     * Remove a component from an entity
     * @param {number} entityId
     * @param {string} componentKey
     */
    removeComponent(entityId: number, componentKey: string): void;
    /**
     * Set a global resource (singleton data)
     * @param {string} resourceKey
     * @param {*} data
     */
    setResource(resourceKey: string, data: any): void;
    /**
     * Get a global resource
     * @param {string} resourceKey
     * @returns {*}
     */
    getResource(resourceKey: string): any;
    /**
     * Check if a resource exists
     * @param {string} resourceKey
     * @returns {boolean}
     */
    hasResource(resourceKey: string): boolean;
    /**
     * Remove a resource
     * @param {string} resourceKey
     */
    removeResource(resourceKey: string): void;
    /**
     * Query entities that have all specified components
     * @param {...string} componentKeys
     * @returns {Array<number>} Array of entity IDs
     */
    query(...componentKeys: string[]): Array<number>;
    /**
     * Get all components for a specific component key
     * @param {string} componentKey
     * @returns {Map<number, *>} Map of entity IDs to component data
     */
    getAllComponents(componentKey: string): Map<number, any>;
    /**
     * Clear all entities and components
     */
    clear(): void;
}
//# sourceMappingURL=ecs.d.ts.map