import { LocaleSelectControl } from "@/components/locale-select-control";
import { getLocale } from "next-intl/server";

/** Server-backed language preference control. */
export async function LocaleSelect() {
  const locale = await getLocale();
  return <LocaleSelectControl initialLocale={locale} />;
}
