"use client";

import { useState } from "react";
import { Demand, Node, Item } from "@/lib/types";

interface DemandsViewProps {
  demands: Demand[];
  nodes: Node[];
  items: Item[];
  onAddDemand: (demand: Demand) => void;
}

export default function DemandsView({ demands, nodes, items, onAddDemand }: DemandsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [formVillage, setFormVillage] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formUrgency, setFormUrgency] = useState("");

  const villages = nodes.filter(n => n.kind === "village");

  // Sort demands by urgency (descending) for display
  const sorted = [...demands].sort((a, b) => b.urgency_score - a.urgency_score);

  const handleSubmit = () => {
    if (!formVillage || !formItem) return;

    const newDemand: Demand = {
      id: `d-${Date.now()}`,
      node_id: formVillage,
      item_id: formItem,
      qty_needed: parseInt(formQty) || 50,
      urgency_score: parseFloat(formUrgency) || 0.5,
    };

    onAddDemand(newDemand);

    // Reset form
    setFormVillage("");
    setFormItem("");
    setFormQty("");
    setFormUrgency("");
    setShowForm(false);
  };

  const criticalCount = demands.filter(d => d.urgency_score >= 0.8).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-margin py-space-md flex flex-col gap-space-sm h-[calc(100vh-3.5rem)] overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between h-9 mt-4">
        <div className="flex items-center gap-space-sm font-mono-metric-md text-mono-metric-md">
          <span className="text-on-surface font-medium tracking-tight">{demands.length} requests</span>
          <span className="text-outline-variant font-mono-code">·</span>
          <span className="text-error font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
            {criticalCount} critical
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => setShowForm(!showForm)}
            className="h-7 px-space-sm bg-surface-container border border-outline-variant hover:border-outline text-on-surface font-label-md text-label-md rounded flex items-center gap-1.5 transition-colors select-none"
            type="button"
          >
            <span className="text-[14px]">{showForm ? '×' : '+'}</span>
            <span>{showForm ? 'Cancel' : 'Add demand'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Inline Form */}
      {showForm && (
        <div className="w-full bg-surface-container-high border border-outline-variant rounded p-space-sm transition-all">
          <div className="flex items-center justify-between gap-space-sm text-on-surface text-body-sm flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Target Village</label>
              <select
                value={formVillage}
                onChange={e => setFormVillage(e.target.value)}
                className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-body-sm focus:outline-none focus:border-primary-container"
              >
                <option value="" disabled>Select village...</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Relief Asset</label>
              <select
                value={formItem}
                onChange={e => setFormItem(e.target.value)}
                className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-body-sm focus:outline-none focus:border-primary-container"
              >
                <option value="" disabled>Select item...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Quantity</label>
              <input
                type="number"
                value={formQty}
                onChange={e => setFormQty(e.target.value)}
                placeholder="50"
                className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-mono-metric-sm focus:outline-none focus:border-primary-container"
              />
            </div>
            <div className="w-28">
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">Urgency (0-1)</label>
              <input
                type="number"
                value={formUrgency}
                onChange={e => setFormUrgency(e.target.value)}
                placeholder="0.75"
                min="0"
                max="1"
                step="0.01"
                className="w-full h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface font-mono-metric-sm focus:outline-none focus:border-primary-container"
              />
            </div>
            <div className="flex items-end gap-2 pt-4">
              <button
                onClick={handleSubmit}
                className="h-8 px-4 bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md rounded flex items-center justify-center transition-colors"
                type="button"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="h-8 px-3 bg-transparent hover:bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded border border-outline-variant"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demands Table */}
      <div className="w-full bg-surface-container-low border border-outline-variant rounded overflow-hidden mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-8 bg-surface-container border-b border-outline-variant font-mono-code text-label-sm text-on-surface-variant uppercase tracking-wider select-none">
              <th className="w-14 px-space-sm text-right">Rank</th>
              <th className="px-space-md">Village Jurisdiction</th>
              <th className="w-28 px-space-sm text-center">Item Requisition</th>
              <th className="w-32 px-space-md text-right">Quantity</th>
              <th className="w-36 px-space-md text-right">Weight</th>
              <th className="w-28 px-space-md text-right">Urgency (0-1)</th>
              <th className="w-32 px-space-md text-center">Triage Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
            {sorted.map((demand, index) => {
              const node = nodes.find(n => n.id === demand.node_id);
              const item = items.find(i => i.id === demand.item_id);
              const isCritical = demand.urgency_score >= 0.8;
              const isHigh = demand.urgency_score >= 0.6 && demand.urgency_score < 0.8;

              return (
                <tr key={demand.id} className={`h-9 hover:bg-surface-container transition-colors ${isCritical ? 'border-l-2 border-l-error' : ''}`}>
                  <td className="px-space-sm font-mono-metric-sm text-mono-metric-sm text-on-surface-variant text-right">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-space-md flex items-center h-9">
                    <span className="font-headline-sm text-headline-sm text-on-surface">{node?.name || 'Unknown'}</span>
                    <span className="font-mono-metric-sm text-mono-metric-sm text-on-surface-variant ml-1.5">({demand.node_id})</span>
                  </td>
                  <td className="px-space-sm text-center">
                    <span className="inline-block px-2 py-0.5 bg-surface-container-high border border-outline-variant text-on-surface rounded font-mono-code text-label-sm">
                      {item?.name.split(' ')[0].toUpperCase() || '—'}
                    </span>
                  </td>
                  <td className="px-space-md font-mono-metric-sm text-mono-metric-sm text-on-surface text-right">
                    {demand.qty_needed.toLocaleString()}
                  </td>
                  <td className="px-space-md font-mono-metric-sm text-mono-metric-sm text-on-surface-variant text-right">
                    {((item?.weight_kg || 0) * demand.qty_needed).toLocaleString()} kg
                  </td>
                  <td className={`px-space-md font-mono-metric-sm text-mono-metric-sm font-medium text-right ${isCritical ? 'text-error' : 'text-on-surface'}`}>
                    {demand.urgency_score.toFixed(2)}
                  </td>
                  <td className="px-space-md text-center">
                    {isCritical ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono-code text-label-sm bg-error-container/30 text-error border border-error/40">Critical</span>
                    ) : isHigh ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono-code text-label-sm bg-primary-container/20 text-primary-container border border-primary-container/40">Pending</span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono-code text-label-sm bg-secondary-container/30 text-secondary border border-secondary/40">Planned</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-outline text-label-sm font-mono-code px-space-xs mt-space-xs select-none pb-4">
        <div>DISPATCH REGISTER · SORT: URGENCY_INDEX_DESC</div>
        <div className="flex items-center gap-4">
          <span>DEMANDS: {demands.length}</span>
          <span>CRITICAL: {criticalCount}</span>
        </div>
      </div>
    </div>
  );
}
