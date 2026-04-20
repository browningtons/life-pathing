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
