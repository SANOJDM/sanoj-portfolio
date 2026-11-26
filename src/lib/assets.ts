/**
 * Portrait asset URLs.
 *
 * Bump PORTRAIT_VERSION whenever the source photo changes. The query string
 * gives the browser and Next's image optimizer a fresh cache entry, so a new
 * cutout can never be hidden behind an older copy of the same filename.
 */
export const PORTRAIT_VERSION = "2";

export const PORTRAIT_CUTOUT = `/images/portrait-cutout.png?v=${PORTRAIT_VERSION}`;
export const PORTRAIT_SAMPLE = `/images/portrait-sample.webp?v=${PORTRAIT_VERSION}`;
export const PORTRAIT_CRT = `/images/portrait-crt.webp?v=${PORTRAIT_VERSION}`;
