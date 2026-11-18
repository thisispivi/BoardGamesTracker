import path from "node:path";

import type { NextConfig } from "next";

const basePath = process.env.DEMO_BASE_PATH ?? "";

/** Exports only the isolated, credential-free demo routes for static hosting. */
const config: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // The workspace root, where the lockfile and pnpm store live.
  turbopack: { root: path.resolve(import.meta.dirname, "../../..") },
  env: { NEXT_PUBLIC_DEMO_BASE_PATH: basePath },
};

export default config;
