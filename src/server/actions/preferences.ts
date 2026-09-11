"use server";

import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { currencySchema, sharingSchema } from "@/core";
import { env } from "@/env";
import { isLocale } from "@/i18n/config";
import { writeAuditEvent } from "@/server/audit";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { revalidateAccountRoutes } from "@/server/revalidate";
import { requireUser } from "@/server/session";
import { createShareToken } from "@/server/sharing";

/**
 * Persists a validated display locale in a same-site cookie.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set("locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

/**
 * Persists the signed-in user's ISO 4217 display currency.
 *
 * Every library page formats prices in this currency, so all of them are
 * revalidated along with the settings page.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function setCurrencyAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const parsed = currencySchema.safeParse(formData.get("currency"));
  if (!parsed.success) {
    return;
  }

  await db
    .update(user)
    .set({ currency: parsed.data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));
  revalidateAccountRoutes();
}

/**
 * Persists which libraries the signed-in user shares, and whether prices show.
 *
 * Unchecked checkboxes are absent from the payload, so every flag is read as an
 * explicit boolean. Enabling sharing mints a token when the account has none;
 * turning everything off clears it, which permanently breaks any old link.
 *
 * @param formData - The submitted form data.
 * @returns A promise that resolves when the operation completes.
 */
export async function setSharingAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const parsed = sharingSchema.safeParse({
    shareCollection: formData.get("shareCollection") === "on",
    sharePrices: formData.get("sharePrices") === "on",
    shareWishlist: formData.get("shareWishlist") === "on",
  });
  if (!parsed.success) {
    return;
  }

  const sharesAnything =
    parsed.data.shareCollection || parsed.data.shareWishlist;
  await db
    .update(user)
    .set({
      ...parsed.data,
      shareToken: sharesAnything
        ? sql`coalesce(${user.shareToken}, ${createShareToken()})`
        : null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));
  await writeAuditEvent({
    actorId: session.user.id,
    action: "settings.sharing_updated",
    targetType: "user",
    targetId: session.user.id,
    metadata: parsed.data,
  });
  revalidatePath("/settings");
}

/**
 * Returns the current sharing token, creating one for an already shared library.
 *
 * An account that already holds a token is answered by a read, so repeatedly
 * copying a link does not rewrite the row. Creation stays a single conditional
 * statement, so two concurrent callers cannot mint two tokens.
 *
 * @returns The active sharing token, or null when sharing is disabled.
 */
export async function getShareTokenAction(): Promise<string | null> {
  const session = await requireUser();
  const [current] = await db
    .select({
      shareCollection: user.shareCollection,
      shareToken: user.shareToken,
      shareWishlist: user.shareWishlist,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!current || (!current.shareCollection && !current.shareWishlist)) {
    return null;
  }
  if (current.shareToken) return current.shareToken;

  const token = createShareToken();
  const [updated] = await db
    .update(user)
    .set({
      shareToken: sql`coalesce(${user.shareToken}, ${token})`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(user.id, session.user.id),
        or(eq(user.shareCollection, true), eq(user.shareWishlist, true)),
      ),
    )
    .returning({ shareToken: user.shareToken });
  if (!updated) return null;
  if (updated.shareToken !== token) return updated.shareToken;
  await writeAuditEvent({
    actorId: session.user.id,
    action: "settings.share_token_created",
    targetType: "user",
    targetId: session.user.id,
  });
  revalidatePath("/settings");
  return token;
}

/**
 * Replaces the share token, revoking every link handed out so far.
 *
 * An account that shares nothing holds no token, so rotation only applies to
 * an account that is actually sharing a library.
 *
 * @returns The new token, or null when the account is not sharing anything.
 */
export async function regenerateShareTokenAction(): Promise<string | null> {
  const session = await requireUser();
  const [updated] = await db
    .update(user)
    .set({ shareToken: createShareToken(), updatedAt: new Date() })
    .where(
      and(
        eq(user.id, session.user.id),
        or(eq(user.shareCollection, true), eq(user.shareWishlist, true)),
      ),
    )
    .returning({ shareToken: user.shareToken });
  if (!updated) {
    return null;
  }

  await writeAuditEvent({
    actorId: session.user.id,
    action: "settings.share_token_rotated",
    targetType: "user",
    targetId: session.user.id,
  });
  revalidatePath("/settings");
  return updated.shareToken;
}
