# ReliefRoute

ReliefRoute is a disaster relief routing and logistics application designed to orchestrate and optimize the distribution of critical resources (medical kits, water, food, shelter) from supply depots to affected villages.

## Features

- **Real-time Synchronization:** Built with Supabase, allowing multiple operators to monitor network states, toggle road passability, and queue demands in real-time.
- **Interactive Topographic Map:** Visualizes depots, villages, and road networks. Click on any road segment to toggle its passable status (e.g., due to floods or landslides).
- **Demand Queueing:** Log supply requests for specific villages with calculated urgency scores based on population, severity, and time-to-deadline.
- **Deterministic Optimization Pipeline:** Generates comprehensive relief plans using a sequence of classical algorithms.
- **Immutable Log Registry:** Keeps a history of generated manifests and plans for audit and review.

## Algorithm Pipeline

When you click "Generate Relief Plan", the application runs a 4-step algorithmic pipeline:

1. **Ranking (Binary Max-Heap):** Extracts the most urgent demands based on urgency scores.
2. **Routing (Dijkstra's Algorithm):** Computes the shortest travel times and feasible paths from depots to target villages.
3. **Capacity Analysis (Edmonds-Karp):** Calculates the maximum network flow (throughput) and identifies critical bottlenecks (min-cut edges).
4. **Vehicle Packing (0/1 Knapsack):** Optimally allocates relief items to available vehicles to maximize total value while respecting weight capacities.

## Tech Stack

- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS & custom shadcn/ui components
- **Map:** Leaflet (`react-leaflet`)
- **Database & Realtime:** Supabase

## Setup Instructions

### 1. Supabase Setup
You need a Supabase project to enable real-time features and persistence.
1. Create a project at [Supabase](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard.
3. Open `supabase-schema.sql` (found in your workspace) and run the entire script. This will create the necessary tables, configure Row Level Security (RLS), enable Realtime, and insert seed data (nodes, edges, items, vehicles). *Note: The demands table starts empty by design.*

### 2. Environment Variables
Create a `.env.local` file in the root of the frontend directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run the Development Server

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. If Supabase is not configured, the app will gracefully fall back to local mock data.
