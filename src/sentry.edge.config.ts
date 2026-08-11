import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { createSentryOptions } from "@/utils/sentryOptions";

const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init(
    createSentryOptions(
      dsn,
      env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
      env.NEXT_PUBLIC_SENTRY_RELEASE,
      "edge",
    ),
  );
}
