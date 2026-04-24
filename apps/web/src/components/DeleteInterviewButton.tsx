'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@leucent/ui';

type InterviewStatus = 'scheduled' | 'live' | 'completed' | 'expired';

export function DeleteInterviewButton({
  interviewId,
  title,
  status,
}: {
  interviewId: string;
  title: string;
  status: InterviewStatus;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (status === 'live') {
    return null;
  }

  async function onDelete() {
    if (
      !confirm(
        `Delete “${title}”? This permanently removes the interview record, invites, and logs. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, { method: 'DELETE' });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(`Could not delete interview: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
      {deleting ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
