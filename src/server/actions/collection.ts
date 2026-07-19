"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import {
  type BggMetadata,
  type CollectionActionState,
  editCollectionItemSchema,
  gameDetailsSchema,
  type GameSelection,
  giftedSchema,
  itemIdSchema,
  libraryDestinationSchema,
} from "@/core";
import { writeAuditEvent } from "@/server/audit";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { db } from "@/server/db";
import { collectionItems, gameImages, games } from "@/server/db/schema";
import { discoverBoardGameImages } from "@/server/discovery/searxng";
import { verifySelectionToken } from "@/server/discovery/selectionToken";
import { downloadBggImage, downloadBggImages } from "@/server/images/bggImage";
import { parseBggCollectionCsv } from "@/server/import/bggCsv";
import { requireUser } from "@/server/session";
import { CLEAR_COLLECTION_CONFIRMATION } from "@/utils/collectionConfirmation";
import { hasExpansionCategory } from "@/utils/gameTaxonomy";

type LocalGameDetails = z.infer<typeof gameDetailsSchema>;

/** Splits and deduplicates user-maintained taxonomy labels. */
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

/** Inserts or refreshes user-supplied local metadata and returns the game ID. */
async function upsertGame(
  selection: GameSelection,
  details: LocalGameDetails,
  metadata?: BggMetadata,
): Promise<{ id: string; imageCached: boolean }> {
  const categories = parseLabels(details.categories);
  const mechanics = parseLabels(details.mechanics);
  const families = parseLabels(details.families);
  const sourceUrl =
    metadata?.imageUrl ?? details.imageUrl ?? selection.imageUrl;
  const image = sourceUrl
    ? await downloadBggImage(sourceUrl).catch(() => null)
    : null;
  const values = {
    bggId: selection.bggId,
    name: metadata?.name ?? selection.name,
    description: metadata?.description || details.description,
    imageUrl: sourceUrl,
    thumbnailUrl: sourceUrl,
    imageChecksum: image?.checksum ?? null,
    yearPublished:
      metadata?.yearPublished ??
      details.yearPublished ??
      selection.yearPublished,
    minPlayers: metadata?.minPlayers ?? details.minPlayers,
    maxPlayers: metadata?.maxPlayers ?? details.maxPlayers,
    minPlaytime: metadata?.minPlaytime ?? details.minPlaytime,
    maxPlaytime: metadata?.maxPlaytime ?? details.maxPlaytime,
    weight: metadata?.weight ?? details.weight,
    bggRating: metadata?.bggRating ?? null,
    isExpansion: metadata?.isExpansion ?? hasExpansionCategory(categories),
    categories: metadata?.categories.length ? metadata.categories : categories,
    mechanics: metadata?.mechanics.length ? metadata.mechanics : mechanics,
    families: metadata?.families.length ? metadata.families : families,
    updatedAt: new Date(),
  };
  const record = await db.transaction(async (transaction) => {
    if (image) {
      await transaction.insert(gameImages).values(image).onConflictDoNothing({
        target: gameImages.checksum,
      });
    }
    const [saved] = await transaction
      .insert(games)
      .values(values)
      .onConflictDoUpdate({
        target: games.bggId,
        set: {
          ...values,
          categories: sql`case when jsonb_array_length(excluded.categories) > 0 then excluded.categories else ${games.categories} end`,
          mechanics: sql`case when jsonb_array_length(excluded.mechanics) > 0 then excluded.mechanics else ${games.mechanics} end`,
          families: sql`case when jsonb_array_length(excluded.families) > 0 then excluded.families else ${games.families} end`,
          imageChecksum: sql`coalesce(excluded.image_checksum, ${games.imageChecksum})`,
        },
      })
      .returning({ id: games.id });
    return saved;
  });

  if (!record) {
    throw new Error("The game could not be saved.");
  }

  return { id: record.id, imageCached: Boolean(image) };
}

