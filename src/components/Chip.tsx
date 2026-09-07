import type { ReactNode } from 'react';
import { CHIP } from '../design/tokens';

/** A name chip — used for famous-people lists on every view. */
export const Chip = ({ children }: { children: ReactNode }) => <span className={CHIP}>{children}</span>;
