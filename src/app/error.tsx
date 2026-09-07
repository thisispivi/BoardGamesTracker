"use client";

import * as Sentry from "@sentry/nextjs";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";

import { Button } from "@/components/atoms/Button/Button";
import { AuthShell } from "@/components/templates/AuthShell/AuthShell";

/**
 * Isolates unexpected render failures without leaking stack traces.
 *
 * @param root0 - Properties that configure error boundary.
 * @param root0.error - Error captured by the nearest Next.js error boundary.
 * @param root0.reset - Callback that asks Next.js to retry rendering the boundary.
 * @returns The rendered error boundary.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  const t = useTranslations("error");
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  /**
   * Retries the failed render, reloading when this bundle cannot succeed again.
   *
   * A digest marks an error thrown on the server, which frequently outlives the
   * bundle the visitor is running: a Server Action removed by a newer
   * deployment, for example, can never be found by this build. Re-rendering
   * would fail identically, so the page is loaded again to pick up the current
   * deployment. Client render failures keep the cheaper boundary reset.
   *
   * @returns Nothing.
   */
  function recover(): void {
    if (error.digest) {
      window.location.reload();
      return;
    }
    reset();
  }

  return (
    <AuthShell className="max-w-lg text-center">
      <p className="text-danger text-sm font-bold tracking-widest uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-4 text-4xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-4">{t("body")}</p>
      <Button className="mt-7" onClick={recover} size="lg" type="button">
        <RotateCcw className="size-4" /> {t("retry")}
      </Button>
    </AuthShell>
  );
}
