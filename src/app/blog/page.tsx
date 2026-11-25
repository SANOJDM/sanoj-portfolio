import type { Metadata } from "next";
import Link from "next/link";
import { ContactClock } from "@/components/contact-clock";

export const metadata: Metadata = {
  title: "Blog — Sanoj",
  description:
    "Notes and writing by Sanoj on full-stack builds, 3D on the web and the details behind this site.",
};

export default function BlogPage() {
  return (
    <main className="inner-page blog-page" id="main-content" tabIndex={-1}>
      <div className="inner-page__head">
        <p className="inner-page__crumb">
          <Link href="/" data-cursor-label="HOME">
            HOME
          </Link>
          <span aria-hidden="true">/</span>
          <span>BLOG</span>
        </p>
        <h1 className="inner-page__title">Blog</h1>
      </div>

      <div className="inner-page__stage">
        <div className="empty-state">
          <p className="empty-state__kicker">
            ARCHIVE_04 <span aria-hidden="true">·</span> STATUS
          </p>
          <p className="empty-state__title">NO POSTS YET</p>
          <p className="empty-state__copy">
            I&apos;m writing the first notes on full-stack builds, 3D on the web
            and the small details behind this site. Nothing is published yet —
            check back soon.
          </p>
        </div>
      </div>

      <div className="inner-page__aside">
        <ContactClock stacked />
      </div>
    </main>
  );
}
