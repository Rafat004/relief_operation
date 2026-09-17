// 0/1 Knapsack (weight-only) with backtracking
// Maximizes total value score of items loaded onto each vehicle
// Time: O(n * W), Space: O(W) using rolled 1D DP array

import { Demand, Item, Vehicle } from "../types";

export interface ManifestItem {
  demandId: string;
  itemName: string;
  weightKg: number;
  valueScore: number;
  qtyLoaded: number;
}

export interface VehicleManifest {
  vehicleId: string;
  vehicleName: string;
  capacityKg: number;
  items: ManifestItem[];
  totalWeight: number;
  totalValue: number;
  utilization: number; // percentage
}

export interface PackingResult {
  manifests: VehicleManifest[];
  totalPayload: number;
  averageUtilization: number;
  runtimeMs: number;
}

/**
 * Solve 0/1 knapsack for a single vehicle given a set of "demand items".
 * Each demand is treated as one item with:
 *   weight = item.weight_kg * demand.qty_needed
 *   value  = item.value_score * demand.urgency_score
 * 
 * Uses standard 2D DP with backtracking to recover chosen items.
 */
function solveKnapsack(
  demandItems: { demand: Demand; item: Item; weight: number; value: number }[],
  capacity: number
): { chosenIndices: number[]; totalValue: number } {
  const n = demandItems.length;
  // Scale capacity down to integers (work in whole kg)
  const W = Math.floor(capacity);

  if (n === 0 || W === 0) return { chosenIndices: [], totalValue: 0 };

  // Build 2D DP table for backtracking
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const w = Math.floor(demandItems[i - 1].weight);
    const v = demandItems[i - 1].value;
    for (let j = 0; j <= W; j++) {
      dp[i][j] = dp[i - 1][j];
      if (w <= j) {
        dp[i][j] = Math.max(dp[i][j], dp[i - 1][j - w] + v);
      }
    }
  }

  // Backtrack to find which items were chosen
  const chosen: number[] = [];
  let j = W;
  for (let i = n; i >= 1; i--) {
    if (dp[i][j] !== dp[i - 1][j]) {
      chosen.push(i - 1);
      j -= Math.floor(demandItems[i - 1].weight);
    }
  }

  return { chosenIndices: chosen.reverse(), totalValue: dp[n][W] };
}

/**
 * Algorithm 4: PACK — 0/1 Knapsack per vehicle.
 * 
 * Strategy: Process vehicles in order. For each vehicle, run knapsack
 * on remaining unallocated demands. Once a demand is allocated to a vehicle,
 * it's removed from the pool.
 */
export function computePacking(
  demands: Demand[],
  items: Item[],
  vehicles: Vehicle[]
): PackingResult {
  const start = performance.now();

  const itemMap = new Map(items.map(i => [i.id, i]));
  const remainingDemands = [...demands]; // copy so we can splice

  const manifests: VehicleManifest[] = [];

  for (const vehicle of vehicles) {
    // Build candidate items from remaining demands
    const candidates = remainingDemands.map((demand, idx) => {
      const item = itemMap.get(demand.item_id);
      if (!item) return null;
      const weight = item.weight_kg * demand.qty_needed;
      const value = item.value_score * demand.urgency_score;
      return { demand, item, weight, value, originalIdx: idx };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    const { chosenIndices, totalValue } = solveKnapsack(candidates, vehicle.weight_capacity_kg);

    const manifestItems: ManifestItem[] = [];
    let totalWeight = 0;

    // Collect chosen items (track indices to remove from pool)
    const indicesToRemove: number[] = [];

    for (const ci of chosenIndices) {
      const chosen = candidates[ci];
      const w = chosen.item.weight_kg * chosen.demand.qty_needed;
      manifestItems.push({
        demandId: chosen.demand.id,
        itemName: chosen.item.name,
        weightKg: w,
        valueScore: chosen.value,
        qtyLoaded: chosen.demand.qty_needed,
      });
      totalWeight += w;
      indicesToRemove.push(chosen.originalIdx);
    }

    // Remove allocated demands from pool (in reverse order to preserve indices)
    indicesToRemove.sort((a, b) => b - a);
    for (const idx of indicesToRemove) {
      remainingDemands.splice(idx, 1);
    }

    manifests.push({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      capacityKg: vehicle.weight_capacity_kg,
      items: manifestItems,
      totalWeight,
      totalValue,
      utilization: vehicle.weight_capacity_kg > 0
        ? Math.round((totalWeight / vehicle.weight_capacity_kg) * 1000) / 10
        : 0,
    });
  }

  const totalPayload = manifests.reduce((sum, m) => sum + m.totalWeight, 0);
  const averageUtilization = manifests.length > 0
    ? Math.round(manifests.reduce((sum, m) => sum + m.utilization, 0) / manifests.length * 10) / 10
    : 0;

  const runtimeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    manifests,
    totalPayload,
    averageUtilization,
    runtimeMs,
  };
}
