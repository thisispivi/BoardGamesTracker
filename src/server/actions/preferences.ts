"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { isLocale } from "@/i18n/config";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { requireUser } from "@/server/session";

const currencySchema = z.enum([
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "EUR",
  "GBP",
  "JPY",
  "NOK",
  "PLN",
  "SEK",
  "USD",
]);

/** Persists a validated display locale in a same-site cookie. */
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

/** Persists the signed-in user's ISO 4217 display currency. */
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
