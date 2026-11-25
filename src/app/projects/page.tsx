import type { Metadata } from "next";
import Link from "next/link";
import { ContactClock } from "@/components/contact-clock";
import { ProjectsShowcase } from "@/components/projects-showcase";

export const metadata: Metadata = {
  title: "Projects — Sanoj",
  description:
    "Selected work by Sanoj: full-stack web apps and AI interfaces built with Django, Flask and Next.js.",
};

export default function ProjectsPage() {
  return (
    <main className="projects-page" id="main-content" tabIndex={-1}>
      <div className="inner-page__head projects-page__head">
        <p className="inner-page__crumb">
          <Link href="/" data-cursor-label="HOME">
            HOME
          </Link>
          <span aria-hidden="true">/</span>
          <span>PROJECTS</span>
        </p>
        <h1 className="inner-page__title">Projects</h1>
      </div>

      <ProjectsShowcase />

      <div className="projects-page__foot">
        <ContactClock stacked />
      </div>
    </main>
  );
}
