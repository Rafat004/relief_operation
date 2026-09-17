import { Node, Edge, Item, Vehicle, Demand } from "./types";

// Helper for generating urgency scores
const calculateUrgency = (severity: number, population: number, hours: number) => {
  return Number(((severity * 0.5) + (population / 100) * 0.3 + (1 / hours) * 0.2).toFixed(2));
};

export const MOCK_NODES: Node[] = [
  // Depots
  { id: "depot-1", name: "DEPOT-NORTH (Kurigram Sadar)", kind: "depot", lat: 25.8105, lng: 89.6455, population: 0 },
  { id: "depot-2", name: "DEPOT-CENTRAL (Chilmari)", kind: "depot", lat: 25.5684, lng: 89.6702, population: 0 },
  { id: "depot-3", name: "DEPOT-SOUTH (Ulipur)", kind: "depot", lat: 25.6661, lng: 89.6277, population: 0 },
  
  // Villages
  { id: "v-1", name: "Shahebganj", kind: "village", lat: 25.8502, lng: 89.6588, population: 2100 },
  { id: "v-2", name: "Thettoi", kind: "village", lat: 25.8611, lng: 89.6792, population: 1400 },
  { id: "v-3", name: "Mogolbasa", kind: "village", lat: 25.8322, lng: 89.6855, population: 3800 },
  { id: "v-4", name: "Holokhana", kind: "village", lat: 25.8450, lng: 89.6200, population: 1800 },
  { id: "v-5", name: "Ghoghadanga", kind: "village", lat: 25.7955, lng: 89.6850, population: 2900 },
  { id: "v-6", name: "Kanthalbari", kind: "village", lat: 25.8155, lng: 89.6050, population: 2300 },
  { id: "v-7", name: "Raniganj", kind: "village", lat: 25.6022, lng: 89.6600, population: 3100 },
  { id: "v-8", name: "Hatia", kind: "village", lat: 25.5900, lng: 89.6850, population: 4600 },
  { id: "v-9", name: "Durgapur", kind: "village", lat: 25.5500, lng: 89.6450, population: 3400 },
  { id: "v-10", name: "Begumganj", kind: "village", lat: 25.5350, lng: 89.6800, population: 4900 },
  { id: "v-11", name: "Nayarhat", kind: "village", lat: 25.5100, lng: 89.6950, population: 2600 },
  { id: "v-12", name: "Astamir Char", kind: "village", lat: 25.5300, lng: 89.7150, population: 1200 },
  { id: "v-13", name: "Jatrapur", kind: "village", lat: 25.5500, lng: 89.7300, population: 4200 },
  { id: "v-14", name: "Bozra", kind: "village", lat: 25.6550, lng: 89.6550, population: 3700 },
  { id: "v-15", name: "Gunaigach", kind: "village", lat: 25.6700, lng: 89.6100, population: 1900 },
];

export const MOCK_EDGES: Edge[] = [
  // Connect Kurigram (depot-1)
  { id: "e-1", node_a: "depot-1", node_b: "v-1", minutes: 45, capacity_per_hour: 5000, passable: true },
  { id: "e-2", node_a: "depot-1", node_b: "v-3", minutes: 30, capacity_per_hour: 8000, passable: true },
  { id: "e-3", node_a: "depot-1", node_b: "v-4", minutes: 25, capacity_per_hour: 4000, passable: true },
  { id: "e-4", node_a: "depot-1", node_b: "v-5", minutes: 35, capacity_per_hour: 6000, passable: true },
  { id: "e-5", node_a: "depot-1", node_b: "v-6", minutes: 20, capacity_per_hour: 4500, passable: true },
  
  // Inter-village north
  { id: "e-6", node_a: "v-1", node_b: "v-2", minutes: 15, capacity_per_hour: 2000, passable: true },
  { id: "e-7", node_a: "v-2", node_b: "v-3", minutes: 25, capacity_per_hour: 3000, passable: true },
  
  // Connect Chilmari (depot-2)
  { id: "e-8", node_a: "depot-2", node_b: "v-7", minutes: 40, capacity_per_hour: 6000, passable: true },
  { id: "e-9", node_a: "depot-2", node_b: "v-8", minutes: 20, capacity_per_hour: 7000, passable: true },
  { id: "e-10", node_a: "depot-2", node_b: "v-9", minutes: 15, capacity_per_hour: 4000, passable: false }, // Impassable
  { id: "e-11", node_a: "depot-2", node_b: "v-10", minutes: 35, capacity_per_hour: 9000, passable: true },
  
  // Inter-village central
  { id: "e-12", node_a: "v-8", node_b: "v-13", minutes: 45, capacity_per_hour: 3000, passable: true },
  { id: "e-13", node_a: "v-10", node_b: "v-11", minutes: 25, capacity_per_hour: 4500, passable: false }, // Impassable
  { id: "e-14", node_a: "v-11", node_b: "v-12", minutes: 15, capacity_per_hour: 2000, passable: true },
  
  // Connect Ulipur (depot-3)
  { id: "e-15", node_a: "depot-3", node_b: "v-14", minutes: 20, capacity_per_hour: 5000, passable: true },
  { id: "e-16", node_a: "depot-3", node_b: "v-15", minutes: 15, capacity_per_hour: 4000, passable: true },
  
  // Inter-depot / cross-region
  { id: "e-17", node_a: "v-5", node_b: "v-14", minutes: 50, capacity_per_hour: 3000, passable: true },
  { id: "e-18", node_a: "v-7", node_b: "v-14", minutes: 40, capacity_per_hour: 4000, passable: true },
];

export const MOCK_ITEMS: Item[] = [
  { id: "i-1", name: "Medical Kit Type A", weight_kg: 5, value_score: 100 },
  { id: "i-2", name: "Clean Water (20L)", weight_kg: 20, value_score: 80 },
  { id: "i-3", name: "Family Ration Pack (7 Days)", weight_kg: 15, value_score: 90 },
  { id: "i-4", name: "Emergency Shelter Tarpaulin", weight_kg: 8, value_score: 60 },
  { id: "i-5", name: "High-Energy Biscuits (Carton)", weight_kg: 10, value_score: 75 },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "veh-1", name: "Heavy Cargo Truck (T-01)", weight_capacity_kg: 5000 },
  { id: "veh-2", name: "Heavy Cargo Truck (T-02)", weight_capacity_kg: 5000 },
  { id: "veh-3", name: "Medium Cargo Truck (T-03)", weight_capacity_kg: 2500 },
  { id: "veh-4", name: "Watercraft (W-01)", weight_capacity_kg: 1500 },
  { id: "veh-5", name: "Watercraft (W-02)", weight_capacity_kg: 1500 },
];

export const MOCK_DEMANDS: Demand[] = [];
