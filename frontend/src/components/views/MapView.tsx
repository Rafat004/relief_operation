import DynamicMap from "../map/DynamicMap";
import { Node, Edge } from "@/lib/types";

interface MapViewProps {
  nodes: Node[];
  edges: Edge[];
  onToggleEdge: (edgeId: string) => void;
}

export default function MapView({ nodes, edges, onToggleEdge }: MapViewProps) {
  const villageCount = nodes.filter(n => n.kind === 'village').length;
  const depotCount = nodes.filter(n => n.kind === 'depot').length;
  const impassableCount = edges.filter(e => !e.passable).length;
  const totalEdges = edges.length;

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative">
      <DynamicMap nodes={nodes} edges={edges} onToggleEdge={onToggleEdge} />

      {/* HUD Overlay — bottom left */}
      <div className="absolute bottom-4 left-4 z-[400] bg-surface-container border border-surface-container-highest rounded-lg p-3 pointer-events-auto shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Network State: Monitored</span>
        </div>
        <div className="font-mono-metric-md text-mono-metric-md text-on-surface flex items-center gap-1.5">
          <span className="font-bold text-on-surface">{villageCount}</span>
          <span className="text-outline">villages</span>
          <span className="text-surface-container-highest">·</span>
          <span className="font-bold text-on-surface">{depotCount}</span>
          <span className="text-outline">depots</span>
          <span className="text-surface-container-highest">·</span>
          <span className="font-bold text-on-surface">{totalEdges}</span>
          <span className="text-outline">edges</span>
          <span className="text-surface-container-highest">·</span>
          <span className={`font-bold ${impassableCount > 0 ? 'text-error' : 'text-tertiary'}`}>{impassableCount}</span>
          <span className="text-outline">impassable</span>
        </div>
      </div>

      {/* Interactive hint — bottom right */}
      <div className="absolute bottom-4 right-4 z-[400] bg-surface-container/90 border border-surface-container-highest rounded-lg px-3 py-2 pointer-events-none shadow-md">
        <span className="font-mono-code text-mono-code text-outline">
          Click any road to toggle passable/impassable
        </span>
      </div>
    </div>
  );
}
