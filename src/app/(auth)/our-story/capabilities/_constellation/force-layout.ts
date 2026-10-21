/* Force-directed layout for the constellation graph — the physics behind an
   Obsidian-style graph view, written small enough to own: link springs,
   many-body repulsion, collision, a gentle centre pull, and an optional cone
   constraint that fans a telescoped neighbourhood out from its apex.

   Semantics follow d3-force (alpha cooling, velocity decay, link bias by
   degree) so the motion feels familiar. Deterministic for a given seed and
   input, so a reload lays the same child's constellation out the same way.
   Pure: no DOM, no timers. The caller decides when to tick. */

import { makeRng } from './topology';

export type LayoutNode = {
  id: string;
  /** Collision radius in world units. */
  r: number;
  /** Many-body strength; negative repels. */
  charge: number;
};

export type LayoutLink = {
  source: string;
  target: string;
  /** Rest length in world units. */
  distance: number;
  /** Optional override; defaults to 1 / min(degree) as in d3. */
  strength?: number;
};

export type Point = { x: number; y: number };

/**
 * Fan a telescoped neighbourhood into a cone opening to the right of its
 * apex: each node is drawn to the ring `hop × ringGap` from the apex and held
 * within ±halfAngle of the axis, so the shape widens as it extends.
 */
export type ConeSpec = {
  apex: string;
  hops: Record<string, number>;
  ringGap: number;
  /** Radians. */
  halfAngle: number;
  /**
   * Optional resting angle per node (radians; see coneAngles). Spreads each
   * ring evenly across the cone in the given order instead of letting
   * siblings bunch where their links happen to pull them.
   */
  angles?: Record<string, number>;
};

export type SimulationOptions = {
  seed?: number;
  /** Starting positions; nodes without one get a seeded spiral position. */
  initial?: Record<string, Point>;
  cone?: ConeSpec;
  /** Pull toward the origin (ignored in cone mode). */
  centerStrength?: number;
  /**
   * Viewport width ÷ height. The vertical pull is scaled by it so a wide
   * stage gets a wide layout and a phone a tall one, instead of a disc.
   */
  aspect?: number;
  /** Ignore repulsion beyond this distance, as d3's distanceMax. */
  chargeDistanceMax?: number;
};

export type Simulation = {
  readonly ids: readonly string[];
  tick(iterations?: number): void;
  alpha(): number;
  /** Warm the simulation back up (e.g. on drag) so the graph re-settles. */
  reheat(alpha?: number): void;
  /** Hold the simulation warm while a node is dragged; 0 lets it cool. */
  setAlphaTarget(target: number): void;
  settled(): boolean;
  pin(id: string, x: number, y: number): void;
  unpin(id: string): void;
  position(id: string): Point | null;
  positions(): Record<string, Point>;
  bounds(): { minX: number; minY: number; maxX: number; maxY: number };
};

export const ALPHA_MIN = 0.001;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ALPHA_DECAY = 1 - Math.pow(ALPHA_MIN, 1 / 300);
const VELOCITY_DECAY = 0.4;
const COLLIDE_PADDING = 2.5;
const CONE_STRENGTH = 0.8;
const ANGLE_STRENGTH = 0.3;
/** Ticks a full cool-down takes from alpha 1, for callers that pre-settle. */
export const TICKS_TO_SETTLE = Math.ceil(Math.log(ALPHA_MIN) / Math.log(1 - ALPHA_DECAY));

