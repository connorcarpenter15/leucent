import { describe, expect, it } from 'vitest';
import {
  FileSnapshotEntry,
  InterviewSnapshot,
  ReactFlowEdge,
  ReactFlowNode,
} from '../src/snapshot';

describe('ReactFlowNode', () => {
  it('parses a typical node', () => {
    const node = ReactFlowNode.parse({
      id: 'n1',
      type: 'service',
      position: { x: 0, y: 100 },
      data: { label: 'auth' },
    });
    expect(node.position.y).toBe(100);
  });

  it('rejects missing position fields', () => {
    const result = ReactFlowNode.safeParse({
      id: 'n1',
      type: 'service',
      position: { x: 0 },
      data: {},
    });
    expect(result.success).toBe(false);
  });
});

describe('ReactFlowEdge', () => {
  it('makes label and data optional', () => {
    const edge = ReactFlowEdge.parse({ id: 'e1', source: 'a', target: 'b' });
    expect(edge.label).toBeUndefined();
  });
});

describe('InterviewSnapshot', () => {
  it('parses a complete snapshot', () => {
    const snap = InterviewSnapshot.parse({
      interviewId: '11111111-2222-4333-8444-555555555555',
      capturedAt: '2026-04-18T12:00:00.000Z',
      canvas: {
        nodes: [{ id: 'n1', type: 'service', position: { x: 0, y: 0 }, data: {} }],
        edges: [{ id: 'e1', source: 'n1', target: 'n1' }],
      },
      code: [{ path: 'src/index.ts', contents: 'console.log(1)' }],
    });
    expect(snap.canvas.nodes).toHaveLength(1);
    expect(snap.code[0].path).toBe('src/index.ts');
  });

  it('rejects malformed file entries', () => {
    const result = FileSnapshotEntry.safeParse({ path: 'x' });
    expect(result.success).toBe(false);
  });
});
