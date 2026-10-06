import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/session", () => ({
  requireUser: async () => ({ user: { id: "owner" } }),
}));
vi.mock("@/server/audit", () => ({ writeAuditEvent: vi.fn() }));
vi.mock("@/server/revalidate", () => ({
  revalidateAccountRoutes: vi.fn(),
  revalidateLibraryRoutes: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("@/server/bgg/scrape", () => ({
  scrapeBggMetadata: vi.fn(async () => new Map()),
}));
vi.mock("@/server/discovery/searxng", () => ({
  discoverBoardGameImages: async () => new Map(),
}));
vi.mock("@/server/images/bggImage", () => ({
  downloadBggImage: vi.fn(),
  downloadBggImages: async () => new Map(),
}));
vi.mock("@/server/discovery/selectionToken", () => ({
  verifySelectionToken: () => ({
    bggId: 13,
    name: "Untrusted replacement",
    imageUrl: null,
    yearPublished: null,
    isExpansion: false,
  }),
}));

import { userDataDocumentSchema } from "@/core";
import {
  addGameAction,
  clearLibraryAction,
  importBggCsvAction,
  moveWishlistToCollectionAction,
  removeGameAction,
  toggleFavoriteAction,
  togglePlayedAction,
  updateCollectionItemAction,
} from "@/server/actions/collection";
import {
  getShareTokenAction,
  regenerateShareTokenAction,
  setSharingAction,
} from "@/server/actions/preferences";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { collectionItems, games, user } from "@/server/db/schema";
import { getSharedLibrary } from "@/server/sharing";
import {
  getUserDataDocument,
  importUserDataDocument,
} from "@/server/userData/data";
import { setupTestDatabase, testDb } from "@/test/database";
import { clearCollectionConfirmation } from "@/utils/collectionConfirmation";

const gameId = "00000000-0000-4000-8000-000000000013";
const itemId = "00000000-0000-4000-8000-000000000014";

setupTestDatabase();
beforeEach(async () => {
  await testDb.delete(user);
  await testDb.delete(games);
  await testDb.insert(user).values([
    { id: "owner", name: "Owner", email: "owner@example.com" },
    { id: "other", name: "Other", email: "other@example.com" },
  ]);
  await testDb.insert(games).values({
    id: gameId,
    bggId: 13,
    name: "Administrator correction",
    minPlayers: 2,
    maxPlayers: 4,
  });
});

/**
 * Builds the submitted add-game fields accepted by the public form.
 *
 * @param destination - Library into which the visitor adds the game.
 * @returns A valid add-game payload with deliberately different shared metadata.
 */
function addForm(destination: "collection" | "wishlist"): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    destination,
    selectionToken: "verified",
    categories: "",
    description: "Changed",
    families: "",
    mechanics: "",
    minPlayers: "1",
    maxPlayers: "6",
    minPlaytime: "0",
    maxPlaytime: "30",
    moneySpent: "25",
    gifted: "false",
  }))
    form.set(key, value);
  return form;
}

