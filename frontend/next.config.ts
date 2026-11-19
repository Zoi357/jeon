import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Only enable Cache Components in production builds.
  // In dev it has no effect and shows a "Cache disabled" toast.
  cacheComponents: process.env.NODE_ENV === "production",
  partialPrefetching: process.env.NODE_ENV === "production",
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
