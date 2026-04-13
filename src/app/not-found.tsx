"use client";

import { useCallback, useSyncExternalStore } from "react";
import ZoroGame from "@/components/404/ZoroGame";
import StaticNotFound from "@/components/404/StaticNotFound";

function useReducedMotion() {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);
  const getSnapshot = useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function NotFound() {
  const reduced = useReducedMotion();

  return (
    <main className="flex-1 relative z-10">
      {reduced ? <StaticNotFound /> : <ZoroGame />}
    </main>
  );
}
