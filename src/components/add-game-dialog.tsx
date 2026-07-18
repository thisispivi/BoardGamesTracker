"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ExternalLink, Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "next-intl";
import { GiftedPriceField } from "@/components/gifted-price-field";
import { Button } from "@/components/ui/button";
import { AppSpinner } from "@/components/ui/app-spinner";
import {
  addGameAction,
  type CollectionActionState,
} from "@/server/actions/collection";
import type { GameDiscoveryResult } from "@/server/discovery/types";

const initialState: CollectionActionState = { success: false, message: "" };

/** Debounced search dialog for adding a title or pasted BGG game URL. */
export function AddGameDialog({
  currency,
  destination = "collection",
}: {
  currency: string;
  destination?: "collection" | "wishlist";
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameDiscoveryResult[]>([]);
  const [selected, setSelected] = useState<GameDiscoveryResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [state, action, adding] = useActionState(addGameAction, initialState);
  const router = useRouter();

  /** Resets ephemeral search state whenever the dialog is dismissed. */
  function changeOpen(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setSearching(false);
      setHasSearched(false);
      setSearchError(null);
    }
  }

  /** Clears stale discovery state immediately while the user keeps typing. */
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
    const term = query.trim();
    if (!open || selected || term.length < 3) {
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
          setResults(payload.results ?? []);
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
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query, selected]);

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
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
                type="button"
                className="hover:bg-muted grid size-10 shrink-0 place-items-center rounded-full transition"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </header>

          <div className="modal-scroll-area min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            {selected ? (
              <SelectedGameForm
                action={action}
                adding={adding}
                currency={currency}
                destination={destination}
                selected={selected}
                onChooseAnother={() => setSelected(null)}
              />
            ) : (
              <div>
                <label className="relative block">
                  <span className="sr-only">{t("add.gameTitle")}</span>
                  <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(event) => changeQuery(event.target.value)}
                    minLength={3}
                    maxLength={500}
                    autoFocus
                    className="bg-background focus:ring-primary/20 h-12 w-full rounded-xl border pr-12 pl-11 transition focus:ring-4 focus:outline-none"
                    placeholder={t("add.searchPlaceholder")}
                  />
                  {searching && (
                    <AppSpinner
                      className="absolute top-[calc(50%-0.5rem)] right-4 size-4"
                      label={t("common.loading")}
                    />
                  )}
                </label>

                <div className="mt-5 space-y-2" aria-live="polite">
                  {results.map((result) => (
                    <button
                      key={result.bggId}
                      type="button"
                      onClick={() => setSelected(result)}
                      className="hover:bg-muted/60 focus:ring-primary/20 flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition focus:ring-4 focus:outline-none"
                    >
                      <span className="bg-muted relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl">
                        {result.imageUrl ? (
                          <Image
                            src={result.imageUrl}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-primary font-display text-lg font-bold">
                            {result.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{result.name}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {result.yearPublished ?? t("common.yearUnknown")} ·
                          BGG #{result.bggId}
                        </p>
                      </div>
                      <span className="text-primary ml-auto shrink-0 text-xs font-bold">
                        {t("add.choose")}
                      </span>
                    </button>
                  ))}
                  {!searching && searchError && (
                    <p className="text-danger py-8 text-center text-sm">
                      {searchError === "unavailable"
                        ? t("add.unavailable")
                        : searchError}
                    </p>
                  )}
                  {!searching &&
                    !searchError &&
                    hasSearched &&
                    results.length === 0 && (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        {t("add.resultsHint")}
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Editable local details after a trusted discovery result has been selected. */
function SelectedGameForm({
  action,
  adding,
  currency,
  destination,
  onChooseAnother,
  selected,
}: {
  action: (formData: FormData) => void;
  adding: boolean;
  currency: string;
  destination: "collection" | "wishlist";
  onChooseAnother: () => void;
  selected: GameDiscoveryResult;
}) {
  const t = useTranslations();
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="destination" value={destination} />
      <input
        type="hidden"
        name="selectionToken"
        value={selected.selectionToken}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <button
          type="button"
          onClick={onChooseAnother}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-bold"
        >
          <ArrowLeft className="size-4" /> {t("add.chooseAnother")}
        </button>
        <a
          href={selected.bggUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary flex items-center gap-2 text-sm font-bold hover:underline"
        >
          {t("add.viewBgg")} <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("add.year")}>
          <input
            name="yearPublished"
            type="number"
            min={1800}
            max={2200}
            defaultValue={selected.yearPublished ?? ""}
            className="field-input"
            placeholder="2019"
          />
        </Field>
        <Field label={t("add.minPlayers")}>
          <input
            name="minPlayers"
            type="number"
            min={1}
            max={99}
            defaultValue={1}
            required
            className="field-input"
          />
        </Field>
        <Field label={t("add.maxPlayers")}>
          <input
            name="maxPlayers"
            type="number"
            min={1}
            max={99}
            defaultValue={4}
            required
            className="field-input"
          />
        </Field>
        <Field label={t("add.minMinutes")}>
          <input
            name="minPlaytime"
            type="number"
            min={0}
            max={10_000}
            defaultValue={30}
            required
            className="field-input"
          />
        </Field>
        <Field label={t("add.maxMinutes")}>
          <input
            name="maxPlaytime"
            type="number"
            min={1}
            max={10_000}
            defaultValue={60}
            required
            className="field-input"
          />
        </Field>
        <Field label={t("add.complexity")}>
          <input
            name="weight"
            type="number"
            min={1}
            max={5}
            step={0.1}
            defaultValue={2.5}
            className="field-input"
          />
        </Field>
        {destination === "collection" ? (
          <GiftedPriceField className="sm:col-span-3" currency={currency} />
        ) : (
          <>
            <input type="hidden" name="moneySpent" value="0" />
            <input type="hidden" name="gifted" value="false" />
          </>
        )}
      </div>

      <Field label={t("add.categories")}>
        <input
          name="categories"
          maxLength={500}
          className="field-input"
          placeholder={t("add.categoriesPlaceholder")}
        />
      </Field>
      <Field label={t("add.mechanics")}>
        <input
          name="mechanics"
          maxLength={1_000}
          className="field-input"
          placeholder={t("add.mechanicsPlaceholder")}
        />
      </Field>
      <Field label={t("add.families")}>
        <input
          name="families"
          maxLength={1_000}
          className="field-input"
          placeholder={t("add.familiesPlaceholder")}
        />
      </Field>
      <Field label={t("add.artwork")}>
        <input
          name="imageUrl"
          type="url"
          maxLength={2_000}
          defaultValue={selected.imageUrl ?? ""}
          className="field-input"
          placeholder="https://cf.geekdo-images.com/..."
        />
      </Field>
      <Field label={t("add.description")}>
        <textarea
          name="description"
          maxLength={2_000}
          rows={3}
          className="field-input min-h-24 py-3"
          placeholder={t("add.descriptionPlaceholder")}
        />
      </Field>
      <div className="flex justify-end border-t pt-5">
        <Button
          type="submit"
          disabled={adding}
          aria-label={adding ? t("common.loading") : undefined}
        >
          {adding ? (
            <AppSpinner className="size-4" label={t("common.loading")} />
          ) : (
            <Plus className="size-4" />
          )}
          {!adding &&
            t(destination === "wishlist" ? "wishlist.addSubmit" : "add.submit")}
        </Button>
      </div>
    </form>
  );
}

/** Consistent label wrapper for local game metadata inputs. */
function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
