"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { PORTRAIT_CRT } from "@/lib/assets";
import { getTier, subscribeTier } from "@/lib/settings";

const CrtCanvas = dynamic(() => import("./crt-canvas"), {
  ssr: false,
  loading: () => null,
});

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * HOME CRT. HIGH/MED get the live shader; SAVER and reduced-motion visitors
 * get the same grayscale crop with CSS scanlines, dots and a vignette instead
 * of a WebGL loop. The shader chunk (and three.js) is only fetched when the
 * variant is actually selectable at full quality.
 */
export default function CrtPortrait() {
  const tier = useSyncExternalStore(subscribeTier, getTier, () => "high");
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const isStatic = tier === "saver" || reduced;

  if (!isStatic) return <CrtCanvas />;

  return (
    <div className="crt-portrait" data-ready="true" data-static="true">
      <Image
        src={PORTRAIT_CRT}
        alt=""
        fill
        sizes="(max-width: 768px) 92vw, (max-width: 1180px) 62vw, 47vw"
        className="crt-portrait__static"
      />
      <span className="crt-portrait__glass" aria-hidden="true" />
    </div>
  );
}
