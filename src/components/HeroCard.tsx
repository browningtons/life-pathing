import type { ReactNode } from 'react';
import { Card } from './Card';

interface HeroCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * The indigo hero every view opens with: dark surface, a soft glow in the
 * top-right corner, content lifted above it.
 */
export const HeroCard = ({ children, className = '' }: HeroCardProps) => (
  <Card variant="hero" className={className}>
    <div className="absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16" />
    </div>
    <div className="relative z-10">{children}</div>
  </Card>
);
