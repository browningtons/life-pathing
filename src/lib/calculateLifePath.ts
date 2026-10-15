import type { LifePathData } from '../types';

const MASTER_NUMBERS = new Set([11, 22, 33]);

const digitSum = (val: string | number): number =>
  String(val)
    .split('')
    .reduce((acc, c) => acc + (Number.isNaN(parseInt(c, 10)) ? 0 : parseInt(c, 10)), 0);

const reduce = (val: string | number): number => {
  let n = typeof val === 'number' ? val : parseInt(val, 10);
  if (Number.isNaN(n)) return 0;
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = digitSum(n);
  }
  return n;
};

const emptyData = (): LifePathData => ({
  number: 0,
  compound: 0,
  breakdown: { y: 0, m: 0, d: 0, rawY: '', rawM: '', rawD: '', ySum: 0, mSum: 0, dSum: 0 },
});

export const calculateLifePath = (dateString: string): LifePathData => {
  if (!dateString) return emptyData();
  const parts = dateString.split('-');
  if (parts.length !== 3) return emptyData();
  const [year, month, day] = parts;

  const rYear = reduce(year);
  const rMonth = reduce(month);
  const rDay = reduce(day);

  const compound = rYear + rMonth + rDay;
  let number = compound;
  while (number > 9 && !MASTER_NUMBERS.has(number)) {
    number = digitSum(number);
  }

  return {
    number,
    compound,
    breakdown: {
      y: rYear,
      m: rMonth,
      d: rDay,
      rawY: year,
      rawM: month,
      rawD: day,
      ySum: digitSum(year),
      mSum: digitSum(month),
      dSum: digitSum(day),
    },
  };
};

/**
 * Every step from a number to where it stops, written out. 1999 becomes
 * ["1+9+9+9 = 28", "2+8 = 10", "1+0 = 1"]. A number already at a single digit,
 * or already a master number, has no steps. `keptMaster` is true when the
 * number itself is 11, 22 or 33 and is kept rather than reduced.
 */
export const reductionSteps = (raw: string | number): { steps: string[]; keptMaster: boolean } => {
  const text = String(raw);
  let n = parseInt(text, 10);
  if (Number.isNaN(n)) return { steps: [], keptMaster: false };
  const keptMaster = MASTER_NUMBERS.has(n);
  const steps: string[] = [];
  let current = String(n);
  if (current.length < 2) return { steps, keptMaster };
  // A leading-zero day or month ("08") reads as the digit it is: no steps.
  while (current.length > 1) {
    const sum = digitSum(current);
    steps.push(`${current.split('').join('+')} = ${sum}`);
    if (MASTER_NUMBERS.has(sum) && sum !== n) break;
    current = String(sum);
    n = sum;
  }
  return { steps, keptMaster };
};

/** A one-line note for a date that is probably a typo. It still computes. */
export const birthDateNote = (dateString: string, today: Date = new Date()): string | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!m) return null;
  const pad = (v: number) => String(v).padStart(2, '0');
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  if (dateString > todayIso) return "That date hasn't happened yet.";
  if (Number(m[1]) < 1900) return 'Check the year.';
  return null;
};
