'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { DloConfirmButton } from './DloConfirmButton';
import {
  ALL_THREADS,
  ORDERED_DOMAINS,
  THREADS_BY_ID,
  buildDLOs,
  domainColor,
  makeRng,
  threadCurrentTier,
  topoColumn,
  type LearnerSnapshot,
  type SanityDLO,
  type SynthDLO,
  type ThreadNode,
} from './topology';

const GalleryDefs = () => (
  <defs>
    <filter id="cap-halo-soft" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="1.6" />
    </filter>
    <filter id="cap-halo-strong" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3.2" />
    </filter>
    <filter id="cap-halo-ember" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2" />
    </filter>
    <radialGradient id="cap-band-atm" cx="40%" cy="50%" r="60%">
      <stop offset="0%" stopColor="var(--color-ember)" stopOpacity="0.05" />
      <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="cap-right-fade" x1="0%" x2="100%">
      <stop offset="0%" stopColor="var(--color-ember)" stopOpacity="0" />
      <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0.06" />
    </linearGradient>
  </defs>
);

/* ─── Depth 1 : Domains ─────────────────────────────────────────────────── */
export function GalleryDomains({
  snap, onDrill,
}: { snap: LearnerSnapshot; onDrill: (domainKey: string) => void }) {
  const W = 1200;
  const H = 780;
  const labelW = 220;
  const topPad = 56;
  const bottomPad = 36;
  const bandH = (H - topPad - bottomPad) / ORDERED_DOMAINS.length;

  const layout = useMemo(() => {
    const cols: Record<string, Record<string, number>> = {};
    const jitter: Record<string, number> = {};
    const rng = makeRng(42);
    ORDERED_DOMAINS.forEach((d) => {
      const threads = ALL_THREADS.filter((t) => t.domain === d.key);
      cols[d.key] = topoColumn(threads);
      threads.forEach((t) => { jitter[t.id] = (rng() - 0.5) * 6; });
    });
    return { cols, jitter };
  }, []);

  const maxCol = Math.max(
    1,
    ...ORDERED_DOMAINS.flatMap((d) => Object.values(layout.cols[d.key])),
  );
  const colSpan = (W - labelW - 64) / (maxCol + 1);

  const positions: Record<string, { x: number; y: number }> = {};
  ORDERED_DOMAINS.forEach((domain, di) => {
    const y = topPad + di * bandH;
    const cy = y + bandH / 2;
    const threads = ALL_THREADS.filter((t) => t.domain === domain.key);
    for (let c = 0; c <= maxCol; c++) {
      const peers = threads.filter((t) => layout.cols[domain.key][t.id] === c);
      peers.forEach((t, idx) => {
        const stackOffset = (idx - (peers.length - 1) / 2) * 13;
        positions[t.id] = {
          x: labelW + 28 + c * colSpan,
          y: cy + stackOffset + (layout.jitter[t.id] ?? 0),
        };
      });
    }
  });

  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number; o: number }> = [];
    const rng = makeRng(7);
    for (let i = 0; i < 110; i++) {
      arr.push({
        x: labelW + 12 + rng() * (W - labelW - 28),
        y: topPad - 4 + rng() * (H - topPad - bottomPad + 8),
        r: rng() < 0.82 ? 0.7 : rng() < 0.6 ? 1.1 : 1.6,
        o: 0.14 + rng() * 0.28,
      });
    }
    return arr;
  }, []);

  const edges: Array<{ key: string; src: { x: number; y: number }; tgt: { x: number; y: number }; crossDomain: boolean }> = [];
  ALL_THREADS.forEach((t) => {
    t.prereqs.forEach((p) => {
      const src = positions[p];
      const tgt = positions[t.id];
      const srcT = THREADS_BY_ID[p];
      if (!src || !tgt || !srcT) return;
      edges.push({ src, tgt, key: `${p}->${t.id}`, crossDomain: srcT.domain !== t.domain });
    });
  });

  return (
    <svg
      className="cap-gallery-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="cap-domains-title cap-domains-desc"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="cap-domains-title">{`Capability constellation for ${snap.name}`}</title>
      <desc id="cap-domains-desc">{`${ORDERED_DOMAINS.length} domains, each shown as a horizontal band. Bands read left-to-right as capability dependency, from foundational to synthesising.`}</desc>
      <GalleryDefs />

      <g aria-hidden="true">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--color-text-primary)" opacity={s.o} />
        ))}
      </g>

      <rect x={W - 300} y={topPad - 8} width={300} height={H - topPad - bottomPad + 16}
            fill="url(#cap-right-fade)" pointerEvents="none" />

      <text x={labelW} y={26} className="cap-band-meta" textAnchor="start">FOUNDATIONAL  ◂</text>
      <text x={(W + labelW) / 2} y={26} className="cap-band-meta" textAnchor="middle"
            style={{ fontStyle: 'italic', fill: 'var(--color-text-muted)' }}>
        each band reads left → right as capability dependency
      </text>
      <text x={W - 24} y={26} className="cap-band-meta" textAnchor="end">▸  SYNTHESISING</text>

      <g>
        {edges.map((e) => {
          const dx = e.tgt.x - e.src.x;
          const c1x = e.src.x + dx * 0.55;
          const path = `M ${e.src.x} ${e.src.y} C ${c1x} ${e.src.y}, ${c1x} ${e.tgt.y}, ${e.tgt.x} ${e.tgt.y}`;
          return (
            <path
              key={e.key}
              d={path}
              className={`cap-edge ${e.crossDomain ? 'cross-domain' : ''}`}
              strokeWidth={e.crossDomain ? 0.7 : 0.8}
              fill="none"
            />
          );
        })}
      </g>

      {ORDERED_DOMAINS.map((domain, i) => {
        const y = topPad + i * bandH;
        const cy = y + bandH / 2;
        const threads = ALL_THREADS.filter((t) => t.domain === domain.key);
        const active = threads.filter((t) => snap.threadState[t.id] === 'active').length;
        const ghosts = threads.filter((t) => snap.threadState[t.id] === 'ghost').length;
        const demos = threads.filter((t) => threadCurrentTier(t.id, snap) === 'demonstrating').length;
        const threadIds = new Set(threads.map((t) => t.id));
        const earned = snap.badges.filter((b) => b.status === 'awarded' && threadIds.has(b.thread)).length;
        const approaching = snap.badges.filter((b) => b.status === 'approaching' && threadIds.has(b.thread)).length;

        const ariaParts = [
          domain.label,
          `${active} active`,
          ghosts > 0 ? `${ghosts} opening up` : null,
          demos > 0 ? `${demos} demonstrating` : null,
          earned > 0 ? `${earned} badge${earned === 1 ? '' : 's'} earned` : null,
          approaching > 0 ? `${approaching} approaching` : null,
        ].filter(Boolean).join(', ');

        return (
          <g
            key={domain.key}
            className="cap-interactive"
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`${ariaParts}. Drill in to see threads.`}
            onClick={() => onDrill(domain.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDrill(domain.key);
              }
            }}
          >
            {i < ORDERED_DOMAINS.length - 1 && (
              <line x1={labelW - 12} y1={y + bandH} x2={W - 20} y2={y + bandH}
                    stroke="var(--color-border-subtle)" strokeWidth={0.5} opacity={0.7} />
            )}

            {active > 0 && (
              <ellipse cx={labelW + 200} cy={cy} rx={300} ry={bandH * 0.55}
                       fill="url(#cap-band-atm)" pointerEvents="none" />
            )}

            <text x={labelW - 22} y={cy - 8} textAnchor="end"
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, fill: 'var(--color-text-primary)' }}>
              {domain.label}
            </text>
            <text x={labelW - 22} y={cy + 9} textAnchor="end" className="cap-band-meta">
              {active} active{ghosts > 0 ? ` · ${ghosts} opening up` : ''}
            </text>
            {demos > 0 && (
              <text x={labelW - 22} y={cy + 24} textAnchor="end" className="cap-band-meta"
                    style={{ fill: 'var(--color-sage)', letterSpacing: '0.06em' }}>
                ● {demos} demonstrating
              </text>
            )}
            {(earned > 0 || approaching > 0) && (
              <text x={labelW - 22} y={cy + (demos > 0 ? 38 : 24)} textAnchor="end" className="cap-band-meta"
                    style={{ letterSpacing: '0.06em' }}>
                {earned > 0 && (
                  <tspan style={{ fill: 'var(--color-sage)' }}>★ {earned} earned</tspan>
                )}
                {earned > 0 && approaching > 0 && ' · '}
                {approaching > 0 && (
                  <tspan style={{ fill: 'var(--color-ember)' }}>◯ {approaching} approaching</tspan>
                )}
              </text>
            )}

            <circle cx={labelW - 10} cy={cy + 4} r={9} fill={domain.color} opacity={0.18} filter="url(#cap-halo-soft)" />
            <circle cx={labelW - 10} cy={cy + 4} r={5} fill={domain.color} />

            {threads.map((t) => {
              const pos = positions[t.id];
              if (!pos) return null;
              const state = snap.threadState[t.id];
              const tier = threadCurrentTier(t.id, snap);
              const obs = snap.observationsByThread[t.id] ?? 0;
              const isFoundational = t.foundational;

              let r: number, fill: string, stroke: string, op: number, hasOuterHalo: boolean;
              if (state === 'ghost') {
                r = 4.8; fill = 'transparent'; stroke = domain.color; op = 1; hasOuterHalo = false;
              } else if (state === 'dormant') {
                r = 3; fill = domain.color; stroke = 'none'; op = 0.22; hasOuterHalo = false;
              } else if (tier === 'demonstrating') {
                r = 6.5 + Math.min(1.5, obs * 0.05);
                fill = domain.color; stroke = 'none'; op = 1; hasOuterHalo = true;
              } else if (tier === 'developing') {
                r = 5.4; fill = domain.color; stroke = 'none'; op = 0.9; hasOuterHalo = false;
              } else if (tier === 'emerging') {
                r = 4.6; fill = domain.color; stroke = 'none'; op = 0.7; hasOuterHalo = false;
              } else {
                r = 3.5; fill = domain.color; stroke = 'none'; op = 0.4; hasOuterHalo = false;
              }

              return (
                <g key={t.id} className={state === 'ghost' ? 'cap-ghost' : undefined}>
                  {hasOuterHalo && (
                    <>
                      <circle cx={pos.x} cy={pos.y} r={r + 8} fill="var(--color-sage)" opacity={0.06} filter="url(#cap-halo-strong)" />
                      <circle cx={pos.x} cy={pos.y} r={r + 4} fill={domain.color} opacity={0.35} filter="url(#cap-halo-soft)" />
                      <circle cx={pos.x} cy={pos.y} r={r + 9} fill="none" stroke="var(--color-sage)" strokeWidth={0.7} opacity={0.4} />
                    </>
                  )}
                  {state === 'active' && !hasOuterHalo && (
                    <circle cx={pos.x} cy={pos.y} r={r + 2.5} fill={domain.color} opacity={0.25} filter="url(#cap-halo-soft)" />
                  )}
                  {state === 'ghost' && (
                    <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={domain.color} strokeWidth={0.6} opacity={0.4} />
                  )}
                  <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke}
                          strokeWidth={state === 'ghost' ? 1.2 : 0} opacity={op} />
                  {isFoundational && state !== 'dormant' && state !== 'ghost' && (
                    <>
                      <circle cx={pos.x} cy={pos.y} r={1.6} fill="var(--color-ember)" opacity={0.95} />
                      <circle cx={pos.x} cy={pos.y} r={3} fill="var(--color-ember)" opacity={0.25} filter="url(#cap-halo-ember)" />
                    </>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Depth 2 : Threads of one domain ────────────────────────────────── */
export function GalleryThreads({
  snap, domainKey, onDrill,
}: { snap: LearnerSnapshot; domainKey: string; onDrill: (t: ThreadNode) => void }) {
  const W = 1200, H = 580;
  const padL = 80, padR = 80, padT = 72, padB = 80;
  const domain = ORDERED_DOMAINS.find((d) => d.key === domainKey);
  const threads = useMemo(() => ALL_THREADS.filter((t) => t.domain === domainKey), [domainKey]);
  const cols = useMemo(() => topoColumn(threads), [threads]);
  const maxCol = Math.max(1, ...Object.values(cols));
  const colSpan = (W - padL - padR) / (maxCol + 1);

  const positions = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    const rng = makeRng(domainKey.charCodeAt(0) * 13 + 7);
    for (let c = 0; c <= maxCol; c++) {
      const colThreads = threads.filter((t) => cols[t.id] === c);
      const span = H - padT - padB;
      colThreads.forEach((t, i) => {
        const y = padT + ((i + 1) * span) / (colThreads.length + 1) + (rng() - 0.5) * 8;
        out[t.id] = { x: padL + c * colSpan + colSpan / 2, y };
      });
    }
    return out;
  }, [domainKey, threads, cols, maxCol, colSpan]);

  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number; o: number }> = [];
    const rng = makeRng(domainKey.charCodeAt(0) * 31 + 11);
    for (let i = 0; i < 70; i++) {
      arr.push({
        x: 8 + rng() * (W - 16),
        y: padT - 10 + rng() * (H - padT - padB + 20),
        r: rng() < 0.82 ? 0.7 : 1.2,
        o: 0.13 + rng() * 0.22,
      });
    }
    return arr;
  }, [domainKey]);

  const [hovered, setHovered] = useState<string | null>(null);

  const badgeByThread = useMemo(() => {
    const m: Record<string, LearnerSnapshot['badges'][number]> = {};
    snap.badges.forEach((b) => { m[b.thread] = b; });
    return m;
  }, [snap.badges]);

  const edges: Array<{ key: string; src: { x: number; y: number }; tgt: { x: number; y: number }; crossDomain: boolean; active: boolean }> = [];
  threads.forEach((t) => {
    t.prereqs.forEach((p) => {
      const src = positions[p]; const tgt = positions[t.id];
      if (!src || !tgt) return;
      const crossDomain = THREADS_BY_ID[p]?.domain !== t.domain;
      edges.push({
        key: `${p}->${t.id}`, src, tgt, crossDomain,
        active: !!hovered && (hovered === p || hovered === t.id),
      });
    });
  });

  if (!domain) return null;

  const earnedCount = threads.filter((t) => badgeByThread[t.id]?.status === 'awarded').length;
  const approachingCount = threads.filter((t) => badgeByThread[t.id]?.status === 'approaching').length;
  const badgeSummary = earnedCount > 0 || approachingCount > 0
    ? ` ${earnedCount > 0 ? `${earnedCount} badge${earnedCount === 1 ? '' : 's'} earned` : ''}${earnedCount > 0 && approachingCount > 0 ? ', ' : ''}${approachingCount > 0 ? `${approachingCount} approaching` : ''}.`
    : '';

  return (
    <svg
      className="cap-gallery-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`cap-threads-title-${domainKey} cap-threads-desc-${domainKey}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`cap-threads-title-${domainKey}`}>{`${domain.label} band for ${snap.name}`}</title>
      <desc id={`cap-threads-desc-${domainKey}`}>{`${threads.length} threads laid out left-to-right by capability dependency.${badgeSummary}`}</desc>
      <GalleryDefs />

      <g aria-hidden="true">
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--color-text-primary)" opacity={s.o} />
        ))}
      </g>

      <rect x={W - 300} y={padT - 20} width={300} height={H - padT - padB + 40}
            fill="url(#cap-right-fade)" pointerEvents="none" />

      <text x={padL} y={28} style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, fill: 'var(--color-text-primary)' }}>
        {domain.label}
      </text>
      <text x={padL} y={50} className="cap-band-meta">
        {threads.length} threads · capability dependency reads left → right
      </text>

      {Array.from({ length: maxCol + 1 }).map((_, c) => (
        <text key={c} x={padL + c * colSpan + colSpan / 2} y={H - 26}
              textAnchor="middle" className="cap-band-meta"
              style={{ opacity: 0.55, letterSpacing: '0.06em' }}>
          {c === 0 ? 'Foundational' : c === maxCol ? 'Downstream' : `Tier ${c + 1}`}
        </text>
      ))}
      {Array.from({ length: maxCol + 1 }).map((_, c) => (
        <line key={`g${c}`} x1={padL + c * colSpan + colSpan / 2}
              y1={padT + 4} x2={padL + c * colSpan + colSpan / 2}
              y2={H - padB + 4}
              stroke="var(--color-border-subtle)" strokeWidth={0.5} strokeDasharray="2 6" opacity={0.5} />
      ))}

      {edges.map((e) => {
        const dx = e.tgt.x - e.src.x;
        const c1x = e.src.x + dx * 0.5;
        const path = `M ${e.src.x} ${e.src.y} C ${c1x} ${e.src.y}, ${c1x} ${e.tgt.y}, ${e.tgt.x} ${e.tgt.y}`;
        return <path key={e.key} d={path}
          className={`cap-edge ${e.crossDomain ? 'cross-domain' : ''} ${e.active ? 'highlighted' : ''}`} />;
      })}

      {threads.map((t) => {
        const pos = positions[t.id]; if (!pos) return null;
        const state = snap.threadState[t.id];
        const tier = threadCurrentTier(t.id, snap);
        const obs = snap.observationsByThread[t.id] ?? 0;
        const isFoundational = t.foundational;
        const isHovered = hovered === t.id;

        let r: number, fill: string, stroke: string, op: number, hasOuterHalo: boolean;
        if (state === 'ghost') {
          r = 9; fill = 'transparent'; stroke = domain.color; op = 1; hasOuterHalo = false;
        } else if (state === 'dormant') {
          r = 6; fill = domain.color; stroke = 'none'; op = 0.25; hasOuterHalo = false;
        } else if (tier === 'demonstrating') {
          r = 11 + Math.min(3, obs * 0.1);
          fill = domain.color; stroke = 'none'; op = 1; hasOuterHalo = true;
        } else if (tier === 'developing') {
          r = 9; fill = domain.color; stroke = 'none'; op = 0.9; hasOuterHalo = false;
        } else if (tier === 'emerging') {
          r = 7.5; fill = domain.color; stroke = 'none'; op = 0.7; hasOuterHalo = false;
        } else {
          r = 6; fill = domain.color; stroke = 'none'; op = 0.4; hasOuterHalo = false;
        }

        const tierLabel = state === 'ghost' ? 'opening up' : state === 'dormant' ? 'dormant' : tier ?? 'unobserved';
        const badge = badgeByThread[t.id];
        const ariaLabel = `${t.name}, ${tierLabel}${badge ? `, badge ${badge.status}` : ''}. Drill in for objectives.`;

        return (
          <g key={t.id}
             className={`cap-interactive${state === 'ghost' ? ' cap-ghost' : ''}`}
             role="button"
             tabIndex={0}
             aria-label={ariaLabel}
             onMouseEnter={() => setHovered(t.id)}
             onMouseLeave={() => setHovered(null)}
             onFocus={() => setHovered(t.id)}
             onBlur={() => setHovered(null)}
             onClick={() => onDrill(t)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 onDrill(t);
               }
             }}
             style={{ cursor: 'pointer' }}>
            {hasOuterHalo && (
              <>
                <circle cx={pos.x} cy={pos.y} r={r + 14} fill="var(--color-sage)" opacity={0.07} filter="url(#cap-halo-strong)" />
                <circle cx={pos.x} cy={pos.y} r={r + 8} fill={domain.color} opacity={0.32} filter="url(#cap-halo-soft)" />
                <circle cx={pos.x} cy={pos.y} r={r + 12} fill="none" stroke="var(--color-sage)" strokeWidth={0.8} opacity={0.45} />
                <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke={domain.color} strokeWidth={0.6} opacity={0.5} />
              </>
            )}
            {state === 'active' && !hasOuterHalo && (
              <circle cx={pos.x} cy={pos.y} r={r + 4} fill={domain.color} opacity={0.25} filter="url(#cap-halo-soft)" />
            )}
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r={r + 10} fill="none" stroke="var(--color-ember)" strokeWidth={1} opacity={0.55} />
            )}
            {state === 'ghost' && (
              <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" stroke={domain.color} strokeWidth={0.7} opacity={0.4} />
            )}
            <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke}
                    strokeWidth={state === 'ghost' ? 1.5 : 0} opacity={op} />
            {isFoundational && state !== 'dormant' && state !== 'ghost' && (
              <>
                <circle cx={pos.x} cy={pos.y} r={2.6} fill="var(--color-ember)" opacity={0.95} />
                <circle cx={pos.x} cy={pos.y} r={5} fill="var(--color-ember)" opacity={0.3} filter="url(#cap-halo-ember)" />
              </>
            )}
            {(() => {
              const b = badgeByThread[t.id];
              if (!b) return null;
              const bx = pos.x + r * 0.78;
              const by = pos.y - r * 0.78;
              if (b.status === 'awarded') {
                return (
                  <g aria-label={`Badge earned${b.level ? ` — ${b.level}` : ''}`}>
                    <circle cx={bx} cy={by} r={6} fill="var(--color-sage)" opacity={0.18} filter="url(#cap-halo-strong)" />
                    <circle cx={bx} cy={by} r={3.4} fill="var(--color-sage)" />
                  </g>
                );
              }
              if (b.status === 'approaching') {
                return (
                  <g className="cap-badge-mark-approaching" aria-label="Badge approaching">
                    <circle cx={bx} cy={by} r={4} fill="none" stroke="var(--color-ember)" strokeWidth={1.4} />
                  </g>
                );
              }
              return null;
            })()}
            <text x={pos.x} y={pos.y + r + 16}
                  className={`cap-node-label ${state === 'active' ? 'cap-node-label-active' : state === 'ghost' ? 'cap-node-label-ghost' : ''}`}>
              {t.name}
            </text>
            {isFoundational && state === 'active' && (
              <text x={pos.x} y={pos.y + r + 30} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600, fill: 'var(--color-ember)', letterSpacing: '0.08em', textTransform: 'uppercase', pointerEvents: 'none' }}>
                Foundational
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Depth 3 : DLOs of one thread ─────────────────────────────────────
   Layout: three columns (emerging → developing → demonstrating), each stacking
   its DLOs vertically. n-DLOs-per-tier is supported — Sanity may publish any
   number per tier. DLO status (confirmed / emerging / not-started) is read from
   `learner_dlo_status` only — there is no separate per-column moments heuristic,
   which would contradict the authoritative status shown on each node. */
