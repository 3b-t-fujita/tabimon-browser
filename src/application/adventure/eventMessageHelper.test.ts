import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollRandomEventForNode } from './eventMessageHelper';

describe('rollRandomEventForNode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('node 5 では BATTLE にならない', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(rollRandomEventForNode(5)).toBe('BOOST');
  });

  it('node 5 以外では BATTLE になることがある', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(rollRandomEventForNode(3)).toBe('BATTLE');
  });
});
