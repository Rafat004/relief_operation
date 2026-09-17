import { PipelineResult } from "@/lib/algorithms/runner";

interface HistoryViewProps {
  history: PipelineResult[];
  onViewPlan: (plan: PipelineResult) => void;
  onGeneratePlan?: () => void;
}

export default function HistoryView({ history, onViewPlan, onGeneratePlan }: HistoryViewProps) {
  if (history.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center p-margin">
        <div className="bg-surface-container-low rounded border border-outline-variant/30 py-16 px-space-lg flex flex-col items-center justify-center text-center max-w-lg w-full">
          <div className="w-12 h-12 rounded bg-surface-container-high flex items-center justify-center mb-space-md">
            <span className="text-outline text-[24px]">📂</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">No plans generated yet</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-space-lg">
            Telemetry models and supply demand queues require an initial compute cycle to trace optimal delivery routes.
          </p>
          <button
            onClick={onGeneratePlan}
            className="h-8 px-space-md bg-primary-container hover:bg-primary text-on-primary-container font-label-lg text-label-lg rounded flex items-center justify-center transition-colors"
            type="button"
          >
            Generate your first plan
          </button>
        </div>
      </div>
    );
  }

  // Sort newest first
  const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="w-full max-w-7xl mx-auto px-margin py-space-lg flex flex-col gap-space-lg h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-space-sm">
          <span className="font-mono-metric-md text-mono-metric-md text-on-surface">{history.length} plans generated</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Log Registry // Immutable Ledger</span>
        </div>
        <div className="flex items-center gap-space-md">
          <span className="font-mono-code text-mono-code text-on-surface-variant">Partition: IND-AS-04 // Flood Zone Bravo</span>
        </div>
      </div>

      {/* History Table */}
      <div className="w-full bg-surface-container-low rounded border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/30 h-8">
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider font-semibold">Generated At</th>
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider text-right font-semibold">Villages Served</th>
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider text-right font-semibold">Total Payload</th>
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider text-right font-semibold">Network Capacity</th>
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider text-right font-semibold">Runtime</th>
                <th className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface-variant uppercase tracking-wider text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {sortedHistory.map((plan, index) => {
                const isLatest = index === 0;
                const dateStr = new Date(plan.createdAt).toLocaleString();
                const servedNodes = plan.routing.routes.filter(r => r.feasible).length;
                const totalNodes = plan.routing.routes.length;

                return (
                  <tr key={plan.id} className="h-10 hover:bg-surface-container-high/60 transition-colors group">
                    <td className="px-space-md py-space-xs font-mono-code text-mono-code text-on-surface flex items-center gap-space-sm h-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-primary' : 'bg-outline'} flex-shrink-0`}></span>
                      <span>{dateStr}</span>
                      {isLatest && <span className="px-1 bg-surface-container text-primary font-mono-code text-[10px] rounded border border-primary/30 ml-space-xs">LATEST</span>}
                    </td>
                    <td className="px-space-md py-space-xs font-mono-metric-sm text-mono-metric-sm text-on-surface text-right">
                      {servedNodes} / {totalNodes} villages
                    </td>
                    <td className="px-space-md py-space-xs font-mono-metric-sm text-mono-metric-sm text-on-surface text-right font-medium">
                      {plan.packing.totalPayload.toLocaleString()} kg
                    </td>
                    <td className="px-space-md py-space-xs font-mono-metric-sm text-mono-metric-sm text-on-surface text-right text-secondary">
                      {plan.capacity.maxFlow.toLocaleString()} kg/hr
                    </td>
                    <td className="px-space-md py-space-xs font-mono-metric-sm text-mono-metric-sm text-on-surface-variant text-right">
                      {plan.totalRuntimeMs}ms
                    </td>
                    <td className="px-space-md py-space-xs text-right">
                      <button
                        onClick={() => onViewPlan(plan)}
                        className="font-mono-code text-mono-code text-secondary hover:text-secondary-fixed hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-space-md py-space-xs bg-surface-container border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono-code text-mono-code">
          <span>Displaying rows 1–{history.length} of {history.length}</span>
          <span>Storage: Supabase (Persistent)</span>
        </div>
      </div>

      {/* Protocol footnote */}
      <div className="mt-space-lg p-space-md bg-surface-container/60 rounded border border-outline-variant/20 flex flex-col gap-space-xs mb-4">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Protocol Specification Reference</span>
          <span className="font-mono-code text-[10px] text-tertiary">STANDBY DISPATCH REPOSITORY</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Historical manifests contain frozen node-weight snapshots, calculated hydrologic bottlenecks, and computed vehicle routing telemetry. All units calculated via deterministic algorithms (Heap Sort, Dijkstra, Edmonds-Karp, 0/1 Knapsack) against network state at generation time. Plans are persisted to Supabase and synchronized in real-time across all connected clients.
        </p>
      </div>
    </div>
  );
}
