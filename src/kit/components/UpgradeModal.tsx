import { useEffect } from 'react';
import { X, Zap, Check, ExternalLink } from 'lucide-react';
import { useKitConfig } from '../use-kit-config';
import { stripeUrlWithUtm, trackUpgradeShown } from '../analytics';

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
  onRestore: () => void;
  /** Where in the app the modal was triggered, for funnel attribution. */
  source: string;
}

/**
 * The single upgrade modal used everywhere. All copy + IDs come from
 * KIT_CONFIG; the kit ships no app-specific text.
 *
 * If you need a brand color swap, pass a className wrapper from the
 * consuming app — but resist redesigning per-app, the whole point is one
 * shared, tested upgrade surface.
 */
export default function UpgradeModal({ onClose, onRestore, source }: UpgradeModalProps) {
  const { stripe, upgrade } = useKitConfig();

  useEffect(() => {
    trackUpgradeShown(source);
  }, [source]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close upgrade modal"
          >
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Zap size={24} className="text-amber-900" />
          </div>
          <h2 className="text-xl font-bold mb-1">{upgrade.headerTitle}</h2>
          <p className="text-emerald-200 text-sm">{upgrade.headerSubtitle}</p>
        </div>

        {/* Price */}
        <div className="px-6 pt-5 pb-3 text-center">
          <div className="text-4xl font-bold text-stone-800">{upgrade.price}</div>
          <div className="text-xs text-stone-400 mt-1">{upgrade.priceCaption}</div>
        </div>

        {/* Features */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {upgrade.features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-stone-600">
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* CTA — inline Buy Button if configured, else Payment Link */}
        <div className="px-6 pb-4 flex justify-center">
          {isBuyButtonConfigured(stripe.buyButtonId) ? (
            <stripe-buy-button
              buy-button-id={stripe.buyButtonId}
              publishable-key={stripe.publishableKey}
            />
          ) : (
            <a
              href={stripeUrlWithUtm(stripe.paymentUrl)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-lg shadow-md transition-colors"
            >
              Buy now — {upgrade.price}
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Restore */}
        <div className="px-6 pb-5 text-center">
          <button
            onClick={onRestore}
            className="text-[11px] text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
          >
            Already purchased? Restore
          </button>
        </div>

        {/* Trust */}
        <div className="bg-stone-50 px-6 py-3 text-center border-t border-stone-100">
          <p className="text-[10px] text-stone-400 leading-relaxed">{upgrade.trustLine}</p>
        </div>
      </div>
    </div>
  );
}
