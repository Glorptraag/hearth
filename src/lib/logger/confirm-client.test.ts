import { describe, it, expect, vi } from 'vitest';
import { confirmEndpoint, confirmProposal } from './confirm-client';

function response(ok: boolean, status: number): Response {
  return { ok, status } as Response;
}

describe('confirmEndpoint', () => {
  it('builds the DLO confirm URL for a learner', () => {
    expect(confirmEndpoint('learner_1', 'dlo.M1.developing')).toBe(
      '/api/capabilities/learner_1/dlo/dlo.M1.developing/confirm',
    );
  });

  it('URL-encodes both segments', () => {
    expect(confirmEndpoint('learner 1/x', 'dlo.M1.developing?x=1')).toBe(
      `/api/capabilities/${encodeURIComponent('learner 1/x')}/dlo/${encodeURIComponent('dlo.M1.developing?x=1')}/confirm`,
    );
    expect(confirmEndpoint('learner 1/x', 'dlo.M1.developing')).not.toContain(' ');
  });
});

describe('confirmProposal', () => {
  const proposal = { learnerId: 'learner_1', dloId: 'dlo.M1.developing' };

  it('POSTs JSON {action} with the right headers to the confirm endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(true, 200));

    await confirmProposal(proposal, 'confirm', fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/capabilities/learner_1/dlo/dlo.M1.developing/confirm',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      },
    );
  });

  it('sends dispute as the action on the second tap', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(true, 200));

    await confirmProposal(proposal, 'dispute', fetchImpl as unknown as typeof fetch);

    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ action: 'dispute' });
  });

  it('resolves on an ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(true, 201));
    await expect(
      confirmProposal(proposal, 'confirm', fetchImpl as unknown as typeof fetch),
    ).resolves.toBeUndefined();
  });

  it('throws with the status in the message on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(false, 403));
    await expect(
      confirmProposal(proposal, 'confirm', fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow('403');
  });
});
