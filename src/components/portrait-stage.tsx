"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import {
  ENTERED_EVENT,
  getDesign,
  hasEntered,
  subscribeDesign,
} from "@/lib/settings";

const ParticlePortrait = dynamic(() => import("./particle-portrait"), {
  ssr: false,
  loading: () => null,
});

const CrtPortrait = dynamic(() => import("./crt-portrait"), {
  ssr: false,
  loading: () => null,
});

function subscribeEntered(onChange: () => void) {
  window.addEventListener(ENTERED_EVENT, onChange);
  return () => window.removeEventListener(ENTERED_EVENT, onChange);
}

/**
 * The portrait is deliberately mounted only after the boot screen is dismissed:
 * the fetch, pixel sampling and shader setup are the heaviest work on the page
 * and should never compete with the first paint.
 */
export function PortraitStage() {
  const entered = useSyncExternalStore(subscribeEntered, hasEntered, () => false);
  const design = useSyncExternalStore(subscribeDesign, getDesign, () => "particles");

  return (
    <div className="home-portrait" data-variant={design} aria-hidden="true">
      {entered ? (
        design === "crt" ? (
          <CrtPortrait />
        ) : (
          <ParticlePortrait />
        )
      ) : null}
    </div>
  );
}