export function GalleryDLOs({
  snap, threadId, dlosByThread, onDrill,
}: { snap: LearnerSnapshot; threadId: string; dlosByThread?: Record<string, SanityDLO[]>; onDrill: (d: SynthDLO) => void }) {
  const thread = THREADS_BY_ID[threadId];
  const dlos = useMemo(() => buildDLOs(threadId, snap, dlosByThread), [threadId, snap, dlosByThread]);

  const tierOrder: Array<'emerging' | 'developing' | 'demonstrating'> = ['emerging', 'developing', 'demonstrating'];
  const dlosByTier = useMemo(() => {
    const by: Record<'emerging' | 'developing' | 'demonstrating', SynthDLO[]> = {
      emerging: [], developing: [], demonstrating: [],
    };
    for (const d of dlos) by[d.tier].push(d);
    return by;
  }, [dlos]);

  // Pack height grows with the tallest column so the SVG always fits without clipping.
  const maxRows = Math.max(1, ...tierOrder.map((t) => dlosByTier[t].length));
  const rowSpacing = 92;
  const topY = 120;          // first DLO row
  const W = 1100;
  const padL = 60, padR = 60;
  const colWidth = (W - padL - padR) / 3;
  const H = Math.max(460, topY + maxRows * rowSpacing + 60);

  if (!thread) return null;
  const dColor = domainColor(thread.domain);

  return (
    <svg
      className="cap-gallery-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`cap-dlos-title-${threadId} cap-dlos-desc-${threadId}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={`cap-dlos-title-${threadId}`}>{`Learning objectives for ${thread.name} — ${snap.name}`}</title>
      <desc id={`cap-dlos-desc-${threadId}`}>{`Three columns left-to-right: emerging, developing, demonstrating. Each column lists the DLOs at that tier, each showing its observation status.`}</desc>
      <GalleryDefs />
      <text x={padL} y={28} className="cap-band-label">{thread.name}</text>
      <text x={padL} y={48} className="cap-band-meta">
        Left → right reads as tier progression. The right edge is mastery.
      </text>

      {/* Tier column headers + progression rail */}
      {tierOrder.map((t, ci) => {
        const cx = padL + ci * colWidth + colWidth / 2;
        const tierColor = t === 'demonstrating' ? 'var(--color-sage)'
                        : t === 'developing'    ? 'var(--color-child-amber)'
                        :                          'var(--color-text-secondary)';
        return (
          <text key={`hdr-${t}`} x={cx} y={88} textAnchor="middle"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, fill: tierColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t}
          </text>
        );
      })}
      <line x1={padL + colWidth / 2} y1={topY - 8} x2={W - padR - colWidth / 2} y2={topY - 8}
            stroke="var(--color-border-medium)" strokeWidth={1} strokeDasharray="3 5" />

      {/* DLOs stacked per column */}
      {tierOrder.flatMap((t, ci) => {
        const cx = padL + ci * colWidth + colWidth / 2;
        const col = dlosByTier[t];
        return col.map((dlo, ri) => {
          const y = topY + ri * rowSpacing;
          const r = dlo.status === 'confirmed' ? 26 : dlo.status === 'emerging' ? 20 : 15;
          const fill = dlo.status === 'confirmed' ? dColor : dlo.status === 'emerging' ? dColor : 'transparent';
          const opacity = dlo.status === 'confirmed' ? 0.95 : dlo.status === 'emerging' ? 0.6 : 0.4;
          return (
            <g
              key={dlo.id}
              className="cap-interactive"
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={`${dlo.descriptor}, ${dlo.tier} tier, ${dlo.status}. Drill in for moments.`}
              onClick={() => onDrill(dlo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDrill(dlo);
                }
              }}
            >
              {dlo.status === 'confirmed' && (
                <circle cx={cx} cy={y} r={r + 6} fill="none" stroke={dColor} strokeWidth={1} opacity={0.3} />
              )}
              {dlo.tier === 'demonstrating' && dlo.status === 'confirmed' && (
                <circle cx={cx} cy={y} r={r + 14} fill="none" stroke="var(--color-sage)" strokeWidth={0.8} opacity={0.4} />
              )}
              <circle cx={cx} cy={y} r={r} fill={fill} stroke={dColor} strokeWidth={2} opacity={opacity} />
              <text x={cx} y={y + 5} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 600,
                             fill: dlo.status === 'confirmed' ? 'var(--color-surface-body)' : 'var(--color-text-primary)' }}>
                {dlo.glyph}
              </text>
              <text x={cx} y={y + r + 22} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 500, fill: 'var(--color-text-primary)' }}>
                <tspan>{dlo.descriptor.length > 56 ? `${dlo.descriptor.slice(0, 54)}…` : dlo.descriptor}</tspan>
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
}

/* ─── Depth 4 : Moments timeline ─────────────────────────────────────── */
type GalleryMoment = {
  id: string;
  date: string;
  title: string;
  source: 'logger' | 'module';
  tier: 'emerging' | 'developing' | 'demonstrating' | null;
  rationale: string | null;
  provenance: string | null;
};

// Today the live pipeline only ever writes `inferred` provenance, so "Hearth
// noticed" is the only label that renders — which is accurate, not misleading.
// `declared`/`asserted` are kept ready for the Phase-3 provenance wiring (set
// `declared` for module-sourced thread links, `asserted` on explicit parent
// confirmation); until that lands they are intentionally unreachable, not dead.
const GALLERY_PROVENANCE_LABEL: Record<string, string> = {
  inferred:  'Hearth noticed',
  declared:  'From a module',
  asserted:  'You confirmed',
};

const TIER_COLOR: Record<'emerging' | 'developing' | 'demonstrating', string> = {
  emerging: 'var(--color-text-muted)',
  developing: 'var(--color-child-amber)',
  demonstrating: 'var(--color-sage)',
};

export function GalleryMoments({
  snap, dlo, confirmed = false, pending = false, onConfirm,
}: {
  snap: LearnerSnapshot;
  dlo: SynthDLO;
  confirmed?: boolean;
  pending?: boolean;
  onConfirm?: (next: boolean) => void;
}) {
  const W = 1100, H = 460;
  const padL = 100, padR = 60;
  const [moments, setMoments] = useState<GalleryMoment[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // The confirm control sits above the timeline in every state — a parent can
  // assert an objective even with zero logged moments (the whole point: "I've
  // seen this, even off-log"). No-ops to a bare timeline when onConfirm is unset.
  const wrap = (inner: ReactNode) =>
    onConfirm ? (
      <div className="flex flex-col gap-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <p className="max-w-[56ch] font-sans text-[0.78rem] text-text-secondary">
            Seen {snap.name} do this, even off-log? Confirm it to corroborate this objective.
          </p>
          <DloConfirmButton
            confirmed={confirmed}
            pending={pending}
            descriptor={dlo.descriptor}
            onToggle={() => onConfirm(!confirmed)}
          />
        </div>
        {inner}
      </div>
    ) : (
      inner
    );

  useEffect(() => {
    let cancelled = false;
    // Reset stale data when the dependency changes; fresh fetch resolves into the same setter.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoments(null);

    // Try the DLO-precise endpoint first (post-Phase 2). Fall back to the
    // thread-level entries endpoint if it returns no rows — covers legacy
    // entries logged before observation_dlo_links existed.
    fetch(`/api/capabilities/${snap.id}/dlo-evidence?dloId=${encodeURIComponent(dlo.id)}`)
      .then((r) => r.json())
      .then((data: { evidence?: Array<{ entryId: string; title: string; dateOccurred: string; source: string; tier?: string | null; rationale?: string | null; provenance?: string | null }> }) => {
        if (cancelled) return;
        const evidence = Array.isArray(data?.evidence) ? data.evidence : [];
        if (evidence.length > 0) {
          const ms: GalleryMoment[] = evidence.map((e) => ({
            id: e.entryId,
            title: e.title,
            date: e.dateOccurred,
            source: e.source === 'module' ? 'module' : 'logger',
            tier: e.tier === 'emerging' || e.tier === 'developing' || e.tier === 'demonstrating' ? e.tier : null,
            rationale: e.rationale ?? null,
            provenance: e.provenance ?? null,
          }));
          setMoments(ms);
          return;
        }
        // Fallback path: thread-level matches (legacy entries without dlo links carry
        // no tier/rationale — only fields we have are title, date, source).
        fetch(`/api/entries?learnerId=${snap.id}&limit=500`)
          .then((r) => r.json())
          .then((entries: Array<{ id: string; title: string; dateOccurred: string; source: string; aiEnrichment: { capability_threads?: Array<{ thread_id: string; confidence: number }> } | null }>) => {
            if (cancelled) return;
            const ms: GalleryMoment[] = (Array.isArray(entries) ? entries : [])
              .filter((e) => e.aiEnrichment?.capability_threads?.some((c) => c.thread_id === dlo.thread && c.confidence >= 0.5))
              .map((e) => ({
                id: e.id, title: e.title, date: e.dateOccurred,
                source: e.source === 'module' ? 'module' : 'logger',
                tier: null, rationale: null, provenance: null,
              }));
            setMoments(ms);
          })
          .catch(() => { if (!cancelled) setMoments([]); });
      })
      .catch(() => { if (!cancelled) setMoments([]); });

    return () => { cancelled = true; };
  }, [snap.id, dlo.id, dlo.thread]);

  if (moments === null) {
    return wrap(
      <svg
        className="cap-gallery-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="status"
        aria-live="polite"
        aria-label="Loading moments"
      >
        <text x={W / 2} y={H / 2} textAnchor="middle"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fill: 'var(--color-text-muted)' }}>
          Loading moments…
        </text>
      </svg>
    );
  }

  if (moments.length === 0) {
    return wrap(
      <svg
        className="cap-gallery-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="No moments yet for this objective. Log a moment from the Logger and tag this thread."
      >
        <text x={W / 2} y={H / 2} textAnchor="middle"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '16px', fill: 'var(--color-text-secondary)' }}>
          No moments yet for this objective.
        </text>
        <text x={W / 2} y={H / 2 + 26} textAnchor="middle"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-text-muted)' }}>
          Log a moment from the Logger and tag this thread.
        </text>
      </svg>
    );
  }

  const sorted = [...moments].sort((a, b) => a.date.localeCompare(b.date));
  const minD = new Date(sorted[0].date).getTime();
  const maxD = new Date(sorted[sorted.length - 1].date).getTime();
  const range = Math.max(1, maxD - minD);
  const xFor = (d: string) => padL + ((new Date(d).getTime() - minD) / range) * (W - padL - padR);
  const yLogger = H / 2 + 40;
  const yModule = H / 2 - 40;

  return wrap(
    <svg
      className="cap-gallery-svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`cap-moments-title cap-moments-desc`}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="cap-moments-title">{`Moments for "${dlo.descriptor}" — ${snap.name}`}</title>
      <desc id="cap-moments-desc">{`${sorted.length} ${sorted.length === 1 ? 'moment' : 'moments'} plotted left-to-right by date. Top lane is module-sourced, bottom lane is parent-logged.`}</desc>
      <text x={padL} y={28} className="cap-band-label">Moments for &ldquo;{dlo.descriptor}&rdquo;</text>
      <text x={padL} y={48} className="cap-band-meta">
        Left → right is time. Top lane is module-sourced, bottom lane is parent-logged.
      </text>

      <text x={padL - 12} y={yModule + 5} textAnchor="end" className="cap-band-meta">MODULE</text>
      <text x={padL - 12} y={yLogger + 5} textAnchor="end" className="cap-band-meta">LOGGER</text>

      <line x1={padL} y1={yModule} x2={W - padR} y2={yModule}
            stroke="var(--color-border-subtle)" strokeWidth={1} strokeDasharray="2 4" />
      <line x1={padL} y1={yLogger} x2={W - padR} y2={yLogger}
            stroke="var(--color-border-subtle)" strokeWidth={1} strokeDasharray="2 4" />

      <text x={padL} y={H - 22} className="cap-band-meta">{sorted[0].date}</text>
      <text x={W - padR} y={H - 22} textAnchor="end" className="cap-band-meta">{sorted[sorted.length - 1].date}</text>

      {sorted.map((m) => {
        const x = xFor(m.date);
        const y = m.source === 'logger' ? yLogger : yModule;
        const color = m.source === 'logger' ? 'var(--color-ember)' : 'var(--color-text-secondary)';
        const tierColor = m.tier ? TIER_COLOR[m.tier] : null;
        const isHovered = hovered === m.id;
        return (
          <g key={m.id}
             onMouseEnter={() => setHovered(m.id)}
             onMouseLeave={() => setHovered(null)}
             onFocus={() => setHovered(m.id)}
             onBlur={() => setHovered(null)}
             style={{ cursor: m.rationale ? 'help' : 'default' }}
             tabIndex={m.rationale ? 0 : -1}
             aria-label={m.rationale ? `${m.title}. ${m.tier ?? ''} tier. ${m.rationale}` : m.title}>
            <line x1={x} y1={y} x2={x} y2={H / 2} stroke={color} strokeWidth={1} opacity={0.3} strokeDasharray="2 3" />
            {tierColor && (
              <circle cx={x} cy={y} r={10} fill="none" stroke={tierColor} strokeWidth={1.4} opacity={0.7} />
            )}
            <circle cx={x} cy={y} r={7} fill={color} opacity={0.9} />
            <text x={x} y={y + (m.source === 'logger' ? 26 : -16)} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-serif)', fontSize: '11px', fill: 'var(--color-text-primary)' }}>
              {m.title.length > 38 ? `${m.title.slice(0, 36)}…` : m.title}
            </text>
            {m.provenance && (
              <text x={x} y={y + (m.source === 'logger' ? 38 : -28)} textAnchor="middle"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fill: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                {GALLERY_PROVENANCE_LABEL[m.provenance] ?? 'Hearth noticed'}
              </text>
            )}
            {isHovered && m.rationale && (
              <g pointerEvents="none">
                <rect
                  x={Math.max(padL - 8, Math.min(W - padR - 280, x - 140))}
                  y={m.source === 'logger' ? y + 40 : y - 76}
                  width={280}
                  height={64}
                  rx={6}
                  fill="var(--color-surface-raised)"
                  stroke="var(--color-border-medium)"
                  strokeWidth={0.6}
                  opacity={0.98}
                />
                <foreignObject
                  x={Math.max(padL - 8, Math.min(W - padR - 280, x - 140)) + 10}
                  y={(m.source === 'logger' ? y + 40 : y - 76) + 8}
                  width={260}
                  height={48}
                  style={{ pointerEvents: 'none' }}
                >
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '11px',
                    lineHeight: 1.4,
                    fontStyle: 'italic',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {m.rationale}
                  </div>
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
