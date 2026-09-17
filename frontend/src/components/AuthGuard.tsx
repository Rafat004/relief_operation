"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured, skipping auth guard");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && mounted) {
          router.push("/login");
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) router.push("/login");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  // If on the login page, always render immediately
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // While checking auth, show a simple loading state or blank screen
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
