import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ConstellationGraph, canvasLabel, MAX_MOMENT_NODES } from './ConstellationGraph';
import { buildConstellationGraph, domainNodeId } from './graph-model';
import { THREADS_BY_ID, buildSnapshot, type ActiveThreadRow, type SanityDLO } from './topology';

// The cold import of the capability-universe graph module can take well over
// vitest's default 5000ms per-test timeout — bump it for this file.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const row = (thread_id: string, suggested_tier: string): ActiveThreadRow => ({
  thread_id,
  thread_name: THREADS_BY_ID[thread_id].name,
  observation_count: 4,
  suggested_tier,
  last_evidence_date: '2026-06-01',
  current_badge_level: null,
  next_badge: null,
  next_badge_progress: 0,
});

const dlosFor = (threadId: string): SanityDLO[] =>
  (['emerging', 'developing', 'demonstrating'] as const).map((tier) => ({
    _id: `dlo.${threadId}.${tier}`,
    threadRef: `capabilityThread.${threadId}`,
    tier,
    descriptor: `${THREADS_BY_ID[threadId].name} — ${tier} objective`,
  }));

const snap = buildSnapshot({ id: 'lrn1', name: 'Emma', colourToken: null }, [row('L1', 'developing'), row('L4', 'emerging')], {
  'dlo.L1.emerging': { status: 'demonstrating' },
});
const dlosByThread = { L1: dlosFor('L1'), L3: dlosFor('L3') };

