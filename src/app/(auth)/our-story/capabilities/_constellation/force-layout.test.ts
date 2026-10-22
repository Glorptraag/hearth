import { describe, it, expect } from 'vitest';
import {
  TICKS_TO_SETTLE,
  coneAngles,
  coneHalfAngle,
  createSimulation,
  seedClusters,
  seedCone,
  type LayoutLink,
  type LayoutNode,
} from './force-layout';

const node = (id: string, r = 4, charge = -60): LayoutNode => ({ id, r, charge });

// Two tight clusters of five joined by one bridge, plus an orphan.
function twoClusters(): { nodes: LayoutNode[]; links: LayoutLink[] } {
  const nodes: LayoutNode[] = [];
  const links: LayoutLink[] = [];
  for (const c of ['a', 'b']) {
    nodes.push(node(`${c}0`, 8, -200));
    for (let i = 1; i <= 4; i++) {
      nodes.push(node(`${c}${i}`));
      links.push({ source: `${c}${i}`, target: `${c}0`, distance: 30 });
    }
  }
  links.push({ source: 'a0', target: 'b0', distance: 120 });
  nodes.push(node('orphan'));
  return { nodes, links };
}

const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

describe('createSimulation', () => {
  it('cools to settled within the advertised tick budget, with finite positions', () => {
    const { nodes, links } = twoClusters();
    const sim = createSimulation(nodes, links);
    sim.tick(TICKS_TO_SETTLE);
    expect(sim.settled()).toBe(true);
    for (const p of Object.values(sim.positions())) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });

  it('is deterministic for the same input and seed', () => {
    const a = twoClusters();
    const b = twoClusters();
    const s1 = createSimulation(a.nodes, a.links, { seed: 3 });
    const s2 = createSimulation(b.nodes, b.links, { seed: 3 });
    s1.tick(150);
    s2.tick(150);
    expect(s1.positions()).toEqual(s2.positions());
  });

  it('pulls linked nodes together and pushes clusters apart', () => {
    const { nodes, links } = twoClusters();
    const sim = createSimulation(nodes, links);
    sim.tick(TICKS_TO_SETTLE);
    const p = sim.positions();
    const within = dist(p.a1, p.a0);
    const across = dist(p.a1, p.b1);
    expect(within).toBeLessThan(60);
    expect(across).toBeGreaterThan(within * 2);
  });

  it('keeps nodes from overlapping', () => {
    const { nodes, links } = twoClusters();
    const sim = createSimulation(nodes, links);
    sim.tick(TICKS_TO_SETTLE);
    const p = sim.positions();
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        expect(dist(p[nodes[i].id], p[nodes[j].id])).toBeGreaterThan(nodes[i].r + nodes[j].r - 0.5);
      }
    }
  });

  it('holds a pinned node in place until it is released', () => {
    const { nodes, links } = twoClusters();
    const sim = createSimulation(nodes, links);
    sim.pin('a0', 500, -500);
    sim.setAlphaTarget(0.3);
    sim.tick(40);
    expect(sim.position('a0')).toEqual({ x: 500, y: -500 });
    sim.unpin('a0');
    sim.setAlphaTarget(0);
    sim.tick(80);
    expect(sim.position('a0')).not.toEqual({ x: 500, y: -500 });
  });

  it('starts from the given positions', () => {
    const sim = createSimulation([node('only')], [], { initial: { only: { x: 42, y: -7 } } });
    expect(sim.position('only')).toEqual({ x: 42, y: -7 });
    expect(sim.position('missing')).toBeNull();
  });
});

