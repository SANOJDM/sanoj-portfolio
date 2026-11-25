"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type UIEvent as ReactUIEvent,
} from "react";
import { PROJECTS, type Project } from "@/lib/projects";

function padCount(value: number) {
  return String(value).padStart(2, "0");
}

function ProjectThumb({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  const missing = !project.image || failed;

  return (
    <div className="project-thumb" data-missing={missing}>
      {project.image && !missing && (
        <Image
          src={project.image}
          alt={`${project.title} interface preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 25vw, 210px"
          className="project-thumb__img"
          onError={() => setFailed(true)}
        />
      )}
      {missing && (
        <div className="project-thumb__cover" aria-hidden="true">
          <span className="project-thumb__cover-label">{project.category}</span>
          <span className="project-thumb__cover-index">{project.index}</span>
        </div>
      )}
    </div>
  );
}

export function ProjectsShowcase() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef(0);
  const scrollLock = useRef(0);

  const select = useCallback((index: number) => {
    if (index === activeRef.current) return;
    activeRef.current = index;
    setActive(index);
  }, []);

  // Scrolling the rows is the primary way the active row changes; hovering a
  // row or an index number does the same thing without moving the list.
  const onScroll = useCallback(
    (event: ReactUIEvent<HTMLDivElement>) => {
      if (event.timeStamp < scrollLock.current) return;
      window.cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = window.requestAnimationFrame(() => {
        const list = listRef.current;
        if (!list) return;
        const rows = list.querySelectorAll<HTMLElement>("[data-project-row]");
        if (!rows.length) return;

        // Reaching the end of the list should light up the last project, even
        // when only the tail of it is visible.
        const scrollable = list.scrollHeight > list.clientHeight + 8;
        if (scrollable && list.scrollTop + list.clientHeight >= list.scrollHeight - 4) {
          select(rows.length - 1);
          return;
        }

        // The row nearest the top of the reading area wins, so the first row
        // stays active at rest instead of the middle one.
        const line = list.getBoundingClientRect().top + 26;
        let best = 0;
        let distance = Number.POSITIVE_INFINITY;

        rows.forEach((row, index) => {
          const rowDistance = Math.abs(row.getBoundingClientRect().top - line);
          if (rowDistance < distance) {
            distance = rowDistance;
            best = index;
          }
        });

        select(best);
      });
    },
    [select],
  );

  const jumpTo = (index: number, event: ReactMouseEvent<HTMLButtonElement>) => {
    select(index);
    scrollLock.current = event.timeStamp + 900;
    const list = listRef.current;
    const row = list?.querySelectorAll<HTMLElement>("[data-project-row]")[index];
    if (!row) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
      inline: "nearest",
    });
  };

  const current = PROJECTS[active] ?? PROJECTS[0];

  return (
    <div className="projects-page__layout">
      <nav className="projects-index" aria-label="Project index">
        <p className="projects-index__label">INDEX</p>
        <ol className="projects-index__list">
          {PROJECTS.map((project, index) => (
            <li key={project.slug}>
              <button
                type="button"
                aria-pressed={index === active}
                aria-label={`Highlight project ${project.index}: ${project.title}`}
                onPointerEnter={() => select(index)}
                onClick={(event) => jumpTo(index, event)}
              >
                <span>{project.index}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="projects-list" ref={listRef} onScroll={onScroll}>
        {PROJECTS.map((project, index) => (
          <article
            key={project.slug}
            className="project-row"
            data-project-row
            data-active={index === active}
            tabIndex={0}
            onFocus={() => select(index)}
            onPointerMove={() => select(index)}
          >
            <div className="project-row__media">
              <ProjectThumb project={project} />
            </div>

            <div className="project-row__body">
              <p className="project-row__meta">
                <span>{project.index}</span>
                {project.meta.join(" · ")}
              </p>
              <h2 className="project-row__title">{project.title}</h2>
              <p className="project-row__desc">{project.description}</p>

              <div className="project-row__foot">
                <ul className="project-tags" aria-label="Technologies">
                  {project.tags.map((tag) => (
                    <li key={tag} className="project-tag">
                      {tag}
                    </li>
                  ))}
                </ul>

                {project.href ? (
                  <a
                    className="project-row__case"
                    href={project.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor-label="VIEW CASE"
                  >
                    VIEW CASE <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span className="project-row__case" data-pending>
                    CASE SOON <span aria-hidden="true">·</span>
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="projects-rail">
        <div className="projects-rail__live" key={current.slug}>
          <p className="projects-rail__count">
            <strong>{current.index}</strong>
            <em>/{padCount(PROJECTS.length)}</em>
          </p>
          <div className="projects-rail__rule" aria-hidden="true" />
          <p className="projects-rail__title">{current.title}</p>
          <p className="projects-rail__category">{current.category}</p>
        </div>
        <p className="projects-rail__hint">
          SCROLL <span aria-hidden="true" />
        </p>
      </aside>
    </div>
  );
}
