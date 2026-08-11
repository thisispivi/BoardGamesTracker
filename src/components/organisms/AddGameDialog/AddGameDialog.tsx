"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ExternalLink, Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppSpinner } from "@/components/atoms/AppSpinner/AppSpinner";
import { Button } from "@/components/atoms/Button/Button";
import { GiftedPriceField } from "@/components/molecules/GiftedPriceField/GiftedPriceField";
import type {
  BggMetadata,
  CollectionActionState,
  GameDiscoveryResult,
} from "@/core";
import { addGameAction } from "@/server/actions/collection";
import { normalizeSearchText } from "@/utils/search";
import { TtlCache } from "@/utils/ttlCache";

const initialState: CollectionActionState = { success: false, message: "" };

/** Delay that prevents unfinished typing from exhausting free search engines. */
const searchDelayMs = 600;

/**
 * Client-side results cache shared by every dialog instance in the tab.
 *
 * Selection tokens stay valid for an hour, so a ten-minute lifetime keeps
 * repeated searches instant while never serving a token that cannot be saved.
 */
const resultCache = new TtlCache<GameDiscoveryResult[]>(10 * 60_000, 50);

/**
 * Builds the cache key for a search term, matching server-side normalization.
 *
 * @param term - The trimmed search term typed by the user.
 * @returns A stable key that ignores case, accents, and filler words.
 */
function cacheKey(term: string): string {
  return normalizeSearchText(term) || term.toLowerCase();
}

type AddGameDialogProps = {
  currency: string;
  destination?: "collection" | "wishlist";
};

/**
 * Debounced search dialog for adding a title or pasted BGG game URL.
 *
 * @param root0 - Component or function properties.
 * @param root0.currency - The 'currency' property.
 * @param root0.destination - The 'destination' property.
 * @returns The documented function result.
 */
