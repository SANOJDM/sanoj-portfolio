const ITEMS = [
  "FULL-STACK AI DEVELOPER",
  "[AVAILABILITY] OPEN",
  "[STACK] NEXT.JS / DJANGO / GEMINI",
  "[FOCUS] WEB APPS / AI",
  "[LOCATION] CHENNAI",
  "[CORE_ID] SANOJ",
];

function Group({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="marquee__group" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <span className="marquee__item" key={item}>
          {item}
          <span className="marquee__sep" aria-hidden="true">
            ·
          </span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="marquee" aria-label="Availability and stack">
      <div className="marquee__track">
        <Group />
        <Group hidden />
      </div>
    </div>
  );
}
