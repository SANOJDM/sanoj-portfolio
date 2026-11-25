export const SITE_NAME = "Sanoj";
export const SITE_TITLE = "Sanoj — Full-Stack Developer";
export const SITE_DESCRIPTION =
  "Full-stack developer in Chennai building fast, motion-led web apps with Next.js, Django and Three.js.";

/**
 * Set NEXT_PUBLIC_SITE_URL after the first Vercel deploy so sitemap.xml,
 * robots.txt and the Open Graph image resolve to the real domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://sanoj-portfolio.vercel.app"
).replace(/\/$/, "");
