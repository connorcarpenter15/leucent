import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateInviteToken } from '@/lib/invite-token';
import {
  DEFAULT_SANDBOX_TEMPLATE,
  type SandboxTemplateKey,
  normalizeSandboxTemplate,
  SANDBOX_TEMPLATE_KEYS,
} from '@/lib/sandbox-templates';

const sandboxTemplateEnum = z.enum(SANDBOX_TEMPLATE_KEYS);

function shortInterviewSlug(): string {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

const instantSchema = z.object({
  mode: z.literal('instant'),
  sandboxTemplate: sandboxTemplateEnum.optional(),
});

const laterSchema = z.object({
  mode: z.literal('later'),
  candidateName: z.string().max(100).optional(),
  candidateEmail: z.union([z.string().email(), z.literal('')]).optional(),
  targetRole: z.string().max(200).optional(),
  sandboxTemplate: sandboxTemplateEnum.optional(),
});

const Body = z.union([instantSchema, laterSchema]).superRefine((data, ctx) => {
  if (data.mode !== 'later') return;
  const name = data.candidateName?.trim();
  const email = data.candidateEmail?.trim();
  if (!name && !email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide a candidate email or name.',
      path: ['candidateEmail'],
    });
  }
});

/**
 * Creates an interview row + invite token (Meet-style: instant or link-for-later).
 * Sandbox + Neon branch are provisioned when the interviewer starts the session.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return new NextResponse('No active organization', { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const slug = shortInterviewSlug();
  let title: string;
  let candidateName: string | null = null;
  let candidateEmail: string | null = null;
  let sandboxTemplate: SandboxTemplateKey;

  if (body.mode === 'instant') {
    title = `Interview · ${slug}`;
    sandboxTemplate = normalizeSandboxTemplate(body.sandboxTemplate);
  } else {
    const tr = body.targetRole?.trim();
    title = tr && tr.length > 0 ? tr : `Interview · ${slug}`;
    candidateName = body.candidateName?.trim() || null;
    const em = body.candidateEmail?.trim();
    candidateEmail = em && em.length > 0 ? em : null;
    sandboxTemplate = normalizeSandboxTemplate(body.sandboxTemplate);
  }

  const [created] = await db()
    .insert(schema.interview)
    .values({
      organizationId: orgId,
      interviewerUserId: session.user.id,
      title,
      status: 'scheduled',
      sandboxTemplate,
    })
    .returning();
  if (!created) return new NextResponse('insert failed', { status: 500 });

  const { token, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  await db().insert(schema.interviewInvite).values({
    interviewId: created.id,
    tokenHash: hash,
    urlToken: token,
    recipientName: candidateName,
    recipientEmail: candidateEmail,
    expiresAt,
  });

  const joinUrl = new URL(`/join/${token}`, new URL(req.url).origin).toString();

  return NextResponse.json({
    interviewId: created.id,
    joinUrl,
    expiresAt,
    mode: body.mode,
    sandboxTemplate: created.sandboxTemplate ?? DEFAULT_SANDBOX_TEMPLATE,
  });
}
