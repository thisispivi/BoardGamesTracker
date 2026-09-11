import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";

/**
 * Global streaming fallback for the first application load.
 *
 * @returns A localized full-page loading indicator.
 */
export default function Loading(): ReactNode {
  const t = useTranslations();
  return (
    <div className="bg-background grid min-h-screen place-items-center">
      <AppSpinner className="size-11" label={t("common.loading")} />
    </div>
  );
}
