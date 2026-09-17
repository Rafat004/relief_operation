// Pipeline Runner: Orchestrates all 4 algorithms in sequence
// 1. RANK (heap sort)  →  2. ROUTE (Dijkstra)  →  3. CAPACITY (Edmonds-Karp)  →  4. PACK (0/1 knapsack)

import { Node, Edge, Item, Vehicle, Demand } from "../types";
import { rankDemands, RankingResult } from "./ranking";
import { computeRoutes, RoutingResult } from "./routing";
import { computeMaxFlow, CapacityResult } from "./capacity";
import { computePacking, PackingResult } from "./packing";

export interface PipelineResult {
  id: string;
  createdAt: string;
  ranking: RankingResult;
  routing: RoutingResult;
  capacity: CapacityResult;
  packing: PackingResult;
  totalRuntimeMs: number;
}

/**
 * Run the full relief plan pipeline.
 * Called when user clicks "Generate Relief Plan".
 */
export function runPipeline(
  nodes: Node[],
  edges: Edge[],
  demands: Demand[],
  items: Item[],
  vehicles: Vehicle[]
): PipelineResult {
  const totalStart = performance.now();

  // Step 1: RANK demands by urgency
  const ranking = rankDemands(demands);

  // Step 2: ROUTE — compute shortest paths from depots to villages
  const routing = computeRoutes(nodes, edges);

  // Step 3: CAPACITY — compute max-flow through the network
  const capacity = computeMaxFlow(nodes, edges);

  // Step 4: PACK — allocate items to vehicles via knapsack
  const packing = computePacking(ranking.rankedDemands, items, vehicles);

  const totalRuntimeMs = Math.round((performance.now() - totalStart) * 100) / 100;

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ranking,
    routing,
    capacity,
    packing,
    totalRuntimeMs,
  };
}
