import { describe, expect, it } from 'vitest';
import { birthDateNote, calculateLifePath, reductionSteps } from './calculateLifePath';

describe('reductionSteps', () => {
  it('shows every step of 1984-11-29 and keeps the master numbers', () => {
    const r = calculateLifePath('1984-11-29');
    expect([r.breakdown.y, r.breakdown.m, r.breakdown.d]).toEqual([22, 11, 11]);
    expect(r.compound).toBe(44);
    expect(r.number).toBe(8);
    expect(reductionSteps('1984')).toEqual({ steps: ['1+9+8+4 = 22'], keptMaster: false });
    expect(reductionSteps('11')).toEqual({ steps: ['1+1 = 2'], keptMaster: true });
    expect(reductionSteps('29')).toEqual({ steps: ['2+9 = 11'], keptMaster: false });
    expect(reductionSteps(44)).toEqual({ steps: ['4+4 = 8'], keptMaster: false });
  });

  it('keeps 11 for 2001-04-04', () => {
    const r = calculateLifePath('2001-04-04');
    expect(r.number).toBe(11);
    expect(r.compound).toBe(11);
    expect(reductionSteps(r.compound).keptMaster).toBe(true);
  });

  it('writes out multi-step reductions and nothing for single digits', () => {
    expect(reductionSteps('1999').steps).toEqual(['1+9+9+9 = 28', '2+8 = 10', '1+0 = 1']);
    expect(reductionSteps('08').steps).toEqual([]);
    expect(reductionSteps(12).steps).toEqual(['1+2 = 3']);
  });
});

describe('birthDateNote', () => {
  const today = new Date(2026, 9, 15);
  it('flags the future and pre-1900 years, and nothing else', () => {
    expect(birthDateNote('2030-01-01', today)).toBe("That date hasn't happened yet.");
    expect(birthDateNote('1899-12-31', today)).toBe('Check the year.');
    expect(birthDateNote('1984-11-29', today)).toBeNull();
    expect(birthDateNote('2026-10-15', today)).toBeNull();
    expect(birthDateNote('', today)).toBeNull();
  });
});

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
