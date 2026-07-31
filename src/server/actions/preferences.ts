"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { currencySchema, sharingSchema } from "@/core";
import { isLocale } from "@/i18n/config";
import { writeAuditEvent } from "@/server/audit";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { requireUser } from "@/server/session";
import { createShareToken } from "@/server/sharing";

/**
 * Persists a validated display locale in a same-site cookie.
 *
 * @param formData - The submitted form data.
 * @returns The documented function result.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) {
    return;
  }

  (await cookies()).set("locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

/**
 * Persists the signed-in user's ISO 4217 display currency.
 *
 * @param formData - The submitted form data.
 * @returns The documented function result.
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
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Persists which libraries the signed-in user shares, and whether prices show.
 *
 * Unchecked checkboxes are absent from the payload, so every flag is read as an
 * explicit boolean. Enabling sharing mints a token when the account has none;
 * turning everything off clears it, which permanently breaks any old link.
 *
 * @param formData - The submitted form data.
 * @returns The documented function result.
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
  const [current] = await db
    .select({ shareToken: user.shareToken })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  await db
    .update(user)
    .set({
      ...parsed.data,
      shareToken: sharesAnything
        ? (current?.shareToken ?? createShareToken())
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
 * Replaces the share token, revoking every link handed out so far.
 *
 * @returns The documented function result.
 */
export async function regenerateShareTokenAction(): Promise<void> {
  const session = await requireUser();
  const [updated] = await db
    .update(user)
    .set({ shareToken: createShareToken(), updatedAt: new Date() })
    .where(eq(user.id, session.user.id))
    .returning({ id: user.id });
  if (!updated) {
    return;
  }

  await writeAuditEvent({
    actorId: session.user.id,
    action: "settings.share_token_rotated",
    targetType: "user",
    targetId: session.user.id,
  });
  revalidatePath("/settings");
}
