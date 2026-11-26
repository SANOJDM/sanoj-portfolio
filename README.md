# Sanoj — Full-Stack AI Developer

Personal portfolio: a single dark, motion-led site with a particle portrait, an
optional CRT portrait, project index, about page, and a working contact form.

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, Cache Components)          |
| Language   | TypeScript, React 19                                          |
| Styling    | Tailwind CSS 4 + a hand-written design system in `globals.css` |
| 3D / shader| Three.js (particle portrait, CRT post-process)                |
| Motion     | GSAP, CSS transitions, Web Audio for UI clicks                |
| AI         | Google Gemini API (multimodal features)                       |
| Fonts      | Bebas Neue, Space Mono, Inter via `next/font/google`          |
| Forms      | Web3Forms (client `fetch`, no backend)                        |

## Run it

```powershell
npm install
npm run dev
```

Open http://localhost:3000.

```powershell
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
npx tsc --noEmit
```

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_WEB3FORMS_KEY=      # from web3forms.com, powers /contact
NEXT_PUBLIC_SITE_URL=           # https://your-domain.com, no trailing slash
```

Without the Web3Forms key the contact form validates and then reports that the
form is not configured yet.

`NEXT_PUBLIC_SITE_URL` is used by `sitemap.xml`, `robots.txt` and the Open Graph
tags. It falls back to `https://sanoj-portfolio.vercel.app`.

## Structure

```
src/app/            routes: /, /about, /projects, /blog, /contact
                    layout metadata, robots.ts, sitemap.ts, icon + favicon
src/components/     header/menu, preloader, cursor, transitions, portraits, pages
src/lib/            project data, settings stores, site constants
public/images/      portrait textures and project screenshots
public/og.png       1200x630 social preview
```

## Portrait variants

The menu's **DESIGNS** panel switches the home portrait:

- **HOME PARTICLES** — Three.js point cloud sampled from the cutout.
- **HOME CRT** — grayscale photo with a CRT shader (RGB split, scanlines,
  halftone, grain, pointer bulge). SAVER tier and reduced-motion visitors get a
  static CSS version instead.

The choice is remembered in `localStorage` (`sanoj:design`). Globe and Orbit are
listed as `SOON` and disabled.

## Content

- Projects: `src/lib/projects.ts`. Add screenshots to `public/images/projects/`
  and point `image` at them; while `image` is `null` a designed cover is shown.
- About copy, skills and contact details live in their page files.
- Social links: `src/components/site-header.tsx`.

## Accessibility

Skip link, landmarks, visible focus, keyboard-trapped menu with Escape, per-route
titles, focus return after transitions, and full `prefers-reduced-motion`
support (no WebGL loops, no marquee, no wipes).

## Deploy

Static-friendly Next.js app; deploys to Vercel as-is. Set the two environment
variables above, then point `NEXT_PUBLIC_SITE_URL` at the final domain and
redeploy so the sitemap and Open Graph URLs are absolute.
