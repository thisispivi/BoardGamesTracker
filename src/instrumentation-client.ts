import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { scrubSentryEvent } from "@/utils/sentryScrub";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: scrubSentryEvent,
  });
}
