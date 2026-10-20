import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/**
 * Supplies an Italian locale to the hook under test.
 *
 * @param root0 - Wrapper properties from Testing Library.
 * @param root0.children - Hook host rendered inside the provider.
 * @returns The provider-wrapped children.
 */
function ItalianLocale({ children }: { children: ReactNode }): ReactNode {
  return (
    <NextIntlClientProvider locale="it" messages={{}}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useCurrencyFormatter", () => {
  it("formats amounts in the given currency for the active locale", () => {
    const { result } = renderHook(() => useCurrencyFormatter("EUR"), {
      wrapper: ItalianLocale,
    });

    expect(result.current(1234.5)).toMatch(/^1234,50\s€$/);
  });

  it("rounds to at most two fraction digits", () => {
    const { result } = renderHook(() => useCurrencyFormatter("USD"), {
      wrapper: ItalianLocale,
    });

    expect(result.current(9.999)).toMatch(/^10,00\sUSD$/);
  });
});