export function createSimulation(
  nodes: LayoutNode[],
  links: LayoutLink[],
  options: SimulationOptions = {},
): Simulation {
  const { seed = 1, initial = {}, cone, centerStrength = 0.035, chargeDistanceMax = 420 } = options;
  const aspect = clamp(options.aspect ?? 1, 0.4, 2.5);
  const centerX = centerStrength / Math.sqrt(aspect);
  const centerY = centerStrength * Math.sqrt(aspect);
  const n = nodes.length;
  const ids = nodes.map((nd) => nd.id);
  const indexOf = new Map(ids.map((id, i) => [id, i]));
  const rng = makeRng(seed);
  const jiggle = () => (rng() - 0.5) * 1e-6;

  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const fx: Array<number | null> = new Array(n).fill(null);
  const fy: Array<number | null> = new Array(n).fill(null);
  const r = Float64Array.from(nodes, (nd) => nd.r);
  const charge = Float64Array.from(nodes, (nd) => nd.charge);

  // Seeded phyllotaxis for anything without a starting point (d3's default).
  const golden = Math.PI * (3 - Math.sqrt(5));
  nodes.forEach((nd, i) => {
    const p = initial[nd.id];
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      x[i] = p.x;
      y[i] = p.y;
    } else {
      const radius = 10 * Math.sqrt(0.5 + i);
      const angle = i * golden;
      x[i] = radius * Math.cos(angle);
      y[i] = radius * Math.sin(angle);
    }
  });

  const resolved = links
    .map((l) => ({ s: indexOf.get(l.source), t: indexOf.get(l.target), l }))
    .filter((e): e is { s: number; t: number; l: LayoutLink } => e.s !== undefined && e.t !== undefined && e.s !== e.t);
  const count = new Float64Array(n);
  for (const e of resolved) { count[e.s] += 1; count[e.t] += 1; }
  const linkSource = Int32Array.from(resolved, (e) => e.s);
  const linkTarget = Int32Array.from(resolved, (e) => e.t);
  const linkDistance = Float64Array.from(resolved, (e) => e.l.distance);
  const linkStrength = Float64Array.from(resolved, (e) => e.l.strength ?? 1 / Math.min(count[e.s], count[e.t]));
  const linkBias = Float64Array.from(resolved, (e) => count[e.s] / (count[e.s] + count[e.t]));

  const coneHop = new Float64Array(n).fill(-1);
  const coneAngle = new Float64Array(n).fill(NaN);
  if (cone) {
    for (const [id, hop] of Object.entries(cone.hops)) {
      const i = indexOf.get(id);
      if (i !== undefined) coneHop[i] = hop;
    }
    for (const [id, a] of Object.entries(cone.angles ?? {})) {
      const i = indexOf.get(id);
      if (i !== undefined) coneAngle[i] = a;
    }
    const apex = indexOf.get(cone.apex);
    if (apex !== undefined) {
      fx[apex] = 0;
      fy[apex] = 0;
      x[apex] = 0;
      y[apex] = 0;
    }
  }

  let alpha = 1;
  let alphaTarget = 0;
  const maxD2 = chargeDistanceMax * chargeDistanceMax;

  function step() {
    alpha += (alphaTarget - alpha) * ALPHA_DECAY;

    // Link springs.
    for (let k = 0; k < linkSource.length; k++) {
      const s = linkSource[k];
      const t = linkTarget[k];
      let dx = x[t] + vx[t] - x[s] - vx[s] || jiggle();
      let dy = y[t] + vy[t] - y[s] - vy[s] || jiggle();
      let l = Math.sqrt(dx * dx + dy * dy);
      l = ((l - linkDistance[k]) / l) * alpha * linkStrength[k];
      dx *= l;
      dy *= l;
      const b = linkBias[k];
      vx[t] -= dx * b;
      vy[t] -= dy * b;
      vx[s] += dx * (1 - b);
      vy[s] += dy * (1 - b);
    }

    // Many-body repulsion + collision, pairwise. A full constellation is a
    // few hundred nodes, so the O(n²) pass stays well inside a frame.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = x[j] - x[i];
        let dy = y[j] - y[i];
        let d2 = dx * dx + dy * dy;
        if (d2 === 0) {
          dx = jiggle();
          dy = jiggle();
          d2 = dx * dx + dy * dy;
        }
        if (d2 < maxD2) {
          const d2c = Math.max(d2, 1);
          vx[i] += (dx * charge[j] * alpha) / d2c;
          vy[i] += (dy * charge[j] * alpha) / d2c;
          vx[j] -= (dx * charge[i] * alpha) / d2c;
          vy[j] -= (dy * charge[i] * alpha) / d2c;
        }
        const reach = r[i] + r[j] + COLLIDE_PADDING;
        if (d2 < reach * reach) {
          const d = Math.sqrt(d2);
          const push = ((reach - d) / d) * 0.35;
          vx[i] -= dx * push;
          vy[i] -= dy * push;
          vx[j] += dx * push;
          vy[j] += dy * push;
        }
      }
    }

    if (cone) {
      const limit = cone.halfAngle;
      for (let i = 0; i < n; i++) {
        const hop = coneHop[i];
        if (hop <= 0) continue;
        const d = Math.sqrt(x[i] * x[i] + y[i] * y[i]) || 1;
        const ring = hop * cone.ringGap;
        const k = ((ring - d) / d) * CONE_STRENGTH * alpha;
        vx[i] += x[i] * k;
        vy[i] += y[i] * k;
        const angle = Math.atan2(y[i], x[i]);
        const rest = coneAngle[i];
        if (!Number.isNaN(rest)) {
          vx[i] += (d * Math.cos(rest) - x[i]) * ANGLE_STRENGTH * alpha;
          vy[i] += (d * Math.sin(rest) - y[i]) * ANGLE_STRENGTH * alpha;
        }
        if (Math.abs(angle) > limit) {
          const target = Math.sign(angle || 1) * limit;
          vx[i] += (d * Math.cos(target) - x[i]) * CONE_STRENGTH * Math.max(alpha, 0.05);
          vy[i] += (d * Math.sin(target) - y[i]) * CONE_STRENGTH * Math.max(alpha, 0.05);
        }
      }
    } else if (centerStrength > 0) {
      for (let i = 0; i < n; i++) {
        vx[i] -= x[i] * centerX * alpha;
        vy[i] -= y[i] * centerY * alpha;
      }
    }

    for (let i = 0; i < n; i++) {
      const pinnedX = fx[i];
      const pinnedY = fy[i];
      if (pinnedX !== null && pinnedY !== null) {
        x[i] = pinnedX;
        y[i] = pinnedY;
        vx[i] = 0;
        vy[i] = 0;
        continue;
      }
      vx[i] *= 1 - VELOCITY_DECAY;
      vy[i] *= 1 - VELOCITY_DECAY;
      x[i] += vx[i];
      y[i] += vy[i];
    }
  }

  return {
    ids,
    tick(iterations = 1) {
      for (let i = 0; i < iterations; i++) step();
    },
    alpha: () => alpha,
    reheat(next = 0.3) {
      alpha = Math.max(alpha, next);
    },
    setAlphaTarget(target) {
      alphaTarget = target;
      if (target > alpha) alpha = target;
    },
    settled: () => alpha < ALPHA_MIN && alphaTarget === 0,
    pin(id, px, py) {
      const i = indexOf.get(id);
      if (i === undefined) return;
      fx[i] = px;
      fy[i] = py;
    },
    unpin(id) {
      const i = indexOf.get(id);
      if (i === undefined) return;
      // The cone apex stays where the telescope put it.
      if (cone?.apex === id) return;
      fx[i] = null;
      fy[i] = null;
    },
    position(id) {
      const i = indexOf.get(id);
      return i === undefined ? null : { x: x[i], y: y[i] };
    },
    positions() {
      const out: Record<string, Point> = {};
      for (let i = 0; i < n; i++) out[ids[i]] = { x: x[i], y: y[i] };
      return out;
    },
    bounds() {
      if (n === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < n; i++) {
        minX = Math.min(minX, x[i] - r[i]);
        minY = Math.min(minY, y[i] - r[i]);
        maxX = Math.max(maxX, x[i] + r[i]);
        maxY = Math.max(maxY, y[i] + r[i]);
      }
      return { minX, minY, maxX, maxY };
    },
  };
}

