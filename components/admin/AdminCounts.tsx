"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Counts = { pending: number; unseen: number };

const CountsContext = createContext<Counts>({ pending: 0, unseen: 0 });

export function useAdminCounts() {
  return useContext(CountsContext);
}

const POLL_SECONDS = 30;

// Keeps the order numbers fresh: every 30 seconds, and after every page change
export default function AdminCountsProvider({
  initial,
  children,
}: {
  initial: Counts;
  children: React.ReactNode;
}) {
  const [counts, setCounts] = useState<Counts>(initial);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch("/api/admin/counts", { cache: "no-store" });
      if (!res.ok) return;
      setCounts((await res.json()) as Counts);
    } catch {
      // The next try will fix it
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(refresh, POLL_SECONDS * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  return <CountsContext.Provider value={counts}>{children}</CountsContext.Provider>;
}