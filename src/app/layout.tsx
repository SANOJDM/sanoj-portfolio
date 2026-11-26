import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Space_Mono } from "next/font/google";
import { AudioProvider } from "@/components/audio-provider";
import { Cursor } from "@/components/cursor";
import { FloatingTab } from "@/components/floating-tab";
import { PageTransition } from "@/components/page-transition";
import { Preloader } from "@/components/preloader";
import { SiteHeader } from "@/components/site-header";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  authors: [{ name: "Sanoj" }],
  creator: "Sanoj",
  keywords: [
    "Sanoj",
    "full-stack AI developer",
    "Next.js",
    "Django",
    "Gemini",
    "AI integration",
    "portfolio",
    "Chennai",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Sanoj — Full-Stack AI Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Sanoj",
  url: SITE_URL,
  image: `${SITE_URL}/og.png`,
  jobTitle: "Full-Stack AI Developer",
  email: "mailto:vamsisanoj04@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Chennai",
    addressCountry: "IN",
  },
  sameAs: [
    "https://www.linkedin.com/in/sanoj-d-m-8a012a419/",
    "https://github.com/SANOJDM",
  ],
  knowsAbout: ["Next.js", "Django", "Flask", "Gemini API", "AI integration"],
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-type="service"
      data-scroll-behavior="smooth"
      data-entered="false"
      data-boot="on"
      className={`${bebas.variable} ${spaceMono.variable} ${inter.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="page-texture" aria-hidden="true" />
        <div className="page-vignette" aria-hidden="true" />
        <AudioProvider>
          <Preloader />
          <SiteHeader />
          <Cursor />
          <FloatingTab />
          <PageTransition>{children}</PageTransition>
        </AudioProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <noscript>
          <style>{`
            .page-shell { opacity: 1 !important; filter: none !important; }
            .preloader { display: none !important; }
            body { overflow: auto !important; }
          `}</style>
        </noscript>
      </body>
    </html>
  );
}