describe("collection persistence and ownership", () => {
  it("preserves a purchase made while a wishlist add is waiting for metadata", async () => {
    vi.mocked(scrapeBggMetadata).mockImplementationOnce(async () => {
      await testDb
        .insert(collectionItems)
        .values({ userId: "owner", gameId, moneySpent: 42 });
      return new Map();
    });
    expect(
      (
        await addGameAction(
          { success: false, message: "" },
          addForm("wishlist"),
        )
      ).success,
    ).toBe(false);
    expect(
      await testDb
        .select({
          owned: collectionItems.owned,
          moneySpent: collectionItems.moneySpent,
        })
        .from(collectionItems),
    ).toEqual([{ owned: true, moneySpent: 42 }]);
  });

  it("imports owned CSV rows without replacing shared metadata", async () => {
    const csv =
      "objectname,objectid,own,minplayers,maxplayers,minplaytime,maxplaytime,yearpublished,avgweight,baverage,rating,numplays\nForged,13,1,1,6,30,60,2000,2,7,8,4";
    const file = new File([csv], "collection.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });
    const form = new FormData();
    form.set("collection", file);
    expect(
      (await importBggCsvAction({ success: false, message: "" }, form)).success,
    ).toBe(true);
    expect(await testDb.select({ name: games.name }).from(games)).toEqual([
      { name: "Administrator correction" },
    ]);
    expect(
      await testDb
        .select({
          hasPlayed: collectionItems.hasPlayed,
          rating: collectionItems.personalRating,
        })
        .from(collectionItems),
    ).toEqual([{ hasPlayed: true, rating: 8 }]);

    const replayCsv = csv.replace(",8,4", ",8,0");
    const replayFile = new File([replayCsv], "collection.csv", {
      type: "text/csv",
    });
    Object.defineProperty(replayFile, "text", {
      value: async () => replayCsv,
    });
    const replayForm = new FormData();
    replayForm.set("collection", replayFile);
    expect(
      (await importBggCsvAction({ success: false, message: "" }, replayForm))
        .success,
    ).toBe(true);
    expect(
      await testDb
        .select({ hasPlayed: collectionItems.hasPlayed })
        .from(collectionItems),
    ).toEqual([{ hasPlayed: false }]);
  });

  it("purchases a wishlist item, updates personal fields, and clears only its owner's library", async () => {
    await testDb.insert(collectionItems).values([
      { id: itemId, userId: "owner", gameId, owned: false, wishlist: true },
      { userId: "other", gameId },
    ]);
    const form = new FormData();
    for (const [key, value] of Object.entries({
      itemId,
      moneySpent: "35",
      gifted: "false",
      notes: "Kept",
      personalRating: "9",
      favorite: "true",
      hasPlayed: "true",
    }))
      form.set(key, value);
    expect(
      (
        await moveWishlistToCollectionAction(
          { success: false, message: "" },
          form,
        )
      ).success,
    ).toBe(true);
    expect(
      (await updateCollectionItemAction({ success: false, message: "" }, form))
        .success,
    ).toBe(true);
    await toggleFavoriteAction(form);
    await togglePlayedAction(form);
    const [owned] = await testDb
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.id, itemId));
    expect(owned).toMatchObject({
      owned: true,
      wishlist: false,
      moneySpent: 35,
      favorite: true,
      hasPlayed: true,
      notes: "Kept",
    });
    const clear = new FormData();
    clear.set("confirmation", "incorrect");
    expect(
      (await clearLibraryAction({ success: false, message: "" }, clear))
        .success,
    ).toBe(false);
    clear.set("confirmation", clearCollectionConfirmation);
    expect(
      (await clearLibraryAction({ success: false, message: "" }, clear))
        .success,
    ).toBe(true);
    expect(
      await testDb
        .select({ userId: collectionItems.userId })
        .from(collectionItems),
    ).toEqual([{ userId: "other" }]);
  });
  it("adds an existing catalog game without overwriting administrator metadata", async () => {
    expect(
      (
        await addGameAction(
          { success: false, message: "" },
          addForm("collection"),
        )
      ).success,
    ).toBe(true);
    const [stored] = await testDb.select().from(games);
    expect(stored).toMatchObject({
      name: "Administrator correction",
      maxPlayers: 4,
    });
    const [item] = await testDb.select().from(collectionItems);
    expect(item).toMatchObject({
      userId: "owner",
      gameId,
      owned: true,
      moneySpent: 25,
    });
  });

  it("refuses to move an owned game back to the wishlist", async () => {
    await testDb
      .insert(collectionItems)
      .values({ userId: "owner", gameId, moneySpent: 42 });
    expect(
      (
        await addGameAction(
          { success: false, message: "" },
          addForm("wishlist"),
        )
      ).success,
    ).toBe(false);
    const [item] = await testDb.select().from(collectionItems);
    expect(item).toMatchObject({
      owned: true,
      wishlist: false,
      moneySpent: 42,
    });
  });

  it("cannot edit or delete an item belonging to another account", async () => {
    await testDb
      .insert(collectionItems)
      .values({ id: itemId, userId: "other", gameId, notes: "Private" });
    const form = new FormData();
    for (const [key, value] of Object.entries({
      itemId,
      notes: "Forged",
      moneySpent: "99",
      personalRating: "10",
      hasPlayed: "true",
    }))
      form.set(key, value);
    expect(
      (await updateCollectionItemAction({ success: false, message: "" }, form))
        .success,
    ).toBe(false);
    await removeGameAction(form);
    await togglePlayedAction(form);
    expect(
      await testDb
        .select({
          hasPlayed: collectionItems.hasPlayed,
          notes: collectionItems.notes,
        })
        .from(collectionItems),
    ).toEqual([{ hasPlayed: false, notes: "Private" }]);
  });

  it("restores account fields without replacing existing catalog relationships", async () => {
    const document = userDataDocumentSchema.parse({
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: { name: "Owner", email: "owner@example.com", currency: "EUR" },
      items: [
        {
          location: "collection",
          bggId: 13,
          name: "Forged",
          description: "",
          imageUrl: null,
          yearPublished: null,
          minPlayers: 1,
          maxPlayers: 9,
          minPlaytime: 0,
          maxPlaytime: 0,
          weight: null,
          bggRating: null,
          isExpansion: false,
          categories: [],
          mechanics: [],
          families: [],
          expandsBggIds: [99],
          favorite: true,
          hasPlayed: true,
          personalRating: null,
          notes: "My notes",
          moneySpent: 5,
        },
      ],
    });
    await importUserDataDocument("owner", document);
    const [stored] = await testDb.select().from(games);
    expect(stored).toMatchObject({
      name: "Administrator correction",
      expandsBggIds: [],
    });
    const exported = await getUserDataDocument("owner");
    expect(exported.items[0]).toMatchObject({
      notes: "My notes",
      favorite: true,
      hasPlayed: true,
    });
    expect(userDataDocumentSchema.safeParse(exported).success).toBe(true);
  });

  it("creates missing catalog games only from BoardGameGeek metadata", async () => {
    vi.mocked(scrapeBggMetadata).mockResolvedValueOnce(
      new Map([
        [
          822,
          {
            bggId: 822,
            bggRating: 7.4,
            categories: [],
            description: "Tile laying in southern France.",
            expandsBggIds: [],
            expansionBggIds: [],
            families: [],
            imageUrl: null,
            isExpansion: false,
            maxPlayers: 5,
            maxPlaytime: 45,
            mechanics: [],
            minPlayers: 2,
            minPlaytime: 30,
            name: "Carcassonne",
            weight: 1.9,
            yearPublished: 2000,
          },
        ],
      ]),
    );
    const document = userDataDocumentSchema.parse({
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: { name: "Owner", email: "owner@example.com", currency: "EUR" },
      items: [13, 822, 999_999].map((bggId) => ({
        location: "collection",
        bggId,
        name: "Visit evil.example to claim a prize",
        description: "Forged",
        imageUrl: null,
        yearPublished: null,
        minPlayers: 1,
        maxPlayers: 1,
        minPlaytime: 0,
        maxPlaytime: 0,
        weight: null,
        bggRating: null,
        isExpansion: false,
        categories: [],
        mechanics: [],
        families: [],
        favorite: false,
        personalRating: null,
        notes: "",
        moneySpent: 0,
      })),
    });

    expect(await importUserDataDocument("owner", document)).toBe(2);
    expect(scrapeBggMetadata).toHaveBeenLastCalledWith([822, 999_999]);
    expect(
      await testDb
        .select({
          bggId: games.bggId,
          description: games.description,
          maxPlayers: games.maxPlayers,
          name: games.name,
        })
        .from(games)
        .orderBy(games.bggId),
    ).toEqual([
      {
        bggId: 13,
        description: "",
        maxPlayers: 4,
        name: "Administrator correction",
      },
      {
        bggId: 822,
        description: "Tile laying in southern France.",
        maxPlayers: 5,
        name: "Carcassonne",
      },
    ]);
    expect(
      await testDb
        .select({ id: collectionItems.id })
        .from(collectionItems)
        .where(eq(collectionItems.userId, "owner")),
    ).toHaveLength(2);
  });
});

