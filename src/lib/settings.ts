/**
 * Tiny client-side settings store shared by the boot screen, the header and the
 * particle portrait. Values persist in localStorage; nothing here touches the
 * DOM during server rendering.
 */

export type QualityTier = "high" | "medium" | "saver";

export const TIER_TARGETS: Record<QualityTier, number> = {
  high: 60000,
  medium: 35000,
  saver: 12000,
};

export const TIER_ORDER: QualityTier[] = ["high", "medium", "saver"];

const TIER_KEY = "sanoj:tier";
const VIBES_KEY = "sanoj:vibes";

export function isQualityTier(value: unknown): value is QualityTier {
  return value === "high" || value === "medium" || value === "saver";
}

let cachedTier: QualityTier | null = null;
const tierListeners = new Set<(tier: QualityTier) => void>();

/**
 * Pick a sensible starting density before the visitor chooses one:
 * reduced motion or a low-end device gets SAVER, phones/tablets get MED,
 * everything else starts on HIGH. A stored choice always wins.
 */
function detectDefaultTier(): QualityTier {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;

  if (reduced || cores <= 4 || memory <= 4) return "saver";

  const phone = window.matchMedia("(max-width: 640px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (phone || coarse || window.innerWidth < 1180) return "medium";

  return "high";
}

export function getTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  if (cachedTier) return cachedTier;
  try {
    const stored = window.localStorage.getItem(TIER_KEY);
    cachedTier = isQualityTier(stored) ? stored : detectDefaultTier();
  } catch {
    cachedTier = detectDefaultTier();
  }
  return cachedTier;
}

export function setTier(next: QualityTier) {
  cachedTier = next;
  try {
    window.localStorage.setItem(TIER_KEY, next);
  } catch {
    // Storage can be blocked; the in-memory value still works.
  }
  tierListeners.forEach((listener) => listener(next));
}

export function subscribeTier(listener: (tier: QualityTier) => void) {
  tierListeners.add(listener);
  return () => {
    tierListeners.delete(listener);
  };
}

let cachedVibes: boolean | null = null;
const vibesListeners = new Set<(on: boolean) => void>();

export function getVibes(): boolean {
  if (typeof window === "undefined") return true;
  if (cachedVibes !== null) return cachedVibes;
  try {
    cachedVibes = window.localStorage.getItem(VIBES_KEY) !== "off";
  } catch {
    cachedVibes = true;
  }
  return cachedVibes;
}

export function applyVibes() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.vibes = getVibes() ? "on" : "off";
}

export function setVibes(next: boolean) {
  cachedVibes = next;
  try {
    window.localStorage.setItem(VIBES_KEY, next ? "on" : "off");
  } catch {
    // Ignore blocked storage.
  }
  applyVibes();
  vibesListeners.forEach((listener) => listener(next));
}

export function subscribeVibes(listener: (on: boolean) => void) {
  vibesListeners.add(listener);
  return () => {
    vibesListeners.delete(listener);
  };
}

export type HomeDesign = "particles" | "crt";

const DESIGN_KEY = "sanoj:design";

let cachedDesign: HomeDesign | null = null;
const designListeners = new Set<(design: HomeDesign) => void>();

export function isHomeDesign(value: unknown): value is HomeDesign {
  return value === "particles" || value === "crt";
}

export function getDesign(): HomeDesign {
  if (typeof window === "undefined") return "particles";
  if (cachedDesign) return cachedDesign;
  try {
    const stored = window.localStorage.getItem(DESIGN_KEY);
    cachedDesign = isHomeDesign(stored) ? stored : "particles";
  } catch {
    cachedDesign = "particles";
  }
  return cachedDesign;
}

export function setDesign(next: HomeDesign) {
  cachedDesign = next;
  try {
    window.localStorage.setItem(DESIGN_KEY, next);
  } catch {
    // Storage can be blocked; the in-memory value still works.
  }
  designListeners.forEach((listener) => listener(next));
}

export function subscribeDesign(listener: (design: HomeDesign) => void) {
  designListeners.add(listener);
  return () => {
    designListeners.delete(listener);
  };
}

/** Fired once the boot screen starts lifting so in-page reveals can wait for it. */
export const ENTERED_EVENT = "sanoj:entered";

export function markEntered() {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.entered = "true";
  document.documentElement.dataset.boot = "off";
  window.dispatchEvent(new Event(ENTERED_EVENT));
}

export function hasEntered() {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.entered === "true";
}
