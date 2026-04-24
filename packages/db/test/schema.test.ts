import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
  aiContextChunk,
  interview,
  interviewEvent,
  interviewInvite,
  interviewStatus,
  interviewerConstraint,
  organization,
  user,
} from '../src/schema';

describe('Drizzle schema', () => {
  it('exposes Neon-Auth-owned reference stubs (in `neon_auth` schema) so leucent FKs type-check', () => {
    // These stubs must exist in the `neon_auth` schema — that's where Neon
    // Auth writes real user/org rows. If they were in `public` instead,
    // drizzle-kit would emit FKs pointing at `public.user` / `public.organization`,
    // which Neon Auth never populates, and every signup-then-create-interview
    // flow would fail FK checks at INSERT time. Each stub must only expose
    // `id` — Neon Auth owns any additional columns.
    expect(getTableName(user)).toBe('user');
    expect(getTableName(organization)).toBe('organization');
    expect(getTableConfig(user).schema).toBe('neon_auth');
    expect(getTableConfig(organization).schema).toBe('neon_auth');
    const userCols = getTableColumns(user);
    const orgCols = getTableColumns(organization);
    expect(userCols).toHaveProperty('id');
    expect(orgCols).toHaveProperty('id');
    expect(Object.keys(userCols)).toEqual(['id']);
    expect(Object.keys(orgCols)).toEqual(['id']);
  });

  it('exposes Leucent domain tables under expected names', () => {
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
      'sandboxTemplate',
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

  it('stores invite hash plus server-side url token segment for join URL reconstruction', () => {
    const cols = getTableColumns(interviewInvite);
    expect(cols).toHaveProperty('tokenHash');
    expect(cols).toHaveProperty('urlToken');
    expect((cols.tokenHash as { name: string }).name).toBe('token_hash');
    expect((cols.urlToken as { name: string }).name).toBe('url_token');
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
