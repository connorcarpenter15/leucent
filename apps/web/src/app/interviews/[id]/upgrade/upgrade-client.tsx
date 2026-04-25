'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@leucent/ui';

export function UpgradeParticipantButton({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function linkAccount() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/participant/link-account`, {
        method: 'POST',
      });
      if (!res.ok) {
        setError((await res.text()) || `Could not link account (${res.status}).`);
        return;
      }
      router.replace('/candidate');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </div>
      )}
      <Button type="button" onClick={() => void linkAccount()} disabled={loading} size="lg">
        {loading ? 'Linking...' : 'Save this interview to my account'}
      </Button>
    </div>
  );
}
