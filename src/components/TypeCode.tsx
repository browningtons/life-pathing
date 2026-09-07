import type { MbtiDimension } from '../types';

export interface TypeCodeLetter {
  dim: MbtiDimension;
  letter: string;
  pct: number;
  borderline: boolean;
}

interface TypeCodeProps {
  letters: TypeCodeLetter[];
  /** Use the underline colour tuned for the indigo hero surface. */
  onDark?: boolean;
  className?: string;
}

/**
 * Renders a four-letter type code with borderline letters marked — a
 * dotted amber underline and a hover title with the percentage. Use this
 * anywhere a type code is shown so near-even splits are never hidden
 * behind a confident-looking letter.
 */
export const TypeCode = ({ letters, onDark = false, className = '' }: TypeCodeProps) => {
  const code = letters.map((l) => l.letter).join('');
  const borderline = letters.filter((l) => l.borderline);
  const label =
    borderline.length > 0
      ? `${code}. Borderline: ${borderline.map((l) => `${l.letter} at ${l.pct}%`).join(', ')}.`
      : code;
  const underline = onDark ? 'border-amber-300/80' : 'border-amber-400';

  return (
    <span className={className} aria-label={label} role="text">
      {letters.map((l) =>
        l.borderline ? (
          <abbr
            key={l.dim}
            title={`${l.letter} at ${l.pct}% — borderline`}
            className={`no-underline border-b-2 border-dotted ${underline} cursor-help`}
          >
            {l.letter}
          </abbr>
        ) : (
          <span key={l.dim}>{l.letter}</span>
        ),
      )}
    </span>
  );
};
