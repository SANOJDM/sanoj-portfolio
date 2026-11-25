"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAudio } from "@/components/audio-provider";
import {
  getDesign,
  setDesign,
  subscribeDesign,
  type HomeDesign,
} from "@/lib/settings";

const NAV_ITEMS = [
  { index: "1", label: "Home", href: "/" },
  { index: "2", label: "About", href: "/about" },
  { index: "3", label: "Projects", href: "/projects" },
  { index: "4", label: "Blog", href: "/blog" },
  { index: "5", label: "Contact", href: "/contact" },
] as const;

type DesignOption = {
  id: HomeDesign | "globe" | "orbit";
  index: string;
  label: string;
  soon?: boolean;
};

const DESIGNS: DesignOption[] = [
  { id: "particles", index: "01", label: "Home Particles" },
  { id: "crt", index: "02", label: "Home CRT" },
  { id: "globe", index: "03", label: "Home Globe", soon: true },
  { id: "orbit", index: "04", label: "Home Orbit", soon: true },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sanoj-d-m-8a012a419/",
    external: true,
    icon: <LinkedInIcon />,
  },
  {
    label: "GitHub",
    href: "https://github.com/SANOJDM",
    external: true,
    icon: <GitHubIcon />,
  },
  {
    label: "Email",
    href: "mailto:vamsisanoj04@gmail.com",
    external: false,
    icon: <MailIcon />,
  },
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/";

function ScrambleText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    if (ref.current) ref.current.textContent = text;
  };

  const start = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stop();
    let tick = 0;
    timer.current = window.setInterval(() => {
      tick += 1;
      const revealed = Math.floor(tick / 2);
      const next = text
        .split("")
        .map((character, index) => {
          if (character === " " || character === "_") return character;
          if (index < revealed) return character;
          return SCRAMBLE_CHARS[
            Math.floor(Math.random() * SCRAMBLE_CHARS.length)
          ];
        })
        .join("");

      if (ref.current) ref.current.textContent = next;
      if (tick > text.length * 2) stop();
    }, 26);
  };

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, []);

  return (
    <span
      ref={ref}
      onPointerEnter={start}
      onFocus={start}
      className="menu-row__label"
    >
      {text}
    </span>
  );
}

function AudioToggle() {
  const { enabled, toggle } = useAudio();

  return (
    <button
      type="button"
      className="audio-btn"
      data-on={enabled}
      data-cursor-label="AUDIO"
      aria-pressed={enabled}
      aria-label={enabled ? "Mute interface audio" : "Enable interface audio"}
      onClick={() => toggle()}
    >
      <svg viewBox="0 0 42 20" fill="none" aria-hidden="true">
        <path
          d="M1 10h4l2.5-6 3 12 3-9 2.5 5 2.5-10 3.5 15 2.5-8 2.5 4 2.5-7 2.5 8 2-3H42"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function NavPill({ placement }: { placement: "header" | "dock" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const design = useSyncExternalStore(subscribeDesign, getDesign, () => "particles");
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const current =
    NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const wrap = wrapRef.current;
      if (!wrap) return;

      const focusable = Array.from(
        wrap.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const focusTimer = window.setTimeout(() => {
      firstLinkRef.current?.focus({ preventScroll: true });
    }, 120);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const chooseDesign = (next: HomeDesign) => {
    setDesign(next);
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  };

  const moveGlow = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--menu-x",
      `${event.clientX - rect.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--menu-y",
      `${event.clientY - rect.top}px`,
    );
  };

  return (
    <div
      className={`nav-pill-wrap${placement === "dock" ? " nav-pill-wrap--dock" : ""}`}
      ref={wrapRef}
    >
      <div className="nav-pill">
        <Link
          href={current.href}
          className="nav-pill__route"
          onClick={() => setOpen(false)}
        >
          <span className="nav-pill__index">[{current.index}]</span>
          <span>{current.label}</span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="nav-pill__toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          data-cursor-label={open ? "CLOSE" : "MENU"}
          onClick={() => setOpen((value) => !value)}
        >
          <GridIcon />
        </button>
      </div>

      <div
        id="site-menu"
        role="dialog"
        aria-label="Site navigation"
        className={`menu${placement === "dock" ? " menu--up" : ""}`}
        data-open={open}
        inert={!open}
        onPointerMove={moveGlow}
      >
        <div className="menu__glow" aria-hidden="true" />

        <div className="menu__head">
          <div>
            <p className="menu__kicker">NAVIGATION</p>
            <h2 className="menu__title">MENU</h2>
          </div>
          <span className="menu__count">[05]</span>
        </div>

        <nav aria-label="Primary">
          <ul className="menu__list">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  ref={index === 0 ? firstLinkRef : undefined}
                  className="menu-row"
                  aria-current={pathname === item.href ? "page" : undefined}
                  data-cursor-label={item.label.toUpperCase()}
                  onClick={() => setOpen(false)}
                >
                  <span className="menu-row__left">
                    <span className="menu-row__number">[{item.index}]</span>
                    <ScrambleText text={item.label.toUpperCase()} />
                  </span>
                  <span className="menu-row__dot" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="menu__section">
          <div className="menu__subhead">
            <span className="menu__kicker">DESIGNS</span>
            <span className="menu__count">[04]</span>
          </div>
          <div className="menu__grid">
            {DESIGNS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="design-btn"
                data-active={!item.soon && design === item.id}
                data-soon={item.soon || undefined}
                aria-pressed={
                  item.soon ? undefined : design === item.id
                }
                disabled={item.soon}
                onClick={() => {
                  if (item.id === "particles" || item.id === "crt") {
                    chooseDesign(item.id);
                  }
                }}
              >
                <span className="design-btn__num">{item.index}</span>
                {item.soon ? (
                  <span className="design-btn__soon">SOON</span>
                ) : null}
                <span className="design-btn__name">
                  {item.label.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="menu__socials" aria-label="Social links">
          {SOCIALS.map((item) => (
            <a
              key={item.label}
              className="social-btn"
              href={item.href}
              aria-label={item.label}
              title={item.label}
              {...(item.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const inner = pathname !== "/";

  return (
    <>
      <header className={`site-header${inner ? " site-header--inner" : ""}`}>
        <Link href="/" className="site-logo" data-cursor-label="HOME">
          Sanoj
        </Link>
        {!inner && (
          <div className="header-actions">
            <AudioToggle />
            <NavPill key={pathname} placement="header" />
          </div>
        )}
      </header>
      {inner && (
        <div className="nav-dock">
          <AudioToggle />
          <NavPill key={pathname} placement="dock" />
        </div>
      )}
    </>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.6" fill="currentColor" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.6" fill="currentColor" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.6" fill="currentColor" />
      <rect
        x="10.5"
        y="10.5"
        width="6"
        height="6"
        rx="1.6"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05 4.02 0 4.76 2.64 4.76 6.08V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9V9Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5.5"
        width="18"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m4.5 8 6.4 4.6a2 2 0 0 0 2.2 0L19.5 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


