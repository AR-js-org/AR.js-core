import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager } from '../src/core/plugin-manager.js';
import { EventBus } from '../src/core/event-bus.js';

describe('PluginManager', () => {
    let bus;
    let pm;

    beforeEach(() => {
        bus = new EventBus();
        pm = new PluginManager(bus);
    });

    it('registers plugins and emits plugin:registered', () => {
        const plugin = {};
        const onRegistered = vi.fn();
        bus.on('plugin:registered', onRegistered);

        const ok = pm.register('test:one', plugin);
        expect(ok).toBe(true);
        expect(pm.isRegistered('test:one')).toBe(true);
        expect(pm.getRegisteredPlugins()).toContain('test:one');
        expect(onRegistered).toHaveBeenCalledTimes(1);
        expect(onRegistered.mock.calls[0][0]).toMatchObject({ pluginId: 'test:one' });
    });

    it('prevents duplicate registrations', () => {
        const plugin = {};
        expect(pm.register('dup:plugin', plugin)).toBe(true);
        expect(pm.register('dup:plugin', plugin)).toBe(false);
    });

    it('enables, updates, and disables a plugin (calls lifecycle methods and emits events)', async () => {
        const init = vi.fn();
        const update = vi.fn();
        const dispose = vi.fn();
        const plugin = { init, update, dispose };

        const onEnabled = vi.fn();
        const onDisabled = vi.fn();
        bus.on('plugin:enabled', onEnabled);
        bus.on('plugin:disabled', onDisabled);

        pm.register('x:y', plugin);
        const context = { eventBus: bus, ecs: {}, engine: {}, pluginManager: pm };

        const enabled = await pm.enable('x:y', context);
        expect(enabled).toBe(true);
        expect(pm.isEnabled('x:y')).toBe(true);
        expect(init).toHaveBeenCalledTimes(1);
        expect(onEnabled).toHaveBeenCalledTimes(1);

        pm.update(16.67, context);
        expect(update).toHaveBeenCalledTimes(1);

        const disabled = await pm.disable('x:y');
        expect(disabled).toBe(true);
        expect(pm.isEnabled('x:y')).toBe(false);
        expect(dispose).toHaveBeenCalledTimes(1);
        expect(onDisabled).toHaveBeenCalledTimes(1);
    });

    it('clear() disables all enabled plugins and clears registry', async () => {
        const disposeA = vi.fn();
        const disposeB = vi.fn();
        pm.register('a:a', { init: vi.fn(), dispose: disposeA });
        pm.register('b:b', { init: vi.fn(), dispose: disposeB });

        const context = { eventBus: bus, ecs: {}, engine: {}, pluginManager: pm };
        await pm.enable('a:a', context);
        await pm.enable('b:b', context);

        expect(pm.getEnabledPlugins().length).toBe(2);
        await pm.clear();
        expect(pm.getEnabledPlugins().length).toBe(0);
        expect(pm.getRegisteredPlugins().length).toBe(0);
        expect(disposeA).toHaveBeenCalledTimes(1);
        expect(disposeB).toHaveBeenCalledTimes(1);
    });
});