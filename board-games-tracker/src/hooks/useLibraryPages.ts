"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CollectionGame,
  LibraryFilters,
  LibraryPage,
  LibraryPageLoader,
} from "@/core";
import { libraryPageMaxLimit, libraryPageSize } from "@/core";
import { createLibraryFilters } from "@/utils/libraryFilters";

/** Pause, in milliseconds, after the last filter edit before the library is queried. */
const filterDebounceMs = 250;

/** Loaded cards, active filters, and continuation controls for one library browser. */
type LibraryPagesState = {
  filters: LibraryFilters;
  hasFailed: boolean;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  page: LibraryPage;
  retry: () => void;
  setFilters: (filters: LibraryFilters) => void;
};

/**
 * Appends a later page, keeping the first copy of any card already loaded.
 *
 * An expansion linked to base games on two pages arrives with both, so it is
 * deduplicated rather than rendered twice.
 *
 * @param current - Cards already on screen.
 * @param incoming - Cards from the page just loaded.
 * @returns Every distinct card in load order.
 */
function mergeUniqueGames(
  current: CollectionGame[],
  incoming: CollectionGame[],
): CollectionGame[] {
  const loadedIds = new Set(current.map((game) => game.id));
  return [...current, ...incoming.filter((game) => !loadedIds.has(game.id))];
}

/**
 * Reports whether two filter states select the same cards in the same order.
 *
 * @param left - First filter state.
 * @param right - Second filter state.
 * @returns Whether both states are structurally identical.
 */
function isSameFilters(left: LibraryFilters, right: LibraryFilters): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Keeps a library browser's filters, loaded pages, and server data in step.
 *
 * Filter edits are debounced and replace the loaded cards, while scrolling
 * appends the next window under the filters those cards were loaded with. When
 * the server renders a new first page after a mutation, every window already on
 * screen is reloaded so no card keeps stale personal data. A newer request
 * always wins over an older one still in flight.
 *
 * @param initialPage - First page rendered by the server; a new object signals fresh data.
 * @param loadPage - Stable loader for later windows, cancelled through its signal.
 * @returns Filter controls, the loaded page, and loading and retry callbacks.
 */
export function useLibraryPages(
  initialPage: LibraryPage,
  loadPage: LibraryPageLoader,
): LibraryPagesState {
  const [filters, setFilters] = useState<LibraryFilters>(createLibraryFilters);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const appliedFilters = useRef(filters);
  const renderedInitialPage = useRef(initialPage);
  const loadedRoots = useRef(initialPage.nextOffset);
  const pageVersion = useRef(0);
  const loadMoreController = useRef<AbortController | null>(null);

  useEffect(() => {
    const isServerRefresh = renderedInitialPage.current !== initialPage;
    renderedInitialPage.current = initialPage;
    if (!isServerRefresh && isSameFilters(filters, appliedFilters.current)) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => {
        loadMoreController.current?.abort();
        pageVersion.current += 1;
        const version = pageVersion.current;
        const limit = isServerRefresh
          ? Math.min(
              Math.max(loadedRoots.current, libraryPageSize),
              libraryPageMaxLimit,
            )
          : libraryPageSize;
        setIsLoading(true);
        loadPage({ filters, limit, offset: 0 }, controller.signal)
          .then((result) => {
            if (controller.signal.aborted) return;
            appliedFilters.current = filters;
            loadedRoots.current = result.nextOffset;
            setPage(result);
          })
          .catch(() => {
            if (!controller.signal.aborted) setHasFailed(true);
          })
          .finally(() => {
            if (pageVersion.current === version) setIsLoading(false);
          });
      },
      isServerRefresh ? 0 : filterDebounceMs,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filters, initialPage, loadPage, retryCount]);

  const loadMore = useCallback(() => {
    if (loadMoreController.current || page.nextOffset >= page.total) return;
    const controller = new AbortController();
    const version = pageVersion.current;
    loadMoreController.current = controller;
    setIsLoading(true);
    loadPage(
      {
        filters: appliedFilters.current,
        limit: libraryPageSize,
        offset: page.nextOffset,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted || pageVersion.current !== version) {
          return;
        }
        loadedRoots.current = result.nextOffset;
        setPage((current) => ({
          ...result,
          games: mergeUniqueGames(current.games, result.games),
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted && pageVersion.current === version) {
          setHasFailed(true);
        }
      })
      .finally(() => {
        if (loadMoreController.current === controller) {
          loadMoreController.current = null;
        }
        if (pageVersion.current === version) setIsLoading(false);
      });
  }, [loadPage, page.nextOffset, page.total]);

  const retry = useCallback(() => {
    setHasFailed(false);
    if (!isSameFilters(filters, appliedFilters.current)) {
      setRetryCount((current) => current + 1);
    }
  }, [filters]);

  const changeFilters = useCallback((nextFilters: LibraryFilters) => {
    setHasFailed(false);
    setFilters(nextFilters);
  }, []);

  return {
    filters,
    hasFailed,
    hasMore: page.nextOffset < page.total,
    isLoading,
    loadMore,
    page,
    retry,
    setFilters: changeFilters,
  };
}
