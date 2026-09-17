"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { runPipeline, PipelineResult } from "@/lib/algorithms/runner";
import { Node, Edge, Item, Vehicle, Demand } from "@/lib/types";

import MapView from "@/components/views/MapView";
import DemandsView from "@/components/views/DemandsView";
import PlanView from "@/components/views/PlanView";
import HistoryView from "@/components/views/HistoryView";

type ViewState = "map" | "demands" | "plan" | "history";

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewState>("map");

  // Data state — initialized empty, populated from Supabase
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<PipelineResult[]>([]);
  const [activePlan, setActivePlan] = useState<PipelineResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ──────────────────────────────────────────────
  // Initial data fetch from Supabase
  // ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // Auth Check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) {
          router.push("/login");
        }
        return; // Don't fetch data if not authenticated
      }

      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setError("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
          setIsLoading(false);
        }
        return;
      }

      try {
        const [nodesRes, edgesRes, itemsRes, vehiclesRes, demandsRes, plansRes] = await Promise.all([
          supabase.from("nodes").select("*"),
          supabase.from("edges").select("*"),
          supabase.from("items").select("*"),
          supabase.from("vehicles").select("*"),
          supabase.from("demands").select("*").order("created_at", { ascending: true }),
          supabase.from("plans").select("*").neq("id", "plan-1789638658192").order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;

        const hasError = [nodesRes, edgesRes, itemsRes, vehiclesRes, demandsRes].some(r => r.error);

        if (hasError || !nodesRes.data?.length) {
          setError("Failed to fetch data from Supabase. Ensure your database is initialized.");
        } else {
          setNodes(nodesRes.data as Node[]);
          setEdges(edgesRes.data as Edge[]);
          setItems(itemsRes.data as Item[]);
          setVehicles(vehiclesRes.data as Vehicle[]);
          setDemands(demandsRes.data as Demand[]);

          if (plansRes.data && plansRes.data.length > 0) {
            const loadedPlans: PipelineResult[] = plansRes.data.map((p: { id: string; created_at: string; result: PipelineResult }) => ({
              ...p.result,
              id: p.id,
              createdAt: p.created_at,
            }));
            setHistory(loadedPlans);
            setActivePlan(loadedPlans[0]);
          }
        }
      } catch (err) {
        if (!cancelled) setError("Supabase connection failed.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ──────────────────────────────────────────────
  // Real-time subscriptions (only when using Supabase)
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (error || isLoading) return;

    const channel = supabase
      .channel("realtime-relief")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "edges" },
        (payload) => {
          const updated = payload.new as Edge;
          setEdges((prev) =>
            prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "demands" },
        (payload) => {
          const newDemand = payload.new as Demand;
          setDemands((prev) => {
            // Avoid duplicates (we already optimistically added it)
            if (prev.some((d) => d.id === newDemand.id)) return prev;
            return [...prev, newDemand];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "demands" },
        (payload) => {
          const deletedDemandId = payload.old.id;
          setDemands((prev) => prev.filter((d) => d.id !== deletedDemandId));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "plans" },
        (payload) => {
          const newPlan = payload.new as { id: string; created_at: string; result: PipelineResult };
          const plan: PipelineResult = {
            ...newPlan.result,
            id: newPlan.id,
            createdAt: newPlan.created_at,
          };
          setHistory((prev) => {
            if (prev.some((p) => p.id === plan.id)) return prev;
            return [plan, ...prev];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [error, isLoading]);

  // ──────────────────────────────────────────────
  // Event Handlers
  // ──────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleGeneratePlan = useCallback(async () => {
    setIsGenerating(true);

    // Use requestAnimationFrame to let the UI update before blocking
    requestAnimationFrame(async () => {
      const result = runPipeline(nodes, edges, demands, items, vehicles);

      const { error } = await supabase.from("plans").insert({
        id: result.id,
        created_at: result.createdAt,
        result: result,
      });
      
      if (error) {
        console.error("Failed to save plan to Supabase:", error);
        alert("Failed to save plan to database: " + error.message);
      }

      setHistory((prev) => {
        if (prev.some((p) => p.id === result.id)) return prev;
        return [result, ...prev];
      });
      setActivePlan(result);
      setActiveView("plan");
      setIsGenerating(false);
    });
  }, [nodes, edges, demands, items, vehicles]);

  const handleViewPlanFromHistory = useCallback((plan: PipelineResult) => {
    setActivePlan(plan);
    setActiveView("plan");
  }, []);

  const handleAddDemand = useCallback(async (demand: Demand) => {
    // Optimistic update
    setDemands((prev) => [...prev, demand]);

    const { error } = await supabase.from("demands").insert({
      id: demand.id,
      node_id: demand.node_id,
      item_id: demand.item_id,
      qty_needed: demand.qty_needed,
      urgency_score: demand.urgency_score,
    });
    if (error) {
      console.error("Failed to insert demand:", error);
      // Rollback on error
      setDemands((prev) => prev.filter((d) => d.id !== demand.id));
    }
  }, []);

  const handleDeleteDemand = useCallback(async (demandId: string) => {
    // Find the demand to potentially rollback
    const demandToDelete = demands.find((d) => d.id === demandId);
    if (!demandToDelete) return;

    // Optimistic update
    setDemands((prev) => prev.filter((d) => d.id !== demandId));

    const { error } = await supabase.from("demands").delete().eq("id", demandId);
    if (error) {
      console.error("Failed to delete demand:", error);
      // Rollback on error
      setDemands((prev) => [...prev, demandToDelete]);
    }
  }, [demands]);

  const handleToggleEdge = useCallback(async (edgeId: string) => {
    // Optimistic update
    setEdges((prev) =>
      prev.map((e) =>
        e.id === edgeId ? { ...e, passable: !e.passable } : e
      )
    );

    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const { error: updateError } = await supabase
      .from("edges")
      .update({ passable: !edge.passable })
      .eq("id", edgeId);

    if (updateError) {
      console.error("Failed to toggle edge:", updateError);
      // Rollback
      setEdges((prev) =>
        prev.map((e) =>
          e.id === edgeId ? { ...e, passable: !e.passable } : e
        )
      );
    }
  }, [edges]);

  const navItems: { key: ViewState; label: string }[] = [
    { key: "map", label: "Map" },
    { key: "demands", label: "Demands" },
    { key: "plan", label: "Plan" },
    { key: "history", label: "History" },
  ];

  // ──────────────────────────────────────────────
  // Loading State
  // ──────────────────────────────────────────────
  if (error) {
    return (
      <main className="w-full h-screen flex flex-col items-center justify-center bg-surface-container-lowest gap-space-md">
        <div className="font-headline-md text-error font-bold">Error</div>
        <div className="text-on-surface-variant max-w-lg text-center">{error}</div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="w-full h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }}></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }}></span>
          </div>
          <span className="font-mono-code text-mono-code text-outline uppercase tracking-widest">
            Establishing Supabase Link...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-grow flex flex-col bg-surface-container-lowest">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full h-14 z-50 bg-surface-container-low border-b border-surface-container-highest">
        <div className="w-full h-14 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">ReliefRoute</span>
            </div>
            <div className="h-4 w-px bg-surface-container-highest"></div>
            <nav className="flex items-center gap-space-md h-14">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key)}
                  className={`h-14 flex items-center px-space-xs transition-colors ${
                    activeView === item.key
                      ? "text-on-surface border-b-2 border-primary-container font-medium"
                      : "font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface border-b-2 border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container border border-surface-container-highest rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span className="font-mono-metric-sm text-mono-metric-sm text-on-surface-variant uppercase">
                {isGenerating ? 'Computing...' : 'Realtime: Connected'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="h-8 px-space-md bg-surface-container-highest hover:bg-error hover:text-on-error text-on-surface-variant font-label-lg text-label-lg rounded-md flex items-center justify-center transition-colors select-none"
              type="button"
            >
              Sign Out
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="h-8 px-space-md bg-primary-container hover:bg-primary text-on-primary-container font-label-lg text-label-lg rounded-md flex items-center justify-center transition-colors select-none disabled:opacity-50"
              type="button"
            >
              {isGenerating ? 'Generating...' : 'Generate Relief Plan'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <div className="w-full mt-14 flex-grow">
        {activeView === "map" && (
          <MapView
            nodes={nodes}
            edges={edges}
            onToggleEdge={handleToggleEdge}
          />
        )}
        {activeView === "demands" && (
          <DemandsView
            demands={demands}
            nodes={nodes}
            items={items}
            onAddDemand={handleAddDemand}
            onDeleteDemand={handleDeleteDemand}
          />
        )}
        {activeView === "plan" && (
          <PlanView plan={activePlan} nodes={nodes} />
        )}
        {activeView === "history" && (
          <HistoryView
            history={history}
            onViewPlan={handleViewPlanFromHistory}
            onGeneratePlan={handleGeneratePlan}
          />
        )}
      </div>
    </main>
  );
}
