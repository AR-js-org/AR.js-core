import { describe, it, expect } from 'vitest';
import { Engine } from '../src/core/engine.js';
import pkg from '../package.json';

describe('Engine version', () => {
  it('exposes VERSION and REVISION matching package version', () => {
    expect(typeof Engine.VERSION).toBe('string');
    expect(Engine.VERSION).toBe(pkg.version);
    expect(Engine.REVISION).toBe(Engine.VERSION);
  });
});
