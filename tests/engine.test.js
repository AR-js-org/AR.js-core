import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../src/core/engine.js';
import { EVENTS } from '../src/core/components.js';

describe('Engine', () => {
    let engine;

    beforeEach(() => {
        engine = new Engine();
    });

    afterEach(async () => {
        await engine.dispose();
    });

    it('emits ENGINE_START and runs systems on RAF', async () => {
        vi.useFakeTimers();
        const started = vi.fn();
        engine.eventBus.on(EVENTS.ENGINE_START, started);

        let ticks = 0;
        engine.addSystem(() => {
            ticks += 1;
        });

        engine.start();
        expect(started).toHaveBeenCalledTimes(1);

        // Advance timers to trigger a few RAF cycles
        vi.advanceTimersByTime(50);
        expect(ticks).toBeGreaterThan(0);

        engine.stop();
        vi.useRealTimers();
    });

    it('emits ENGINE_STOP when stopped and halts updates', async () => {
        vi.useFakeTimers();
        const stopped = vi.fn();
        engine.eventBus.on(EVENTS.ENGINE_STOP, stopped);

        let ticks = 0;
        engine.addSystem(() => {
            ticks += 1;
        });

        engine.start();
        vi.advanceTimersByTime(20);
        const beforeStop = ticks;

        engine.stop();
        expect(stopped).toHaveBeenCalledTimes(1);

        // Try to advance more; ticks should not increase
        vi.advanceTimersByTime(40);
        expect(ticks).toBe(beforeStop);

        vi.useRealTimers();
    });

    it('emits ENGINE_UPDATE each frame', async () => {
        vi.useFakeTimers();
        const updates = vi.fn();
        engine.eventBus.on(EVENTS.ENGINE_UPDATE, updates);

        engine.start();
        vi.advanceTimersByTime(34); // a couple of frames via RAF polyfill

        expect(updates).toHaveBeenCalled();
        engine.stop();
        vi.useRealTimers();
    });
});