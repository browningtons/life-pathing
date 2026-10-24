import { useEffect, type ReactNode } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { GATE_COPY, INCLUDED_WITH_READING, READING_GATE, type GateKey } from '../data/tiers';
import { BODY, FOCUS_RING, MICRO_LABEL } from '../design/tokens';
import { trackEvent, useKitConfig } from '../kit';
import { READING_ENABLED } from '../lib/readingFlag';
import { useGate } from '../store/useGate';
import { useNav } from '../store/useNav';
import { useProfile } from '../store/useProfile';
import { Card } from './Card';
import { LETTERS_ASK_ID } from './LettersAsk';
import { BIRTHDATE_INPUT_ID } from '../views/LifePathView';

interface ProGateProps {
  /** Which gate this is; picks the copy and tags the analytics. */
  gate: GateKey;
  /** The real, ungated content. Rendered as-is for Pro readers. */
  children: ReactNode;
  /**
   * An honest preview for free readers — the same component fed a slice
   * of the data, never a blurred copy of the whole thing. Optional.
   */
  teaser?: ReactNode;
  /** The button's words. Defaults to the Profile's "See the whole profile". */
  buttonLabel?: string;
  /** Which tab the gate sits on; the upgrade source reads `<surface>_<gate>`. */
  surface?: string;
  /**
   * A real line from behind the gate, with where it comes from, quoted
   * beside the price. Optional; without it the gate reads as before.
   */
  excerpt?: { label: string; text: string };
}

/**
 * The one way a paid section is gated. Pro readers see the children.
 * Free readers see the teaser (if any) and then a card that says, in
 * plain words, what is behind the line and what it costs.
 *
 * With the Reading on, a purchase is bound to the reader's own number and
 * letters, so a reader without them is sent to supply them first instead
 * of to the upgrade modal.
 */
export const ProGate = ({
  gate,
  children,
  teaser,
  buttonLabel = 'See the whole profile',
  surface = 'profile',
  excerpt,
}: ProGateProps) => {
  const { isPro, openUpgrade, restore } = useGate();
  const { ownBirthDate, lettersKnown } = useProfile();
  const { go } = useNav();
  const { upgrade } = useKitConfig();
  const copy = GATE_COPY[gate];
  const source = `${surface}_${gate}`;
  const needsInputs = READING_ENABLED && !(ownBirthDate && lettersKnown);

  useEffect(() => {
    if (!isPro) trackEvent('gate_shown', { gate });
  }, [isPro, gate]);

  if (isPro) return <>{children}</>;

  const onBuy = () => {
    if (!needsInputs) return openUpgrade(source);
    if (!ownBirthDate) go('lifepath', BIRTHDATE_INPUT_ID);
    else go('lifepath', LETTERS_ASK_ID);
  };

  return (
    <div className="space-y-4">
      {teaser}
      <Card variant="tinted" className="relative overflow-hidden" data-print-hide="">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className={`${MICRO_LABEL} !text-indigo-500 mb-2 flex items-center gap-1.5`}>
              <Lock size={11} aria-hidden="true" /> Behind the line
            </div>
            {excerpt && (
              <figure className="mb-4 border-l-2 border-indigo-300 pl-4">
                <blockquote className="text-sm italic text-slate-700 leading-relaxed">
                  &ldquo;{excerpt.text}&rdquo;
                </blockquote>
                <figcaption className={`${MICRO_LABEL} mt-1.5`}>{excerpt.label}</figcaption>
              </figure>
            )}
            <h3 className="text-base font-bold text-slate-900 mb-1">{copy.title}</h3>
            <p className={BODY}>{copy.blurb}</p>
            {READING_ENABLED && gate !== READING_GATE && (
              <p className="mt-2 text-xs font-bold text-indigo-600">{INCLUDED_WITH_READING}</p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
            <button
              type="button"
              onClick={onBuy}
              className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              {buttonLabel} <ArrowRight size={14} aria-hidden="true" />
            </button>
            <span className="text-xs text-slate-500">
              {needsInputs
                ? ownBirthDate
                  ? 'Written for your own letters. Add them first.'
                  : 'Written for your own birthdate and letters. Start there.'
                : `${upgrade.price} · ${upgrade.priceCaption.toLowerCase()}`}
            </span>
            <button
              type="button"
              onClick={restore}
              className={`rounded text-[11px] text-slate-400 underline underline-offset-2 hover:text-slate-600 ${FOCUS_RING}`}
            >
              Already purchased? Restore
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
