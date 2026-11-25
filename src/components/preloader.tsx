"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useAudio } from "@/components/audio-provider";
import {
  applyVibes,
  getTier,
  getVibes,
  markEntered,
  setTier,
  setVibes,
  subscribeTier,
  subscribeVibes,
  TIER_ORDER,
  type QualityTier,
} from "@/lib/settings";

const TIER_LABELS: Record<QualityTier, string> = {
  high: "HIGH",
  medium: "MED",
  saver: "SAVER",
};

export function Preloader() {
  const { enabled, toggle, play } = useAudio();
  const tier = useSyncExternalStore(subscribeTier, getTier, () => "high" as QualityTier);
  const vibes = useSyncExternalStore(subscribeVibes, getVibes, () => true);
  const [loaded, setLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    applyVibes();
  }, []);

  // The boot screen is a modal: move focus into it and keep Tab inside until
  // the visitor enters, then hand focus back to the page.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!done) return;
    document
      .getElementById("main-content")
      ?.focus({ preventScroll: true });
  }, [done]);

  // Hold the page still while the boot screen is up.
  useEffect(() => {
    if (done) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [done]);

  // Count 0 → 100. GSAP drives the number and the progress hairline directly so
  // the whole boot sequence only causes two React renders.
  useEffect(() => {
    if (reducedRef.current) {
      if (numberRef.current) numberRef.current.textContent = "100";
      if (barRef.current) barRef.current.style.transform = "scaleX(1)";
      setLoaded(true);
      return;
    }

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: 100,
      duration: 1.7,
      ease: "power2.inOut",
      onUpdate: () => {
        const value = Math.round(counter.value);
        if (numberRef.current) numberRef.current.textContent = String(value);
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${counter.value / 100})`;
        }
        if (value >= 100) setLoaded(true);
      },
      onComplete: () => setLoaded(true),
    });

    return () => {
      tween.kill();
    };
  }, []);

  const enter = () => {
    if (!loaded || leaving) return;
    setLeaving(true);
    play("enter");
    markEntered();

    const content = contentRef.current;
    const top = topRef.current;
    const bottom = bottomRef.current;

    if (reducedRef.current) {
      gsap.to(content, {
        autoAlpha: 0,
        duration: 0.2,
        onComplete: () => setDone(true),
      });
      return;
    }

    gsap
      .timeline({ onComplete: () => setDone(true) })
      .to(content, {
        autoAlpha: 0,
        filter: "blur(10px)",
        duration: 0.3,
        ease: "power2.out",
      })
      .to(top, { yPercent: -100, duration: 0.95, ease: "power4.inOut" }, 0.18)
      .to(bottom, { yPercent: 100, duration: 0.95, ease: "power4.inOut" }, 0.18);
  };

  if (done) return null;

  return (
    <div
      className="preloader"
      ref={dialogRef}
      tabIndex={-1}
      data-leaving={leaving}
      role="dialog"
      aria-modal="true"
      aria-label="Boot sequence"
    >
      <div className="preloader__half preloader__half--top" ref={topRef} />
      <div className="preloader__half preloader__half--bottom" ref={bottomRef} />

      <div className="preloader__content" ref={contentRef}>
        <div className="preloader__frame" aria-hidden="true" />
        <div className="preloader__glow" aria-hidden="true" />
        <div className="preloader__grid" aria-hidden="true" />

        <header className="preloader__bar">
          <span className="preloader__logo">Sanoj</span>
          <span className="preloader__state">
            <i aria-hidden="true" />
            {loaded ? "READY" : "BOOTING"}
          </span>
        </header>

        <div className="preloader__center">
          <div className="preloader__readout">
            <span className="preloader__number" ref={numberRef}>
              0
            </span>
            <span className="preloader__pct">%</span>
          </div>
        </div>

        <div className="preloader__controls">
          <div className="boot-control">
            <span className="boot-label">PERFORMANCE TIER</span>
            <div className="seg" role="group" aria-label="Performance tier">
              {TIER_ORDER.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="seg__btn"
                  data-active={tier === option}
                  aria-pressed={tier === option}
                  data-cursor-label={TIER_LABELS[option]}
                  onClick={() => {
                    setTier(option);
                  }}
                >
                  {TIER_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <div className="boot-actions">
            <div className="boot-pill">
              <button
                type="button"
                className="boot-pill__enter"
                disabled={!loaded}
                onClick={enter}
                data-cursor-label="ENTER"
              >
                ENTER
              </button>
              <button
                type="button"
                className="boot-pill__vibes"
                aria-pressed={vibes}
                onClick={() => setVibes(!vibes)}
                data-cursor-label={vibes ? "CALM" : "VIBES"}
              >
                VIBES {vibes ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          <div className="boot-control boot-control--audio">
            <span className="boot-label">AUDIO</span>
            <div className="seg" role="group" aria-label="Interface audio">
              <button
                type="button"
                className="seg__btn"
                data-active={enabled}
                aria-pressed={enabled}
                onClick={() => toggle(true)}
              >
                ON
              </button>
              <button
                type="button"
                className="seg__btn"
                data-active={!enabled}
                aria-pressed={!enabled}
                onClick={() => toggle(false)}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        <footer className="preloader__foot">
          <div className="preloader__status">
            <span className="preloader__sys">
              <i aria-hidden="true" />
              {loaded ? "SYSTEM_READY" : "SYSTEM_BOOT"}
            </span>
            <span className="preloader__loaded">
              {loaded ? "LOADED" : "LOADING"}
            </span>
          </div>
          <div className="preloader__progress">
            <span ref={barRef} />
          </div>
        </footer>
      </div>
    </div>
  );
}
