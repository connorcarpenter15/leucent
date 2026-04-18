import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'default' | 'raised' | 'accent';

const toneClasses: Record<Tone, string> = {
  default: 'bg-surface-900/60 border-surface-800',
  raised: 'bg-surface-900 border-surface-800 shadow-elevated',
  accent: 'bg-surface-900/60 border-accent-700/40 shadow-accent-glow',
};

type CardProps = HTMLAttributes<HTMLDivElement> & { tone?: Tone };

export function Card({ className, tone = 'default', ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border backdrop-blur-sm transition-colors',
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-5 py-4 border-b border-surface-800',
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-tight text-surface-50', className)}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-surface-400', className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-surface-800 px-5 py-3',
        className,
      )}
      {...rest}
    />
  );
}
