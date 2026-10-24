import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, Zap, Check, ExternalLink } from 'lucide-react';
import { useKitConfig } from '../use-kit-config';
import { clientReferenceId, getUtmParams, stripeUrlWithRef, trackUpgradeShown } from '../analytics';
import { useTapGuard } from '../tap-guard';
import { RESTORE_SOURCE } from '../auth/useAuth';
import { RESTORE_MESSAGES, isPlausibleEmail, type RestoreResult } from '../auth/restore';

/**
 * The Buy Button web component requires a Stripe-dashboard-created Buy
 * Button ID. If the consuming app hasn't created one yet (or prefers the
 * hosted Payment Link flow), we fall back to a styled anchor tag pointing
 * at `paymentUrl`. Either path lands the buyer in Stripe Checkout.
 */
function isBuyButtonConfigured(buyButtonId: string): boolean {
  return Boolean(buyButtonId) && !buyButtonId.includes('REPLACE_ME') && buyButtonId !== 'buy_btn_DEMO';
}

interface UpgradeModalProps {
  onClose: () => void;
  /** Email restore (useAuth's handleRestore). Resolves what the form shows. */
  onRestore: (email: string) => Promise<RestoreResult>;
  /** Where in the app the modal was triggered, for funnel attribution. */
  source: string;
  /**
   * The Reading key this purchase is for. When set, the Buy link binds the
   * Stripe session to it (client_reference_id = <key>__<utm>); when absent
   * the link carries UTMs only (legacy).
   */
  readingKey?: string;
  /**
   * Optional. A line of what the buyer is getting, quoted under the feature
   * list: `label` names where it comes from, `text` is the quote itself.
   */
  excerpt?: { label: string; text: string };
  /**
   * Optional. What this purchase is bound to, e.g. a profile name. Shown
   * under the price through `upgrade.pairingNote`; nothing shows without it.
   */
  pairingLabel?: string;
}

/** App-agnostic default; an app overrides it with `upgrade.restoredNote`. */
const DEFAULT_RESTORED_NOTE = 'Your purchase is unlocked on this device. Pick up where you left off.';

type RestoreState =
  | { phase: 'closed' }
  | { phase: 'open'; pending: boolean; message: string | null }
  | { phase: 'done' };

/**
 * The single upgrade modal used everywhere. All copy + IDs come from
 * KIT_CONFIG; the kit ships no app-specific text.
 *
 * If you need a brand color swap, pass a className wrapper from the
 * consuming app — but resist redesigning per-app, the whole point is one
 * shared, tested upgrade surface.
 */
