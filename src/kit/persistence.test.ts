import { beforeEach, describe, expect, it } from 'vitest';
import { clearByPrefix } from './persistence';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

describe('clearByPrefix', () => {
  let a: MemStorage;
  let b: MemStorage;
  beforeEach(() => {
    a = new MemStorage();
    b = new MemStorage();
  });

  it('removes every prefixed key in every storage and leaves the rest', () => {
    for (const k of ['lp_profile', 'lp_pro', 'lp_reading:3|7-16-INFJ', 'other_key', 'xlp_pro', 'LP_pro']) {
      a.setItem(k, '1');
    }
    b.setItem('lp_just_purchased', '1');
    b.setItem('keep', '1');
    clearByPrefix('lp_', [a, b]);
    expect(a.length).toBe(3);
    expect(a.getItem('other_key')).toBe('1');
    expect(a.getItem('xlp_pro')).toBe('1');
    expect(a.getItem('LP_pro')).toBe('1');
    expect(b.length).toBe(1);
    expect(b.getItem('keep')).toBe('1');
  });

  it('does nothing with an empty prefix and survives a throwing storage', () => {
    a.setItem('x', '1');
    clearByPrefix('', [a]);
    expect(a.length).toBe(1);
    const bad = {
      get length(): number {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => clearByPrefix('lp_', [bad, a])).not.toThrow();
  });
});
