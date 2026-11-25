"use client";

import { useEffect, useRef } from "react";

/**
 * Small white cursor dot that grows over interactive elements and can show a
 * short label when the target has a `data-cursor-label` attribute.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    if (!el) return;

    const label = el.querySelector<HTMLSpanElement>(".cursor__label");
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let currentX = -100;
    let currentY = -100;
    let targetX = -100;
    let targetY = -100;
    let frame = 0;
    let visible = false;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const place = () => {
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.24;
      currentY += (targetY - currentY) * 0.24;
      place();
      frame = window.requestAnimationFrame(loop);
    };
    if (!reduced) frame = window.requestAnimationFrame(loop);

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (reduced) {
        currentX = targetX;
        currentY = targetY;
        place();
      }
      if (!visible) {
        visible = true;
        el.dataset.visible = "true";
      }
    };

    const onOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest(
        "a, button, [data-cursor]",
      ) as HTMLElement | null;
      if (!target) {
        el.classList.remove("is-active", "has-label");
        if (label) label.textContent = "";
        return;
      }

      el.classList.add("is-active");
      const text = target.dataset.cursorLabel;
      if (text && label) {
        label.textContent = text;
        el.classList.add("has-label");
      }
    };

    const onOut = (event: PointerEvent) => {
      const next = event.relatedTarget as Element | null;
      if (next?.closest?.("a, button, [data-cursor]")) return;

      el.classList.remove("is-active", "has-label");
      if (label) label.textContent = "";
    };

    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");
    const onLeave = () => {
      visible = false;
      el.dataset.visible = "false";
      el.classList.remove("is-active", "has-label");
      if (label) label.textContent = "";
    };
    const onEnter = () => {
      visible = true;
      el.dataset.visible = "true";
    };

    // The preloader (and page wipes) can unmount the hovered element without a
    // pointerout event, so clear any stuck label when the site takes over.
    const onSiteEntered = () => {
      el.classList.remove("is-active", "has-label");
      if (label) label.textContent = "";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    window.addEventListener("sanoj:entered", onSiteEntered);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      window.removeEventListener("sanoj:entered", onSiteEntered);
      root.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div className="cursor" ref={ref} data-visible="false" aria-hidden="true">
      <span className="cursor__label" />
    </div>
  );
}
