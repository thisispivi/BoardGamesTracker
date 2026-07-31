"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Clock3, Pencil, RefreshCw, Search, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";
import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import type { AdminGame, CollectionActionState } from "@/core";
import {
  refreshGameFromBggAction,
  updateGameMetadataAction,
} from "@/server/actions/adminGames";
import { normalizeSearchText } from "@/utils/search";

const initialState: CollectionActionState = { success: false, message: "" };

type AdminGamesPanelProps = {
  games: AdminGame[];
};

type EditDialogProps = {
  game: AdminGame;
  onClose: () => void;
};

/**
 * Labelled input used throughout the metadata editor.
 *
 * @param root0 - Component or function properties.
 * @param root0.children - The 'children' property.
 * @param root0.label - The 'label' property.
 * @returns The documented function result.
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
 * @param root0 - Component or function properties.
 * @param root0.game - The 'game' property.
 * @param root0.onClose - The 'onClose' property.
 * @returns The documented function result.
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
        <Dialog.Content className="dialog-content bg-card fixed top-1/2 left-1/2 z-51 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl focus:outline-none">
          <header className="flex shrink-0 items-start justify-between gap-5 border-b px-6 py-5">
            <div className="min-w-0">
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("adminGames.eyebrow")}
              </p>
              <Dialog.Title className="font-display mt-1 truncate text-xl font-bold">
                {game.name}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-1 text-xs">
                BGG #{game.bggId} ·{" "}
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
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
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
                    step={0.01}
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

/**
 * Searchable table of every shared game with a metadata editor.
 *
 * @param root0 - Component or function properties.
 * @param root0.games - The 'games' property.
 * @returns The documented function result.
 */
export function AdminGamesPanel({ games }: AdminGamesPanelProps): ReactNode {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminGame | null>(null);
  const visible = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return games;
    return games.filter((game) =>
      normalizeSearchText(`${game.name} ${game.bggId}`).includes(term),
    );
  }, [games, query]);

  return (
    <>
      <label className="relative mb-5 block">
        <span className="sr-only">{t("adminGames.searchLabel")}</span>
        <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <input
          className="bg-background focus:ring-primary/20 h-11 w-full rounded-xl border pr-4 pl-11 text-sm transition focus:ring-4 focus:outline-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("adminGames.searchPlaceholder")}
          type="search"
          value={query}
        />
      </label>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t("adminGames.empty")}
        </p>
      ) : (
        <ul className="divide-y">
          {visible.map((game) => (
            <li className="flex items-center gap-4 py-3" key={game.id}>
              <GameArtwork
                className="size-12 shrink-0 rounded-xl"
                imageUrl={game.imageUrl}
                name={game.name}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{game.name}</p>
                <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>BGG #{game.bggId}</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {game.minPlayers}–{game.maxPlayers}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-3" />
                    {game.minPlaytime}–{game.maxPlaytime}
                  </span>
                  <span>{game.yearPublished ?? t("common.yearUnknown")}</span>
                  {game.isExpansion ? (
                    <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 font-bold">
                      {t("common.expansion")}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                aria-label={t("adminGames.edit", { name: game.name })}
                className="text-muted-foreground hover:bg-muted hover:text-primary shrink-0 rounded-lg p-2 transition"
                onClick={() => setEditing(game)}
                type="button"
              >
                <Pencil className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <EditGameMetadataDialog
          game={editing}
          key={editing.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
