'use client';

/* The constellation as a linked graph — Obsidian's graph view for a child's
   capability universe. Every domain, thread and learning objective is a node,
   every catalog relation a link, laid out by a live force simulation the
   parent can pan, zoom and drag. Hovering a node lights its neighbourhood.
   Telescoping onto a node (the drill depths 2–4) keeps only what is within
   reach of it and fans that neighbourhood out in a cone from the node, each
   ring one more link away; telescoping onto an objective adds the moments
   that evidence it.

   React renders structure and state classes; the simulation writes positions
   straight to the DOM each frame, so a few hundred nodes move without a
   re-render per tick. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { MagnifyingGlass } from '@/components/icons';
import { ConstellationPanel } from './ConstellationPanel';
import {
  buildConstellationGraph,
  describeNode,
  domainNodeId,
  focusForNode,
  nodeIdForFocus,
  nodeRadius,
  objectiveNodeId,
  subgraph,
  telescopeHops,
  threadNodeId,
  withMoments,
  type ConstellationGraph as Graph,
  type Focus,
  type GraphLinkKind,
  type GraphNode,
  type GraphNodeKind,
} from './graph-model';
import {
  TICKS_TO_SETTLE,
  coneAngles,
  coneHalfAngle,
  createSimulation,
  seedClusters,
  seedCone,
  type Point,
  type Simulation,
} from './force-layout';
import { useDloMoments } from './use-dlo-moments';
import { ORDERED_DOMAINS, type LearnerSnapshot, type SanityDLO } from './topology';

type Depth = 1 | 2 | 3 | 4;
type Camera = { x: number; y: number; k: number };

const LINK_DISTANCE: Record<GraphLinkKind, number> = {
  'part-of': 50,
  'leads-to': 84,
  next: 13,
  evidence: 30,
};
const CHARGE: Record<GraphNodeKind, number> = {
  domain: -420,
  thread: -150,
  objective: -22,
  moment: -45,
};
/** World units between the telescope's rings (one ring per link of reach). */
export const RING_GAP = 140;
/** Most moments drawn as nodes; the panel lists them all. */
export const MAX_MOMENT_NODES = 30;
const ZOOM_MIN = 0.12;
const ZOOM_MAX = 5;
const FIT_MAX_ZOOM = 2.2;
const DRAG_THRESHOLD_PX = 4;
/** Paint order: small satellites under threads under hubs. */
const KIND_ORDER: Record<GraphNodeKind, number> = { objective: 0, moment: 1, thread: 2, domain: 3 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const DOMAIN_SHORT: Record<string, string> = Object.fromEntries(ORDERED_DOMAINS.map((d) => [d.key, d.short]));

/** The label drawn on the canvas — short, since the panel carries the full text. */
export function canvasLabel(node: GraphNode): string {
  if (node.kind === 'domain') return DOMAIN_SHORT[node.ref] ?? node.label;
  const max = node.kind === 'thread' ? 40 : 34;
  return node.label.length > max ? `${node.label.slice(0, max - 1)}…` : node.label;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ConstellationGraph({
  snap,
  dlosByThread,
  depth,
  focus,
  confirmedDloIds,
  pendingDloIds,
  onConfirmDlo,
  onTelescope,
  onOpenInTable,
  onReset,
}: {
  snap: LearnerSnapshot;
  dlosByThread: Record<string, SanityDLO[]>;
  depth: Depth;
  focus: Focus;
  confirmedDloIds: ReadonlySet<string>;
  pendingDloIds: ReadonlySet<string>;
  onConfirmDlo: (dloId: string, next: boolean) => void;
  /** Re-root the telescope on a node (sets the drill focus + depth). */
  onTelescope: (focus: Focus, depth: 2 | 3 | 4) => void;
  onOpenInTable: (focus: Focus, depth: 2 | 3 | 4) => void;
  /** Back out to the whole constellation (depth 1). */
  onReset: () => void;
}) {
  const [showObjectives, setShowObjectives] = useState(true);
  const [showUnlit, setShowUnlit] = useState(true);
  // null = automatic: two links on a wide stage, one on a phone, where a
  // second ring's names would run into the first's.
  const [reachChoice, setReach] = useState<1 | 2 | 3 | null>(null);
  const [query, setQuery] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  // A phone's stage is taller than wide: the cone opens wider there, so its
  // rings spread into the height instead of shrinking to fit the width.
  const [portrait, setPortrait] = useState(false);
  const reach: 1 | 2 | 3 = reachChoice ?? (portrait ? 1 : 2);

  /* ── Graph: the whole constellation, then the telescope's slice of it ── */
  const base = useMemo(() => buildConstellationGraph(snap, dlosByThread, {
    includeObjectives: showObjectives,
    includeUnlit: showUnlit,
    // The telescope apex survives the filters even when it is unlit.
    keep: [
      focus.domain ? domainNodeId(focus.domain) : '',
      focus.thread ? threadNodeId(focus.thread) : '',
      focus.dlo ? objectiveNodeId(focus.dlo) : '',
    ],
    confirmedDloIds,
  }), [snap, dlosByThread, showObjectives, showUnlit, focus.domain, focus.thread, focus.dlo, confirmedDloIds]);

  const apexId = depth > 1 ? nodeIdForFocus(focus, base) : null;
  const apex = apexId ? base.byId[apexId] : null;
  const moments = useDloMoments(
    snap.id,
    apex?.kind === 'objective' && apex.thread ? { id: apex.ref, thread: apex.thread } : null,
  );
  const graph: Graph = useMemo(
    () => (apexId && moments?.length ? withMoments(base, apexId, moments.slice(0, MAX_MOMENT_NODES)) : base),
    [base, apexId, moments],
  );
  const hops = useMemo(() => (apexId ? telescopeHops(graph, apexId, reach) : null), [graph, apexId, reach]);
  const view: Graph = useMemo(() => (hops ? subgraph(graph, hops.keys()) : graph), [graph, hops]);

  const cone = useMemo(() => {
    if (!apexId || !hops) return null;
    const counts: number[] = [];
    for (const h of hops.values()) counts[h] = (counts[h] ?? 0) + 1;
    const halfAngle = coneHalfAngle(
      Array.from(counts, (c) => c ?? 0),
      RING_GAP,
      portrait ? 30 : 20,
      portrait ? { min: Math.PI / 3.4, max: Math.PI / 2.3 } : undefined,
    );
    const hopById = Object.fromEntries(hops);
    return {
      apex: apexId,
      hops: hopById,
      ringGap: RING_GAP,
      halfAngle,
      // Map order is breadth-first, so neighbours share a stretch of their ring.
      angles: coneAngles([...hops.keys()], hopById, halfAngle),
      // Rings drawn (and framed) out to the chosen reach, even an empty one.
      reach,
    };
  }, [apexId, hops, reach, portrait]);

  // The simulation restarts only when the set of nodes/links changes — a
  // confirmation or a hover changes how a node looks, not where it sits.
  const structureKey = useMemo(
    () => `${apexId ?? ''}#${reach}#${cone ? portrait : ''}#${view.nodes.map((n) => n.id).join(',')}#${view.links.map((l) => l.id).join(',')}`,
    [view, apexId, reach, cone, portrait],
  );

  const selectedId = selection && graph.byId[selection] ? selection : null;
  const selected = selectedId ? graph.byId[selectedId] : apex;

  /* ── Simulation + painting (refs, never state: they change every frame) ── */
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const simRef = useRef<Simulation | null>(null);
  const coneRef = useRef(cone);
  const globalPositionsRef = useRef<Record<string, Point> | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const cameraTargetRef = useRef<Camera | null>(null);
  const autoFitRef = useRef(true);
  const snapCameraRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const elsRef = useRef<{ nodes: Array<[string, SVGGElement]>; links: Array<[string, string, SVGLineElement]> }>({ nodes: [], links: [] });
  const focusRequestRef = useRef<string | null>(null);

  const viewportSize = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 && rect.height > 0 ? { w: rect.width, h: rect.height } : null;
  };

  const fitTarget = (): Camera | null => {
    const sim = simRef.current;
    const size = viewportSize();
    if (!sim || !size) return null;
    let { minX, minY, maxX, maxY } = sim.bounds();
    const c = coneRef.current;
    if (c) {
      const outer = (c.reach + 0.35) * c.ringGap;
      minX = Math.min(minX, -30);
      maxX = Math.max(maxX, outer);
      minY = Math.min(minY, -outer * Math.sin(c.halfAngle) - 16);
      maxY = Math.max(maxY, outer * Math.sin(c.halfAngle) + 16);
    }
    const pad = 36;
    // Labels keep a constant screen size, so leave screen room for them: the
    // cone's names run out to the right of each star, the apex's sits below.
    const padL = pad + (c ? 40 : 0);
    const padR = pad + (c ? Math.min(150, size.w * 0.3) : 0);
    const k = clamp(
      Math.min((size.w - padL - padR) / Math.max(1, maxX - minX), (size.h - pad * 2) / Math.max(1, maxY - minY)),
      ZOOM_MIN,
      FIT_MAX_ZOOM,
    );
    return {
      k,
      x: padL + (size.w - padL - padR) / 2 - ((minX + maxX) / 2) * k,
      y: size.h / 2 - ((minY + maxY) / 2) * k,
    };
  };

  /** Ease the camera toward its target; true while it is still moving. */
  const stepCamera = (): boolean => {
    const target = cameraTargetRef.current ?? (autoFitRef.current ? fitTarget() : null);
    if (!target) return false;
    const cam = cameraRef.current;
    const t = snapCameraRef.current || reducedMotionRef.current ? 1 : 0.14;
    snapCameraRef.current = false;
    cam.x += (target.x - cam.x) * t;
    cam.y += (target.y - cam.y) * t;
    cam.k += (target.k - cam.k) * t;
    const moving = Math.abs(target.x - cam.x) > 0.5 || Math.abs(target.y - cam.y) > 0.5 || Math.abs(target.k - cam.k) > 0.002;
    if (!moving) {
      cameraRef.current = { ...target };
      cameraTargetRef.current = null;
    }
    return moving;
  };

  const paint = () => {
    const sim = simRef.current;
    const svg = svgRef.current;
    if (!sim || !svg) return;
    const cam = cameraRef.current;
    viewportRef.current?.setAttribute('transform', `translate(${cam.x.toFixed(2)},${cam.y.toFixed(2)}) scale(${cam.k.toFixed(4)})`);
    svg.style.setProperty('--cg-k', cam.k.toFixed(4));
    svg.dataset.zoom = cam.k < 0.55 ? 'far' : cam.k < 1.35 ? 'mid' : 'near';
    for (const [id, el] of elsRef.current.nodes) {
      const p = sim.position(id);
      if (p) el.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
    }
    for (const [s, t, el] of elsRef.current.links) {
      const a = sim.position(s);
      const b = sim.position(t);
      if (!a || !b) continue;
      el.setAttribute('x1', a.x.toFixed(1));
      el.setAttribute('y1', a.y.toFixed(1));
      el.setAttribute('x2', b.x.toFixed(1));
      el.setAttribute('y2', b.y.toFixed(1));
    }
  };

  const frame = () => {
    const sim = simRef.current;
    let busy = false;
    if (sim && !sim.settled()) {
      sim.tick(2);
      busy = true;
    }
    if (stepCamera()) busy = true;
    paint();
    rafRef.current = busy ? requestAnimationFrame(frame) : null;
  };

  const ensureLoop = () => {
    if (rafRef.current !== null) return;
    if (typeof requestAnimationFrame !== 'function') {
      simRef.current?.tick(TICKS_TO_SETTLE);
      stepCamera();
      paint();
      return;
    }
    rafRef.current = requestAnimationFrame(frame);
  };

  // Build (or rebuild) the simulation when the structure changes.
  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion();
    const prev = simRef.current;
    const prevPositions = prev?.positions() ?? null;
    if (prev && !coneRef.current && prevPositions) globalPositionsRef.current = prevPositions;
    coneRef.current = cone;

    // In the cone the rings and resting angles place things; repulsion only
    // needs to keep neighbours apart, so a hub can't shove its ring aside.
    const chargeScale = cone ? 0.3 : 1;
    const layoutNodes = view.nodes.map((n) => ({
      id: n.id,
      r: nodeRadius(n, view.degree[n.id]),
      charge: CHARGE[n.kind] * chargeScale,
    }));
    const layoutLinks = view.links.map((l) => {
      if (cone) {
        // In the cone the rings carry the structure: a link spans the gap
        // between its ends' rings and pulls gently; a link along one ring
        // barely pulls at all, so siblings keep their even spacing.
        const span = Math.abs((cone.hops[l.source] ?? 0) - (cone.hops[l.target] ?? 0));
        return {
          source: l.source,
          target: l.target,
          distance: Math.max(0.45, span) * cone.ringGap,
          strength: (span === 0 ? 0.04 : 0.3) / Math.max(1, Math.min(view.degree[l.source], view.degree[l.target])),
        };
      }
      return {
        source: l.source,
        target: l.target,
        distance: l.kind === 'leads-to' && l.crossDomain ? LINK_DISTANCE['leads-to'] * 1.3 : LINK_DISTANCE[l.kind],
      };
    });

    let initial: Record<string, Point>;
    if (cone) {
      // Breadth-first order, so a node's neighbours sit together on the next ring.
      const order = Object.keys(cone.hops);
      const seeded = seedCone(order, cone.hops, cone.ringGap, cone.halfAngle);
      // Morph from wherever the previous layout had these nodes, shifted so
      // the new apex sits at the origin; anything new starts on its ring.
      const origin = prevPositions?.[cone.apex];
      initial = { ...seeded };
      if (prevPositions && origin) {
        for (const id of order) {
          const p = prevPositions[id];
          if (p && id !== cone.apex) initial[id] = { x: p.x - origin.x, y: p.y - origin.y };
        }
      }
    } else {
      const anchors = view.nodes.map((n) => ({
        id: n.id,
        anchor: n.kind === 'domain' ? null
          : n.kind === 'thread' ? domainNodeId(n.domain)
            : n.kind === 'objective' && n.thread ? threadNodeId(n.thread)
              : null,
      }));
      initial = { ...seedClusters(anchors, { radius: 300, spread: 60 }), ...(globalPositionsRef.current ?? {}) };
    }

    const size = viewportSize();
    const sim = createSimulation(layoutNodes, layoutLinks, {
      seed: 11,
      initial,
      cone: cone ?? undefined,
      aspect: size ? size.w / size.h : 1,
    });
    if (reducedMotionRef.current) sim.tick(TICKS_TO_SETTLE);
    else if (!prev) sim.tick(cone ? 40 : 90);
    simRef.current = sim;
    autoFitRef.current = true;
    cameraTargetRef.current = null;
    if (!prev) snapCameraRef.current = true;
    ensureLoop();
    // `view`/`cone` are captured through structureKey: a new key means a new layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  useEffect(() => () => {
    if (rafRef.current !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  // After every render: re-collect the elements the painter moves, place
  // them, and honour a pending keyboard-focus request.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    elsRef.current = {
      nodes: Array.from(svg.querySelectorAll<SVGGElement>('[data-pos]')).map((el) => [el.dataset.pos!, el]),
      links: Array.from(svg.querySelectorAll<SVGLineElement>('[data-link]')).map((el) => [el.dataset.source!, el.dataset.target!, el]),
    };
    paint();
    const want = focusRequestRef.current;
    if (want) {
      focusRequestRef.current = null;
      Array.from(svg.querySelectorAll<SVGGElement>('[data-node]'))
        .find((el) => el.dataset.node === want)
        ?.focus({ preventScroll: true });
    }
  });

  // Re-fit when the viewport resizes (rotation, panel collapse), and note
  // whether the stage is portrait so the cone can open wider into the height.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(() => {
      const size = viewportSize();
      if (size) setPortrait(size.h > size.w * 1.1);
      if (autoFitRef.current) ensureLoop();
    });
    ro.observe(svg);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Camera controls ── */
  const zoomAround = (sx: number, sy: number, nextK: number, smooth: boolean) => {
    const cam = cameraTargetRef.current ?? cameraRef.current;
    const k = clamp(nextK, ZOOM_MIN, ZOOM_MAX);
    const wx = (sx - cam.x) / cam.k;
    const wy = (sy - cam.y) / cam.k;
    const next = { k, x: sx - wx * k, y: sy - wy * k };
    autoFitRef.current = false;
    if (smooth) {
      cameraTargetRef.current = next;
      ensureLoop();
    } else {
      cameraTargetRef.current = null;
      cameraRef.current = next;
      paint();
    }
  };

  const zoomBy = (factor: number) => {
    const size = viewportSize();
    if (!size) return;
    const cam = cameraTargetRef.current ?? cameraRef.current;
    zoomAround(size.w / 2, size.h / 2, cam.k * factor, true);
  };

  const fit = () => {
    autoFitRef.current = true;
    cameraTargetRef.current = null;
    ensureLoop();
  };

  const panTo = (id: string) => {
    const p = simRef.current?.position(id);
    const size = viewportSize();
    if (!p || !size) return;
    const k = Math.max(cameraRef.current.k, 0.9);
    autoFitRef.current = false;
    cameraTargetRef.current = { k, x: size.w / 2 - p.x * k, y: size.h / 2 - p.y * k };
    ensureLoop();
  };

  // Wheel zoom needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      zoomAround(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current.k * factor, false);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Pointer: pan the background, drag a node, pinch to zoom ── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { type: 'pan'; startX: number; startY: number; cam: Camera }
    | { type: 'node'; id: string; startX: number; startY: number; dragging: boolean }
    | { type: 'pinch'; dist: number; cam: Camera; mid: { x: number; y: number } }
    | null
  >(null);
  const suppressClickRef = useRef(false);

  const toWorld = (clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    const cam = cameraRef.current;
    return { x: (clientX - rect.left - cam.x) / cam.k, y: (clientY - rect.top - cam.y) / cam.k };
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const prev = gesture.current;
      if (prev?.type === 'node' && prev.dragging) {
        simRef.current?.unpin(prev.id);
        simRef.current?.setAlphaTarget(0);
      }
      const [a, b] = [...pointers.current.values()];
      const rect = svg.getBoundingClientRect();
      gesture.current = {
        type: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        cam: { ...cameraRef.current },
        mid: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
      };
      svg.setPointerCapture?.(e.pointerId);
      return;
    }
    const nodeEl = (e.target as Element).closest?.('[data-node]') as SVGGElement | null;
    if (nodeEl?.dataset.node) {
      // No capture yet: a press that never moves stays a click / double-click on the node.
      gesture.current = { type: 'node', id: nodeEl.dataset.node, startX: e.clientX, startY: e.clientY, dragging: false };
    } else {
      gesture.current = { type: 'pan', startX: e.clientX, startY: e.clientY, cam: { ...cameraRef.current } };
      svg.setPointerCapture?.(e.pointerId);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const k = clamp(g.cam.k * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist), ZOOM_MIN, ZOOM_MAX);
      const wx = (g.mid.x - g.cam.x) / g.cam.k;
      const wy = (g.mid.y - g.cam.y) / g.cam.k;
      autoFitRef.current = false;
      cameraTargetRef.current = null;
      cameraRef.current = { k, x: g.mid.x - wx * k, y: g.mid.y - wy * k };
      paint();
    } else if (g.type === 'pan') {
      autoFitRef.current = false;
      cameraTargetRef.current = null;
      cameraRef.current = { ...g.cam, x: g.cam.x + e.clientX - g.startX, y: g.cam.y + e.clientY - g.startY };
      paint();
    } else if (g.type === 'node') {
      if (!g.dragging && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD_PX) return;
      const sim = simRef.current;
      if (!sim) return;
      if (!g.dragging) {
        g.dragging = true;
        svgRef.current?.setPointerCapture?.(e.pointerId);
        sim.setAlphaTarget(0.3);
      }
      const w = toWorld(e.clientX, e.clientY);
      sim.pin(g.id, w.x, w.y);
      ensureLoop();
    }
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (g?.type === 'node' && g.dragging) {
      suppressClickRef.current = true;
      simRef.current?.unpin(g.id);
      simRef.current?.setAlphaTarget(0);
      ensureLoop();
    }
    // A tap on empty sky clears the selection.
    if (g?.type === 'pan' && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD_PX) {
      setSelection(null);
    }
    if (pointers.current.size === 0) gesture.current = null;
    else if (g?.type === 'pinch') gesture.current = null;
  };

  /* ── Selection, hover, keyboard ── */
  const telescopeTo = (node: GraphNode) => {
    const target = focusForNode(node);
    if (target) onTelescope(target.focus, target.depth);
  };

  const select = (id: string | null, { pan = false, focusNode = false } = {}) => {
    setSelection(id);
    if (id && pan) panTo(id);
    if (id && focusNode) focusRequestRef.current = id;
  };

  /** Select a related node: in view → select it; out of view → telescope onto it. */
  const visit = (id: string) => {
    if (view.byId[id]) {
      select(id, { pan: true, focusNode: true });
      return;
    }
    const node = graph.byId[id];
    if (node) {
      setSelection(id);
      telescopeTo(node);
    }
  };

  const onNodeClick = (id: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    select(id);
  };

  const ARROW_ANGLE: Record<string, number> = { ArrowRight: 0, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowUp: -Math.PI / 2 };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const nodeEl = (e.target as Element).closest?.('[data-node]') as SVGGElement | null;
    const id = nodeEl?.dataset.node ?? null;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.25); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.8); return; }
    if (!id) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const node = view.byId[id];
      if (!node) return;
      // Enter selects; Enter again on the selection telescopes onto it.
      if (selectedId === id && node.kind !== 'moment' && id !== apexId) telescopeTo(node);
      else select(id);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setSelection(null);
      return;
    }
    const want = ARROW_ANGLE[e.key];
    if (want === undefined) return;
    e.preventDefault();
    const sim = simRef.current;
    const here = sim?.position(id);
    if (!sim || !here) return;
    let best: string | null = null;
    let bestScore = Infinity;
    for (const n of view.neighbours[id] ?? []) {
      const p = sim.position(n);
      if (!p) continue;
      const angle = Math.atan2(p.y - here.y, p.x - here.x);
      const diff = Math.abs(Math.atan2(Math.sin(angle - want), Math.cos(angle - want)));
      const score = diff * 1000 + Math.hypot(p.x - here.x, p.y - here.y);
      if (score < bestScore) { bestScore = score; best = n; }
    }
    if (best) select(best, { pan: true, focusNode: true });
  };

  /* ── What lights up: hover beats selection beats search ── */
  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () => (needle ? view.nodes.filter((n) => n.label.toLowerCase().includes(needle)).map((n) => n.id) : []),
    [view, needle],
  );
  // Selecting the apex itself lights nothing: the whole cone is its neighbourhood.
  const centreCandidate = hoverId ?? (selectedId !== apexId ? selectedId : null);
  const centre = centreCandidate && view.byId[centreCandidate] ? centreCandidate : null;
  const lit = useMemo(() => {
    if (centre) return new Set([centre, ...(view.neighbours[centre] ?? [])]);
    if (needle) return new Set(matches);
    return null;
  }, [centre, view, needle, matches]);

  const tabStop = (selectedId && view.byId[selectedId] ? selectedId : null)
    ?? apexId
    ?? view.nodes.find((n) => n.kind === 'thread' && n.glow === 'lit')?.id
    ?? view.nodes[0]?.id
    ?? null;

  const orderedNodes = useMemo(
    () => [...view.nodes].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
    [view],
  );

  const litThreads = graph.nodes.filter((n) => n.kind === 'thread' && n.glow === 'lit').length;
  const totalThreads = base.nodes.filter((n) => n.kind === 'thread').length;
  const hintId = `cg-hint-${snap.id}`;
  const outer = cone ? (reach + 0.35) * cone.ringGap : 0;

  return (
    <div className="flex flex-col gap-md">
      {/* Controls: search + display filters (Obsidian's filter panel, trimmed) */}
      <div className="flex flex-wrap items-center gap-sm">
        <form
          role="search"
          className="relative flex min-w-0 flex-1 basis-[14rem] items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (matches[0]) select(matches[0], { pan: true, focusNode: true });
          }}
        >
          <span aria-hidden className="pointer-events-none absolute left-sm inline-flex text-text-muted">
            <MagnifyingGlass size={16} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a thread or objective"
            aria-label="Find a thread or objective in the constellation"
            className="w-full rounded-md border border-border-subtle bg-surface-input py-xs pl-[2rem] pr-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
          />
        </form>
        {needle && (
          <span className="font-sans text-[0.75rem] text-text-muted" aria-live="polite">
            {matches.length === 0 ? 'No matches' : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`}
          </span>
        )}
        <button type="button" aria-pressed={showObjectives} onClick={() => setShowObjectives((v) => !v)}
                className={`cap-chip${showObjectives ? ' active' : ''}`}>
          Objectives
        </button>
        <button type="button" aria-pressed={showUnlit} onClick={() => setShowUnlit((v) => !v)}
                className={`cap-chip${showUnlit ? ' active' : ''}`}>
          Not yet lit
        </button>
        {cone && (
          <div role="radiogroup" aria-label="Telescope reach" className="inline-flex items-center gap-[2px] rounded-md border border-border-subtle bg-surface-panel p-[3px]">
            <span className="px-xs font-sans text-[0.72rem] text-text-muted">Reach</span>
            {([1, 2, 3] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reach === r}
                aria-label={`${r} ${r === 1 ? 'link' : 'links'}`}
                onClick={() => setReach(r)}
                className={`rounded-sm px-sm py-[2px] font-sans text-[0.75rem] transition-colors ${
                  reach === r ? 'bg-ember font-semibold text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-md lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="cg-stage relative min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-surface-panel">
          {cone && apex && (
            <div className="pointer-events-none absolute left-md top-md z-[1] flex max-w-[70%] flex-wrap items-center gap-sm">
              <button
                type="button"
                onClick={onReset}
                className="pointer-events-auto rounded-full border border-border-subtle bg-surface-raised px-md py-xs font-sans text-[0.75rem] text-text-secondary hover:border-border-medium hover:text-text-primary"
              >
                ← Whole constellation
              </button>
              <span className="font-sans text-[0.7rem] uppercase tracking-[0.06em] text-text-muted">
                Telescope · {reach} {reach === 1 ? 'link' : 'links'} out
              </span>
            </div>
          )}

          <svg
            ref={svgRef}
            className={`cg-svg${lit ? ' has-highlight' : ''}`}
            data-mode={cone ? 'telescope' : 'whole'}
            role="group"
            aria-label={cone && apex
              ? `Telescope from ${apex.label}: ${view.nodes.length - 1} linked ${view.nodes.length === 2 ? 'node' : 'nodes'} within ${reach} ${reach === 1 ? 'link' : 'links'}`
              : `${snap.name}'s constellation: ${litThreads} of ${totalThreads} threads lit`}
            aria-describedby={hintId}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <g ref={viewportRef}>
              {cone && (
                <g aria-hidden="true" className="cg-guides">
                  {/* The telescope's field of view: everything within reach sits inside it. */}
                  <path
                    className="cg-cone-field"
                    d={`M 0 0 L ${outer * Math.cos(cone.halfAngle)} ${-outer * Math.sin(cone.halfAngle)} A ${outer} ${outer} 0 0 1 ${outer * Math.cos(cone.halfAngle)} ${outer * Math.sin(cone.halfAngle)} Z`}
                  />
                  <path
                    className="cg-cone-edge"
                    d={`M 0 0 L ${outer * Math.cos(cone.halfAngle)} ${-outer * Math.sin(cone.halfAngle)} M 0 0 L ${outer * Math.cos(cone.halfAngle)} ${outer * Math.sin(cone.halfAngle)}`}
                  />
                  {Array.from({ length: reach }, (_, i) => i + 1).map((h) => {
                    const R = h * cone.ringGap;
                    const a = cone.halfAngle;
                    // Named just outside the cone's upper edge, where no star sits.
                    const la = a + 0.16;
                    return (
                      <g key={h}>
                        <path className="cg-ring" d={`M ${R * Math.cos(a)} ${-R * Math.sin(a)} A ${R} ${R} 0 0 1 ${R * Math.cos(a)} ${R * Math.sin(a)}`} />
                        <text className="cg-ring-label" x={R * Math.cos(la)} y={-R * Math.sin(la)} textAnchor="middle">
                          {h === 1 ? '1 link away' : `${h} links away`}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              <g aria-hidden="true">
                {view.links.map((l) => {
                  const s = view.byId[l.source];
                  const t = view.byId[l.target];
                  const constellationLine = s.glow === 'lit' && t.glow === 'lit';
                  const hl = centre !== null && (l.source === centre || l.target === centre);
                  return (
                    <line
                      key={l.id}
                      data-link={l.id}
                      data-source={l.source}
                      data-target={l.target}
                      className={`cg-link cg-link-${l.kind}${l.crossDomain ? ' is-cross' : ''}${constellationLine ? ' is-lit' : ''}${hl ? ' is-hl' : ''}`}
                    />
                  );
                })}
              </g>

              {orderedNodes.map((n) => {
                const degree = view.degree[n.id];
                const r = nodeRadius(n, degree);
                const isApex = n.id === apexId;
                const isSelected = n.id === selectedId;
                const fill = n.glow === 'lit' ? n.color : 'var(--color-text-muted)';
                // The painter moves the outer group. The app-wide press feedback
                // (`[role=button]:active { transform: scale(0.98) }`) would
                // replace a transform attribute on the button itself and drop
                // the star at the origin mid-press, so the role lives inside.
                return (
                  <g key={n.id} data-pos={n.id}>
                    <g
                      data-node={n.id}
                      role="button"
                      tabIndex={n.id === tabStop ? 0 : -1}
                      aria-label={describeNode(n, degree)}
                      aria-pressed={isSelected}
                      className={[
                        'cg-node',
                        `cg-${n.kind}`,
                        `is-${n.glow}`,
                        lit?.has(n.id) ? 'is-hl' : '',
                        isSelected ? 'is-selected' : '',
                        isApex ? 'is-apex' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => onNodeClick(n.id)}
                      onDoubleClick={() => {
                        if (n.kind !== 'moment' && !isApex) telescopeTo(n);
                      }}
                      onPointerEnter={() => setHoverId(n.id)}
                      onPointerLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                    >
                      {/* Generous invisible hit target so small satellites are tappable. */}
                      <circle className="cg-hit" r={Math.max(r + 4, 9)} />
                      {(n.tier === 'demonstrating' && n.glow === 'lit' && n.kind === 'thread') || n.confirmed ? (
                        <circle className="cg-ring-growth" r={r + 2.6} />
                      ) : null}
                      <circle
                        className={`cg-dot${n.glow === 'opening' ? ' cap-ghost' : ''}`}
                        r={r}
                        style={n.glow === 'opening' ? { stroke: n.color } : { fill }}
                      />
                      {n.badge === 'awarded' && <circle className="cg-badge-earned" cx={r * 0.8} cy={-r * 0.8} r={2.2} />}
                      {n.badge === 'approaching' && <circle className="cg-badge-near" cx={r * 0.8} cy={-r * 0.8} r={2.4} />}
                      <circle className="cg-ring-focus" r={r + 4.5} />
                      {/* In the cone, names sit beside their star and read outward
                          along the ring; in the whole sky they sit beneath. */}
                      {cone && !isApex
                        ? <text className="cg-label cg-label-side" x={r + 4}>{canvasLabel(n)}</text>
                        : <text className="cg-label" y={r + 3}>{canvasLabel(n)}</text>}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute bottom-md right-md flex flex-col gap-[2px] rounded-md border border-border-subtle bg-surface-raised p-[3px]">
            <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.3)}
                    className="h-[28px] w-[28px] rounded-sm font-sans text-sm text-text-secondary hover:text-text-primary">+</button>
            <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.3)}
                    className="h-[28px] w-[28px] rounded-sm font-sans text-sm text-text-secondary hover:text-text-primary">−</button>
            <button type="button" aria-label="Fit to view" onClick={fit}
                    className="h-[28px] w-[28px] rounded-sm font-sans text-[0.65rem] font-semibold uppercase text-text-secondary hover:text-text-primary">Fit</button>
          </div>

          <p id={hintId} className="sr-only">
            Arrow keys move along links between nodes. Enter selects a node; Enter again telescopes onto it.
            Escape clears the selection. Plus and minus zoom. The details panel lists every link as a button.
          </p>
          <p className="sr-only" aria-live="polite">
            {selected ? describeNode(selected, graph.degree[selected.id] ?? 0) : ''}
          </p>
        </div>

        <ConstellationPanel
          snap={snap}
          graph={graph}
          node={selected ?? null}
          isApex={!!selected && selected.id === apexId}
          inView={(id) => !!view.byId[id]}
          moments={apex?.kind === 'objective' ? moments : null}
          confirmed={selected?.kind === 'objective' ? confirmedDloIds.has(selected.ref) : false}
          pending={selected?.kind === 'objective' ? pendingDloIds.has(selected.ref) : false}
          onConfirm={(next) => { if (selected?.kind === 'objective') onConfirmDlo(selected.ref, next); }}
          onVisit={visit}
          onTelescope={telescopeTo}
          onOpenInTable={(node) => {
            const target = focusForNode(node);
            if (target) onOpenInTable(target.focus, target.depth);
          }}
          onClose={selectedId ? () => setSelection(null) : undefined}
          litThreads={litThreads}
          totalThreads={totalThreads}
        />
      </div>
    </div>
  );
}
