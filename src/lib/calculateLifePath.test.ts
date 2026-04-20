import { describe, expect, it } from 'vitest';
import { calculateLifePath } from './calculateLifePath';

describe('calculateLifePath', () => {
  it('reduces a typical birth date to a single digit', () => {
    // 1986-08-09: year 1986 -> 24 -> 6, month 08 -> 8, day 09 -> 9
    // 6 + 8 + 9 = 23 -> 2 + 3 = 5
    const result = calculateLifePath('1986-08-09');
    expect(result.number).toBe(5);
    expect(result.compound).toBe(23);
    expect(result.breakdown).toEqual({
      y: 6,
      m: 8,
      d: 9,
      rawY: '1986',
      rawM: '08',
      rawD: '09',
      ySum: 24,
      mSum: 8,
      dSum: 9,
    });
  });

  it('preserves master number 11', () => {
    // 1983-07-01: year 1983 -> 21 -> 3, month 7, day 1 -> sum 11
    const result = calculateLifePath('1983-07-01');
    expect(result.number).toBe(11);
    expect(result.compound).toBe(11);
  });

  it('preserves master number 22', () => {
    // 1989-04-09: year 1989 -> 27 -> 9, month 4, day 9 -> sum 22
    const result = calculateLifePath('1989-04-09');
    expect(result.number).toBe(22);
    expect(result.compound).toBe(22);
  });

  it('preserves master number 33', () => {
    // 2009-11-11: year 2009 -> 11, month 11, day 11 -> sum 33
    const result = calculateLifePath('2009-11-11');
    expect(result.number).toBe(33);
    expect(result.compound).toBe(33);
  });

  it('preserves master numbers mid-reduction (day 29 -> 11)', () => {
    // Day "29" should reduce to 11 (master) and stay there, not reduce to 2.
    const result = calculateLifePath('1974-07-29');
    expect(result.breakdown.d).toBe(11);
    // 1974 -> 21 -> 3; month 7; day 11 -> sum 21 -> 3
    expect(result.number).toBe(3);
    expect(result.compound).toBe(21);
  });

  it('returns empty data for an empty string', () => {
    const result = calculateLifePath('');
    expect(result.number).toBe(0);
    expect(result.compound).toBe(0);
    expect(result.breakdown.rawY).toBe('');
  });

  it('returns empty data for a malformed date', () => {
    const result = calculateLifePath('not-a-date');
    expect(result.number).toBe(0);
    expect(result.compound).toBe(0);
  });

  it('returns empty data for a wrongly separated date', () => {
    const result = calculateLifePath('1986/08/09');
    expect(result.number).toBe(0);
    expect(result.compound).toBe(0);
  });
});
