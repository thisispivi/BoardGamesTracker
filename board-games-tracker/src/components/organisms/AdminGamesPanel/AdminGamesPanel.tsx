"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pencil,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog/ConfirmDialog";
import type { AdminGame, AdminGamesPage, CollectionActionState } from "@/core";
import {
  getAdminGamesPageAction,
  refreshGameCatalogBatchAction,
  refreshGameFromBggAction,
  updateGameMetadataAction,
} from "@/server/actions/adminGames";
import { cn } from "@/utils/cn";

const initialState: CollectionActionState = { success: false, message: "" };

/** Initial paginated data displayed by the game administration panel. */
type AdminGamesPanelProps = {
  initialPage: AdminGamesPage;
};

/** Game record and close handler used by the metadata editor. */
type EditDialogProps = {
  game: AdminGame;
  onClose: () => void;
};

/**
 * Labelled input used throughout the metadata editor.
 *
 * @param root0 - Properties that configure one labelled metadata field.
 * @param root0.children - Content rendered inside the component.
 * @param root0.label - Localized label displayed by the control.
 * @returns The rendered field.
 */
function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}): ReactNode {
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

/**
 * Editable form for one shared game's metadata.
 *
 * @param root0 - Properties that configure edit game metadata dialog.
 * @param root0.game - Game record displayed or changed by the component.
 * @param root0.onClose - Callback that dismisses the dialog.
 * @returns The rendered edit game metadata dialog.
 */
function EditGameMetadataDialog({ game, onClose }: EditDialogProps): ReactNode {
  const t = useTranslations();
  const [saveState, save, saving] = useActionState(
    updateGameMetadataAction,
    initialState,
  );
  const [refreshState, refresh, refreshing] = useActionState(
    refreshGameFromBggAction,
    initialState,
  );

  useEffect(() => {
    for (const state of [saveState, refreshState]) {
      if (!state.message) continue;
      if (state.success) {
        toast.success(state.message);
        onClose();
      } else {
        toast.error(state.message);
      }
    }
  }, [onClose, refreshState, saveState]);

  return (
    <Dialog.Root onOpenChange={(next) => (next ? null : onClose())} open>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content bg-card fixed top-1/2 left-1/2 z-51 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-xl border shadow-2xl focus:outline-none">
          <header className="flex shrink-0 items-start justify-between gap-5 border-b px-6 py-5">
            <div className="min-w-0">
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("adminGames.eyebrow")}
              </p>
              <Dialog.Title className="font-display mt-1 truncate text-xl font-bold">
                {game.name}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-xs">
                {t("common.bggId", { id: game.bggId })} ·{" "}
                {t("adminGames.owners", { count: game.owners })}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label={t("common.close")}
                className="hover:bg-muted grid size-10 shrink-0 place-items-center rounded-full transition"
                type="button"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </header>

          <div className="modal-scroll-area min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <form action={refresh} className="mb-6">
              <input name="gameId" type="hidden" value={game.id} />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <p className="text-muted-foreground min-w-0 flex-1 text-xs leading-5">
                  {t("adminGames.refreshHelp")}
                </p>
                <Button disabled={refreshing} type="submit" variant="secondary">
                  {refreshing ? (
                    <AppSpinner
                      className="size-4"
                      label={t("common.loading")}
                    />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {t("adminGames.refresh")}
                </Button>
              </div>
            </form>

            <form action={save} className="space-y-5">
              <input name="gameId" type="hidden" value={game.id} />
              <Field label={t("adminGames.name")}>
                <input
                  className="field-input"
                  defaultValue={game.name}
                  maxLength={160}
                  name="name"
                  required
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("add.year")}>
                  <input
                    className="field-input"
                    defaultValue={game.yearPublished ?? ""}
                    max={2200}
                    min={1800}
                    name="yearPublished"
                    type="number"
                  />
                </Field>
                <Field label={t("add.minPlayers")}>
                  <input
                    className="field-input"
                    defaultValue={game.minPlayers}
                    max={99}
                    min={1}
                    name="minPlayers"
                    required
                    type="number"
                  />
                </Field>
                <Field label={t("add.maxPlayers")}>
                  <input
                    className="field-input"
                    defaultValue={game.maxPlayers}
                    max={99}
                    min={1}
                    name="maxPlayers"
                    required
                    type="number"
                  />
                </Field>
                <Field label={t("add.minMinutes")}>
                  <input
                    className="field-input"
                    defaultValue={game.minPlaytime}
                    max={10_000}
                    min={0}
                    name="minPlaytime"
                    required
                    type="number"
                  />
                </Field>
                <Field label={t("add.maxMinutes")}>
                  <input
                    className="field-input"
                    defaultValue={game.maxPlaytime}
                    max={10_000}
                    min={0}
                    name="maxPlaytime"
                    required
                    type="number"
                  />
                </Field>
                <Field label={t("add.complexity")}>
                  <input
                    className="field-input"
                    defaultValue={game.weight ?? ""}
                    max={5}
                    min={0}
                    name="weight"
                    step="any"
                    type="number"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("adminGames.rating")}>
                  <input
                    className="field-input"
                    defaultValue={game.bggRating ?? ""}
                    max={10}
                    min={0}
                    name="bggRating"
                    step={0.01}
                    type="number"
                  />
                </Field>
                <Field label={t("adminGames.kind")}>
                  <select
                    className="field-input"
                    defaultValue={String(game.isExpansion)}
                    name="isExpansion"
                  >
                    <option value="false">{t("adminGames.baseGame")}</option>
                    <option value="true">{t("common.expansion")}</option>
                  </select>
                </Field>
              </div>
              <Field label={t("add.categories")}>
                <input
                  className="field-input"
                  defaultValue={game.categories.join(", ")}
                  maxLength={1_000}
                  name="categories"
                />
              </Field>
              <Field label={t("add.mechanics")}>
                <input
                  className="field-input"
                  defaultValue={game.mechanics.join(", ")}
                  maxLength={1_000}
                  name="mechanics"
                />
              </Field>
              <Field label={t("add.families")}>
                <input
                  className="field-input"
                  defaultValue={game.families.join(", ")}
                  maxLength={1_000}
                  name="families"
                />
              </Field>
              <Field label={t("add.description")}>
                <textarea
                  className="field-input min-h-24 py-3"
                  defaultValue={game.description}
                  maxLength={10_000}
                  name="description"
                  rows={4}
                />
              </Field>
              <div className="flex justify-end gap-2 border-t pt-5">
                <Button onClick={onClose} type="button" variant="secondary">
                  {t("common.cancel")}
                </Button>
                <Button disabled={saving} type="submit">
                  {saving ? (
                    <AppSpinner
                      className="size-4"
                      label={t("common.loading")}
                    />
                  ) : null}
                  {t("adminGames.save")}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Callback the catalog header runs once a refresh stops. */
type CatalogHeaderProps = {
  onFinished: () => void;
};

/** Games processed so far, and the catalog size once the first batch reports it. */
type CatalogRefreshProgress = {
  done: number;
  total: number | null;
};

/**
 * Titles the catalog section and refreshes every shared game from BoardGameGeek, one bounded batch at a time.
 *
 * The refresh button sits beside the title and wraps below it on narrow
 * screens. Batches run one after another from the browser, so a large catalog
 * never holds a request open past a proxy timeout and its progress stays
 * visible. Leaving the page stops the walk after the batch in flight; games
 * refreshed by then keep their new metadata.
 *
 * @param root0 - Properties that configure the catalog header.
 * @param root0.onFinished - Callback run once the walk stops, whether it completed or failed.
 * @returns The section title, the refresh button, its confirmation dialog, and a progress bar with a live count while refreshing.
 */
function CatalogHeader({ onFinished }: CatalogHeaderProps): ReactNode {
  const t = useTranslations();
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<CatalogRefreshProgress | null>(null);

  /**
   * Walks the catalog batch by batch and reports the outcome in a toast.
   *
   * @returns A promise that settles after the last batch, or after the first batch that fails.
   */
  async function refreshCatalog(): Promise<void> {
    setProgress({ done: 0, total: null });
    let cursor: string | null = null;
    let refreshed = 0;
    let failed = 0;
    try {
      do {
        const batch = await refreshGameCatalogBatchAction(cursor);
        refreshed += batch.refreshed;
        failed += batch.failed;
        setProgress({ done: refreshed + failed, total: batch.total });
        cursor = batch.nextCursor;
      } while (cursor !== null);
      if (failed === 0) {
        toast.success(t("adminGames.refreshAllDone", { count: refreshed }));
      } else {
        toast.warning(t("adminGames.refreshAllPartial", { failed, refreshed }));
      }
    } catch {
      toast.error(t("adminGames.refreshAllFailed"));
    } finally {
      setProgress(null);
      onFinished();
    }
  }

  /**
   * Closes the confirmation and starts the catalog walk without awaiting it.
   *
   * React commits state set inside a form action only once the action settles,
   * so awaiting the whole walk here would keep the dialog open over the page
   * and hold back the first progress update until the refresh ended.
   *
   * @returns A promise that settles as soon as the walk has started.
   */
  async function startRefresh(): Promise<void> {
    setConfirming(false);
    void refreshCatalog();
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grow basis-72">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {t("adminGames.eyebrow")}
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">
            {t("adminGames.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("adminGames.body")}
          </p>
        </div>
        <Button
          className="shrink-0"
          disabled={progress !== null}
          onClick={() => setConfirming(true)}
          type="button"
          variant="secondary"
        >
          {progress === null ? (
            <RefreshCw className="size-4" />
          ) : (
            <AppSpinner className="size-4" label={t("common.loading")} />
          )}
          {t("adminGames.refreshAll")}
        </Button>
      </div>
      {progress === null ? null : (
        <progress
          aria-label={t("adminGames.refreshAll")}
          className="bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary mt-4 block h-2 w-full appearance-none overflow-hidden rounded-full"
          max={progress.total === null ? undefined : progress.total}
          value={progress.total === null ? undefined : progress.done}
        />
      )}
      <p
        aria-live="polite"
        className={cn(
          "text-muted-foreground text-xs leading-5 tabular-nums",
          progress === null ? null : "mt-2",
        )}
      >
        {progress === null
          ? null
          : progress.total === null
            ? t("adminGames.refreshAllStarting")
            : t("adminGames.refreshAllProgress", {
                done: progress.done,
                total: progress.total,
              })}
      </p>
      <ConfirmDialog
        action={startRefresh}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("adminGames.refreshAllConfirm")}
        description={t("adminGames.refreshAllBody")}
        fields={{}}
        onOpenChange={setConfirming}
        open={confirming}
        title={t("adminGames.refreshAllTitle")}
      />
    </div>
  );
}

/**
 * Searchable, paginated list of every shared game with a metadata editor.
 *
 * @param root0 - Properties that configure admin games panel.
 * @param root0.initialPage - First server-rendered page of paginated records.
 * @returns The rendered admin games panel.
 */
export function AdminGamesPanel({
  initialPage,
}: AdminGamesPanelProps): ReactNode {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(initialPage);
  const [appliedQuery, setAppliedQuery] = useState("");
  const [editing, setEditing] = useState<AdminGame | null>(null);
  const [pending, startTransition] = useTransition();
  const loadErrorMessage = t("adminGames.loadError");

  /**
   * Loads one validated administration page without blocking the panel.
   *
   * @param page - One-based page number to request.
   * @param search - Current game-name filter.
   * @returns Nothing.
   */
  function loadPage(page: number, search: string): void {
    if (pending || page < 1 || page > result.pages) return;
    startTransition(async () => {
      try {
        setResult(await getAdminGamesPageAction(page, search));
      } catch {
        toast.error(loadErrorMessage);
      }
    });
  }
  useEffect(() => {
    if (query === appliedQuery) {
      return;
    }
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        try {
          setResult(await getAdminGamesPageAction(1, query));
          setAppliedQuery(query);
        } catch {
          toast.error(loadErrorMessage);
        }
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [appliedQuery, loadErrorMessage, query]);

  return (
    <>
      <CatalogHeader onFinished={() => loadPage(result.page, query)} />
      <label className="relative mb-5 block">
        <span className="sr-only">{t("adminGames.searchLabel")}</span>
        <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <input
          className="bg-background h-11 w-full rounded-lg border pr-4 pl-11 text-sm transition"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("adminGames.searchPlaceholder")}
          type="search"
          value={query}
        />
      </label>

      <div aria-busy={pending} className="relative min-h-32">
        <div
          className={cn(
            "max-h-128 space-y-1 overflow-y-auto overscroll-contain pr-1 transition-opacity",
            pending ? "opacity-35" : "opacity-100",
          )}
        >
          {result.games.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              {t("adminGames.empty")}
            </p>
          ) : (
            <ul className="divide-y">
              {result.games.map((game) => (
                <li className="flex items-center gap-4 py-3" key={game.id}>
                  <GameArtwork
                    className="size-12 shrink-0 rounded-lg"
                    imageUrl={game.imageUrl}
                    name={game.name}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{game.name}</p>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>{t("common.bggId", { id: game.bggId })}</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {game.minPlayers}–{game.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {game.minPlaytime}–{game.maxPlaytime}
                      </span>
                      <span>
                        {game.yearPublished ?? t("common.yearUnknown")}
                      </span>
                      {game.isExpansion ? (
                        <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 font-bold">
                          {t("common.expansion")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Tooltip content={t("adminGames.editHint")}>
                    <button
                      aria-label={t("adminGames.edit", { name: game.name })}
                      className="text-muted-foreground hover:bg-muted hover:text-primary shrink-0 rounded-md p-2 transition"
                      onClick={() => setEditing(game)}
                      type="button"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
        </div>
        {pending ? (
          <div className="bg-card/72 absolute inset-0 grid place-items-center rounded-lg backdrop-blur-[2px]">
            <div className="text-primary flex flex-col items-center gap-3 text-sm font-bold">
              <AppSpinner className="size-7" label={t("adminGames.loading")} />
              <span>{t("adminGames.loading")}</span>
            </div>
          </div>
        ) : null}
      </div>

      <nav
        aria-label={t("adminGames.title")}
        className="mt-5 flex items-center justify-between gap-4 border-t pt-5"
      >
        <Button
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page <= 1}
          onClick={() => loadPage(result.page - 1, query)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ChevronLeft className="size-4" /> {t("admin.previous")}
        </Button>
        <p className="text-muted-foreground text-xs font-bold tabular-nums">
          {t("adminGames.page", { page: result.page, pages: result.pages })}
        </p>
        <Button
          className="min-w-0 px-2 sm:min-w-28 sm:px-3"
          disabled={pending || result.page >= result.pages}
          onClick={() => loadPage(result.page + 1, query)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {t("admin.next")} <ChevronRight className="size-4" />
        </Button>
      </nav>

      {editing ? (
        <EditGameMetadataDialog
          game={editing}
          key={editing.id}
          onClose={() => {
            setEditing(null);
            loadPage(result.page, query);
          }}
        />
      ) : null}
    </>
  );
}
