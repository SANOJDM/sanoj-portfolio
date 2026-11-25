"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Grey gradient wipe between internal pages plus a soft blur on the outgoing
 * content. Link clicks are intercepted once, in the capture phase, so Next's
 * own Link handler never fires twice.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wipeRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<string | null>(null);
  const transitioningRef = useRef(false);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    gsap.set(wipeRef.current, { yPercent: 100, pointerEvents: "none" });
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        transitioningRef.current
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!url.pathname.startsWith("/")) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash === window.location.hash
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const target = `${url.pathname}${url.search}`;
      const wipe = wipeRef.current;
      const shell = shellRef.current;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      pendingRef.current = target;

      if (!wipe || reduced) {
        router.push(target);
        return;
      }

      transitioningRef.current = true;
      document.body.style.overflow = "hidden";
      shell?.setAttribute("data-cover", "true");

      gsap
        .timeline({
          onComplete: () => router.push(target),
        })
        .set(wipe, { yPercent: 100, pointerEvents: "auto" })
        .to(wipe, { yPercent: 0, duration: 0.42, ease: "power3.inOut" });
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [router]);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    const wipe = wipeRef.current;
    const shell = shellRef.current;

    if (!pendingRef.current) {
      // Back/forward navigation: no wipe, but still settle any lock.
      document.body.style.overflow = "";
      transitioningRef.current = false;
      shell?.removeAttribute("data-cover");
      window.requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      });
      return;
    }

    pendingRef.current = null;
    window.scrollTo(0, 0);

    const finish = () => {
      transitioningRef.current = false;
      document.body.style.overflow = "";
      shell?.removeAttribute("data-cover");
      gsap.set(wipe, { yPercent: 100, pointerEvents: "none" });
      window.requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      });
    };

    if (!wipe || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    gsap
      .timeline({ onComplete: finish })
      .to(wipe, { yPercent: -100, duration: 0.62, ease: "power3.inOut" });
  }, [pathname]);

  return (
    <>
      <div className="page-shell" ref={shellRef}>
        {children}
      </div>
      <div className="page-wipe" ref={wipeRef} aria-hidden="true" />
    </>
  );
}