export function AddGameDialog({
  currency,
  destination = "collection",
}: AddGameDialogProps): ReactNode {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameDiscoveryResult[]>([]);
  const [selected, setSelected] = useState<GameDiscoveryResult | null>(null);
  const [loaded, setLoaded] = useState<{
    bggId: number;
    metadata: BggMetadata | null;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [state, action, adding] = useActionState(addGameAction, initialState);
  const router = useRouter();
  const term = query.trim();
  const cached = term.length < 3 ? undefined : resultCache.get(cacheKey(term));
  const visibleResults = cached ?? results;
  const loadingDetails = selected !== null && loaded?.bggId !== selected.bggId;
  const details =
    loaded?.bggId === selected?.bggId ? (loaded?.metadata ?? null) : null;

  /**
   * Resets ephemeral search state whenever the dialog is dismissed.
   *
   * @param nextOpen - The 'nextOpen' value.
   */
  function changeOpen(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setLoaded(null);
      setSearching(false);
      setHasSearched(false);
      setSearchError(null);
    }
  }

  /**
   * Clears stale discovery state immediately while the user keeps typing.
   *
   * @param nextQuery - The 'nextQuery' value.
   */
  function changeQuery(nextQuery: string): void {
    setQuery(nextQuery);
    setResults([]);
    setSearching(false);
    setHasSearched(false);
    setSearchError(null);
  }

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      router.refresh();
      const timeout = window.setTimeout(() => changeOpen(false), 0);
      return () => window.clearTimeout(timeout);
    }
    toast.error(state.message);
  }, [router, state]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    const controller = new AbortController();
    const bggId = selected.bggId;
    void fetch(`/api/games/metadata?bggId=${bggId}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          metadata?: BggMetadata | null;
        };
        setLoaded({ bggId, metadata: payload.metadata ?? null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoaded({ bggId, metadata: null });
      });

    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    if (!open || selected || term.length < 3 || cached) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setSearching(true);
      void fetch(`/api/games/search?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as {
            results?: GameDiscoveryResult[];
            error?: string;
          };
          if (!response.ok) {
            setSearchError(payload.error ?? "unavailable");
            setResults([]);
            return;
          }
          const found = payload.results ?? [];
          // An empty answer is usually a starved upstream, so never pin it.
          if (found.length > 0) {
            resultCache.set(cacheKey(term), found);
          }
          setResults(found);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setSearchError("unavailable");
          setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSearching(false);
            setHasSearched(true);
          }
        });
    }, searchDelayMs);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cached, open, selected, term]);

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Trigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          {t(destination === "wishlist" ? "wishlist.add" : "add.button")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content bg-card fixed top-1/2 left-1/2 z-51 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl focus:outline-none">
          <header className="flex shrink-0 items-start justify-between gap-5 border-b px-6 py-5 sm:px-8 sm:py-6">
            <div className="min-w-0">
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                {t("add.eyebrow")}
              </p>
              <Dialog.Title className="font-display mt-1 truncate text-2xl font-bold">
                {selected ? selected.name : t("add.findTitle")}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground mt-2 text-sm">
                {selected ? t("add.selectedBody") : t("add.searchBodyWithUrl")}
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

          <div className="modal-scroll-area min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            {selected ? (
              loadingDetails ? (
                <div className="grid place-items-center py-16">
                  <AppSpinner className="size-6" label={t("common.loading")} />
                </div>
              ) : (
                <SelectedGameForm
                  action={action}
                  adding={adding}
                  currency={currency}
                  destination={destination}
                  details={details}
                  onChooseAnother={() => setSelected(null)}
                  selected={selected}
                />
              )
            ) : (
              <div>
                <label className="relative block">
                  <span className="sr-only">{t("add.gameTitle")}</span>
                  <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                  <input
                    autoFocus
                    className="bg-background focus:ring-primary/20 h-12 w-full rounded-xl border pr-12 pl-11 transition focus:ring-4 focus:outline-none"
                    maxLength={500}
                    minLength={3}
                    onChange={(event) => changeQuery(event.target.value)}
                    placeholder={t("add.searchPlaceholder")}
                    value={query}
                  />
                  {searching ? (
                    <AppSpinner
                      className="absolute top-[calc(50%-0.5rem)] right-4 size-4"
                      label={t("common.loading")}
                    />
                  ) : null}
                </label>

                <div aria-live="polite" className="mt-5 space-y-2">
                  {visibleResults.map((result) => (
                    <button
                      className="hover:bg-muted/60 focus:ring-primary/20 flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition focus:ring-4 focus:outline-none"
                      key={result.bggId}
                      onClick={() => setSelected(result)}
                      type="button"
                    >
                      <span className="bg-muted relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl">
                        {result.imageUrl ? (
                          <Image
                            alt=""
                            className="object-cover"
                            fill
                            sizes="64px"
                            src={result.imageUrl}
                          />
                        ) : (
                          <span className="text-primary font-display text-lg font-bold">
                            {result.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{result.name}</p>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                          <span>
                            {result.yearPublished ?? t("common.yearUnknown")} ·
                            BGG #{result.bggId}
                          </span>
                          {result.isExpansion ? (
                            <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 font-bold">
                              {t("common.expansion")}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="text-primary ml-auto shrink-0 text-xs font-bold">
                        {t("add.choose")}
                      </span>
                    </button>
                  ))}
                  {!searching && searchError ? (
                    <p className="text-danger py-8 text-center text-sm">
                      {searchError === "unavailable"
                        ? t("add.unavailable")
                        : searchError}
                    </p>
                  ) : null}
                  {!searching &&
                  !searchError &&
                  (hasSearched || cached !== undefined) &&
                  visibleResults.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t("add.resultsHint")}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type SelectedGameFormProps = {
  action: (formData: FormData) => void;
  adding: boolean;
  currency: string;
  destination: "collection" | "wishlist";
  details: BggMetadata | null;
  onChooseAnother: () => void;
  selected: GameDiscoveryResult;
};

/**
 * Editable local details after a trusted discovery result has been selected.
 *
 * @param root0 - Component or function properties.
 * @param root0.action - The 'action' property.
 * @param root0.adding - The 'adding' property.
 * @param root0.currency - The 'currency' property.
 * @param root0.destination - The 'destination' property.
 * @param root0.details - The 'details' property.
 * @param root0.onChooseAnother - The 'onChooseAnother' property.
 * @param root0.selected - The 'selected' property.
 */
function SelectedGameForm({
  action,
  adding,
  currency,
  destination,
  details,
  onChooseAnother,
  selected,
}: SelectedGameFormProps): ReactNode {
  const t = useTranslations();
  return (
    <form action={action} className="space-y-5">
      <input name="destination" type="hidden" value={destination} />
      <input
        name="selectionToken"
        type="hidden"
        value={selected.selectionToken}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <button
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold"
          onClick={onChooseAnother}
          type="button"
        >
          <ArrowLeft className="size-4" /> {t("add.chooseAnother")}
        </button>
        <a
          className="text-primary flex items-center gap-2 text-sm font-bold hover:underline"
          href={selected.bggUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t("add.viewBgg")} <ExternalLink className="size-4" />
        </a>
      </div>

      {details ? null : (
        <p className="border-accent/40 bg-accent/10 rounded-xl border px-4 py-3 text-xs leading-5">
          {t("add.metadataUnavailable")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("add.year")}>
          <input
            className="field-input"
            defaultValue={
              details?.yearPublished ?? selected.yearPublished ?? ""
            }
            max={2200}
            min={1800}
            name="yearPublished"
            placeholder="2019"
            type="number"
          />
        </Field>
        <Field label={t("add.minPlayers")}>
          <input
            className="field-input"
            defaultValue={details?.minPlayers ?? 1}
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
            defaultValue={details?.maxPlayers ?? 4}
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
            defaultValue={details?.minPlaytime ?? 30}
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
            defaultValue={details?.maxPlaytime ?? 60}
            max={10_000}
            min={1}
            name="maxPlaytime"
            required
            type="number"
          />
        </Field>
        <Field label={t("add.complexity")}>
          <input
            className="field-input"
            defaultValue={details?.weight ?? 2.5}
            max={5}
            min={1}
            name="weight"
            step={0.1}
            type="number"
          />
        </Field>
        {destination === "collection" ? (
          <GiftedPriceField className="sm:col-span-3" currency={currency} />
        ) : (
          <>
            <input name="moneySpent" type="hidden" value="0" />
            <input name="gifted" type="hidden" value="false" />
          </>
        )}
      </div>

      <Field label={t("add.categories")}>
        <input
          className="field-input"
          defaultValue={details?.categories.join(", ") ?? ""}
          maxLength={500}
          name="categories"
          placeholder={t("add.categoriesPlaceholder")}
        />
      </Field>
      <Field label={t("add.mechanics")}>
        <input
          className="field-input"
          defaultValue={details?.mechanics.join(", ") ?? ""}
          maxLength={1_000}
          name="mechanics"
          placeholder={t("add.mechanicsPlaceholder")}
        />
      </Field>
      <Field label={t("add.families")}>
        <input
          className="field-input"
          defaultValue={details?.families.join(", ") ?? ""}
          maxLength={1_000}
          name="families"
          placeholder={t("add.familiesPlaceholder")}
        />
      </Field>
      <Field label={t("add.artwork")}>
        <input
          className="field-input"
          defaultValue={details?.imageUrl ?? selected.imageUrl ?? ""}
          maxLength={2_000}
          name="imageUrl"
          placeholder="https://cf.geekdo-images.com/..."
          type="url"
        />
      </Field>
      <Field label={t("add.description")}>
        <textarea
          className="field-input min-h-24 py-3"
          defaultValue={details?.description.slice(0, 2_000) ?? ""}
          maxLength={2_000}
          name="description"
          placeholder={t("add.descriptionPlaceholder")}
          rows={3}
        />
      </Field>
      <div className="flex justify-end border-t pt-5">
        <Button
          aria-label={adding ? t("common.loading") : undefined}
          disabled={adding}
          type="submit"
        >
          {adding ? (
            <AppSpinner className="size-4" label={t("common.loading")} />
          ) : (
            <Plus className="size-4" />
          )}
          {!adding
            ? t(
                destination === "wishlist"
                  ? "wishlist.addSubmit"
                  : "add.submit",
              )
            : null}
        </Button>
      </div>
    </form>
  );
}

type FieldProps = {
  children: React.ReactNode;
  label: string;
};

/**
 * Consistent label wrapper for local game metadata inputs.
 *
 * @param root0 - Component or function properties.
 * @param root0.children - The 'children' property.
 * @param root0.label - The 'label' property.
 */
function Field({ children, label }: FieldProps): ReactNode {
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
