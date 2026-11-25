"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyVibes,
  getVibes,
  setVibes,
  subscribeVibes,
} from "@/lib/settings";

export function FloatingTab() {
  const vibes = useSyncExternalStore(subscribeVibes, getVibes, () => true);

  useEffect(() => {
    applyVibes();
  }, []);

  return (
    <button
      type="button"
      className="floating-tab"
      aria-pressed={vibes}
      aria-label={vibes ? "Turn visual effects off" : "Turn visual effects on"}
      title={vibes ? "Visual effects on" : "Visual effects off"}
      data-cursor-label={vibes ? "VIBES" : "CALM"}
      onClick={() => setVibes(!vibes)}
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3.4" fill="currentColor" />
        <path
          d="M10 1.5v2.2M10 16.3v2.2M1.5 10h2.2M16.3 10h2.2M3.99 3.99l1.56 1.56M14.45 14.45l1.56 1.56M16.01 3.99l-1.56 1.56M5.55 14.45l-1.56 1.56"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
