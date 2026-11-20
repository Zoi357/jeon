import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: process.env.NODE_ENV === "production",
  partialPrefetching: process.env.NODE_ENV === "production",
  images: {
    // Next.js 16 requires an explicit qualities allowlist.
    qualities: [75, 90],
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
