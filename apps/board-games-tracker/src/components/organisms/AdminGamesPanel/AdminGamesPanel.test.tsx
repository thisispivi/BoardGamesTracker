import messages from "@messages/en.json";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminGamesPanel } from "@/components/organisms/AdminGamesPanel/AdminGamesPanel";
import type { AdminGame, AdminGamesPage } from "@/core";

const { getAdminGamesPageAction, refreshGameCatalogBatchAction } = vi.hoisted(
  () => ({
    getAdminGamesPageAction: vi.fn(),
    refreshGameCatalogBatchAction: vi.fn(),
  }),
);

vi.mock("@/server/actions/adminGames", () => ({
  getAdminGamesPageAction,
  refreshGameCatalogBatchAction,
  refreshGameFromBggAction: vi.fn(),
  updateGameMetadataAction: vi.fn(),
}));

/**
 * Builds one shared game row with the fields the panel renders.
 *
 * @param name - The game name, also used to derive a unique identifier.
 * @returns A complete administrator game record.
 */
function buildGame(name: string): AdminGame {
  return {
    bggId: 13,
    bggRating: null,
    categories: [],
    description: "",
    families: [],
    id: `id-${name}`,
    imageUrl: null,
    isExpansion: false,
    maxPlayers: 4,
    maxPlaytime: 60,
    mechanics: [],
    minPlayers: 2,
    minPlaytime: 30,
    name,
    owners: 1,
    weight: null,
    yearPublished: 1995,
  };
}

const firstPage: AdminGamesPage = {
  games: [buildGame("Catan")],
  page: 1,
  pages: 3,
};

/**
 * Renders the panel inside the translation provider it depends on.
 *
 * @param strict - Whether to wrap in StrictMode, matching the dev runtime.
 * @returns Nothing.
 */
function renderPanel(strict = false): void {
  const tree = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <AdminGamesPanel initialPage={firstPage} />
    </NextIntlClientProvider>
  );
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("AdminGamesPanel", () => {
  it("requests the next page exactly once and does not re-fetch on re-render", async () => {
    vi.useFakeTimers();
    getAdminGamesPageAction.mockResolvedValue({
      games: [buildGame("Brass")],
      page: 2,
      pages: 3,
    });
    renderPanel(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    });

    expect(getAdminGamesPageAction).toHaveBeenCalledOnce();
    expect(getAdminGamesPageAction).toHaveBeenCalledWith(2, "");
    expect(
      screen.getByRole("button", { name: "Edit Brass" }),
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });
    expect(getAdminGamesPageAction).toHaveBeenCalledOnce();
  });

  it("does not fetch on mount under StrictMode", async () => {
    vi.useFakeTimers();
    getAdminGamesPageAction.mockResolvedValue(firstPage);
    renderPanel(true);

    await act(async () => {
      vi.advanceTimersByTime(3_000);
    });

    expect(getAdminGamesPageAction).not.toHaveBeenCalled();
  });

  it("debounces a search back to the first page", async () => {
    vi.useFakeTimers();
    getAdminGamesPageAction.mockResolvedValue({
      games: [buildGame("Root")],
      page: 1,
      pages: 1,
    });
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText("Search by name or BGG id"), {
      target: { value: "Root" },
    });

    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(getAdminGamesPageAction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(getAdminGamesPageAction).toHaveBeenCalledOnce();
    expect(getAdminGamesPageAction).toHaveBeenCalledWith(1, "Root");
  });

  it("refreshes the whole catalog batch by batch only after confirmation", async () => {
    refreshGameCatalogBatchAction
      .mockResolvedValueOnce({
        failed: 0,
        nextCursor: "cursor-1",
        refreshed: 8,
        total: 9,
      })
      .mockResolvedValueOnce({
        failed: 1,
        nextCursor: null,
        refreshed: 0,
        total: 9,
      });
    getAdminGamesPageAction.mockResolvedValue(firstPage);
    renderPanel();

    expect(
      screen.getByRole("heading", { name: "Board-game metadata" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh all from BGG" }),
    );
    expect(refreshGameCatalogBatchAction).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Refresh all games" }),
      );
    });

    await vi.waitFor(() =>
      expect(refreshGameCatalogBatchAction).toHaveBeenCalledTimes(2),
    );
    expect(refreshGameCatalogBatchAction).toHaveBeenNthCalledWith(1, null);
    expect(refreshGameCatalogBatchAction).toHaveBeenNthCalledWith(
      2,
      "cursor-1",
    );
  });

  it("shows a progress bar that advances with each catalog batch", async () => {
    vi.useFakeTimers();
    const pendingBatches: ((batch: unknown) => void)[] = [];
    refreshGameCatalogBatchAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingBatches.push(resolve);
        }),
    );
    getAdminGamesPageAction.mockResolvedValue(firstPage);
    renderPanel();

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh all from BGG" }),
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Refresh all games" }),
      );
    });

    expect(refreshGameCatalogBatchAction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(refreshGameCatalogBatchAction).toHaveBeenCalledOnce();
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("value");
    expect(screen.getByText("Starting the refresh…")).toBeInTheDocument();

    await act(async () => {
      pendingBatches[0]?.({
        failed: 1,
        nextCursor: "cursor-1",
        refreshed: 3,
        total: 9,
      });
    });

    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "4");
    expect(screen.getByRole("progressbar")).toHaveAttribute("max", "9");
    expect(
      screen.getByText("Refreshing from BoardGameGeek: 4 of 9 games"),
    ).toBeInTheDocument();

    await act(async () => {
      pendingBatches[1]?.({
        failed: 0,
        nextCursor: null,
        refreshed: 5,
        total: 9,
      });
    });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
