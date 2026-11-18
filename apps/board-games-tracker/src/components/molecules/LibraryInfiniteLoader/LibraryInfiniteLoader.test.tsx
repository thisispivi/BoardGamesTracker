import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { LibraryInfiniteLoader } from "@/components/molecules/LibraryInfiniteLoader/LibraryInfiniteLoader";

/**
 * Renders a component inside the English message catalog.
 *
 * @param children - Component under test.
 * @returns The rendering result.
 */
function renderInEnglish(children: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>,
  );
}

describe("LibraryInfiniteLoader", () => {
  it("announces a row of card placeholders while loading", () => {
    renderInEnglish(
      <LibraryInfiniteLoader
        hasFailed={false}
        hasMore
        isLoading
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading more games");
  });

  it("offers a retry instead of loading again after a failure", () => {
    const onLoadMore = vi.fn();
    const onRetry = vi.fn();
    renderInEnglish(
      <LibraryInfiniteLoader
        hasFailed
        hasMore
        isLoading={false}
        onLoadMore={onLoadMore}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "These games could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("renders nothing while the sentinel is idle", () => {
    renderInEnglish(
      <LibraryInfiniteLoader
        hasFailed={false}
        hasMore={false}
        isLoading={false}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
