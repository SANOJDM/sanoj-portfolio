import { PortraitStage } from "./portrait-stage";

const BIG_STATS = [
  { index: "S1", value: "3+", label: "PROJECTS_COMPLETED" },
  { index: "S2", value: "3+", label: "EXPERIENCE_YEARS" },
] as const;

const STAT_ROWS = [
  { key: "ROLE", value: "Full-Stack AI Developer" },
  { key: "STACK", value: "Django / Next.js / Gemini" },
  { key: "FOCUS", value: "Web Apps / AI Features" },
  { key: "AVAILABILITY", value: "Open for work" },
  { key: "RESPONSE", value: "Under 24H" },
] as const;

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-main">
        <p className="hero-mark">
          <span className="hero-mark__cross" aria-hidden="true">
            +
          </span>
          <span>[01] INTRODUCTION</span>
        </p>

        <h1 className="hero-title" id="hero-title">
          <span className="hero-title__outline">Full-Stack</span>
          <span className="hero-title__solid">AI Developer</span>
        </h1>

        <div className="hero-label">
          <span className="hero-label__rule" aria-hidden="true" />
          <span className="hero-label__text">| Django · Next.js · AI |</span>
          <span className="hero-label__rule" aria-hidden="true" />
        </div>

        <p className="hero-copy">
          I build full-stack web apps from the database to the interface, and add
          AI features that make them smarter.
        </p>
      </div>

      <PortraitStage />

      <div className="hero-aside">
        <aside className="stats" aria-label="Developer stats">
          <div className="stats__head">
            <span className="stats__head-label">Developer Stats</span>
            <span className="stats__head-rule" aria-hidden="true" />
            <span className="stats__live">
              <span className="stats__live-dot" aria-hidden="true" />
              Active
            </span>
          </div>

          <div className="stats__numbers">
            {BIG_STATS.map((stat) => (
              <div className="stat-big" key={stat.label}>
                <span className="stat-big__index" aria-hidden="true">
                  {stat.index}
                </span>
                <span className="stat-big__value">{stat.value}</span>
                <span className="stat-big__label">{stat.label}</span>
                <span className="stat-big__bar" aria-hidden="true" />
              </div>
            ))}
          </div>

          <dl className="stats__rows">
            {STAT_ROWS.map((row) => (
              <div className="stat-row" key={row.key}>
                <dt className="stat-row__key">{row.key}</dt>
                <dd className="stat-row__val">
                  <span className="stat-row__dots" aria-hidden="true" />
                  <span>{row.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
