import { getLocale } from "next-intl/server";

import { LocaleSelectControl } from "@/components/molecules/LocaleSelectControl/LocaleSelectControl";

/** Server-backed language preference control. */
export async function LocaleSelect() {
  const locale = await getLocale();
  return <LocaleSelectControl initialLocale={locale} />;
}
