// Edmonds-Karp (BFS-based Ford-Fulkerson) Max Flow algorithm
// with min-cut extraction via residual graph reachability scan
// Time: O(VE²), Space: O(V+E)

import { Node, Edge, Demand } from "../types";

export interface CapacityResult {
  maxFlow: number;
  minCutEdges: { edgeId: string; from: string; to: string; capacity: number }[];
  bottleneckDescription: string;
  runtimeMs: number;
}

/**
 * BFS to find an augmenting path in the residual graph.
 * Returns the parent map if a path exists from source to sink, or null.
 */
function bfs(
  residual: Map<string, Map<string, number>>,
  source: string,
  sink: string
): Map<string, string> | null {
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [source];
  visited.add(source);

  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = residual.get(u);
    if (!neighbors) continue;

    for (const [v, cap] of neighbors) {
      if (!visited.has(v) && cap > 0) {
        visited.add(v);
        parent.set(v, u);
        if (v === sink) return parent;
        queue.push(v);
      }
    }
  }
  return null;
}

/**
 * Algorithm 3: CAPACITY — Edmonds-Karp max-flow from a super-source
 * (connecting all depots) to a super-sink (connecting all villages).
 * 
 * Also performs min-cut extraction by finding reachable nodes from the source
 * in the final residual graph and returning edges crossing that partition.
 */
export function computeMaxFlow(nodes: Node[], edges: Edge[], demands: Demand[]): CapacityResult {
  const start = performance.now();

  // Build residual graph with super-source and super-sink
  const SUPER_SOURCE = "__super_source__";
  const SUPER_SINK = "__super_sink__";

  const residual = new Map<string, Map<string, number>>();

  // Ensure all nodes + super nodes exist in the residual
  const allNodeIds = [SUPER_SOURCE, SUPER_SINK, ...nodes.map(n => n.id)];
  for (const id of allNodeIds) {
    if (!residual.has(id)) residual.set(id, new Map());
  }

  // Connect super-source to all depots with large capacity
  const depots = nodes.filter(n => n.kind === "depot");
  const villagesWithDemands = new Set(demands.map(d => d.node_id));
  const villages = nodes.filter(n => n.kind === "village" && villagesWithDemands.has(n.id));

  for (const depot of depots) {
    residual.get(SUPER_SOURCE)!.set(depot.id, 100000);
    if (!residual.get(depot.id)!.has(SUPER_SOURCE)) {
      residual.get(depot.id)!.set(SUPER_SOURCE, 0);
    }
  }

  // Connect all villages to super-sink with large capacity
  for (const village of villages) {
    residual.get(village.id)!.set(SUPER_SINK, 100000);
    if (!residual.get(SUPER_SINK)!.has(village.id)) {
      residual.get(SUPER_SINK)!.set(village.id, 0);
    }
  }

  // Add edges to residual graph (bidirectional since roads go both ways)
  // Edge IDs tracked for min-cut reporting
  const edgeMap = new Map<string, Edge>(); // "nodeA->nodeB" -> Edge
  for (const edge of edges) {
    if (!edge.passable) continue;

    const cap = edge.capacity_per_hour;
    const key1 = `${edge.node_a}->${edge.node_b}`;
    const key2 = `${edge.node_b}->${edge.node_a}`;
    edgeMap.set(key1, edge);
    edgeMap.set(key2, edge);

    // Forward edge
    const existing1 = residual.get(edge.node_a)!.get(edge.node_b) || 0;
    residual.get(edge.node_a)!.set(edge.node_b, existing1 + cap);

    // Reverse edge (for residual)
    if (!residual.get(edge.node_b)!.has(edge.node_a)) {
      residual.get(edge.node_b)!.set(edge.node_a, 0);
    }

    // Also add the edge in the other direction (undirected graph)
    const existing2 = residual.get(edge.node_b)!.get(edge.node_a) || 0;
    residual.get(edge.node_b)!.set(edge.node_a, existing2 + cap);

    if (!residual.get(edge.node_a)!.has(edge.node_b)) {
      residual.get(edge.node_a)!.set(edge.node_b, 0);
    }
  }

  // Run Edmonds-Karp: repeatedly find augmenting paths via BFS
  let totalFlow = 0;

  while (true) {
    const parent = bfs(residual, SUPER_SOURCE, SUPER_SINK);
    if (!parent) break;

    // Find bottleneck capacity along the path
    let pathFlow = Infinity;
    let current = SUPER_SINK;
    while (current !== SUPER_SOURCE) {
      const prev = parent.get(current)!;
      pathFlow = Math.min(pathFlow, residual.get(prev)!.get(current)!);
      current = prev;
    }

    // Update residual capacities
    current = SUPER_SINK;
    while (current !== SUPER_SOURCE) {
      const prev = parent.get(current)!;
      residual.get(prev)!.set(current, residual.get(prev)!.get(current)! - pathFlow);
      residual.get(current)!.set(prev, (residual.get(current)!.get(prev) || 0) + pathFlow);
      current = prev;
    }

    totalFlow += pathFlow;
  }

  // Min-cut extraction: find all nodes reachable from super-source in residual
  const reachable = new Set<string>();
  const queue: string[] = [SUPER_SOURCE];
  reachable.add(SUPER_SOURCE);
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const [v, cap] of residual.get(u) || []) {
      if (!reachable.has(v) && cap > 0) {
        reachable.add(v);
        queue.push(v);
      }
    }
  }

  // Min-cut edges: edges from reachable to non-reachable in the original graph
  const minCutEdges: CapacityResult["minCutEdges"] = [];
  for (const edge of edges) {
    if (!edge.passable) continue;
    const aReachable = reachable.has(edge.node_a);
    const bReachable = reachable.has(edge.node_b);
    if (aReachable && !bReachable) {
      minCutEdges.push({ edgeId: edge.id, from: edge.node_a, to: edge.node_b, capacity: edge.capacity_per_hour });
    } else if (bReachable && !aReachable) {
      minCutEdges.push({ edgeId: edge.id, from: edge.node_b, to: edge.node_a, capacity: edge.capacity_per_hour });
    }
  }

  // Find the bottleneck edge (lowest capacity in the cut)
  let bottleneckDescription = "No bottleneck identified";
  if (minCutEdges.length > 0) {
    const bottleneck = minCutEdges.reduce((a, b) => a.capacity < b.capacity ? a : b);
    const fromNode = nodes.find(n => n.id === bottleneck.from);
    const toNode = nodes.find(n => n.id === bottleneck.to);
    bottleneckDescription = `Bottleneck on edge ${fromNode?.name || bottleneck.from} → ${toNode?.name || bottleneck.to} (capacity: ${bottleneck.capacity} kg/hr)`;
  }

  const runtimeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    maxFlow: totalFlow,
    minCutEdges,
    bottleneckDescription,
    runtimeMs,
  };
}
