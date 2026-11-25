import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactClock } from "@/components/contact-clock";

export const metadata: Metadata = {
  title: "About — Sanoj",
  description:
    "Sanoj is a full-stack developer from Chennai building web apps with Django, Flask, Next.js and Three.js.",
};

const SKILLS = [
  "DJANGO",
  "FLASK",
  "NEXT.JS",
  "THREE.JS",
  "PYTHON",
  "JAVASCRIPT",
  "SQL",
  "GIT",
];

export default function AboutPage() {
  return (
    <main className="about-page" id="main-content" tabIndex={-1}>
      <div className="inner-page__head about-page__head">
        <p className="inner-page__crumb">
          <Link href="/" data-cursor-label="HOME">
            HOME
          </Link>
          <span aria-hidden="true">/</span>
          <span>ABOUT</span>
        </p>
        <h1 className="inner-page__title">About</h1>
      </div>

      <div className="about-portrait">
        <Image
          src="/images/portrait-cutout.png"
          alt="Portrait of Sanoj"
          width={1200}
          height={1607}
          priority
          sizes="(max-width: 900px) 140vw, 720px"
          className="about-portrait__img"
        />
      </div>

      <div
        className="about-scroll"
        tabIndex={0}
        aria-label="About Sanoj, scrollable introduction"
      >
        <p className="about-kicker">
          <span aria-hidden="true">01</span> INTRODUCTION
        </p>

        <p className="about-lede">
          Full-stack developer, working from the database to the screen.
        </p>

        <h2 className="about-heading">
          I BUILD THE
          <br />
          WHOLE STACK
        </h2>

        <div className="about-copy">
          <p>
            I&apos;m a BCA student from Chennai who builds full-stack web apps. I
            work with Django and Flask on the back end and Next.js on the front
            end.
          </p>
          <p>
            Lately I&apos;ve been learning to make interfaces feel alive with
            motion, shaders and 3D using Three.js. This site is part of that
            practice.
          </p>
          <p>
            I like projects where I can take an idea from the database all the
            way to the screen, and I&apos;m open to internships and freelance
            work.
          </p>
        </div>

        <section className="about-skills" aria-labelledby="about-skills-label">
          <p className="about-kicker" id="about-skills-label">
            <span aria-hidden="true">02</span> SKILLS
          </p>
          <ul className="about-skills__list">
            {SKILLS.map((skill, index) => (
              <li key={skill}>
                <span aria-hidden="true" className="about-skills__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <div className="about-cta">
          <p className="about-cta__note">OPEN TO INTERNSHIPS &amp; FREELANCE</p>
          <Link
            href="/contact"
            className="about-cta__link"
            data-cursor-label="SAY HELLO"
          >
            GET IN TOUCH <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="about-page__foot">
        <ContactClock stacked />
      </div>
    </main>
  );
}
