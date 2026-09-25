import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { version } from "./package.json";

const sentryRelease =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  process.env.SENTRY_RELEASE ||
  `v${version}`;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cf.geekdo-images.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE: sentryRelease,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: 5 * 1024 * 1024 + 256_000,
    },
    typedEnv: true,
  },
};

const withNextIntl = createNextIntlPlugin();
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryUrl =
  process.env.SENTRY_URL || (sentryDsn ? new URL(sentryDsn).origin : undefined);
const canUploadSourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_PROJECT && sentryUrl,
);

export default withSentryConfig(withNextIntl(nextConfig), {
  ...(canUploadSourceMaps && process.env.SENTRY_AUTH_TOKEN
    ? { authToken: process.env.SENTRY_AUTH_TOKEN }
    : {}),
  ...(process.env.SENTRY_PROJECT
    ? { project: process.env.SENTRY_PROJECT }
    : {}),
  ...(sentryUrl ? { sentryUrl } : {}),
  org: process.env.SENTRY_ORG || "bugsinkhasnoorgs",
  telemetry: false,
  silent: !canUploadSourceMaps,
  sourcemaps: {
    disable: !canUploadSourceMaps,
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    name: sentryRelease,
    create: false,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
