import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '', ...props }: CardProps) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);
