/**
 * Minimal Entity-Component-System (ECS) implementation
 * Entities are simple numeric IDs
 * Components are data structures stored in Maps keyed by entity ID
 * Systems operate on entities that match component queries
 */

export class ECS {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map(); // componentName -> Map(entityId -> componentData)
    this.resources = new Map(); // global singleton data
    this.queries = new Map(); // queryId -> { components: [], entities: Set() }
  }

  /**
   * Create a new entity
   * @returns {number} entity ID
   */
  createEntity() {
    const id = this.nextEntityId++;
    this.entities.add(id);
    return id;
  }

  /**
   * Destroy an entity and remove all its components
   * @param {number} entityId
   */
  destroyEntity(entityId) {
    if (!this.entities.has(entityId)) return;

    // Remove entity from all queries
    for (const query of this.queries.values()) {
      query.entities.delete(entityId);
    }

    // Remove all components for this entity
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }

    this.entities.delete(entityId);
  }

  /**
   * Add a component to an entity
   * @param {number} entityId
   * @param {string} componentName
   * @param {*} data - component data
   */
  addComponent(entityId, componentName, data) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }

    this.components.get(componentName).set(entityId, data);

    // Update queries
    this.#updateQueriesForEntity(entityId);
  }

  /**
   * Remove a component from an entity
   * @param {number} entityId
   * @param {string} componentName
   */
  removeComponent(entityId, componentName) {
    const componentMap = this.components.get(componentName);
    if (componentMap) {
      componentMap.delete(entityId);
      this.#updateQueriesForEntity(entityId);
    }
  }

  /**
   * Get a component from an entity
   * @param {number} entityId
   * @param {string} componentName
   * @returns {*} component data or undefined
   */
  getComponent(entityId, componentName) {
    const componentMap = this.components.get(componentName);
    return componentMap ? componentMap.get(entityId) : undefined;
  }

  /**
   * Check if entity has a component
   * @param {number} entityId
   * @param {string} componentName
   * @returns {boolean}
   */
  hasComponent(entityId, componentName) {
    const componentMap = this.components.get(componentName);
    return componentMap ? componentMap.has(entityId) : false;
  }

  /**
   * Set a global resource (singleton data)
   * @param {string} resourceName
   * @param {*} data
   */
  setResource(resourceName, data) {
    this.resources.set(resourceName, data);
  }

  /**
   * Get a global resource
   * @param {string} resourceName
   * @returns {*} resource data or undefined
   */
  getResource(resourceName) {
    return this.resources.get(resourceName);
  }

  /**
   * Create a query for entities with specific components
   * @param {string} queryId - unique identifier for this query
   * @param {string[]} componentNames - components required for match
   * @returns {Set} set of matching entity IDs
   */
  createQuery(queryId, componentNames) {
    if (this.queries.has(queryId)) {
      return this.queries.get(queryId).entities;
    }

    const query = {
      components: componentNames,
      entities: new Set(),
    };

    // Find all entities that match
    for (const entityId of this.entities) {
      if (this.#entityMatchesQuery(entityId, componentNames)) {
        query.entities.add(entityId);
      }
    }

    this.queries.set(queryId, query);
    return query.entities;
  }

  /**
   * Get entities matching a query
   * @param {string} queryId
   * @returns {Set} set of matching entity IDs
   */
  getQuery(queryId) {
    const query = this.queries.get(queryId);
    return query ? query.entities : new Set();
  }

  /**
   * Check if entity matches component requirements
   * @private
   */
  #entityMatchesQuery(entityId, componentNames) {
    return componentNames.every((name) => this.hasComponent(entityId, name));
  }

  /**
   * Update all queries after entity component changes
   * @private
   */
  #updateQueriesForEntity(entityId) {
    for (const [queryId, query] of this.queries) {
      const matches = this.#entityMatchesQuery(entityId, query.components);
      if (matches) {
        query.entities.add(entityId);
      } else {
        query.entities.delete(entityId);
      }
    }
  }

  /**
   * Clear all entities, components and queries
   */
  clear() {
    this.entities.clear();
    this.components.clear();
    this.resources.clear();
    this.queries.clear();
    this.nextEntityId = 1;
  }
}
