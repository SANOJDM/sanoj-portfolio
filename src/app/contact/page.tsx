import type { Metadata } from "next";
import Link from "next/link";
import { ContactClock } from "@/components/contact-clock";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact — Sanoj",
  description:
    "Start a project with Sanoj, a full-stack AI developer in Chennai. Tell me what you're building and I'll reply within 24 hours.",
};

export default function ContactPage() {
  return (
    <main className="contact-page" id="main-content" tabIndex={-1}>
      <div className="inner-page__head contact-page__head">
        <p className="inner-page__crumb">
          <Link href="/" data-cursor-label="HOME">
            HOME
          </Link>
          <span aria-hidden="true">/</span>
          <span>CONTACT</span>
        </p>
        <h1 className="inner-page__title">Contact</h1>
      </div>

      <section className="contact-panel" aria-labelledby="contact-heading">
        <p className="contact-tag">[ TRANSMISSION_FORM ]</p>
        <h2 id="contact-heading" className="contact-title">
          SEND A MESSAGE
        </h2>
        <p className="contact-intro">
          Tell me about your project: what you want to build, your timeline, and
          anything else I should know. I usually reply within 24 hours.
        </p>

        <ContactForm />
      </section>

      <div className="contact-page__foot">
        <ContactClock stacked />
      </div>
    </main>
  );
}
