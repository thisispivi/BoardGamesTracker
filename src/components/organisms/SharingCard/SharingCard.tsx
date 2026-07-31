"use client";

import { Check, Copy, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import { setSharingAction } from "@/server/actions/preferences";

type SharingCardProps = {
  shareCollection: boolean;
  sharePrices: boolean;
  shareUrl: string;
};

/**
 * Opt-in controls for publishing a collection and its recorded prices.
 *
 * @param root0 - Component or function properties.
 * @param root0.shareCollection - The 'shareCollection' property.
 * @param root0.sharePrices - The 'sharePrices' property.
 * @param root0.shareUrl - The 'shareUrl' property.
 * @returns The documented function result.
 */
export function SharingCard({
  shareCollection,
  sharePrices,
  shareUrl,
}: SharingCardProps): ReactNode {
  const [shared, setShared] = useState(shareCollection);
  const [prices, setPrices] = useState(sharePrices);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();

  /**
   * Saves both flags together so price sharing can never outlive sharing.
   *
   * @param nextShared - Whether the collection is published at all.
   * @param nextPrices - Whether recorded prices are included.
   */
  function save(nextShared: boolean, nextPrices: boolean): void {
    const pricesShared = nextShared && nextPrices;
    setShared(nextShared);
    setPrices(pricesShared);
    const formData = new FormData();
    if (nextShared) formData.set("shareCollection", "on");
    if (pricesShared) formData.set("sharePrices", "on");
    startTransition(async () => {
      await setSharingAction(formData);
      router.refresh();
      toast.success(t("sharing.updated"));
    });
  }

  /** Copies the sharing link, falling back silently on denied clipboards. */
  function copyLink(): void {
    void navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2_000);
      })
      .catch(() => toast.error(t("sharing.copyFailed")));
  }

  return (
    <section
      aria-busy={pending}
      className="bg-card shadow-soft relative overflow-hidden rounded-3xl border p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="bg-primary/7 absolute -top-16 -right-12 size-56 rounded-full blur-2xl"
      />
      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-start gap-4">
          <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
            <Share2 className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">
              {t("sharing.title")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-5">
              {t("sharing.body")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition">
            <input
              checked={shared}
              className="accent-primary mt-0.5 size-4 shrink-0"
              onChange={(event) => save(event.target.checked, prices)}
              type="checkbox"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                {t("sharing.shareCollection")}
              </span>
              <span className="text-muted-foreground block text-xs leading-5">
                {t("sharing.shareCollectionHelp")}
              </span>
            </span>
          </label>

          <label
            className={`flex items-start gap-3 rounded-2xl border p-4 transition ${shared ? "hover:bg-muted/50 cursor-pointer" : "opacity-55"}`}
          >
            <input
              checked={prices}
              className="accent-primary mt-0.5 size-4 shrink-0"
              disabled={!shared}
              onChange={(event) => save(shared, event.target.checked)}
              type="checkbox"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                {t("sharing.sharePrices")}
              </span>
              <span className="text-muted-foreground block text-xs leading-5">
                {t("sharing.sharePricesHelp")}
              </span>
            </span>
          </label>
        </div>

        {shared ? (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-5">
            <code className="bg-muted min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-xs">
              {shareUrl}
            </code>
            <button
              className="hover:bg-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition"
              onClick={copyLink}
              type="button"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? t("sharing.copied") : t("sharing.copy")}
            </button>
            <Link
              className="text-primary px-2 py-2 text-xs font-bold hover:underline"
              href="/share"
            >
              {t("sharing.browse")}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
