export type NodeKind = 'depot' | 'village';

export interface Node {
  id: string;
  name: string;
  kind: NodeKind;
  lat: number;
  lng: number;
  population: number;
}

export interface Edge {
  id: string;
  node_a: string;
  node_b: string;
  minutes: number;
  capacity_per_hour: number;
  passable: boolean;
}

export interface Item {
  id: string;
  name: string;
  weight_kg: number;
  value_score: number;
}

export interface Vehicle {
  id: string;
  name: string;
  weight_capacity_kg: number;
}

export interface Demand {
  id: string;
  node_id: string;
  item_id: string;
  qty_needed: number;
  urgency_score: number; // severity * 0.5 + (population / 100) * 0.3 + (1 / hours_until_deadline) * 0.2
}

export interface PlanResult {
  // Algorithm 1: Ranked Demands
  rankedDemands: Demand[];
  // Algorithm 2: Routing (Dijkstra)
  travelTimes: Record<string, number>; // village_id -> minutes from depot
  paths: Record<string, string[]>; // village_id -> array of node_ids forming the path
  // Algorithm 3: Capacity (Edmonds-Karp)
  maxFlow: number;
  minCutEdges: string[]; // Edge IDs that are the bottlenecks
  // Algorithm 4: Packing (Knapsack)
  manifests: Record<string, {
    items: string[]; // Array of demand IDs loaded
    totalWeight: number;
    totalValue: number;
  }>; // vehicle_id -> manifest details
}

export interface Plan {
  id: string;
  created_at: string;
  result: PlanResult;
}
