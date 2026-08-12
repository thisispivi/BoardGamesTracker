"use client";

import { Check, Copy, RefreshCw, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  getShareTokenAction,
  regenerateShareTokenAction,
  setSharingAction,
} from "@/server/actions/preferences";

/** Public-library settings currently persisted for the account. */
type SharingState = {
  collection: boolean;
  prices: boolean;
  wishlist: boolean;
};

/** Public URL and sharing settings displayed by the account card. */
type SharingCardProps = {
  appUrl: string;
  shareCollection: boolean;
  sharePrices: boolean;
  shareToken: string | null;
  shareWishlist: boolean;
};

/** Accessible label, description, and state for one sharing option. */
type ShareToggleProps = {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

/**
 * One labelled sharing switch with its explanatory help text.
 *
 * @param root0 - Properties that configure share toggle.
 * @param root0.checked - Whether the sharing option is enabled.
 * @param root0.description - Localized explanatory text shown to the user.
 * @param root0.disabled - Whether the control must reject interaction.
 * @param root0.label - Localized label displayed by the control.
 * @param root0.onChange - Callback invoked with the next checked state.
 * @returns The rendered share toggle.
 */
function ShareToggle({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: ShareToggleProps): ReactNode {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${disabled ? "opacity-55" : "hover:bg-muted/50 cursor-pointer"}`}
    >
      <input
        checked={checked}
        className="accent-primary mt-0.5 size-4 shrink-0"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="text-muted-foreground block text-xs leading-5">
          {description}
        </span>
      </span>
    </label>
  );
}

/**
 * Opt-in controls for publishing a collection, a wishlist, and their prices.
 *
 * @param root0 - Properties that configure sharing card.
 * @param root0.appUrl - Public base URL used to build the sharing link.
 * @param root0.shareCollection - Whether owned games are visible on the public page.
 * @param root0.sharePrices - Whether monetary values are visible on the public page.
 * @param root0.shareToken - Opaque token identifying the public sharing page.
 * @param root0.shareWishlist - Whether wishlist games are visible on the public page.
 * @returns The rendered sharing card.
 */
export function SharingCard({
  appUrl,
  shareCollection,
  sharePrices,
  shareToken,
  shareWishlist,
}: SharingCardProps): ReactNode {
  const [sharing, setSharing] = useState<SharingState>({
    collection: shareCollection,
    prices: sharePrices,
    wishlist: shareWishlist,
  });
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(shareToken);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  const shareUrl = token ? `${appUrl}/share/${token}` : "";
  const sharesAnything = sharing.collection || sharing.wishlist;

  /**
   * Saves every switch together so prices can never outlive what they describe.
   *
   * @param next - The switch positions to persist.
   * @returns Nothing.
   */
  function save(next: SharingState): void {
    const prices = (next.collection || next.wishlist) && next.prices;
    setSharing({ ...next, prices });
    const formData = new FormData();
    if (next.collection) formData.set("shareCollection", "on");
    if (next.wishlist) formData.set("shareWishlist", "on");
    if (prices) formData.set("sharePrices", "on");
    startTransition(async () => {
      await setSharingAction(formData);
      router.refresh();
      toast.success(t("sharing.updated"));
    });
  }

  /**
   * Rotates the token, invalidating every link already handed out.
   *
   * @returns Nothing.
   */
  function regenerate(): void {
    startTransition(async () => {
      const updatedToken = await regenerateShareTokenAction();
      setToken(updatedToken);
      router.refresh();
      toast.success(t("sharing.regenerated"));
    });
  }

  /**
   * Copies the sharing link, reporting a denied clipboard rather than failing.
   *
   * @returns Nothing.
   */
  function copyLink(): void {
    startTransition(async () => {
      try {
        const resolvedToken = token ?? (await getShareTokenAction());
        if (!resolvedToken) {
          toast.error(t("sharing.copyFailed"));
          return;
        }
        await navigator.clipboard.writeText(`${appUrl}/share/${resolvedToken}`);
        setToken(resolvedToken);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2_000);
      } catch {
        toast.error(t("sharing.copyFailed"));
      }
    });
  }

  return (
    <section
      aria-busy={pending}
      className="bg-card shadow-soft relative overflow-hidden rounded-3xl border p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="bg-primary/7 pointer-events-none absolute -top-16 -right-12 size-56 rounded-full blur-2xl"
      />
      <div className="relative flex flex-col gap-6">
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

        <div className="grid gap-3 lg:grid-cols-3">
          <ShareToggle
            checked={sharing.collection}
            description={t("sharing.shareCollectionHelp")}
            label={t("sharing.shareCollection")}
            onChange={(checked) => save({ ...sharing, collection: checked })}
          />
          <ShareToggle
            checked={sharing.wishlist}
            description={t("sharing.shareWishlistHelp")}
            label={t("sharing.shareWishlist")}
            onChange={(checked) => save({ ...sharing, wishlist: checked })}
          />
          <ShareToggle
            checked={sharing.prices}
            description={t("sharing.sharePricesHelp")}
            disabled={!sharesAnything}
            label={t("sharing.sharePrices")}
            onChange={(checked) => save({ ...sharing, prices: checked })}
          />
        </div>

        {sharesAnything ? (
          <div className="flex flex-col gap-3 border-t pt-5">
            <p className="text-muted-foreground text-xs leading-5">
              {t("sharing.linkWarning")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {shareUrl ? (
                <code className="bg-muted min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-xs">
                  {shareUrl}
                </code>
              ) : null}
              <button
                className="hover:bg-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition"
                disabled={pending}
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
              <button
                className="hover:bg-muted flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition"
                disabled={pending}
                onClick={regenerate}
                type="button"
              >
                <RefreshCw className="size-3.5" />
                {t("sharing.regenerate")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
