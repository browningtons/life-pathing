import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SECTION_HEADING, SECTION_HEADING_MUTED, toneFor, type Tone } from '../design/tokens';

interface SectionHeadingProps {
  children: ReactNode;
  icon?: LucideIcon;
  /** Colour the heading with a tone; omit for the quiet slate default. */
  tone?: Tone;
  /** Extra classes — usually a margin override. */
  className?: string;
  as?: 'h2' | 'h3' | 'h4';
}

/** Small-caps heading used at the top of every card section. */
export const SectionHeading = ({ children, icon: Icon, tone, className = '', as: Tag = 'h3' }: SectionHeadingProps) => {
  const color = tone ? toneFor(tone).text : SECTION_HEADING_MUTED;
  return (
    <Tag className={`${SECTION_HEADING} ${color} ${className}`}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </Tag>
  );
};
