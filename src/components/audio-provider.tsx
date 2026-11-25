"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Sfx = "hover" | "click" | "open" | "close" | "toggle" | "enter";

type AudioApi = {
  enabled: boolean;
  toggle: (next?: boolean) => void;
  play: (sfx?: Sfx) => void;
};

const AudioContextValue = createContext<AudioApi | null>(null);

/**
 * Web Audio blips generated on the fly — no audio files. The context is only
 * created inside a user gesture, and every sound is a no-op until audio is on.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const lastHoverRef = useRef(0);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!contextRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      const context = new Ctor();
      const master = context.createGain();
      master.gain.value = 0.15;
      master.connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
    }
    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const tone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType,
      volume: number,
      slideTo?: number,
      delay = 0,
    ) => {
      const context = contextRef.current;
      const master = masterRef.current;
      if (!context || !master) return;

      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(1, slideTo),
          start + duration,
        );
      }
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    },
    [],
  );

  const play = useCallback(
    (sfx: Sfx = "click") => {
      if (!enabledRef.current) return;
      const context = ensureContext();
      if (!context) return;

      switch (sfx) {
        case "hover": {
          if (context.currentTime - lastHoverRef.current < 0.055) return;
          lastHoverRef.current = context.currentTime;
          tone(1760, 0.028, "sine", 0.05);
          break;
        }
        case "click":
          tone(780, 0.08, "triangle", 0.11, 520);
          break;
        case "open":
          tone(420, 0.13, "sine", 0.09, 880);
          break;
        case "close":
          tone(880, 0.12, "sine", 0.08, 420);
          break;
        case "toggle":
          tone(620, 0.07, "square", 0.05, 760);
          break;
        case "enter":
          tone(300, 0.34, "sine", 0.12, 1180);
          tone(620, 0.26, "sine", 0.07, 1560, 0.1);
          break;
      }
    },
    [ensureContext, tone],
  );

  const toggle = useCallback(
    (next?: boolean) => {
      const target = next ?? !enabledRef.current;
      if (target === enabledRef.current) return;

      if (target) {
        enabledRef.current = true;
        setEnabled(true);
        ensureContext();
        play("enter");
      } else {
        play("close");
        enabledRef.current = false;
        setEnabled(false);
        void contextRef.current?.suspend();
      }
    },
    [ensureContext, play],
  );

  // One global listener gives every link and button a blip without editing them.
  useEffect(() => {
    if (!enabled) return;

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const trigger = target?.closest?.("a, button, [role='button']");
      if (!trigger) return;
      const related = event.relatedTarget as Node | null;
      if (related && trigger.contains(related)) return;
      play("hover");
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("a, button, [role='button']")) play("click");
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled, play]);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = null;
      masterRef.current = null;
    };
  }, []);

  return (
    <AudioContextValue.Provider value={{ enabled, toggle, play }}>
      {children}
    </AudioContextValue.Provider>
  );
}

export function useAudio() {
  const value = useContext(AudioContextValue);
  if (!value) throw new Error("useAudio must be used inside AudioProvider");
  return value;
}