type Props = React.ComponentProps<typeof ConstellationGraph>;
function renderGraph(overrides: Partial<Props> = {}) {
  const props: Props = {
    snap,
    dlosByThread,
    depth: 1,
    focus: { domain: null, thread: null, dlo: null },
    confirmedDloIds: new Set(),
    pendingDloIds: new Set(),
    onConfirmDlo: vi.fn(),
    onTelescope: vi.fn(),
    onOpenInTable: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  return { ...render(<ConstellationGraph {...props} />), props };
}

const node = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}\\. `) });
const panel = () => screen.getByRole('complementary', { name: 'Constellation details' });

describe('ConstellationGraph — the whole constellation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders every domain, thread and objective as a node, with an overview in the panel', () => {
    const { container } = renderGraph();
    const graph = buildConstellationGraph(snap, dlosByThread);
    expect(container.querySelectorAll('[data-node]')).toHaveLength(graph.nodes.length);
    expect(container.querySelectorAll('[data-link]')).toHaveLength(graph.links.length);
    expect(screen.getByRole('group', { name: "Emma's constellation: 2 of 56 threads lit" })).toBeInTheDocument();
    expect(node('Oral Communication')).toHaveAccessibleName(/Thread, Developing/);
    expect(within(panel()).getByText(/threads lit for Emma/)).toBeInTheDocument();
  });

  it('selecting a node opens it in the panel with its links and backlinks', () => {
    renderGraph();
    fireEvent.click(node('Reading Comprehension'));
    expect(node('Reading Comprehension')).toHaveAttribute('aria-pressed', 'true');
    const p = panel();
    expect(within(p).getByRole('heading', { name: 'Reading Comprehension' })).toBeInTheDocument();
    expect(within(p).getByText('Opening up')).toBeInTheDocument();
    expect(within(p).getByRole('heading', { name: /Builds on/ })).toBeInTheDocument();
    expect(within(p).getByRole('heading', { name: /Leads to/ })).toBeInTheDocument();
    // Its neighbourhood lights; the rest of the sky dims.
    expect(document.querySelector('.cg-svg')).toHaveClass('has-highlight');
    expect(document.querySelector(`[data-node="${domainNodeId('languageLiteracy')}"]`)).toHaveClass('is-hl');
  });

  it('a link in the panel moves the selection to that node', () => {
    renderGraph();
    fireEvent.click(node('Reading Comprehension'));
    fireEvent.click(within(panel()).getByRole('button', { name: /^Oral Communication, Developing/ }));
    expect(within(panel()).getByRole('heading', { name: 'Oral Communication' })).toBeInTheDocument();
  });

  it('telescopes from the panel, or on double-click', () => {
    const { props } = renderGraph();
    fireEvent.click(node('Oral Communication'));
    fireEvent.click(within(panel()).getByRole('button', { name: 'Telescope from here' }));
    expect(props.onTelescope).toHaveBeenCalledWith({ domain: 'languageLiteracy', thread: 'L1', dlo: null }, 3);
    fireEvent.doubleClick(node('Language & Literacy'));
    expect(props.onTelescope).toHaveBeenLastCalledWith({ domain: 'languageLiteracy', thread: null, dlo: null }, 2);
  });

  it('keyboard: Enter selects, Enter again telescopes, arrows walk the links', () => {
    const { props } = renderGraph();
    const l1 = node('Oral Communication');
    fireEvent.keyDown(l1, { key: 'Enter' });
    expect(l1).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(l1, { key: 'ArrowRight' });
    const moved = document.querySelector('[data-node][aria-pressed="true"]');
    expect(moved).not.toBe(l1);
    const graph = buildConstellationGraph(snap, dlosByThread);
    expect(graph.neighbours['thread:L1']).toContain(moved?.getAttribute('data-node'));
    // The new selection is the one tab stop into the graph.
    expect(moved).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(l1, { key: 'Enter' });
    fireEvent.keyDown(l1, { key: 'Enter' });
    expect(props.onTelescope).toHaveBeenCalledWith({ domain: 'languageLiteracy', thread: 'L1', dlo: null }, 3);
    fireEvent.keyDown(l1, { key: 'Escape' });
    expect(document.querySelector('[data-node][aria-pressed="true"]')).toBeNull();
  });

  it('search lights matching nodes and Enter selects the first', () => {
    renderGraph();
    const input = screen.getByRole('searchbox', { name: /Find a thread or objective/ });
    fireEvent.change(input, { target: { value: 'phonolog' } });
    expect(screen.getByText('1 match')).toBeInTheDocument();
    expect(node('Phonological Awareness')).toHaveClass('is-hl');
    fireEvent.submit(input.closest('form')!);
    expect(within(panel()).getByRole('heading', { name: 'Phonological Awareness' })).toBeInTheDocument();
  });

  it('display filters drop objectives and unlit nodes', () => {
    const { container } = renderGraph();
    fireEvent.click(screen.getByRole('button', { name: 'Objectives' }));
    expect(container.querySelector('.cg-objective')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Not yet lit' }));
    expect(container.querySelector('.cg-node.is-unlit')).toBeNull();
    expect(node('Oral Communication')).toBeInTheDocument();
  });

  it('"Open in table" hands back the node’s drill target', () => {
    const { props } = renderGraph();
    fireEvent.click(node('Language & Literacy'));
    fireEvent.click(within(panel()).getByRole('button', { name: 'Open in table' }));
    expect(props.onOpenInTable).toHaveBeenCalledWith({ domain: 'languageLiteracy', thread: null, dlo: null }, 2);
  });
});

describe('ConstellationGraph — telescope', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps only nodes within reach, draws one ring per link, and widens on demand', () => {
    const { container, props } = renderGraph({ depth: 3, focus: { domain: 'languageLiteracy', thread: 'L3', dlo: null } });
    expect(screen.getByRole('group', { name: /^Telescope from Reading Comprehension/ })).toBeInTheDocument();
    expect(screen.getByText('1 link away')).toBeInTheDocument();
    expect(screen.getByText('2 links away')).toBeInTheDocument();
    // Persuasion is two links out (via Written Expression); a far thread is not.
    expect(node('Persuasion & Argument')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Probability\. / })).toBeNull();
    expect(container.querySelector('.cg-node.is-apex')?.getAttribute('data-node')).toBe('thread:L3');
    // The apex reads in the panel without a selection.
    expect(within(panel()).getByRole('heading', { name: 'Reading Comprehension' })).toBeInTheDocument();

    const twoLinks = container.querySelectorAll('[data-node]').length;
    fireEvent.click(screen.getByRole('radio', { name: '1 link' }));
    expect(container.querySelectorAll('[data-node]').length).toBeLessThan(twoLinks);
    expect(screen.queryByText('2 links away')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Whole constellation/ }));
    expect(props.onReset).toHaveBeenCalled();
  });

  it('a panel link outside the telescope re-roots the telescope onto it', () => {
    const { props } = renderGraph({ depth: 3, focus: { domain: 'languageLiteracy', thread: 'L3', dlo: null } });
    fireEvent.click(screen.getByRole('radio', { name: '1 link' }));
    fireEvent.click(node('Written Expression'));
    fireEvent.click(within(panel()).getByRole('button', { name: /^Persuasion & Argument, .* telescopes onto it/ }));
    expect(props.onTelescope).toHaveBeenCalledWith({ domain: 'logicRhetoric', thread: 'L8', dlo: null }, 3);
  });

  it('telescoping onto an objective adds its moments as leaf nodes and lists them', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      json: async () => (String(url).includes('dlo-evidence')
        ? {
          evidence: [
            { entryId: 'e1', title: 'Told the story back at dinner', dateOccurred: '2026-06-02', source: 'logger', tier: 'emerging', rationale: 'Retold events in order', provenance: 'inferred' },
            { entryId: null, title: 'You confirmed this', dateOccurred: '2026-06-05', source: 'parent', tier: 'emerging', rationale: null, provenance: 'asserted' },
          ],
        }
        : []),
    })));
    const { container } = renderGraph({ depth: 4, focus: { domain: 'languageLiteracy', thread: 'L1', dlo: 'dlo.L1.emerging' } });
    expect(await within(panel()).findByRole('link', { name: 'Told the story back at dinner' })).toHaveAttribute('href', '/our-story/portfolio#entry-e1');
    expect(within(panel()).getByText('Retold events in order')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelectorAll('.cg-moment')).toHaveLength(2));
    fireEvent.click(node('Told the story back at dinner'));
    expect(within(panel()).getByText(/Hearth noticed/)).toBeInTheDocument();
    expect(within(panel()).getByRole('link', { name: 'Open in portfolio' })).toHaveAttribute('href', '/our-story/portfolio#entry-e1');
  });

  it('caps moment nodes so a well-evidenced objective stays readable', async () => {
    const evidence = Array.from({ length: MAX_MOMENT_NODES + 5 }, (_, i) => ({
      entryId: `e${i}`, title: `Moment ${i}`, dateOccurred: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
      source: 'logger', tier: 'emerging', rationale: null, provenance: 'inferred',
    }));
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ evidence }) })));
    const { container } = renderGraph({ depth: 4, focus: { domain: 'languageLiteracy', thread: 'L1', dlo: 'dlo.L1.emerging' } });
    await waitFor(() => expect(container.querySelectorAll('.cg-moment')).toHaveLength(MAX_MOMENT_NODES));
    expect(within(panel()).getAllByRole('listitem').length).toBeGreaterThanOrEqual(evidence.length);
  });
});

describe('canvasLabel', () => {
  it('uses the domain short name and trims long objective text', () => {
    const graph = buildConstellationGraph(snap, dlosByThread);
    expect(canvasLabel(graph.byId[domainNodeId('historicalCivicGeographic')])).toBe('History & Place');
    const long = { ...graph.byId['objective:dlo.L1.emerging'], label: 'x'.repeat(80) };
    expect(canvasLabel(long).length).toBeLessThanOrEqual(34);
  });
});
