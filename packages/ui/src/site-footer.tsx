import type { ReactNode } from 'react';
import { cn } from './cn';
import { Container } from './container';
import { Logo } from './logo';

export type FooterColumn = {
  heading: string;
  links: { href: string; label: string; external?: boolean }[];
};

type SiteFooterProps = {
  columns?: FooterColumn[];
  /** Tagline beneath the wordmark in the brand column. */
  tagline?: ReactNode;
  /** Optional content rendered just above the legal row. */
  trailing?: ReactNode;
  className?: string;
};

const defaultColumns: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/interviews/new', label: 'Schedule interview' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '#how-it-works', label: 'How it works' },
      { href: '#features', label: 'Features' },
      { href: '#security', label: 'Security' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/signup', label: 'Get a demo' },
      { href: 'mailto:hello@bleucent.dev', label: 'Contact', external: true },
    ],
  },
];

/**
 * Global footer rendered on marketing and signed-in app surfaces. Workspace
 * pages (`/interviews/[id]/work`, `/conduct`, `/replay`) are full-screen and
 * render their own minimal chrome instead of this footer.
 */
export function SiteFooter({
  columns = defaultColumns,
  tagline = 'Synchronous, observable technical interviews.',
  trailing,
  className,
}: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'relative border-t border-surface-800/80 bg-surface-950 text-surface-300',
        className,
      )}
    >
      <div className="bleucent-hairline absolute inset-x-0 top-0 h-px opacity-50" />
      <Container size="xl" className="py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 flex flex-col gap-3">
            <Logo size="md" />
            <p className="max-w-xs text-sm text-surface-400">{tagline}</p>
          </div>
          {columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-1.5 text-sm">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.href}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-surface-300 no-underline transition-colors hover:text-surface-50"
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {trailing && <div className="mt-10">{trailing}</div>}

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-surface-800/80 pt-6 text-xs text-surface-500 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Bleucent. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              All systems nominal
            </span>
            <a href="#" className="text-surface-400 no-underline hover:text-surface-200">
              Privacy
            </a>
            <a href="#" className="text-surface-400 no-underline hover:text-surface-200">
              Terms
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
