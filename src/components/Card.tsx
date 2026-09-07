import type { HTMLAttributes, ReactNode } from 'react';
import { CARD_BASE, CARD_VARIANTS, type CardVariant } from '../design/tokens';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Surface treatment from the shared design tokens. */
  variant?: CardVariant;
  className?: string;
}

export const Card = ({ children, variant = 'default', className = '', ...props }: CardProps) => (
  <div className={`${CARD_BASE} ${CARD_VARIANTS[variant]} ${className}`} {...props}>
    {children}
  </div>
);
