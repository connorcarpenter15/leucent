import type { ReactNode } from 'react';
import { cn } from './cn';
import { Container } from './container';
import { Logo } from './logo';

export type NavLink = {
  href: string;
  label: string;
  /** Treat this link as the active route (visual emphasis). */
  active?: boolean;
};

type SiteHeaderProps = {
  /** Override the logo link target. Defaults to "/". */
  logoHref?: string;
  links?: NavLink[];
  /** Right-side area — typically auth buttons or the user menu. */
  actions?: ReactNode;
  /** When true, header is sticky to the top of the viewport. */
  sticky?: boolean;
  className?: string;
  /** Render a logo-only minimal header (e.g. for auth pages). */
  variant?: 'default' | 'minimal';
};

/**
 * Global top navigation. Presentational only — apps decide what links and
 * actions to pass in based on the current session/route. The header sits on
 * a translucent surface with a hairline underline and a faint accent glow so
 * it reads as part of the page chrome without dominating it.
 */
export function SiteHeader({
  logoHref = '/',
  links = [],
  actions,
  sticky = true,
  className,
  variant = 'default',
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        'z-30 w-full border-b border-surface-800/80 bg-surface-950/75 backdrop-blur',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div className="leucent-hairline absolute inset-x-0 bottom-0 h-px opacity-40" />
      <Container size="xl" className="flex h-14 items-center justify-between gap-6">
        <a href={logoHref} className="group flex items-center gap-2 no-underline">
          <Logo size="md" />
        </a>

        {variant === 'default' && links.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors no-underline',
                  link.active
                    ? 'bg-surface-800/80 text-surface-50'
                    : 'text-surface-300 hover:bg-surface-800/60 hover:text-surface-50',
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">{actions}</div>
      </Container>
    </header>
  );
}