/** Imports owned games from a bounded official BoardGameGeek CSV export. */
export async function importBggCsvAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireUser();
  const t = await getTranslations();
  const file = formData.get("collection");
  if (
    !(file instanceof File) ||
    !file.name.toLowerCase().endsWith(".csv") ||
    file.size === 0 ||
    file.size > 5 * 1024 * 1024
  ) {
    return {
      success: false,
      message: t("action.chooseCsv"),
    };
  }

  let imported;
  try {
    imported = parseBggCollectionCsv(await file.text());
  } catch {
    return {
      success: false,
      message: t("action.invalidCsv"),
    };
  }
  if (imported.games.length === 0) {
    return {
      success: false,
      message: t("action.noOwned"),
    };
  }

  const metadataById = await scrapeBggMetadata(
    imported.games.map((game) => game.bggId),
  ).catch(() => new Map<number, BggMetadata>());
  const artwork = await discoverBoardGameImages(
    imported.games.map((game) => ({
      bggId: game.bggId,
      name: game.name,
    })),
  ).catch(() => new Map<number, string>());
  for (const [bggId, metadata] of metadataById) {
    if (metadata.imageUrl) {
      artwork.set(bggId, metadata.imageUrl);
    }
  }
  const cachedArtwork = await downloadBggImages(artwork);
  const now = new Date();
  await db.transaction(async (transaction) => {
    const uniqueImages = [
      ...new Map(
        [...cachedArtwork.values()].map((image) => [image.checksum, image]),
      ).values(),
    ];
    if (uniqueImages.length > 0) {
      await transaction
        .insert(gameImages)
        .values(uniqueImages)
        .onConflictDoNothing({ target: gameImages.checksum });
    }
    const savedGames = await transaction
      .insert(games)
      .values(
        imported.games.map((game) => {
          const metadata = metadataById.get(game.bggId);
          return {
            bggId: game.bggId,
            name: metadata?.name ?? game.name,
            description: metadata?.description ?? "",
            imageUrl: artwork.get(game.bggId) ?? null,
            thumbnailUrl: artwork.get(game.bggId) ?? null,
            imageChecksum: cachedArtwork.get(game.bggId)?.checksum ?? null,
            yearPublished: metadata?.yearPublished ?? game.yearPublished,
            minPlayers: metadata?.minPlayers ?? game.minPlayers,
            maxPlayers: metadata?.maxPlayers ?? game.maxPlayers,
            minPlaytime: metadata?.minPlaytime ?? game.minPlaytime,
            maxPlaytime: metadata?.maxPlaytime ?? game.maxPlaytime,
            weight: metadata?.weight ?? game.weight,
            bggRating: metadata?.bggRating ?? game.bggRating,
            isExpansion: metadata?.isExpansion ?? game.isExpansion,
            categories: metadata?.categories.length
              ? metadata.categories
              : game.categories,
            mechanics: metadata?.mechanics ?? [],
            families: metadata?.families ?? [],
            updatedAt: now,
          };
        }),
      )
      .onConflictDoUpdate({
        target: games.bggId,
        set: {
          name: sql`excluded.name`,
          description: sql`coalesce(nullif(excluded.description, ''), ${games.description})`,
          imageUrl: sql`coalesce(excluded.image_url, ${games.imageUrl})`,
          thumbnailUrl: sql`coalesce(excluded.thumbnail_url, ${games.thumbnailUrl})`,
          imageChecksum: sql`coalesce(excluded.image_checksum, ${games.imageChecksum})`,
          yearPublished: sql`excluded.year_published`,
          minPlayers: sql`excluded.min_players`,
          maxPlayers: sql`excluded.max_players`,
          minPlaytime: sql`excluded.min_playtime`,
          maxPlaytime: sql`excluded.max_playtime`,
          weight: sql`excluded.weight`,
          bggRating: sql`excluded.bgg_rating`,
          isExpansion: sql`excluded.is_expansion`,
          categories: sql`case when jsonb_array_length(excluded.categories) > 0 then excluded.categories else ${games.categories} end`,
          mechanics: sql`case when jsonb_array_length(excluded.mechanics) > 0 then excluded.mechanics else ${games.mechanics} end`,
          families: sql`case when jsonb_array_length(excluded.families) > 0 then excluded.families else ${games.families} end`,
          updatedAt: now,
        },
      })
      .returning({ bggId: games.bggId, id: games.id });
    const ids = new Map(savedGames.map((game) => [game.bggId, game.id]));

    await transaction
      .insert(collectionItems)
      .values(
        imported.games.map((game) => ({
          userId: session.user.id,
          gameId: ids.get(game.bggId)!,
          owned: true,
          wishlist: false,
          personalRating: game.personalRating,
          notes: game.notes,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [collectionItems.userId, collectionItems.gameId],
        set: {
          owned: true,
          wishlist: false,
          personalRating: sql`excluded.personal_rating`,
          notes: sql`excluded.notes`,
          updatedAt: now,
        },
      });
  });

  await writeAuditEvent({
    actorId: session.user.id,
    action: "collection.csv_imported",
    targetType: "collection",
    metadata: {
      imported: imported.games.length,
      artwork: cachedArtwork.size,
      skipped: imported.skipped,
      invalid: imported.invalid,
    },
  });
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  revalidatePath("/play");

  return {
    success: true,
    message: t("action.imported", {
      games: imported.games.length,
      artwork: cachedArtwork.size,
    }),
  };
}

/** Adds a discovered game with locally supplied picker metadata. */
export async function addGameAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireUser();
  const t = await getTranslations();
  const token = z.string().max(4_000).safeParse(formData.get("selectionToken"));
  const destination = libraryDestinationSchema.safeParse(
    formData.get("destination") ?? "collection",
  );
  const selection = token.success ? verifySelectionToken(token.data) : null;
  if (!selection || !destination.success) {
    return {
      success: false,
      message: t("action.chooseGame"),
    };
  }

  const details = gameDetailsSchema.safeParse({
    categories: formData.get("categories"),
    description: formData.get("description"),
    families: formData.get("families"),
    imageUrl: formData.get("imageUrl"),
    maxPlayers: formData.get("maxPlayers"),
    maxPlaytime: formData.get("maxPlaytime"),
    mechanics: formData.get("mechanics"),
    minPlayers: formData.get("minPlayers"),
    minPlaytime: formData.get("minPlaytime"),
    moneySpent: formData.get("moneySpent"),
    gifted: formData.get("gifted"),
    weight: formData.get("weight"),
    yearPublished: formData.get("yearPublished"),
  });
  if (!details.success) {
    return {
      success: false,
      message: t("action.checkDetails"),
    };
  }

  if (destination.data === "wishlist") {
    const [existingOwned] = await db
      .select({ id: collectionItems.id })
      .from(collectionItems)
      .innerJoin(games, eq(collectionItems.gameId, games.id))
      .where(
        and(
          eq(collectionItems.userId, session.user.id),
          eq(games.bggId, selection.bggId),
          eq(collectionItems.owned, true),
        ),
      )
      .limit(1);
    if (existingOwned) {
      return {
        success: false,
        message: t("action.alreadyOwned"),
      };
    }
  }

  const metadata = (
    await scrapeBggMetadata([selection.bggId]).catch(() => new Map())
  ).get(selection.bggId);
  const savedGame = await upsertGame(selection, details.data, metadata);
  const isWishlist = destination.data === "wishlist";
  await db
    .insert(collectionItems)
    .values({
      userId: session.user.id,
      gameId: savedGame.id,
      moneySpent: isWishlist ? 0 : details.data.moneySpent,
      gifted: isWishlist ? false : details.data.gifted,
      owned: !isWishlist,
      wishlist: isWishlist,
    })
    .onConflictDoUpdate({
      target: [collectionItems.userId, collectionItems.gameId],
      set: {
        moneySpent: isWishlist ? 0 : details.data.moneySpent,
        gifted: isWishlist ? false : details.data.gifted,
        owned: !isWishlist,
        wishlist: isWishlist,
        updatedAt: new Date(),
      },
    });
  await writeAuditEvent({
    actorId: session.user.id,
    action: isWishlist ? "wishlist.game_added" : "collection.game_added",
    targetType: "game",
    targetId: savedGame.id,
    metadata: {
      bggId: selection.bggId,
      imageCached: savedGame.imageCached,
    },
  });
  revalidatePath("/collection");
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: t(isWishlist ? "action.wishlisted" : "action.added", {
      name: selection.name,
    }),
  };
}

