"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactNode } from "react";
import { useEffect } from "react";

/**
 * Isolates failures in the root layout itself, which the nested error boundary cannot catch.
 *
 * This replaces the entire document, so it cannot rely on styling or providers (Tailwind, locale,
 * theme) that live inside the root layout — the failure may be in that layout.
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
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
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
              Something went wrong.
            </h1>
            <button onClick={reset} style={{ marginTop: "1rem" }} type="button">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
