"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactNode } from "react";
import { useEffect, useSyncExternalStore } from "react";

import { type AppLocale, defaultLocale } from "@/i18n/config";
import { fallbackMessages, getFallbackLocale } from "@/i18n/fallbackMessages";

/**
 * Subscribes to locale changes, of which there are none within one crash screen.
 *
 * @returns A no-op unsubscribe callback.
 */
function subscribeToLocale(): () => void {
  return () => undefined;
}

/**
 * Reads the locale the visitor chose, once the document is available.
 *
 * @returns The preferred locale recorded in the browser cookie.
 */
function getBrowserLocale(): AppLocale {
  return getFallbackLocale(document.cookie);
}

/**
 * Reports the locale assumed while rendering on the server.
 *
 * @returns The default locale, which the browser render then corrects.
 */
function getServerLocale(): AppLocale {
  return defaultLocale;
}

/**
 * Isolates failures in the root layout itself, which the nested error boundary cannot catch.
 *
 * This replaces the entire document, so it cannot rely on styling or providers (Tailwind, locale,
 * theme) that live inside the root layout — the failure may be in that layout. Its copy therefore
 * comes from the locale cookie rather than from next-intl, and it is resolved after hydration so
 * the server-rendered and client-rendered markup agree.
 *
 * @param root0 - Properties that configure global error.
 * @param root0.error - Error captured by the nearest Next.js error boundary.
 * @param root0.reset - Callback that asks Next.js to retry rendering the boundary.
 * @returns The rendered global error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getBrowserLocale,
    getServerLocale,
  );
  const messages = fallbackMessages[locale];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {messages.title}
            </h1>
            <button onClick={reset} style={{ marginTop: "1rem" }} type="button">
              {messages.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
