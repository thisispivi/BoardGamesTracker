import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { createSentryOptions } from "@/utils/sentryOptions";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init(
    createSentryOptions(
      env.NEXT_PUBLIC_SENTRY_DSN,
      env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      env.NEXT_PUBLIC_SENTRY_RELEASE,
      "browser",
    ),
  );
}

/** Lets the Sentry SDK observe App Router navigations initiated in the browser. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
