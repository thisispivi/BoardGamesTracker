"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  type CollectionActionState,
  gameMetadataSchema,
  itemIdSchema,
} from "@/core";
import { writeAuditEvent } from "@/server/audit";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/**
 * Splits and deduplicates comma-separated taxonomy labels.
 *
 * @param value - The raw comma-separated input.
 * @returns Bounded, trimmed, unique labels.
 */
function parseLabels(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  ].slice(0, 50);
}

/**
 * Revalidates every route that renders shared game metadata.
 *
 * @returns The documented function result.
 */
function revalidateGameViews(): void {
  revalidatePath("/admin/games");
  revalidatePath("/collection");
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/play");
}

/**
 * Applies administrator corrections to one shared game record.
 *
 * @param _previous - The previous server-action state.
 * @param formData - The submitted form data.
 * @returns The documented function result.
 */
export async function updateGameMetadataAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations();
  const parsed = gameMetadataSchema.safeParse({
    bggRating: formData.get("bggRating") || null,
    categories: formData.get("categories") ?? "",
    description: formData.get("description") ?? "",
    families: formData.get("families") ?? "",
    gameId: formData.get("gameId"),
    isExpansion: formData.get("isExpansion") ?? "false",
    maxPlayers: formData.get("maxPlayers"),
    maxPlaytime: formData.get("maxPlaytime"),
    mechanics: formData.get("mechanics") ?? "",
    minPlayers: formData.get("minPlayers"),
    minPlaytime: formData.get("minPlaytime"),
    name: formData.get("name"),
    weight: formData.get("weight") || null,
    yearPublished: formData.get("yearPublished") || null,
  });
  if (!parsed.success || parsed.data.maxPlayers < parsed.data.minPlayers) {
    return { success: false, message: t("action.checkDetails") };
  }

  const { gameId, categories, mechanics, families, ...values } = parsed.data;
  const [updated] = await db
    .update(games)
    .set({
      ...values,
      categories: parseLabels(categories),
      families: parseLabels(families),
      mechanics: parseLabels(mechanics),
      updatedAt: new Date(),
    })
    .where(eq(games.id, gameId))
    .returning({ id: games.id, bggId: games.bggId });
  if (!updated) {
    return { success: false, message: t("action.itemMissing") };
  }

  await writeAuditEvent({
    actorId: session.user.id,
    action: "admin.game_metadata_updated",
    targetType: "game",
    targetId: updated.id,
    metadata: { bggId: updated.bggId },
  });
  revalidateGameViews();
  return { success: true, message: t("adminGames.saved") };
}

/**
 * Re-reads one game's details from BoardGameGeek and overwrites the record.
 *
 * This repairs games that were saved while BoardGameGeek was unreachable and
 * therefore stored the add form's generic placeholder values.
 *
 * @param _previous - The previous server-action state.
 * @param formData - The submitted form data.
 * @returns The documented function result.
 */
export async function refreshGameFromBggAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireAdmin();
  const t = await getTranslations();
  const gameId = itemIdSchema.safeParse(formData.get("gameId"));
  if (!gameId.success) {
    return { success: false, message: t("action.itemMissing") };
  }

  const [record] = await db
    .select({ bggId: games.bggId })
    .from(games)
    .where(eq(games.id, gameId.data))
    .limit(1);
  if (!record) {
    return { success: false, message: t("action.itemMissing") };
  }

  const metadata = (
    await scrapeBggMetadata([record.bggId]).catch(() => new Map())
  ).get(record.bggId);
  if (!metadata) {
    return { success: false, message: t("adminGames.refreshFailed") };
  }

  await db
    .update(games)
    .set({
      bggRating: metadata.bggRating,
      categories: metadata.categories,
      description: metadata.description,
      families: metadata.families,
      isExpansion: metadata.isExpansion,
      maxPlayers: metadata.maxPlayers,
      maxPlaytime: metadata.maxPlaytime,
      mechanics: metadata.mechanics,
      minPlayers: metadata.minPlayers,
      minPlaytime: metadata.minPlaytime,
      name: metadata.name,
      updatedAt: new Date(),
      weight: metadata.weight,
      yearPublished: metadata.yearPublished,
    })
    .where(eq(games.id, gameId.data));
  await writeAuditEvent({
    actorId: session.user.id,
    action: "admin.game_refreshed_from_bgg",
    targetType: "game",
    targetId: gameId.data,
    metadata: { bggId: record.bggId },
  });
  revalidateGameViews();
  return { success: true, message: t("adminGames.refreshed") };
}
