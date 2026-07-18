import { useTranslations } from "next-intl";

import { AppSpinner } from "@/components/ui/app-spinner";

/** Global streaming fallback for the first application load. */
export default function Loading() {
  const t = useTranslations();
  return (
    <div className="bg-background grid min-h-screen place-items-center">
      <AppSpinner className="size-11" label={t("common.loading")} />
    </div>
  );
}
