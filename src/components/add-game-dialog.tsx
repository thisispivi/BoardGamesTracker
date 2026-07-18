"use client";

import {
  ArrowLeft,
  ExternalLink,
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import {
  addGameAction,
  type CollectionActionState,
} from "@/server/actions/collection";
import type { GameDiscoveryResult } from "@/server/discovery/types";

const initialState: CollectionActionState = { success: false, message: "" };

/** Search-first dialog for adding a game to the collection or wishlist. */
export function AddGameDialog({
  currency,
  destination = "collection",
}: {
  currency: string;
  destination?: "collection" | "wishlist";
}) {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameDiscoveryResult[]>([]);
  const [selected, setSelected] = useState<GameDiscoveryResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [state, action, adding] = useActionState(addGameAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.success) {
      toast.success(state.message);
      router.refresh();
      const timeout = window.setTimeout(() => {
        setOpen(false);
        setSelected(null);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    toast.error(state.message);
  }, [router, state]);

  /** Queries the authenticated SearXNG discovery proxy. */
  async function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (query.trim().length < 2) {
      return;
    }

    setSearching(true);
    setResults([]);
    try {
      const response = await fetch(
        `/api/games/search?q=${encodeURIComponent(query.trim())}`,
      );
      const payload = (await response.json()) as {
        results?: GameDiscoveryResult[];
        error?: string;
      };
      if (!response.ok) {
        toast.error(payload.error ?? t("add.searchFailed"));
        return;
      }
      setResults(payload.results ?? []);
    } catch {
      toast.error(t("add.unavailable"));
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {t(destination === "wishlist" ? "wishlist.add" : "add.button")}
      </Button>
      {open && (
        <div
          className="modal-overlay fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <section
            className="modal-content bg-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border p-6 shadow-2xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-labelledby="add-game-title"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-primary text-xs font-bold tracking-widest uppercase">
                  {t("add.eyebrow")}
                </p>
                <h2
                  id="add-game-title"
                  className="font-display mt-1 text-2xl font-bold"
                >
                  {selected ? selected.name : t("add.findTitle")}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {selected ? t("add.selectedBody") : t("add.searchBody")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:bg-muted rounded-full p-2"
                aria-label={t("common.close")}
              >
                <X className="size-5" />
              </button>
            </div>

            {selected ? (
              <form action={action} className="mt-7 space-y-5">
                <input type="hidden" name="destination" value={destination} />
                <input
                  type="hidden"
                  name="selectionToken"
                  value={selected.selectionToken}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
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
                    <Field label={t("edit.money", { currency })}>
                      <input
                        name="moneySpent"
                        type="number"
                        min={0}
                        max={999_999_999.99}
                        step="0.01"
                        defaultValue={0}
                        required
                        className="field-input"
                      />
                    </Field>
                  ) : (
                    <input type="hidden" name="moneySpent" value="0" />
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
                  <Button type="submit" disabled={adding}>
                    {adding ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {t(
                      destination === "wishlist"
                        ? "wishlist.addSubmit"
                        : "add.submit",
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSearch} className="mt-6 flex gap-2">
                  <label className="relative flex-1">
                    <span className="sr-only">{t("add.gameTitle")}</span>
                    <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      minLength={2}
                      maxLength={80}
                      required
                      autoFocus
                      className="bg-background h-12 w-full rounded-xl border pr-4 pl-11"
                      placeholder={t("add.searchPlaceholder")}
                    />
                  </label>
                  <Button type="submit" disabled={searching}>
                    {searching ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      t("add.search")
                    )}
                  </Button>
                </form>
                <div className="mt-5 space-y-2">
                  {results.map((result) => (
                    <button
                      key={result.bggId}
                      type="button"
                      onClick={() => setSelected(result)}
                      className="hover:bg-muted/60 flex w-full items-center gap-4 rounded-xl border p-3 text-left transition"
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
                  {!searching && results.length === 0 && query.length >= 2 && (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {t("add.resultsHint")}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
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
