"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

/** Isolates unexpected render failures without leaking stack traces. */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useI18n();
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
        <Button type="button" size="lg" onClick={reset} className="mt-7">
          <RotateCcw className="size-4" /> {t("error.retry")}
        </Button>
      </div>
    </main>
  );
}
