import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button, SiteFooter, SiteHeader, type FooterColumn, type NavLink } from '@leucent/ui';
import { getSession } from '@/lib/session';
import { SignOutButton } from './SignOutButton';

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/settings', label: 'Settings' },
      { href: '/interviews/new', label: 'Schedule interview' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#security', label: 'Security' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/signup', label: 'Get a demo' },
      { href: 'mailto:hello@leucent.dev', label: 'Contact', external: true },
    ],
  },
];

type SiteShellProps = {
  children: ReactNode;
  /** Highlights the active link in the header. */
  activeNav?: 'dashboard' | 'new' | 'home' | 'settings';
  /** Drop the footer (used by full-screen workspace pages that opt-in). */
  hideFooter?: boolean;
  /** Render a minimal logo-only header (used on auth pages). */
  minimal?: boolean;
};

/**
 * Wraps page content with the global header and footer, reading the current
 * session so the header can present either auth CTAs or the signed-in user
 * controls. Workspace pages render their own internal chrome and skip this
 * shell entirely.
 */
export async function SiteShell({
  children,
  activeNav,
  hideFooter = false,
  minimal = false,
}: SiteShellProps) {
  const session = await getSession();
  const signedIn = Boolean(session?.user);

  const links: NavLink[] = signedIn
    ? [
        { href: '/dashboard', label: 'Dashboard', active: activeNav === 'dashboard' },
        { href: '/settings', label: 'Settings', active: activeNav === 'settings' },
        { href: '/interviews/new', label: 'New interview', active: activeNav === 'new' },
      ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/#security', label: 'Security' },
      ];

  const actions = signedIn ? (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-surface-400 sm:inline">{session?.user.email}</span>
      <SignOutButton />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm">Get started</Button>
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-surface-100">
      <SiteHeader
        variant={minimal ? 'minimal' : 'default'}
        links={minimal ? [] : links}
        actions={minimal ? null : actions}
      />
      <main className="flex-1">{children}</main>
      {!hideFooter && <SiteFooter columns={FOOTER_COLUMNS} />}
    </div>
  );
}
