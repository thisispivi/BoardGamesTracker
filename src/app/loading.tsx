import { useTranslations } from "next-intl";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";

/**
 * Global streaming fallback for the first application load.
 *
 * @returns The documented function result.
 */
export default function Loading() {
  const t = useTranslations();
  return (
    <div className="bg-background grid min-h-screen place-items-center">
      <AppSpinner className="size-11" label={t("common.loading")} />
    </div>
  );
}
