import type { NextConfig } from "next";
import { PORTRAIT_VERSION } from "./src/lib/assets";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  images: {
    // Versioned portrait URLs (?v=2) plus plain /images/* for future assets.
    localPatterns: [
      { pathname: "/images/**", search: `?v=${PORTRAIT_VERSION}` },
      { pathname: "/images/**", search: "" },
    ],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
