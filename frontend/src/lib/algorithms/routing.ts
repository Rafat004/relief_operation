// Dijkstra's shortest path algorithm using a custom binary min-heap
// Finds shortest travel time from each depot to all reachable villages
// Time: O((V+E) log V), Space: O(V)

import { Node, Edge } from "../types";

// Binary Min-Heap keyed by distance for Dijkstra's priority queue
class MinHeap {
  private heap: { nodeId: string; dist: number }[] = [];

  private parent(i: number) { return Math.floor((i - 1) / 2); }
  private left(i: number) { return 2 * i + 1; }
  private right(i: number) { return 2 * i + 2; }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private siftUp(i: number) {
    while (i > 0 && this.heap[this.parent(i)].dist > this.heap[i].dist) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  private siftDown(i: number) {
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);
    if (l < this.heap.length && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
    if (r < this.heap.length && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
    if (smallest !== i) {
      this.swap(i, smallest);
      this.siftDown(smallest);
    }
  }

  insert(nodeId: string, dist: number) {
    this.heap.push({ nodeId, dist });
    this.siftUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  size() { return this.heap.length; }
}

export interface RouteInfo {
  depotId: string;
  depotName: string;
  villageId: string;
  villageName: string;
  travelMinutes: number;
  path: string[]; // node IDs forming the shortest path
  feasible: boolean;
}

export interface RoutingResult {
  routes: RouteInfo[];
  runtimeMs: number;
}

/**
 * Build adjacency list from edges, filtering out impassable ones
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, { neighborId: string; weight: number }[]> {
  const adj = new Map<string, { neighborId: string; weight: number }[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    if (!edge.passable) continue; // skip impassable
    adj.get(edge.node_a)?.push({ neighborId: edge.node_b, weight: edge.minutes });
    adj.get(edge.node_b)?.push({ neighborId: edge.node_a, weight: edge.minutes });
  }
  return adj;
}

/**
 * Run Dijkstra from a single source node.
 * Returns distances and predecessors for path reconstruction.
 */
function dijkstra(source: string, adj: Map<string, { neighborId: string; weight: number }[]>): {
  dist: Map<string, number>;
  prev: Map<string, string | null>;
} {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const nodeId of adj.keys()) {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
  }
  dist.set(source, 0);

  const pq = new MinHeap();
  pq.insert(source, 0);

  while (pq.size() > 0) {
    const { nodeId: u } = pq.extractMin()!;
    if (visited.has(u)) continue;
    visited.add(u);

    for (const { neighborId: v, weight: w } of adj.get(u) || []) {
      const alt = dist.get(u)! + w;
      if (alt < dist.get(v)!) {
        dist.set(v, alt);
        prev.set(v, u);
        pq.insert(v, alt);
      }
    }
  }

  return { dist, prev };
}

/**
 * Reconstruct path from source to target using predecessor map
 */
function reconstructPath(target: string, prev: Map<string, string | null>): string[] {
  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.unshift(current);
    current = prev.get(current) ?? null;
  }
  return path;
}

/**
 * Algorithm 2: ROUTE — Dijkstra from each depot to all villages.
 * For each village, pick the closest depot.
 * Time: O(D * (V+E) log V) where D = number of depots
 */
export function computeRoutes(nodes: Node[], edges: Edge[]): RoutingResult {
  const start = performance.now();
  const adj = buildAdjacencyList(nodes, edges);

  const depots = nodes.filter(n => n.kind === "depot");
  const villages = nodes.filter(n => n.kind === "village");

  // Run Dijkstra from each depot
  const depotResults = depots.map(depot => ({
    depot,
    ...dijkstra(depot.id, adj),
  }));

  // For each village, find the closest depot
  const routes: RouteInfo[] = villages.map(village => {
    let bestDepot = depots[0];
    let bestDist = Infinity;
    let bestPrev = new Map<string, string | null>();

    for (const result of depotResults) {
      const d = result.dist.get(village.id) ?? Infinity;
      if (d < bestDist) {
        bestDist = d;
        bestDepot = result.depot;
        bestPrev = result.prev;
      }
    }

    const path = bestDist < Infinity ? reconstructPath(village.id, bestPrev) : [];

    return {
      depotId: bestDepot.id,
      depotName: bestDepot.name,
      villageId: village.id,
      villageName: village.name,
      travelMinutes: bestDist === Infinity ? -1 : bestDist,
      path,
      feasible: bestDist < Infinity,
    };
  });

  // Sort by travel time ascending (unreachable last)
  routes.sort((a, b) => {
    if (!a.feasible) return 1;
    if (!b.feasible) return -1;
    return a.travelMinutes - b.travelMinutes;
  });

  const runtimeMs = Math.round((performance.now() - start) * 100) / 100;
  return { routes, runtimeMs };
}
