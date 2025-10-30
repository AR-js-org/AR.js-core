import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/core/event-bus.js";

describe("EventBus", () => {
  it("subscribes and emits events", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.on("ping", cb);
    bus.emit("ping", { foo: 1 });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ foo: 1 });
  });

  it("unsubscribes with off()", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.on("x", cb);
    bus.off("x", cb);
    bus.emit("x", 42);
    expect(cb).not.toHaveBeenCalled();
  });

  it("supports once()", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.once("only", cb);
    bus.emit("only", 1);
    bus.emit("only", 2);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(1);
  });

  it("clears listeners by event or all", () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("a", a);
    bus.on("b", b);
    expect(bus.listenerCount("a")).toBe(1);
    expect(bus.listenerCount("b")).toBe(1);

    bus.clear("a");
    expect(bus.listenerCount("a")).toBe(0);
    expect(bus.listenerCount("b")).toBe(1);

    bus.clear();
    expect(bus.listenerCount("b")).toBe(0);
  });
});
