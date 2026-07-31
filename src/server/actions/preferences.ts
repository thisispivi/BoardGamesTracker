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
 * Persists whether the signed-in user shares their collection, and its prices.
 *
 * Unchecked checkboxes are absent from the payload, so both flags are read as
 * explicit booleans and price sharing is forced off whenever sharing is off.
 *
 * @param formData - The submitted form data.
 * @returns The documented function result.
 */
export async function setSharingAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const parsed = sharingSchema.safeParse({
    shareCollection: formData.get("shareCollection") === "on",
    sharePrices: formData.get("sharePrices") === "on",
  });
  if (!parsed.success) {
    return;
  }

  await db
    .update(user)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));
  await writeAuditEvent({
    actorId: session.user.id,
    action: "settings.sharing_updated",
    targetType: "user",
    targetId: session.user.id,
    metadata: parsed.data,
  });
  revalidatePath("/settings");
  revalidatePath("/share");
}