/** Updates user-owned collection details without mutating shared game data. */
export async function updateCollectionItemAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireUser();
  const t = await getTranslations();
  const parsed = editCollectionItemSchema.safeParse({
    itemId: formData.get("itemId"),
    moneySpent: formData.get("moneySpent"),
    gifted: formData.get("gifted"),
    notes: formData.get("notes"),
    personalRating: formData.get("personalRating"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: t("action.checkDetails"),
    };
  }

  const [updated] = await db
    .update(collectionItems)
    .set({
      moneySpent: parsed.data.moneySpent,
      gifted: parsed.data.gifted,
      notes: parsed.data.notes,
      personalRating: parsed.data.personalRating,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(collectionItems.id, parsed.data.itemId),
        eq(collectionItems.userId, session.user.id),
      ),
    )
    .returning({ id: collectionItems.id });
  if (!updated) {
    return {
      success: false,
      message: t("action.itemMissing"),
    };
  }

  await writeAuditEvent({
    actorId: session.user.id,
    action: "collection.game_updated",
    targetType: "collection_item",
    targetId: updated.id,
    metadata: {
      gifted: parsed.data.gifted,
      moneySpent: parsed.data.moneySpent,
    },
  });
  revalidatePath("/collection");
  revalidatePath("/stats");
  revalidatePath("/dashboard");
  revalidatePath("/play");
  return {
    success: true,
    message: t("action.gameUpdated"),
  };
}