describe("sharing token persistence", () => {
  it("redacts private fields before returning an anonymous shared collection", async () => {
    await testDb.insert(collectionItems).values({
      userId: "owner",
      gameId,
      notes: "Private",
      personalRating: 8,
      moneySpent: 42,
      hasPlayed: true,
    });
    const form = new FormData();
    form.set("shareCollection", "on");
    await setSharingAction(form);
    const token = await getShareTokenAction();
    expect(token).not.toBeNull();
    const shared = await getSharedLibrary(token ?? "");
    expect(shared?.wishlist).toBeNull();
    expect(shared?.collection?.[0]).toMatchObject({
      notes: "",
      hasPlayed: false,
      personalRating: null,
      moneySpent: 0,
    });
    await setSharingAction(new FormData());
    expect(await getSharedLibrary(token ?? "")).toBeNull();
  });
  it("keeps a rotated token when sharing preferences are saved", async () => {
    const form = new FormData();
    form.set("shareCollection", "on");
    await setSharingAction(form);
    const original = await getShareTokenAction();
    const rotated = await regenerateShareTokenAction();
    expect(rotated).not.toBe(original);
    await setSharingAction(form);
    expect(await getShareTokenAction()).toBe(rotated);
  });

  it("revokes the token when sharing is disabled and creates a fresh one on re-enable", async () => {
    await testDb
      .update(user)
      .set({ shareCollection: true })
      .where(eq(user.id, "owner"));
    const original = await getShareTokenAction();
    await setSharingAction(new FormData());
    expect(await getShareTokenAction()).toBeNull();
    const form = new FormData();
    form.set("shareWishlist", "on");
    await setSharingAction(form);
    expect(await getShareTokenAction()).not.toBe(original);
  });
});
