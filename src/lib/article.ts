/** "a 7", "an 8", "an 11", "an 18": the article follows how the number is said. */
export function withArticle(n: number): string {
  const abs = Math.abs(Math.trunc(n));
  const an = abs === 8 || abs === 11 || abs === 18 || (abs >= 80 && abs <= 89);
  return `${an ? 'an' : 'a'} ${n}`;
}
