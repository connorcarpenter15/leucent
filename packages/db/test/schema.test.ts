import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  aiContextChunk,
  account,
  interview,
  interviewEvent,
  interviewInvite,
  interviewStatus,
  interviewerConstraint,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from '../src/schema';

describe('Drizzle schema', () => {
  it('exposes Better Auth tables under expected names', () => {
    expect(getTableName(user)).toBe('user');
    expect(getTableName(session)).toBe('session');
    expect(getTableName(account)).toBe('account');
    expect(getTableName(verification)).toBe('verification');
    expect(getTableName(organization)).toBe('organization');
    expect(getTableName(member)).toBe('member');
    expect(getTableName(invitation)).toBe('invitation');
  });

  it('exposes Bleucent domain tables under expected names', () => {
    expect(getTableName(interview)).toBe('interview');
    expect(getTableName(interviewInvite)).toBe('interview_invite');
    expect(getTableName(interviewEvent)).toBe('interview_event');
    expect(getTableName(interviewerConstraint)).toBe('interviewer_constraint');
    expect(getTableName(aiContextChunk)).toBe('ai_context_chunk');
  });

  it('declares the interview_status enum with the expected values', () => {
    expect(interviewStatus.enumValues).toEqual(['scheduled', 'live', 'completed', 'expired']);
  });

  it('models interview columns the rest of the system relies on', () => {
    const cols = getTableColumns(interview);
    for (const required of [
      'id',
      'organizationId',
      'interviewerUserId',
      'candidateName',
      'candidateEmail',
      'title',
      'status',
      'startedAt',
      'endedAt',
      'neonBranchId',
      'sandboxId',
      'sandboxStatus',
      'replayS3Key',
      'createdAt',
      'updatedAt',
    ]) {
      expect(cols, `interview.${required} must exist`).toHaveProperty(required);
    }
  });

  it('stores invite tokens only as a hash', () => {
    const cols = getTableColumns(interviewInvite);
    expect(cols).toHaveProperty('tokenHash');
    expect(cols).not.toHaveProperty('token');
    expect((cols.tokenHash as { name: string }).name).toBe('token_hash');
  });

  it('models event log columns required for replay (kind, actor, payload, ts, seq)', () => {
    const cols = getTableColumns(interviewEvent);
    for (const required of ['interviewId', 'ts', 'kind', 'actor', 'payload', 'seq']) {
      expect(cols, `interview_event.${required}`).toHaveProperty(required);
    }
  });

  it('models RAG chunks with embeddings + interview scoping', () => {
    const cols = getTableColumns(aiContextChunk);
    for (const required of ['interviewId', 'sourcePath', 'chunkIndex', 'contents', 'embedding']) {
      expect(cols, `ai_context_chunk.${required}`).toHaveProperty(required);
    }
  });
});
