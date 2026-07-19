import { useTranslations } from "next-intl";

/**
 * Formats a minute count with the active locale's compact duration message.
 *
 * @returns The documented function result.
 */
export function useDurationFormatter(): (minutes: number) => string {
  const t = useTranslations();

  return (minutes) =>
    t("common.duration", {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
    });
}