export default function UpgradeModal({
  onClose,
  onRestore,
  source,
  readingKey,
  excerpt,
  pairingLabel,
}: UpgradeModalProps) {
  const { stripe, upgrade } = useKitConfig();

  // "Already purchased? Restore" opens a small email form in place; until
  // then only the link shows. Opened straight from a gate's restore link,
  // the form is already showing. No message shows before a submit.
  const [restore, setRestore] = useState<RestoreState>(() =>
    source === RESTORE_SOURCE ? { phase: 'open', pending: false, message: null } : { phase: 'closed' },
  );
  const [email, setEmail] = useState('');
  const pendingRef = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const restoreOpen = restore.phase === 'open';
  const restored = restore.phase === 'done';
  const restoredNote = upgrade.restoredNote || DEFAULT_RESTORED_NOTE;
  useEffect(() => {
    if (restoreOpen) emailRef.current?.focus({ preventScroll: true });
  }, [restoreOpen]);

  const submitRestore = async (e: FormEvent) => {
    e.preventDefault();
    // A double-click or a second Enter while the first check runs is ignored.
    if (pendingRef.current) return;
    // Empty or not an address: say so here, without a round trip.
    if (!isPlausibleEmail(email)) {
      setRestore({ phase: 'open', pending: false, message: RESTORE_MESSAGES.invalid });
      emailRef.current?.focus({ preventScroll: true });
      return;
    }
    pendingRef.current = true;
    setRestore({ phase: 'open', pending: true, message: null });
    try {
      const result = await onRestore(email);
      setRestore(result.ok ? { phase: 'done' } : { phase: 'open', pending: false, message: result.message });
    } finally {
      pendingRef.current = false;
    }
  };

  // The tap that opened the modal can double: its second half lands where
  // the Buy link now is. Pointer clicks on the CTA are ignored for a moment.
  const tooEarly = useTapGuard();
  const pairingNote =
    pairingLabel && upgrade.pairingNote ? upgrade.pairingNote.replace('{pairing}', pairingLabel) : null;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    trackUpgradeShown(source);
  }, [source]);

  // Escape closes; focus moves in on open and returns to the opener on close.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={upgrade.headerTitle}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[95vh] overflow-y-auto outline-none"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 pt-5 pb-4 sm:p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close upgrade modal"
          >
            <X size={16} />
          </button>
          <div className="hidden sm:flex w-12 h-12 bg-amber-400 rounded-xl items-center justify-center mx-auto mb-3 shadow-lg">
            <Zap size={24} className="text-amber-900" />
          </div>
          <h2 className="text-xl font-bold mb-1 px-6">{restored ? 'Restored. Welcome back.' : upgrade.headerTitle}</h2>
          <p className="text-emerald-200 text-sm">{restored ? restoredNote : upgrade.headerSubtitle}</p>
        </div>

        {!restored && (
          <>

        {/* Price, and what the purchase is bound to */}
        <div className="px-6 pt-4 pb-3 text-center">
          <div className="text-4xl font-bold text-stone-800">{upgrade.price}</div>
          <div className="text-xs text-stone-400 mt-1">{upgrade.priceCaption}</div>
          {pairingNote && (
            <p data-testid="upgrade-pairing" className="mt-2 text-xs font-semibold text-stone-600">
              {pairingNote}
            </p>
          )}
        </div>

        {/* What every buyer gets */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {upgrade.features.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                <Check size={14} className="text-emerald-500 flex-shrink-0 mt-[3px]" />
                {f}
              </div>
            ))}
          </div>
          {excerpt && excerpt.text && (
            <figure data-testid="upgrade-excerpt" className="mt-3 rounded-lg border-l-2 border-emerald-500 bg-stone-50 px-3 py-2">
              <blockquote className="text-sm italic leading-snug text-stone-700">“{excerpt.text}”</blockquote>
              <figcaption className="mt-1 text-[11px] font-semibold text-stone-500">{excerpt.label}</figcaption>
            </figure>
          )}
        </div>

        {/* CTA — inline Buy Button if configured, else Payment Link. */}
        <div className="px-6 pb-4 flex justify-center">
          {isBuyButtonConfigured(stripe.buyButtonId) ? (
            <stripe-buy-button
              buy-button-id={stripe.buyButtonId}
              publishable-key={stripe.publishableKey}
              client-reference-id={clientReferenceId({ key: readingKey, utm: getUtmParams() }) || undefined}
            />
          ) : (
            <a
              href={stripeUrlWithRef(stripe.paymentUrl, { key: readingKey, utm: getUtmParams() })}
              onClick={(e) => {
                if (tooEarly(e)) e.preventDefault();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-lg shadow-md transition-colors"
            >
              Buy now — {upgrade.price}
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* What needs something from the buyer first, after the buy */}
        {upgrade.conditionalFeatures && upgrade.conditionalFeatures.features.length > 0 && (
          <div className="px-6 pb-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500 mb-2">
              {upgrade.conditionalFeatures.heading}
            </div>
            <div className="space-y-2">
              {upgrade.conditionalFeatures.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <Check size={14} className="text-emerald-500 flex-shrink-0 mt-[3px]" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

          </>
        )}

        {/* Restore */}
        <div className="px-6 pb-5 text-center">
          {restore.phase === 'closed' && (
            <button
              type="button"
              onClick={() => setRestore({ phase: 'open', pending: false, message: null })}
              className="text-[11px] text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            >
              Already purchased? Restore
            </button>
          )}
          {restore.phase === 'open' && (
            <form onSubmit={submitRestore} noValidate className="text-left" aria-label="Restore a purchase">
              <label htmlFor="kit-restore-email" className="block text-xs font-semibold text-stone-600 mb-1.5">
                The email you used at checkout
              </label>
              <div className="flex gap-2">
                <input
                  ref={emailRef}
                  id="kit-restore-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-describedby="kit-restore-status"
                  className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-base sm:text-sm text-stone-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
                <button
                  type="submit"
                  disabled={restore.pending}
                  aria-busy={restore.pending}
                  className="shrink-0 rounded-lg bg-stone-800 px-4 py-2 text-sm font-bold text-white hover:bg-stone-900 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  {restore.pending ? 'Checking…' : 'Restore'}
                </button>
              </div>
              <p id="kit-restore-status" role="status" aria-live="polite" className="mt-2 min-h-[1rem] text-xs text-stone-600">
                {restore.pending ? 'Checking your purchase…' : restore.message}
              </p>
            </form>
          )}
          {restore.phase === 'done' && (
            <div role="status" aria-live="polite" className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Trust */}
        <div className="bg-stone-50 px-6 py-3 text-center border-t border-stone-100">
          <p className="text-[10px] text-stone-400 leading-relaxed">{upgrade.trustLine}</p>
        </div>
      </div>
    </div>
  );
}
