"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/atoms/Button/Button";

/**
 * Isolates unexpected render failures without leaking stack traces.
 *
 * @param root0 - Component or function properties.
 * @param root0.error - The 'error' property.
 * @param root0.reset - The 'reset' property.
 * @returns The documented function result.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    console.error("Application render failed", { digest: error.digest });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-lg text-center">
        <p className="text-danger text-sm font-bold tracking-widest uppercase">
          {t("error.eyebrow")}
        </p>
        <h1 className="font-display mt-4 text-4xl font-bold">
          {t("error.title")}
        </h1>
        <p className="text-muted-foreground mt-4">{t("error.body")}</p>
        <Button className="mt-7" onClick={reset} size="lg" type="button">
          <RotateCcw className="size-4" /> {t("error.retry")}
        </Button>
      </div>
    </main>
  );
}
