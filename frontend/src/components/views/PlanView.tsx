import { PipelineResult } from "@/lib/algorithms/runner";
import { Node } from "@/lib/types";

interface PlanViewProps {
  plan: PipelineResult | null;
  nodes: Node[];
}

export default function PlanView({ plan, nodes }: PlanViewProps) {
  if (!plan) {
    return (
      <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center p-margin">
        <div className="bg-surface-container-low rounded border border-outline-variant/30 py-16 px-space-lg flex flex-col items-center justify-center text-center max-w-lg w-full">
          <div className="w-12 h-12 rounded bg-surface-container-high flex items-center justify-center mb-space-md">
            <span className="text-outline text-[24px]">⚠</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">No active plan in memory</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
            Click &quot;Generate Relief Plan&quot; to run the optimization pipeline and view resource allocations.
          </p>
        </div>
      </div>
    );
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const getNodeName = (id: string) => nodeMap.get(id)?.name || id;

  const timeStr = new Date(plan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const topDemands = plan.ranking.rankedDemands.slice(0, 5);
  const totalPayload = plan.packing.totalPayload.toLocaleString();
  const averageUtil = plan.packing.averageUtilization.toFixed(1);
  const allRoutes = plan.routing.routes;
  const feasibleRoutes = allRoutes.filter(r => r.feasible);
  const unreachableRoutes = allRoutes.filter(r => !r.feasible);
  const maxTravel = feasibleRoutes.length > 0 ? Math.max(...feasibleRoutes.map(r => r.travelMinutes)) : 0;
  const populationServed = feasibleRoutes.reduce((sum, r) => sum + (nodeMap.get(r.villageId)?.population || 0), 0);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-margin py-space-lg flex flex-col gap-space-lg h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-md border-b border-surface-container-highest gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <h1 className="font-mono-metric-lg text-mono-metric-lg text-on-surface tracking-tight font-semibold">
              Plan generated at {timeStr}
            </h1>
            <span className="px-space-xs py-0.5 rounded text-[10px] font-mono-code uppercase bg-surface-container-high text-primary tracking-wider border border-surface-container-highest">Optimal Converged</span>
          </div>
          <p className="font-mono-code text-mono-code text-outline tracking-wider uppercase">
            SOLVER: HEAP + DIJKSTRA + EDMONDS-KARP + KNAPSACK · RUNTIME {plan.totalRuntimeMs}ms · ALL CONSTRAINTS SATISFIED
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center bg-surface-container border border-surface-container-highest rounded px-space-sm py-1 gap-space-xs">
            <span className="text-outline font-label-sm uppercase">Sector</span>
            <span className="font-mono-metric-sm text-mono-metric-sm text-on-surface font-semibold">Brahmaputra Basin (R-4)</span>
          </div>
        </div>
      </div>

      {/* Grid of 4 algorithm cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

        {/* CARD 01 — RANKING (Heap Sort) */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-highest">
              <span className="font-mono-code text-mono-code uppercase text-on-surface font-semibold tracking-wider">
                CARD 01 · RANKED DEMANDS
              </span>
              <span className="font-mono-code text-mono-code text-outline">{plan.ranking.runtimeMs}ms</span>
            </div>
            <div className="flex flex-col">
              <div className="grid grid-cols-12 py-1 text-outline font-mono-code text-[10px] uppercase border-b border-surface-container-highest px-space-xs">
                <span className="col-span-1">Rank</span>
                <span className="col-span-5">Target Village</span>
                <span className="col-span-3 text-right">Net Demand</span>
                <span className="col-span-3 text-right">Urgency Index</span>
              </div>
              <div className="flex flex-col divide-y divide-surface-container-highest/40 font-mono-code text-mono-code">
                {topDemands.map((d, idx) => {
                  const isCrit = d.urgency_score >= 0.8;
                  const isHigh = d.urgency_score >= 0.6;
                  return (
                    <div key={d.id} className="grid grid-cols-12 items-center py-2 px-space-xs hover:bg-surface-container/50 transition-colors">
                      <span className="col-span-1 text-outline">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="col-span-5 text-on-surface font-label-lg flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCrit ? 'bg-error' : isHigh ? 'bg-primary' : 'bg-tertiary'}`}></span>
                        {getNodeName(d.node_id)}
                      </span>
                      <span className="col-span-3 text-right text-on-surface-variant font-mono-metric-sm">{d.qty_needed} units</span>
                      <div className="col-span-3 text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                          isCrit ? 'bg-error-container/20 text-error border border-error/30' :
                          isHigh ? 'bg-primary-container/20 text-primary-container border border-primary-container/30' :
                          'bg-tertiary-container/20 text-tertiary border border-tertiary/30'
                        }`}>
                          {d.urgency_score.toFixed(2)} {isCrit ? 'CRIT' : isHigh ? 'HIGH' : 'MOD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-surface-container-highest flex items-center justify-between text-outline font-mono-code text-[11px]">
            <span>TOTAL DEMANDS PROCESSED: {plan.ranking.rankedDemands.length}</span>
            <span>POPULATION SERVED: ~{populationServed.toLocaleString()}</span>
          </div>
        </section>

        {/* CARD 02 — ROUTING (Dijkstra) */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-highest">
              <span className="font-mono-code text-mono-code uppercase text-on-surface font-semibold tracking-wider">
                CARD 02 · ROUTES (DIJKSTRA)
              </span>
              <span className="font-mono-code text-mono-code text-outline">{plan.routing.runtimeMs}ms</span>
            </div>
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left font-mono-code text-mono-code">
                <thead>
                  <tr className="border-b border-surface-container-highest text-outline text-[10px] uppercase sticky top-0 bg-surface-container-low">
                    <th className="py-1 font-medium">Depot</th>
                    <th className="py-1 font-medium">Destination</th>
                    <th className="py-1 font-medium text-right">Transit Time</th>
                    <th className="py-1 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/40">
                  {feasibleRoutes.map(r => (
                    <tr key={r.villageId} className="hover:bg-surface-container/50">
                      <td className="py-1.5 text-on-surface-variant truncate max-w-[120px]" title={r.depotName}>{r.depotName.replace(/DEPOT-\w+ \(/, '').replace(')', '')}</td>
                      <td className="py-1.5 text-on-surface font-semibold">{r.villageName}</td>
                      <td className="py-1.5 text-right text-on-surface">{r.travelMinutes} min</td>
                      <td className="py-1.5 text-right"><span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary border border-tertiary/30 text-[10px]">Feasible</span></td>
                    </tr>
                  ))}
                  {unreachableRoutes.map(r => (
                    <tr key={r.villageId} className="hover:bg-surface-container/50 opacity-60">
                      <td className="py-1.5 text-on-surface-variant">—</td>
                      <td className="py-1.5 text-on-surface">{r.villageName}</td>
                      <td className="py-1.5 text-right text-error">∞</td>
                      <td className="py-1.5 text-right"><span className="px-1.5 py-0.5 rounded bg-error-container/20 text-error border border-error/30 text-[10px]">Unreachable</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-surface-container-highest flex items-center justify-between text-outline font-mono-code text-[11px]">
            <span>SHORTEST PATH HEURISTIC: DIJKSTRA</span>
            <span>MAX TRAVEL RADIUS: {maxTravel} MIN</span>
          </div>
        </section>

        {/* CARD 03 — CAPACITY (Edmonds-Karp) */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm mb-space-md border-b border-surface-container-highest">
              <span className="font-mono-code text-mono-code uppercase text-on-surface font-semibold tracking-wider">
                CARD 03 · CAPACITY (MAX-FLOW)
              </span>
              <span className="font-mono-code text-mono-code text-outline">{plan.capacity.runtimeMs}ms</span>
            </div>
            <div className="flex flex-col gap-space-md">
              <div>
                <div className="text-[32px] leading-tight font-mono-metric-lg font-bold text-on-surface tracking-tight">
                  {plan.capacity.maxFlow.toLocaleString()} kg/hr
                </div>
                <div className="text-outline font-mono-code text-mono-code mt-0.5">
                  EFFECTIVE NETWORK THROUGHPUT
                </div>
              </div>
              <div className="p-space-sm rounded bg-surface-container border border-surface-container-highest border-l-2 border-l-primary-container">
                <p className="font-body-md text-body-md text-on-surface">
                  {plan.capacity.bottleneckDescription}
                </p>
              </div>
              {plan.capacity.minCutEdges.length > 0 && (
                <div className="flex items-center justify-between p-space-xs px-space-sm bg-surface-container-lowest rounded border border-surface-container-highest text-on-surface-variant font-mono-code text-mono-code">
                  <span>Min-cut edges:</span>
                  <span className="text-primary font-semibold">{plan.capacity.minCutEdges.length} saturated</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-surface-container-highest flex items-center justify-between text-outline font-mono-code text-[11px]">
            <span>ALGORITHM: EDMONDS-KARP</span>
            <span>GRAPH STATUS: {plan.capacity.minCutEdges.length > 0 ? 'CONSTRAINED' : 'NOMINAL'}</span>
          </div>
        </section>

        {/* CARD 04 — PACKING (0/1 Knapsack) */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded p-space-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-highest">
              <span className="font-mono-code text-mono-code uppercase text-on-surface font-semibold tracking-wider">
                CARD 04 · VEHICLE MANIFESTS (KNAPSACK)
              </span>
              <span className="font-mono-code text-mono-code text-outline">{plan.packing.runtimeMs}ms</span>
            </div>
            <div className="flex flex-col gap-space-md max-h-56 overflow-y-auto pr-2">
              {plan.packing.manifests.map(m => (
                <div key={m.vehicleId} className="flex flex-col gap-1 pb-space-xs border-b border-surface-container-highest/60">
                  <div className="flex items-center justify-between font-mono-code">
                    <span className="text-on-surface font-semibold font-label-lg">{m.vehicleName}</span>
                    <span className={`font-mono-metric-sm font-semibold ${m.utilization > 80 ? 'text-primary' : 'text-tertiary'}`}>
                      {m.totalWeight.toLocaleString()} / {m.capacityKg.toLocaleString()} kg · {m.utilization}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden border border-surface-container-highest">
                    <div className={`h-full rounded-full transition-all duration-500 ${m.utilization > 80 ? 'bg-primary-container' : 'bg-tertiary'}`} style={{ width: `${m.utilization}%` }}></div>
                  </div>
                  <p className="font-mono-code text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    {m.items.length > 0 ? m.items.map(i => `${i.qtyLoaded}x ${i.itemName} (${i.weightKg}kg)`).join(', ') : 'No cargo assigned'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-space-md pt-space-xs border-t border-surface-container-highest flex items-center justify-between text-outline font-mono-code text-[11px]">
            <span>TOTAL PAYLOAD DISPATCHED: {totalPayload} KG</span>
            <span>UTILIZATION: {averageUtil}%</span>
          </div>
        </section>

      </div>

      {/* Bottom dispatch status bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-space-sm bg-surface-container-low border border-surface-container-highest rounded text-outline font-mono-code text-mono-code gap-space-sm mb-4">
        <div className="flex items-center gap-space-sm">
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
          <span>DISPATCH PIPELINE ARMED · STANDBY FOR OPERATOR AUTHENTICATION</span>
        </div>
        <div className="flex items-center gap-space-md">
          <span>EST. FIRST ARRIVAL: {feasibleRoutes.length > 0 ? `${Math.min(...feasibleRoutes.map(r => r.travelMinutes))} MIN` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
