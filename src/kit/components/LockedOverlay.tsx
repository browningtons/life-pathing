import { Lock } from 'lucide-react';
import { useKitConfig } from '../use-kit-config';

interface LockedOverlayProps {
  onUpgrade: () => void;
  /** Override the default label, e.g. "Unlock the dashboard". */
  label?: string;
}

/**
 * Translucent overlay placed inside a relatively-positioned container to
 * gate a premium component. Click → onUpgrade (typically opens the modal).
 */
export default function LockedOverlay({ onUpgrade, label }: LockedOverlayProps) {
  const { upgrade } = useKitConfig();
  return (
    <div
      className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center cursor-pointer group"
      onClick={onUpgrade}
    >
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full p-2 mb-2 shadow-md group-hover:scale-110 transition-transform">
        <Lock size={16} />
      </div>
      <span className="text-xs font-bold text-stone-600">{label || 'Unlock with Pro'}</span>
      <span className="text-[10px] text-stone-400 mt-0.5">{upgrade.price} {upgrade.priceCaption.toLowerCase()}</span>
    </div>
  );
}
