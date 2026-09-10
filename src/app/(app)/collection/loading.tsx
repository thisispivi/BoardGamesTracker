import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LibraryPageSkeleton } from "@/components/organisms/LibraryPageSkeleton/LibraryPageSkeleton";

/**
 * Shows the collection layout while its server data is loading.
 *
 * @returns A localized collection-page skeleton.
 */
export default function Loading(): ReactNode {
  const t = useTranslations("common");
  return <LibraryPageSkeleton label={t("loadingCollection")} />;
}
