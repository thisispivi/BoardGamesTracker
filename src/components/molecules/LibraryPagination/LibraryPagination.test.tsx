import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { LibraryPagination } from "@/components/molecules/LibraryPagination/LibraryPagination";

describe("LibraryPagination", () => {
  it("reports progress and requests another batch", () => {
    const onLoadMore = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LibraryPagination onLoadMore={onLoadMore} shown={50} total={73} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Showing 50 of 73")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load 50 more" }));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("omits the control after every result is visible", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LibraryPagination onLoadMore={vi.fn()} shown={12} total={12} />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole("button")).toBeNull();
  });
});
