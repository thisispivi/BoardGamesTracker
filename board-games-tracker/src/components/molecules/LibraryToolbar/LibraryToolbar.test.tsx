import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { LibraryToolbar } from "@/components/molecules/LibraryToolbar/LibraryToolbar";
import { createLibraryFilters } from "@/utils/libraryFilters";

describe("LibraryToolbar", () => {
  it("keeps search, filters, and the supplied action reachable", () => {
    const onOpenFilters = vi.fn();
    const onQueryChange = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LibraryToolbar
          action={<button type="button">Add game</button>}
          filters={{
            ...createLibraryFilters(),
            favoriteFilter: "yes",
            playedFilter: "no",
          }}
          onOpenFilters={onOpenFilters}
          onQueryChange={onQueryChange}
          showFavorites
          showPlayed
        />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search games" }), {
      target: { value: "brass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show filters" }));

    expect(onQueryChange).toHaveBeenCalledWith("brass");
    expect(onOpenFilters).toHaveBeenCalledOnce();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add game" }),
    ).toBeInTheDocument();
  });
});