/** Removes one owned item after verifying it belongs to the current user. */
export async function removeGameAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const itemId = itemIdSchema.parse(formData.get("itemId"));
  const [deleted] = await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.id, itemId),
        eq(collectionItems.userId, session.user.id),
      ),
    )
    .returning({ id: collectionItems.id, gameId: collectionItems.gameId });

  if (deleted) {
    await writeAuditEvent({
      actorId: session.user.id,
      action: "collection.game_removed",
      targetType: "collection_item",
      targetId: deleted.id,
    });
  }

  revalidatePath("/collection");
  revalidatePath("/wishlist");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

/** Toggles a favorite after verifying collection ownership. */
export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const itemId = itemIdSchema.parse(formData.get("itemId"));
  const favorite =
    z.enum(["true", "false"]).parse(formData.get("favorite")) === "true";
  await db
    .update(collectionItems)
    .set({ favorite, updatedAt: new Date() })
    .where(
      and(
        eq(collectionItems.id, itemId),
        eq(collectionItems.userId, session.user.id),
      ),
    );
  revalidatePath("/collection");
  revalidatePath("/stats");
  revalidatePath("/play");
}

/** Moves a wished-for game into the owned collection with its purchase price. */
export async function moveWishlistToCollectionAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireUser();
  const t = await getTranslations();
  const parsed = z
    .object({
      gifted: giftedSchema,
      itemId: itemIdSchema,
      moneySpent: z.coerce.number().min(0).max(999_999_999.99),
    })
    .transform((item) => ({
      ...item,
      moneySpent: item.gifted ? 0 : item.moneySpent,
    }))
    .safeParse({
      gifted: formData.get("gifted"),
      itemId: formData.get("itemId"),
      moneySpent: formData.get("moneySpent"),
    });
  if (!parsed.success) {
    return {
      success: false,
      message: t("action.checkDetails"),
    };
  }

  const [updated] = await db
    .update(collectionItems)
    .set({
      moneySpent: parsed.data.moneySpent,
      gifted: parsed.data.gifted,
      owned: true,
      wishlist: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(collectionItems.id, parsed.data.itemId),
        eq(collectionItems.userId, session.user.id),
        eq(collectionItems.wishlist, true),
      ),
    )
    .returning({ id: collectionItems.id });
  if (!updated) {
    return {
      success: false,
      message: t("action.itemMissing"),
    };
  }

  await writeAuditEvent({
    actorId: session.user.id,
    action: "wishlist.game_purchased",
    targetType: "collection_item",
    targetId: updated.id,
    metadata: {
      gifted: parsed.data.gifted,
      moneySpent: parsed.data.moneySpent,
    },
  });
  revalidatePath("/wishlist");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/play");
  return {
    success: true,
    message: t("action.movedToCollection"),
  };
}

/** Permanently clears only owned entries, leaving the wishlist intact. */
export async function clearCollectionAction(
  _previous: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await requireUser();
  const t = await getTranslations();
  const confirmation = z
    .literal(CLEAR_COLLECTION_CONFIRMATION)
    .safeParse(formData.get("confirmation"));
  if (!confirmation.success) {
    return {
      success: false,
      message: t("action.confirmClear", {
        confirmation: CLEAR_COLLECTION_CONFIRMATION,
      }),
    };
  }

  const deleted = await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.userId, session.user.id),
        eq(collectionItems.owned, true),
      ),
    )
    .returning({ id: collectionItems.id });
  await writeAuditEvent({
    actorId: session.user.id,
    action: "collection.cleared",
    targetType: "collection",
    metadata: { removed: deleted.length },
  });
  revalidatePath("/settings");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  revalidatePath("/play");
  return {
    success: true,
    message: t("action.cleared", { count: deleted.length }),
  };
}
