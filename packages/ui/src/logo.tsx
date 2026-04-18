import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type LogoProps = HTMLAttributes<HTMLSpanElement> & {
  size?: 'sm' | 'md' | 'lg';
  /** When false, only the mark is rendered. */
  showWordmark?: boolean;
};

const sizeMap = {
  sm: { mark: 'h-5 w-5', text: 'text-sm', dot: 'h-1.5 w-1.5' },
  md: { mark: 'h-7 w-7', text: 'text-base', dot: 'h-2 w-2' },
  lg: { mark: 'h-9 w-9', text: 'text-lg', dot: 'h-2.5 w-2.5' },
} as const;

/**
 * Bleucent brand mark — a sharp accent square with a soft inner glow paired
 * with the wordmark. Use the small variant in dense chrome (workspace
 * headers), the medium variant in the global header, and the large variant on
 * marketing pages.
 */
export function Logo({ size = 'md', showWordmark = true, className, ...rest }: LogoProps) {
  const s = sizeMap[size];
  return (
    <span className={cn('inline-flex items-center gap-2', className)} {...rest}>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex items-center justify-center rounded-md',
          'bg-accent-gradient shadow-accent-glow',
          s.mark,
        )}
      >
        <span
          className={cn('rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.65)]', s.dot)}
        />
      </span>
      {showWordmark && (
        <span className={cn('font-display font-semibold tracking-tight text-surface-50', s.text)}>
          Bleucent
        </span>
      )}
    </span>
  );
}
