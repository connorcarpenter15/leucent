import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: cn(
    'bg-accent-500 text-white shadow-accent-glow hover:bg-accent-400',
    'focus-visible:ring-accent-400',
  ),
  secondary: cn(
    'bg-surface-800 text-surface-100 border border-surface-700',
    'hover:bg-surface-700 hover:border-surface-600',
    'focus-visible:ring-accent-400',
  ),
  outline: cn(
    'bg-transparent text-surface-100 border border-surface-700',
    'hover:border-accent-500 hover:text-accent-200',
    'focus-visible:ring-accent-400',
  ),
  ghost: cn(
    'bg-transparent text-surface-200',
    'hover:bg-surface-800/70 hover:text-surface-50',
    'focus-visible:ring-surface-500',
  ),
  danger: cn('bg-red-600 text-white hover:bg-red-500', 'focus-visible:ring-red-500'),
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
});