/**
 * Starting positions for a clustered graph: hubs (no anchor) evenly on a
 * circle, every other node scattered near its anchor, anchors placed first.
 * A good start means fewer ticks and a layout that reads the same each load.
 */
export function seedClusters(
  items: Array<{ id: string; anchor: string | null }>,
  { radius = 260, spread = 40, seed = 7 }: { radius?: number; spread?: number; seed?: number } = {},
): Record<string, Point> {
  const rng = makeRng(seed);
  const out: Record<string, Point> = {};
  const hubs = items.filter((it) => !it.anchor);
  hubs.forEach((h, i) => {
    const a = (i / Math.max(1, hubs.length)) * Math.PI * 2 - Math.PI / 2;
    out[h.id] = { x: radius * Math.cos(a), y: radius * Math.sin(a) };
  });
  // Resolve anchors in passes so chains (objective → thread → domain) settle in order.
  let pending = items.filter((it) => it.anchor);
  for (let pass = 0; pass < 4 && pending.length > 0; pass++) {
    const next: typeof pending = [];
    for (const it of pending) {
      const a = out[it.anchor!];
      if (!a) { next.push(it); continue; }
      const angle = rng() * Math.PI * 2;
      const dist = spread * (0.4 + rng() * 0.6) / (pass + 1);
      out[it.id] = { x: a.x + dist * Math.cos(angle), y: a.y + dist * Math.sin(angle) };
    }
    pending = next;
  }
  return out;
}

/**
 * Half-angle wide enough that the busiest ring has room for its nodes at
 * `spacing` apart, clamped so a sparse telescope still reads as a cone.
 */
export function coneHalfAngle(
  countsByHop: number[],
  ringGap: number,
  spacing = 20,
  { min = Math.PI / 7, max = Math.PI / 2.6 }: { min?: number; max?: number } = {},
): number {
  let needed = 0;
  countsByHop.forEach((count, hop) => {
    if (hop === 0 || count === 0) return;
    needed = Math.max(needed, (count * spacing) / (2 * hop * ringGap));
  });
  return Math.min(max, Math.max(min, needed));
}

/**
 * Evenly spaced resting angles across the cone for each ring, in the order
 * given (BFS order keeps a node's neighbours next to each other on the next
 * ring). The apex (hop 0) has none.
 */
export function coneAngles(
  order: string[],
  hops: Record<string, number>,
  halfAngle: number,
): Record<string, number> {
  const byHop: Record<number, string[]> = {};
  for (const id of order) {
    const hop = hops[id] ?? 0;
    if (hop > 0) (byHop[hop] ||= []).push(id);
  }
  const out: Record<string, number> = {};
  for (const idsAtHop of Object.values(byHop)) {
    idsAtHop.forEach((id, i) => {
      out[id] = -halfAngle + ((i + 0.5) / idsAtHop.length) * 2 * halfAngle;
    });
  }
  return out;
}

/** Starting positions: each node on its ring at its resting angle. */
export function seedCone(
  order: string[],
  hops: Record<string, number>,
  ringGap: number,
  halfAngle: number,
): Record<string, Point> {
  const angles = coneAngles(order, hops, halfAngle);
  const out: Record<string, Point> = {};
  for (const id of order) {
    const hop = hops[id] ?? 0;
    const a = angles[id];
    out[id] = hop === 0 || a === undefined
      ? { x: 0, y: 0 }
      : { x: hop * ringGap * Math.cos(a), y: hop * ringGap * Math.sin(a) };
  }
  return out;
}
