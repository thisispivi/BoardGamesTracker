import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
  experimental: {
    typedEnv: true,
  },
};

const withNextIntl = createNextIntlPlugin();
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryRelease =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  process.env.SENTRY_RELEASE ||
  undefined;
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
    ...(sentryRelease ? { name: sentryRelease } : {}),
    create: false,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
