import { useTranslations } from "next-intl";

import { AppSpinner } from "@/components/ui/app-spinner";

/** Immediate fallback for navigation between authenticated pages. */
export default function Loading() {
  const t = useTranslations();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <AppSpinner className="size-10" label={t("common.loading")} />
    </div>
  );
}
