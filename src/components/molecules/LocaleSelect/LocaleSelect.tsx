import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { LocaleSelectControl } from "@/components/molecules/LocaleSelectControl/LocaleSelectControl";

/** Server-backed language preference control. */
export async function LocaleSelect(): Promise<ReactNode> {
  const locale = await getLocale();
  return <LocaleSelectControl initialLocale={locale} />;
}
