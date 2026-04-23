'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@leucent/ui';

const ITEMS = [
  { href: '/settings/user', label: 'Profile' },
  { href: '/settings/organization', label: 'Organization' },
] as const;

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 flex-row gap-2 border-b border-surface-800 pb-4 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
      aria-label="Settings sections"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm no-underline transition-colors',
              active
                ? 'bg-surface-800/90 text-surface-50'
                : 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-100',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
