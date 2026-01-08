/**
 * Minimal Entity-Component-System (ECS) implementation
 * Entities are simple numeric IDs
 * Components are data containers stored in Maps keyed by entity ID
 * Queries allow systems to iterate over entities with specific components
 */

export class ECS {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map(); // Map<componentKey, Map<entityId, componentData>>
    this.resources = new Map(); // Global singleton data
  }

  /**
   * Create a new entity
   * @returns {number} The entity ID
   */
  createEntity() {
    const id = this.nextEntityId++;
    this.entities.add(id);
    return id;
  }

  /**
   * Destroy an entity and all its components
   * @param {number} entityId
   */
  destroyEntity(entityId) {
    if (!this.entities.has(entityId)) return;

    this.entities.delete(entityId);

    // Remove all components for this entity
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }
  }

  /**
   * Add or update a component for an entity
   * @param {number} entityId
   * @param {string} componentKey
   * @param {*} data
   */
  setComponent(entityId, componentKey, data) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    if (!this.components.has(componentKey)) {
      this.components.set(componentKey, new Map());
    }

    this.components.get(componentKey).set(entityId, data);
  }

  /**
   * Get a component for an entity
   * @param {number} entityId
   * @param {string} componentKey
   * @returns {*} The component data or undefined
   */
  getComponent(entityId, componentKey) {
    const componentMap = this.components.get(componentKey);
    return componentMap ? componentMap.get(entityId) : undefined;
  }

  /**
   * Check if an entity has a component
   * @param {number} entityId
   * @param {string} componentKey
   * @returns {boolean}
   */
  hasComponent(entityId, componentKey) {
    const componentMap = this.components.get(componentKey);
    return componentMap ? componentMap.has(entityId) : false;
  }

  /**
   * Remove a component from an entity
   * @param {number} entityId
   * @param {string} componentKey
   */
  removeComponent(entityId, componentKey) {
    const componentMap = this.components.get(componentKey);
    if (componentMap) {
      componentMap.delete(entityId);
    }
  }

  /**
   * Set a global resource (singleton data)
   * @param {string} resourceKey
   * @param {*} data
   */
  setResource(resourceKey, data) {
    this.resources.set(resourceKey, data);
  }

  /**
   * Get a global resource
   * @param {string} resourceKey
   * @returns {*}
   */
  getResource(resourceKey) {
    return this.resources.get(resourceKey);
  }

  /**
   * Check if a resource exists
   * @param {string} resourceKey
   * @returns {boolean}
   */
  hasResource(resourceKey) {
    return this.resources.has(resourceKey);
  }

  /**
   * Remove a resource
   * @param {string} resourceKey
   */
  removeResource(resourceKey) {
    this.resources.delete(resourceKey);
  }

  /**
   * Query entities that have all specified components
   * @param {...string} componentKeys
   * @returns {Array<number>} Array of entity IDs
   */
  query(...componentKeys) {
    if (componentKeys.length === 0) {
      return Array.from(this.entities);
    }

    const result = [];

    for (const entityId of this.entities) {
      let hasAll = true;
      for (const key of componentKeys) {
        if (!this.hasComponent(entityId, key)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        result.push(entityId);
      }
    }

    return result;
  }

  /**
   * Get all components for a specific component key
   * @param {string} componentKey
   * @returns {Map<number, *>} Map of entity IDs to component data
   */
  getAllComponents(componentKey) {
    return this.components.get(componentKey) || new Map();
  }

  /**
   * Clear all entities and components
   */
  clear() {
    this.entities.clear();
    this.components.clear();
    this.resources.clear();
    this.nextEntityId = 1;
  }
}
