'use client';

/* The constellation's reading pane — what Obsidian shows beside its graph:
   the selected note, its outgoing links and its backlinks. Here: the selected
   domain / thread / objective / moment, its state in plain language, the
   parent's confirm control for an objective, the moments behind a telescoped
   objective, and every link as a button (the keyboard path through the graph). */

import Link from 'next/link';
import { X } from '@/components/icons';
import { DloConfirmButton } from './DloConfirmButton';
import { TRAJECTORY_LABEL, relTime } from './TableView';
import {
  kindLabel,
  relationsOf,
  stateLine,
  type ConstellationGraph,
  type GraphMoment,
  type GraphNode,
} from './graph-model';
import { ORDERED_DOMAINS, TIER_LABEL, type LearnerSnapshot } from './topology';

const PROVENANCE_LABEL: Record<string, string> = {
  inferred: 'Hearth noticed',
  declared: 'From a module',
  asserted: 'You confirmed',
};

const DOMAIN_SHORT: Record<string, string> = Object.fromEntries(ORDERED_DOMAINS.map((d) => [d.key, d.short]));

function Swatch({ node }: { node: GraphNode }) {
  const lit = node.glow === 'lit';
  return (
    <span
      aria-hidden
      className="inline-block h-[10px] w-[10px] shrink-0 rounded-full"
      style={
        node.glow === 'opening'
          ? { border: `1.5px solid ${node.color}` }
          : { background: lit ? node.color : 'var(--color-text-muted)', opacity: lit ? 1 : 0.5 }
      }
    />
  );
}

function Overview({ name, litThreads, totalThreads }: { name: string; litThreads: number; totalThreads: number }) {
  return (
    <>
      <div>
        <div className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">Reading the sky</div>
        <p className="mt-xs font-serif text-text-primary">
          <span className="font-semibold">{litThreads}</span> of {totalThreads} threads lit for {name}.
        </p>
      </div>
      <ul className="flex flex-col gap-sm font-sans text-[0.78rem] text-text-secondary">
        <li className="flex items-center gap-sm">
          <span aria-hidden className="inline-block h-[10px] w-[10px] rounded-full bg-text-secondary" />
          Lit — observed, coloured by domain
        </li>
        <li className="flex items-center gap-sm">
          <span aria-hidden className="inline-block h-[10px] w-[10px] rounded-full border-[1.5px] border-text-secondary" />
          Opening up — its foundations are lit, or it&rsquo;s the next objective to watch for
        </li>
        <li className="flex items-center gap-sm">
          <span aria-hidden className="inline-block h-[8px] w-[8px] rounded-full bg-text-muted opacity-50" />
          Not yet observed
        </li>
        <li className="flex items-center gap-sm">
          <span aria-hidden className="inline-block h-[12px] w-[12px] rounded-full border border-sage" />
          Demonstrating, or confirmed by you
        </li>
        <li className="flex items-center gap-sm">
          <span aria-hidden className="inline-block h-[1px] w-[14px] bg-text-secondary" />
          A constellation line joins two lit stars
        </li>
      </ul>
      <p className="font-sans text-[0.75rem] leading-relaxed text-text-muted">
        Drag the sky to move it, scroll or pinch to zoom, drag a star to tug its links. Tap a star to read it here;
        double-tap it — or use Telescope — to look out from it.
      </p>
    </>
  );
}

