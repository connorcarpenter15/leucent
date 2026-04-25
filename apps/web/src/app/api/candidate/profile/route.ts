import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { ensureCandidateProfile } from '@/lib/interview-participants';

const Body = z.object({
  displayName: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await ensureCandidateProfile({
    userId: session.user.id,
    displayName: parsed.data.displayName ?? session.user.name ?? session.user.email,
  });

  return NextResponse.json({ ok: true });
}
