import { describe, it, expect } from 'vitest';
import { ECS } from '../src/core/ecs.js';

describe('ECS', () => {
    it('creates entities with incremental IDs', () => {
        const ecs = new ECS();
        const e1 = ecs.createEntity();
        const e2 = ecs.createEntity();
        expect(e1).toBe(1);
        expect(e2).toBe(2);
    });

    it('adds, gets, and removes components', () => {
        const ecs = new ECS();
        const e = ecs.createEntity();

        ecs.setComponent(e, 'Transform', { x: 1, y: 2 });
        expect(ecs.getComponent(e, 'Transform')).toEqual({ x: 1, y: 2 });
        expect(ecs.hasComponent(e, 'Transform')).toBe(true);

        ecs.removeComponent(e, 'Transform');
        expect(ecs.getComponent(e, 'Transform')).toBeUndefined();
        expect(ecs.hasComponent(e, 'Transform')).toBe(false);
    });

    it('queries entities that have all specified components', () => {
        const ecs = new ECS();
        const a = ecs.createEntity();
        const b = ecs.createEntity();
        ecs.setComponent(a, 'A', { v: 1 });
        ecs.setComponent(a, 'B', { w: 2 });
        ecs.setComponent(b, 'A', { v: 3 });

        const qA = ecs.query('A');
        const qAB = ecs.query('A', 'B');

        expect(qA.sort()).toEqual([a, b].sort());
        expect(qAB).toEqual([a]);
    });

    it('manages resources (set/get/has/remove)', () => {
        const ecs = new ECS();
        ecs.setResource('CONFIG', { mode: 'fast' });
        expect(ecs.hasResource('CONFIG')).toBe(true);
        expect(ecs.getResource('CONFIG')).toEqual({ mode: 'fast' });

        ecs.removeResource('CONFIG');
        expect(ecs.hasResource('CONFIG')).toBe(false);
    });

    it('destroys entities and clears their components', () => {
        const ecs = new ECS();
        const e = ecs.createEntity();
        ecs.setComponent(e, 'C1', { a: 1 });
        ecs.setComponent(e, 'C2', { b: 2 });

        ecs.destroyEntity(e);
        expect(ecs.query('C1')).toEqual([]);
        expect(ecs.query('C2')).toEqual([]);
    });

    it('clear resets state and nextEntityId', () => {
        const ecs = new ECS();
        const e = ecs.createEntity();
        ecs.setComponent(e, 'X', { v: 1 });
        ecs.setResource('R', 123);

        ecs.clear();
        expect(ecs.query('X')).toEqual([]);
        expect(ecs.hasResource('R')).toBe(false);

        const e2 = ecs.createEntity();
        expect(e2).toBe(1);
    });
});