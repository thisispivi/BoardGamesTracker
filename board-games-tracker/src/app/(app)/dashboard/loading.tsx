import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { HomeSkeleton } from "@/components/organisms/HomeSkeleton/HomeSkeleton";

/**
 * Streams a home-shaped placeholder while the library snapshot loads.
 *
 * @returns The home page skeleton.
 */
export default function Loading(): ReactNode {
  const t = useTranslations();
  return <HomeSkeleton label={t("common.loading")} />;
}
