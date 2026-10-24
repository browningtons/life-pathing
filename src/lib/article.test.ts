import { describe, expect, it } from 'vitest';
import { withArticle } from './article';

describe('withArticle', () => {
  it.each([8, 11])('uses "an" before %i', (n) => expect(withArticle(n)).toBe(`an ${n}`));
  it.each([1, 2, 3, 4, 5, 6, 7, 9, 22, 33])('uses "a" before %i', (n) => expect(withArticle(n)).toBe(`a ${n}`));
});
