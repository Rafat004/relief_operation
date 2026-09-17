"use client";

import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Node, Edge } from "@/lib/types";

// Fix missing marker icons in leaflet with Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  nodes: Node[];
  edges: Edge[];
  onToggleEdge?: (edgeId: string) => void;
}

export default function Map({ nodes, edges, onToggleEdge }: MapProps) {
  // Kurigram center point roughly
  const center: [number, number] = [25.7000, 89.6500];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#f2efe9" }}
        className="z-0"
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Draw Edges — clickable to toggle passable/impassable */}
        {edges.map((edge) => {
          const nodeA = nodes.find(n => n.id === edge.node_a);
          const nodeB = nodes.find(n => n.id === edge.node_b);
          if (!nodeA || !nodeB) return null;

          return (
            <Polyline
              key={edge.id}
              positions={[[nodeA.lat, nodeA.lng], [nodeB.lat, nodeB.lng]]}
              color={edge.passable ? "#4a6fa5" : "#ffb4ab"}
              weight={edge.passable ? 3 : 4}
              dashArray={edge.passable ? "none" : "8 6"}
              opacity={0.9}
              eventHandlers={{
                click: () => {
                  if (onToggleEdge) onToggleEdge(edge.id);
                },
              }}
            >
              <Tooltip
                direction="center"
                className="bg-surface-container border border-surface-container-highest text-on-surface shadow-md font-mono-code text-[11px] rounded px-2 py-1"
              >
                {edge.passable ? (
                  <span>{edge.minutes} min · {edge.capacity_per_hour.toLocaleString()} kg/hr<br/><span className="text-outline text-[9px]">Click to mark impassable</span></span>
                ) : (
                  <span className="text-error">/// IMPASSABLE<br/><span className="text-outline text-[9px]">Click to restore</span></span>
                )}
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node) =>
          node.kind === "depot" ? (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={icon}>
              <Tooltip direction="top" offset={[0, -40]} opacity={1} className="bg-surface-container border border-surface-container-highest text-on-surface font-mono-code rounded shadow-md">
                {node.name}
              </Tooltip>
            </Marker>
          ) : (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lng]}
              radius={node.population > 3000 ? 7 : 5}
              fillColor="#2d5f8a"
              color="#1a3d5c"
              weight={2}
              fillOpacity={0.85}
            >
              <Tooltip direction="bottom" opacity={0.95} className="bg-surface-container border border-surface-container-highest text-on-surface font-mono-code rounded shadow-md">
                <span className="font-semibold">{node.name}</span>
                <br />
                <span className="text-outline text-[10px]">Pop: {node.population.toLocaleString()}</span>
              </Tooltip>
            </CircleMarker>
          )
        )}
      </MapContainer>
    </div>
  );
}
