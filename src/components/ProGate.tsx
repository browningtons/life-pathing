import { useEffect, type ReactNode } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { GATE_COPY, type GateKey } from '../data/tiers';
import { BODY, FOCUS_RING, MICRO_LABEL } from '../design/tokens';
import { trackEvent, useKitConfig } from '../kit';
import { useGate } from '../store/useGate';
import { Card } from './Card';

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
}

/**
 * The one way a paid section is gated. Pro readers see the children.
 * Free readers see the teaser (if any) and then a card that says, in
 * plain words, what is behind the line and what it costs.
 */
export const ProGate = ({ gate, children, teaser }: ProGateProps) => {
  const { isPro, openUpgrade } = useGate();
  const { upgrade } = useKitConfig();
  const copy = GATE_COPY[gate];
  const source = `profile_${gate}`;

  useEffect(() => {
    if (!isPro) trackEvent('gate_shown', { gate });
  }, [isPro, gate]);

  if (isPro) return <>{children}</>;

  return (
    <div className="space-y-4">
      {teaser}
      <Card variant="tinted" className="relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-100/60" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className={`${MICRO_LABEL} !text-indigo-500 mb-2 flex items-center gap-1.5`}>
              <Lock size={11} aria-hidden="true" /> Behind the line
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{copy.title}</h3>
            <p className={BODY}>{copy.blurb}</p>
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
            <button
              type="button"
              onClick={() => openUpgrade(source)}
              className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 ${FOCUS_RING}`}
            >
              See the whole profile <ArrowRight size={14} aria-hidden="true" />
            </button>
            <span className="text-xs text-slate-500">
              {upgrade.price} · {upgrade.priceCaption.toLowerCase()}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
