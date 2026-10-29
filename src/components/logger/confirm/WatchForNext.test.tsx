/**
 * WatchForNext (W4.4): renders the server-composed line for a confirmed chip,
 * or nothing — an unconfirmed note never renders and is never made up here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { WatchForNext, __resetWatchForCache } from './WatchForNext';
import { confirmCopy } from './confirmCopy';

const LINE = {
  dloId: 'dlo.M1.developing',
  learnerId: 'learner-ada',
  kind: 'says',
  lookFor: 'Counting may land on the right number without starting over.',
  how: 'Afterwards, ask Ada to tell it back in their own words.',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => __resetWatchForCache());
afterEach(cleanup);

function renderLine(fetchImpl: ReturnType<typeof vi.fn>) {
  return render(
    <WatchForNext
      learnerId="learner-ada"
      dloId="dlo.M1.developing"
      threadName="Number Sense"
      fetchImpl={fetchImpl as unknown as typeof fetch}
    />,
  );
}

describe('WatchForNext', () => {
  it('asks the server for this child’s line and renders look-for then how', async () => {
    const fetchImpl = vi.fn(async () => json({ items: [LINE] }));
    renderLine(fetchImpl);
    const note = await screen.findByRole('complementary', { name: confirmCopy.watchFor.label('Number Sense') });
    expect(note).toHaveTextContent(confirmCopy.watchFor.overline('Number Sense'));
    expect(note).toHaveTextContent(LINE.lookFor);
    expect(note).toHaveTextContent(LINE.how);
    expect(fetchImpl).toHaveBeenCalledWith('/api/watch-for?learner=learner-ada&dlo=dlo.M1.developing');
  });

  it('renders the look-for alone when there is no confirmed how line', async () => {
    renderLine(vi.fn(async () => json({ items: [{ ...LINE, how: null }] })));
    expect(await screen.findByText(LINE.lookFor)).toBeInTheDocument();
    expect(screen.queryByText(LINE.how)).not.toBeInTheDocument();
  });

  it('renders nothing when the DLO has no confirmed note (unconfirmed → omitted)', async () => {
    const fetchImpl = vi.fn(async () => json({ items: [] }));
    const { container } = renderLine(fetchImpl);
    await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on a failed read, and tries again next time it mounts', async () => {
    const fetchImpl = vi.fn(async () => json({ error: 'x' }, 500));
    const first = renderLine(fetchImpl);
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    expect(first.container).toBeEmptyDOMElement();
    first.unmount();
    await Promise.resolve();
    renderLine(fetchImpl);
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  });

  it('reuses a fetched line when the chip is confirmed again', async () => {
    const fetchImpl = vi.fn(async () => json({ items: [LINE] }));
    const first = renderLine(fetchImpl);
    await screen.findByText(LINE.lookFor);
    first.unmount();
    renderLine(fetchImpl);
    await screen.findByText(LINE.lookFor);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