describe('cone (telescope)', () => {
  // A small tree: apex → three children → two grandchildren each.
  function tree() {
    const nodes: LayoutNode[] = [node('apex', 8, -150)];
    const links: LayoutLink[] = [];
    const hops: Record<string, number> = { apex: 0 };
    const order = ['apex'];
    for (let c = 0; c < 3; c++) {
      const child = `c${c}`;
      nodes.push(node(child));
      links.push({ source: child, target: 'apex', distance: 60 });
      hops[child] = 1;
      order.push(child);
    }
    for (let c = 0; c < 3; c++) {
      for (let g = 0; g < 2; g++) {
        const grand = `c${c}g${g}`;
        nodes.push(node(grand, 3, -30));
        links.push({ source: grand, target: `c${c}`, distance: 60 });
        hops[grand] = 2;
        order.push(grand);
      }
    }
    return { nodes, links, hops, order };
  }

  it('pins the apex at the origin and fans each hop onto a wider ring inside the cone', () => {
    const { nodes, links, hops, order } = tree();
    const ringGap = 100;
    const halfAngle = coneHalfAngle([1, 3, 6], ringGap);
    const sim = createSimulation(nodes, links, {
      cone: { apex: 'apex', hops, ringGap, halfAngle },
      initial: seedCone(order, hops, ringGap, halfAngle),
    });
    sim.tick(TICKS_TO_SETTLE);
    const p = sim.positions();
    expect(p.apex).toEqual({ x: 0, y: 0 });
    const radius = (id: string) => Math.hypot(p[id].x, p[id].y);
    const meanRadius = (ids: string[]) => ids.reduce((s, id) => s + radius(id), 0) / ids.length;
    const first = order.filter((id) => hops[id] === 1);
    const second = order.filter((id) => hops[id] === 2);
    expect(meanRadius(second)).toBeGreaterThan(meanRadius(first) * 1.4);
    for (const id of [...first, ...second]) {
      // Opens to the right, within the cone (small tolerance for collision).
      expect(p[id].x).toBeGreaterThan(0);
      expect(Math.abs(Math.atan2(p[id].y, p[id].x))).toBeLessThan(halfAngle + 0.12);
    }
    // The cone widens: the outer ring spans more height than the inner.
    const span = (ids: string[]) => Math.max(...ids.map((id) => p[id].y)) - Math.min(...ids.map((id) => p[id].y));
    expect(span(second)).toBeGreaterThan(span(first));
  });

  it('never unpins the apex', () => {
    const { nodes, links, hops } = tree();
    const sim = createSimulation(nodes, links, { cone: { apex: 'apex', hops, ringGap: 100, halfAngle: 0.6 } });
    sim.unpin('apex');
    sim.tick(50);
    expect(sim.position('apex')).toEqual({ x: 0, y: 0 });
  });
});

describe('seeding helpers', () => {
  it('seedClusters puts hubs on a circle and members near their anchor', () => {
    const seeds = seedClusters([
      { id: 'hubA', anchor: null },
      { id: 'hubB', anchor: null },
      { id: 'leaf', anchor: 'thread' },
      { id: 'thread', anchor: 'hubA' },
    ], { radius: 200, spread: 40 });
    expect(Math.hypot(seeds.hubA.x, seeds.hubA.y)).toBeCloseTo(200);
    expect(dist(seeds.thread, seeds.hubA)).toBeLessThanOrEqual(40);
    // Resolved on a later pass once its own anchor was placed.
    expect(dist(seeds.leaf, seeds.thread)).toBeLessThanOrEqual(40);
  });

  it('coneAngles spreads each ring evenly across the cone, in order', () => {
    const angles = coneAngles(['apex', 'a', 'b', 'c', 'd'], { apex: 0, a: 1, b: 1, c: 2, d: 1 }, 0.6);
    expect(angles.apex).toBeUndefined();
    expect(angles.a).toBeCloseTo(-0.4);
    expect(angles.b).toBeCloseTo(0);
    expect(angles.d).toBeCloseTo(0.4);
    // Alone on its ring: on the axis.
    expect(angles.c).toBeCloseTo(0);
  });

  it('coneHalfAngle widens for a crowded ring and stays clamped', () => {
    const sparse = coneHalfAngle([1, 2], 100);
    const crowded = coneHalfAngle([1, 40], 100);
    expect(crowded).toBeGreaterThan(sparse);
    expect(crowded).toBeLessThanOrEqual(Math.PI / 2.6);
    expect(sparse).toBeGreaterThanOrEqual(Math.PI / 7);
  });
});
