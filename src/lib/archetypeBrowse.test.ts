import { describe, expect, it } from 'vitest';
import { togglesWriteToProfile } from './archetypeBrowse';

describe('togglesWriteToProfile', () => {
  it('writes to the profile only while it is still the sample', () => {
    expect(togglesWriteToProfile('sample')).toBe(true);
  });

  it("keeps the reader's own letters out of reach of browsing", () => {
    expect(togglesWriteToProfile('typed')).toBe(false);
    expect(togglesWriteToProfile('quiz')).toBe(false);
    expect(togglesWriteToProfile('report')).toBe(false);
  });
});
