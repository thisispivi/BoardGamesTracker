import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LibraryPage, LibraryPageLoader } from "@/core";
import { useLibraryPages } from "@/hooks/useLibraryPages";
import { createCollectionGame } from "@/test/collectionGame";
import { createLibraryFilters } from "@/utils/libraryFilters";

/**
 * Builds a page holding one card per name.
 *
 * @param names - Card names, also used as the card identifiers.
 * @param nextOffset - Cursor after the page.
 * @param total - Root entries in the whole view.
 * @returns A library page.
 */
function page(names: string[], nextOffset: number, total: number): LibraryPage {
  return {
    baseGameCount: total,
    expansionCount: 0,
    games: names.map((name, index) =>
      createCollectionGame({ bggId: index + 1, id: name, name }),
    ),
    nextOffset,
    total,
  };
}

/**
 * Renders the hook with a first page that can be replaced like a server refresh.
 *
 * @param initialPage - First page rendered by the server.
 * @param loadPage - Loader for every later window.
 * @returns The hook rendering, with `rerender` accepting a new first page.
 */
function renderPages(initialPage: LibraryPage, loadPage: LibraryPageLoader) {
  return renderHook(({ firstPage }) => useLibraryPages(firstPage, loadPage), {
    initialProps: { firstPage: initialPage },
  });
}

describe("useLibraryPages", () => {
  it("appends the next window under the filters already applied", async () => {
    const loadPage = vi.fn<LibraryPageLoader>(async () =>
      page(["Brass"], 2, 2),
    );
    const { result } = renderPages(page(["Azul"], 1, 2), loadPage);

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(result.current.page.games.map((game) => game.name)).toEqual([
        "Azul",
        "Brass",
      ]),
    );
    expect(loadPage).toHaveBeenCalledWith(
      { filters: createLibraryFilters(), limit: 48, offset: 1 },
      expect.any(AbortSignal),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it("replaces the loaded cards once the filters settle", async () => {
    const loadPage = vi.fn<LibraryPageLoader>(async () =>
      page(["Brass"], 1, 1),
    );
    const { result } = renderPages(page(["Azul"], 1, 2), loadPage);
    const filters = { ...createLibraryFilters(), query: "brass" };

    act(() => result.current.setFilters(filters));

    await waitFor(() =>
      expect(result.current.page.games.map((game) => game.name)).toEqual([
        "Brass",
      ]),
    );
    expect(loadPage).toHaveBeenCalledOnce();
    expect(loadPage).toHaveBeenCalledWith(
      { filters, limit: 48, offset: 0 },
      expect.any(AbortSignal),
    );
  });

  it("reloads the loaded window when the server renders fresh data", async () => {
    const loadPage = vi.fn<LibraryPageLoader>(async () =>
      page(["Azul, played"], 1, 1),
    );
    const { rerender, result } = renderPages(page(["Azul"], 1, 1), loadPage);

    rerender({ firstPage: page(["Azul"], 1, 1) });

    await waitFor(() =>
      expect(result.current.page.games.map((game) => game.name)).toEqual([
        "Azul, played",
      ]),
    );
    expect(loadPage).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 48, offset: 0 }),
      expect.any(AbortSignal),
    );
  });

  it("reports a failed window instead of retrying on its own", async () => {
    const loadPage = vi.fn<LibraryPageLoader>(async () => {
      throw new Error("offline");
    });
    const { result } = renderPages(page(["Azul"], 1, 2), loadPage);

    act(() => result.current.loadMore());

    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
    expect(loadPage).toHaveBeenCalledOnce();
  });
});
