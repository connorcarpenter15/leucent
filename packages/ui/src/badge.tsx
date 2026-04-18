import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-800 text-surface-200 border-surface-700',
  success: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60',
  warning: 'bg-amber-900/40 text-amber-300 border-amber-700/60',
  danger: 'bg-red-900/40 text-red-300 border-red-700/60',
  info: 'bg-accent-900/40 text-accent-200 border-accent-700/50',
  accent: 'bg-accent-500/15 text-accent-200 border-accent-500/40',
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  /** Show a status dot before the label. */
  dot?: boolean;
};

const dotColors: Record<Tone, string> = {
  neutral: 'bg-surface-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-accent-400',
  accent: 'bg-accent-400',
};

export function Badge({ className, tone = 'neutral', dot = false, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  );
}