function Moments({ moments }: { moments: GraphMoment[] | null }) {
  if (moments === null) {
    return <p className="font-sans text-sm text-text-muted">Loading moments…</p>;
  }
  if (moments.length === 0) {
    return (
      <p className="font-serif text-sm italic text-text-secondary">
        No moments yet for this objective. Log a moment from the Logger and tag this thread.
      </p>
    );
  }
  const threadLevel = moments.every((m) => m.threadLevel);
  return (
    <>
      {threadLevel && (
        <p className="font-sans text-[0.72rem] text-text-muted">
          Thread-level matches — this objective has no objective-level evidence yet.
        </p>
      )}
      <ul className="flex flex-col gap-sm">
        {moments.map((m) => (
          <li key={m.id} className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm">
            {m.entryId ? (
              <Link href={`/our-story/portfolio#entry-${m.entryId}`}
                    className="font-serif text-[0.92rem] text-text-primary hover:text-ember transition-colors">
                {m.title}
              </Link>
            ) : (
              <span className="font-serif text-[0.92rem] text-text-primary">{m.title}</span>
            )}
            <div className="mt-[2px] font-sans text-[0.7rem] uppercase tracking-[0.06em] text-text-muted">
              {m.date} · {relTime(m.date)}
              {m.provenance && <> · {PROVENANCE_LABEL[m.provenance] ?? 'Hearth noticed'}</>}
            </div>
            {m.rationale && <p className="mt-xs font-serif text-[0.82rem] italic text-text-secondary">{m.rationale}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function ConstellationPanel({
  snap,
  graph,
  node,
  isApex,
  inView,
  moments,
  confirmed,
  pending,
  onConfirm,
  onVisit,
  onTelescope,
  onOpenInTable,
  onClose,
  litThreads,
  totalThreads,
}: {
  snap: LearnerSnapshot;
  graph: ConstellationGraph;
  node: GraphNode | null;
  isApex: boolean;
  inView: (id: string) => boolean;
  /** Moments behind the telescoped objective (null while loading or not applicable). */
  moments: GraphMoment[] | null;
  confirmed: boolean;
  pending: boolean;
  onConfirm: (next: boolean) => void;
  onVisit: (id: string) => void;
  onTelescope: (node: GraphNode) => void;
  onOpenInTable: (node: GraphNode) => void;
  onClose?: () => void;
  litThreads: number;
  totalThreads: number;
}) {
  return (
    <aside
      aria-label="Constellation details"
      className="flex min-w-0 flex-col gap-md rounded-lg border border-border-subtle bg-surface-panel p-lg lg:max-h-[clamp(360px,62vh,720px)] lg:overflow-y-auto"
    >
      {!node ? (
        <Overview name={snap.name} litThreads={litThreads} totalThreads={totalThreads} />
      ) : (
        <NodeDetail
          snap={snap}
          graph={graph}
          node={node}
          isApex={isApex}
          inView={inView}
          moments={moments}
          confirmed={confirmed}
          pending={pending}
          onConfirm={onConfirm}
          onVisit={onVisit}
          onTelescope={onTelescope}
          onOpenInTable={onOpenInTable}
          onClose={onClose}
        />
      )}
    </aside>
  );
}

function NodeDetail({
  snap, graph, node, isApex, inView, moments, confirmed, pending, onConfirm, onVisit, onTelescope, onOpenInTable, onClose,
}: {
  snap: LearnerSnapshot;
  graph: ConstellationGraph;
  node: GraphNode;
  isApex: boolean;
  inView: (id: string) => boolean;
  moments: GraphMoment[] | null;
  confirmed: boolean;
  pending: boolean;
  onConfirm: (next: boolean) => void;
  onVisit: (id: string) => void;
  onTelescope: (node: GraphNode) => void;
  onOpenInTable: (node: GraphNode) => void;
  onClose?: () => void;
}) {
  const relations = relationsOf(graph, node.id);
  const last = node.kind === 'thread' ? snap.lastDateByThread[node.ref] : undefined;
  const trajectory = node.kind === 'thread' ? snap.trajectoryByThread[node.ref] : undefined;
  const traj = trajectory && node.observations >= 3 ? TRAJECTORY_LABEL[trajectory] : null;
  const canTelescope = node.kind !== 'moment' && !isApex;

  return (
    <>
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
            <Swatch node={node} />
            <span>{kindLabel(node.kind)}</span>
            {node.kind !== 'domain' && <span className="font-normal normal-case tracking-normal">· {DOMAIN_SHORT[node.domain]}</span>}
          </div>
          <h2 className="mt-xs font-serif text-[1.15rem] font-semibold leading-snug text-text-primary">{node.label}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Clear selection"
                  className="inline-flex shrink-0 rounded-sm p-[4px] text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-xs font-sans text-[0.75rem]">
        <span className={`rounded-sm px-sm py-[2px] ${
          node.glow === 'lit' && (node.tier === 'demonstrating' || node.confirmed) ? 'bg-sage-muted text-sage-text' : 'bg-surface-hover text-text-secondary'
        }`}>
          {stateLine(node)}
        </span>
        {node.kind === 'objective' && node.tier && node.tier !== 'unobserved' && (
          <span className="text-text-muted">{TIER_LABEL[node.tier]} band</span>
        )}
        {isApex && <span className="rounded-sm border border-border-active px-sm py-[2px] text-text-secondary">Telescoping from here</span>}
        {node.newlyLit && <span className="rounded-sm bg-surface-hover px-sm py-[2px] text-text-secondary">New</span>}
        {node.badge === 'awarded' && <span className="rounded-sm bg-sage-muted px-sm py-[2px] text-sage-text">Badge earned</span>}
        {node.badge === 'approaching' && <span className="rounded-sm border border-border-subtle px-sm py-[2px] text-text-secondary">Badge approaching</span>}
        {traj && <span className={traj.cls}>{traj.glyph} {traj.label}</span>}
      </div>

      {node.kind === 'thread' && node.glow === 'lit' && (
        <p className="font-sans text-[0.78rem] text-text-secondary">
          {node.observations} {node.observations === 1 ? 'observation' : 'observations'}
          {last && <> · last seen {relTime(last)}</>}
        </p>
      )}
      {node.kind === 'thread' && node.glow === 'opening' && (
        <p className="font-serif text-sm italic text-text-secondary">
          The threads it builds on are lit — this one tends to come on of its own accord when those settle.
        </p>
      )}

      {node.kind === 'objective' && (
        <div className="flex flex-col gap-sm">
          <p className="font-sans text-[0.78rem] text-text-secondary">
            Seen {snap.name} do this, even off-log? Confirm it to corroborate this objective.
          </p>
          <div>
            <DloConfirmButton
              confirmed={confirmed}
              pending={pending}
              descriptor={node.label}
              onToggle={() => onConfirm(!confirmed)}
            />
          </div>
        </div>
      )}

      {node.kind === 'moment' && node.moment && (
        <div className="flex flex-col gap-xs">
          <p className="font-sans text-[0.75rem] uppercase tracking-[0.06em] text-text-muted">
            {node.moment.date} · {relTime(node.moment.date)}
            {node.moment.provenance && <> · {PROVENANCE_LABEL[node.moment.provenance] ?? 'Hearth noticed'}</>}
          </p>
          {node.moment.tier && <p className="font-sans text-[0.78rem] text-text-secondary">Read as {TIER_LABEL[node.moment.tier].toLowerCase()}</p>}
          {node.moment.rationale && <p className="font-serif text-sm italic text-text-secondary">{node.moment.rationale}</p>}
          {node.moment.entryId && (
            <Link href={`/our-story/portfolio#entry-${node.moment.entryId}`}
                  className="hearth-press self-start font-sans text-[0.8rem] font-medium text-ember hover:text-ember-hover">
              Open in portfolio
            </Link>
          )}
        </div>
      )}

      {node.kind !== 'moment' && (
        <div className="flex flex-wrap gap-sm">
          {canTelescope && (
            <button type="button" onClick={() => onTelescope(node)}
                    className="rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover">
              Telescope from here
            </button>
          )}
          <button type="button" onClick={() => onOpenInTable(node)}
                  className="rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm text-text-secondary hover:border-border-medium hover:text-text-primary">
            Open in table
          </button>
        </div>
      )}

      {isApex && node.kind === 'objective' && (
        <section className="flex flex-col gap-sm">
          <h3 className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">Moments</h3>
          <Moments moments={moments} />
        </section>
      )}

      {relations.map((rel) => (
        <section key={rel.label} className="flex flex-col gap-xs">
          <h3 className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {rel.label} <span className="font-normal">· {rel.nodes.length}</span>
          </h3>
          <ul className="flex flex-col">
            {rel.nodes.map((n) => {
              const here = inView(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onVisit(n.id)}
                    aria-label={`${n.label}, ${stateLine(n)}${here ? '' : ' — telescopes onto it'}`}
                    className="flex w-full items-center gap-sm rounded-sm px-xs py-[5px] text-left hover:bg-surface-hover transition-colors"
                  >
                    <Swatch node={n} />
                    <span className={`min-w-0 flex-1 truncate font-serif text-[0.88rem] ${n.glow === 'lit' ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {n.label}
                    </span>
                    <span className="shrink-0 font-sans text-[0.68rem] text-text-muted">{stateLine(n)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
