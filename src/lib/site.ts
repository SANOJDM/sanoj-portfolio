export const SITE_NAME = "Sanoj";
export const SITE_TITLE = "Sanoj — Full-Stack AI Developer";
export const SITE_DESCRIPTION =
  "Full-stack AI developer in Chennai building web apps with Next.js, Django and Gemini.";

/**
 * Vercel exposes the production domain at build time, so preview and
 * production deploys get correct canonical, sitemap and OG URLs without any
 * manual configuration. Set NEXT_PUBLIC_SITE_URL to override it (custom domain).
 */
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelHost ? `https://${vercelHost}` : "https://sanoj-portfolio.vercel.app")
).replace(/\/$/, "");
