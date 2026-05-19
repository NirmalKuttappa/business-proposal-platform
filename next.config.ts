import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — there is an unrelated lockfile higher up the
  // filesystem, and Next.js would otherwise guess the wrong root directory.
  turbopack: {
    root: import.meta.dirname,
  },
  // App Router route handlers receive the raw request body by default,
  // which the Stripe webhook signature check relies on.
};

export default nextConfig;
