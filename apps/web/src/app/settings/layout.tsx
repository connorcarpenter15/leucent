import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Container } from '@leucent/ui';
import { getSession } from '@/lib/session';
import { SiteShell } from '@/components/SiteShell';
import { SettingsSidebar } from './settings-sidebar';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SiteShell activeNav="settings">
      <Container size="lg" className="py-10">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-50">
            Settings
          </h1>
          <p className="mt-1 text-sm text-surface-400">
            Your profile and the workspace used for interviews and the dashboard.
          </p>
        </header>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <SettingsSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </SiteShell>
  );
}
