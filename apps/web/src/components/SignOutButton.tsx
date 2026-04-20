'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@leucent/ui';
import { signOut } from '@/lib/auth-client';

/** Header sign-out control. Calls Better Auth and bounces to /login. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await signOut();
        router.push('/login');
        router.refresh();
      }}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
