import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { hashPassword } from "better-auth/crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { demoDatabaseUrlSchema } from "@/core";
import {
  account,
  collectionItems,
  gameImages,
  games,
  user,
} from "@/server/db/schema";
import { createDemoLibrary, demoNow } from "@/utils/demoLibrary";

/**
 * Seeds an empty, dedicated local database with the fictional showcase account.
 *
 * @returns Nothing after migrations, account credentials, and example games are saved.
 */
async function seedDemo(): Promise<void> {
  const databaseUrl = demoDatabaseUrlSchema.parse(
    process.env.DEMO_DATABASE_URL,
  );
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error(
      "Set DEMO_PASSWORD to a local-only password of 12–128 characters.",
    );
  }
  const client = postgres(databaseUrl, { max: 1 });
  const database = drizzle(client);
  try {
    await migrate(database, { migrationsFolder: "./drizzle" });
    if (
      (await database.select({ id: user.id }).from(user).limit(1)).length > 0
    ) {
      throw new Error(
        "Screenshot seeding requires an empty local demo database.",
      );
    }
    const library = createDemoLibrary();
    await database.transaction(async (transaction) => {
      await transaction.insert(user).values([
        {
          id: "demo-alex",
          name: "Alex Morgan",
          email: "alex@example.invalid",
          emailVerified: true,
          role: "user",
        },
        {
          id: "demo-local-admin",
          name: "Local showcase administrator",
          email: "admin@example.invalid",
          role: "admin",
        },
      ]);
      await transaction.insert(account).values({
        id: randomUUID(),
        accountId: "demo-alex",
        providerId: "credential",
        userId: "demo-alex",
        password: await hashPassword(password),
      });
      for (const [index, game] of [
        ...library.collection,
        ...library.wishlist,
      ].entries()) {
        const data = await readFile(`public/demo/games/${game.bggId}.jpg`);
        const checksum = createHash("sha256").update(data).digest("hex");
        await transaction
          .insert(gameImages)
          .values({
            checksum,
            data,
            mimeType: "image/jpeg",
            size: data.length,
            sourceUrl: `https://boardgamegeek.com/boardgame/${game.bggId}`,
          })
          .onConflictDoNothing();
        const gameId = randomUUID();
        await transaction.insert(games).values({
          id: gameId,
          bggId: game.bggId,
          name: game.name,
          imageChecksum: checksum,
          yearPublished: game.yearPublished,
          minPlayers: game.minPlayers,
          maxPlayers: game.maxPlayers,
          minPlaytime: game.minPlaytime,
          maxPlaytime: game.maxPlaytime,
          weight: game.weight,
          bggRating: game.bggRating,
          isExpansion: game.isExpansion,
          expandsBggIds: game.expandsBggIds,
          expansionBggIds: game.expansionBggIds,
          categories: game.categories,
          mechanics: game.mechanics,
          families: game.families,
        });
        const owned = index < library.collection.length;
        await transaction.insert(collectionItems).values({
          userId: "demo-alex",
          gameId,
          owned,
          wishlist: !owned,
          favorite: game.favorite,
          hasPlayed: game.hasPlayed,
          personalRating: game.personalRating,
          moneySpent: game.moneySpent,
          gifted: game.gifted,
          notes: game.notes,
          createdAt: new Date(demoNow.getTime() - (index + 1) * 86_400_000),
        });
      }
    });
    console.info(
      "Seeded Alex Morgan (alex@example.invalid) with 20 collection items and six wishlist games.",
    );
  } finally {
    await client.end();
  }
}

void seedDemo().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Demo seeding failed.",
  );
  process.exitCode = 1;
});
