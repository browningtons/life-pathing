import { BORDERLINE_BADGE, BORDERLINE_BADGE_ON_DARK } from '../design/tokens';
import { BORDERLINE_MAX, BORDERLINE_MIN } from '../lib/deriveType';

interface BorderlineBadgeProps {
  /** Use the variant tuned for the indigo hero surface. */
  onDark?: boolean;
  /** Percent toward the resolved letter, for the tooltip. */
  pct?: number;
}

/** Flags a dimension whose split sits in the 45–55% band. */
export const BorderlineBadge = ({ onDark = false, pct }: BorderlineBadgeProps) => (
  <span
    className={onDark ? BORDERLINE_BADGE_ON_DARK : BORDERLINE_BADGE}
    title={
      pct === undefined
        ? `Within ${BORDERLINE_MIN}–${BORDERLINE_MAX}%: a near-even split`
        : `${pct}% — within ${BORDERLINE_MIN}–${BORDERLINE_MAX}%, a near-even split`
    }
  >
    borderline
  </span>
);
