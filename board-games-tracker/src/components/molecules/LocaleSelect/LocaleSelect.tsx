import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { LocaleSelectControl } from "@/components/molecules/LocaleSelectControl/LocaleSelectControl";

/** Placement of the server-backed language control. */
type LocaleSelectProps = {
  className?: string;
};

/**
 * Server-backed language preference control.
 *
 * @param root0 - Properties that configure locale select.
 * @param root0.className - Optional classes merged with the control wrapper.
 * @returns The rendered locale select.
 */
export async function LocaleSelect({
  className,
}: LocaleSelectProps): Promise<ReactNode> {
  const locale = await getLocale();
  return (
    <LocaleSelectControl
      {...(className === undefined ? {} : { className })}
      initialLocale={locale}
    />
  );
}
