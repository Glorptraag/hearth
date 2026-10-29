import { describe, it, expect } from 'vitest';
import { parseNoticeSource } from './source';
import { ALPHA_SUPPRESSED_THREAD_IDS } from '@/lib/capability-alpha-suppression';
import { THREAD_NAMES } from '@/lib/capability-threads';

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe('parseNoticeSource', () => {
  it('is logger for a plain visit', () => {
    expect(parseNoticeSource(params(''))).toEqual({ kind: 'logger' });
  });

  it('is logger for null / undefined params', () => {
    expect(parseNoticeSource(null)).toEqual({ kind: 'logger' });
    expect(parseNoticeSource(undefined)).toEqual({ kind: 'logger' });
  });

  it('ignores ?resume= (draft restore is automatic)', () => {
    expect(parseNoticeSource(params('resume=entry_123'))).toEqual({ kind: 'logger' });
  });

  it('is logger for an unknown source value', () => {
    expect(parseNoticeSource(params('source=mystery'))).toEqual({ kind: 'logger' });
  });

  describe('hearth session', () => {
    it('parses scaffold + hearthId', () => {
      expect(parseNoticeSource(params('scaffold=sess_1&hearthId=hearth_9'))).toEqual({
        kind: 'hearth_session',
        sessionId: 'sess_1',
        hearthId: 'hearth_9',
      });
    });

    it('leaves hearthId null when absent or blank', () => {
      expect(parseNoticeSource(params('scaffold=sess_1'))).toEqual({
        kind: 'hearth_session',
        sessionId: 'sess_1',
        hearthId: null,
      });
      expect(parseNoticeSource(params('scaffold=sess_1&hearthId=%20'))).toMatchObject({
        hearthId: null,
      });
    });

    it('wins over a source param when both are present', () => {
      expect(
        parseNoticeSource(params('scaffold=sess_1&source=project_stage&projectId=p1')),
      ).toMatchObject({ kind: 'hearth_session', sessionId: 'sess_1' });
    });

    it('treats a blank scaffold as absent', () => {
      expect(parseNoticeSource(params('scaffold=%20%20'))).toEqual({ kind: 'logger' });
    });
  });

  describe('project stage', () => {
    it('parses a numeric stage', () => {
      expect(
        parseNoticeSource(params('source=project_stage&projectId=proj_1&stageNumber=3')),
      ).toEqual({ kind: 'project_stage', projectId: 'proj_1', stageNumber: 3 });
    });

    it('sets stageNumber null for a non-numeric stage', () => {
      expect(
        parseNoticeSource(params('source=project_stage&projectId=proj_1&stageNumber=three')),
      ).toEqual({ kind: 'project_stage', projectId: 'proj_1', stageNumber: null });
    });

    it('sets stageNumber null when the stage is missing', () => {
      expect(parseNoticeSource(params('source=project_stage&projectId=proj_1'))).toEqual({
        kind: 'project_stage',
        projectId: 'proj_1',
        stageNumber: null,
      });
    });

    it('falls back to logger when projectId is missing', () => {
      expect(parseNoticeSource(params('source=project_stage&stageNumber=2'))).toEqual({
        kind: 'logger',
      });
    });
  });

  describe('check-in', () => {
    const validThread = Object.keys(THREAD_NAMES).find(
      (id) => !ALPHA_SUPPRESSED_THREAD_IDS.includes(id),
    ) as string;

    it('parses learner + a valid thread', () => {
      expect(
        parseNoticeSource(params(`source=check-in&learner=L1&thread=${validThread}`)),
      ).toEqual({ kind: 'check_in', learnerId: 'L1', threadId: validThread });
    });

    it('drops an unknown thread but keeps the learner', () => {
      expect(parseNoticeSource(params('source=check-in&learner=L1&thread=ZZ99'))).toEqual({
        kind: 'check_in',
        learnerId: 'L1',
        threadId: null,
      });
    });

    it('drops a suppressed thread', () => {
      const suppressed = ALPHA_SUPPRESSED_THREAD_IDS[0];
      expect(suppressed).toBeDefined();
      expect(THREAD_NAMES[suppressed]).toBeDefined();
      expect(
        parseNoticeSource(params(`source=check-in&learner=L1&thread=${suppressed}`)),
      ).toEqual({ kind: 'check_in', learnerId: 'L1', threadId: null });
    });

    it('leaves learnerId null when absent', () => {
      expect(parseNoticeSource(params(`source=check-in&thread=${validThread}`))).toEqual({
        kind: 'check_in',
        learnerId: null,
        threadId: validThread,
      });
    });
  });

  it('accepts a ReadonlyURLSearchParams-like object (anything with .get)', () => {
    const values: Record<string, string> = { scaffold: 'sess_ro', hearthId: 'hearth_ro' };
    const readonlyLike = { get: (name: string) => values[name] ?? null };
    expect(parseNoticeSource(readonlyLike)).toEqual({
      kind: 'hearth_session',
      sessionId: 'sess_ro',
      hearthId: 'hearth_ro',
    });
  });
});
