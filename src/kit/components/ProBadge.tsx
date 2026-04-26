import { Sparkles } from 'lucide-react';

interface ProBadgeProps {
  small?: boolean;
}

export default function ProBadge({ small }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold rounded-full ${
        small ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]'
      }`}
    >
      <Sparkles size={small ? 8 : 10} />
      PRO
    </span>
  );
}
