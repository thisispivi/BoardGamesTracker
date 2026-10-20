import { and, asc, eq, isNotNull, isNull, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { gameImages, games } from "@/server/db/schema";
import { downloadBggImages } from "@/server/images/bggImage";

/** Most games processed in one run, so a large catalog is cached in batches. */
const batchSize = 500;

/**
 * Caches remote BGG artwork already referenced by existing game records.
 *
 * @returns A promise that resolves after every uncached image is processed.
 */
async function cacheExistingImages(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to cache game images.");
  }
  const client = postgres(process.env.DATABASE_URL, {
    max: 3,
    prepare: false,
    onnotice: () => undefined,
  });
  const database = drizzle(client);
  try {
    const pending = await database
      .select({ bggId: games.bggId, imageUrl: games.imageUrl })
      .from(games)
      .where(
        and(
          isNull(games.imageChecksum),
          isNotNull(games.imageUrl),
          like(games.imageUrl, "https://cf.geekdo-images.com/%"),
        ),
      )
      .orderBy(asc(games.bggId))
      .limit(batchSize);
    const sources = new Map<number, string>();
    for (const game of pending) {
      if (game.imageUrl) sources.set(game.bggId, game.imageUrl);
    }
    const images = await downloadBggImages(sources);
    for (const [bggId, image] of images) {
      await database.transaction(async (transaction) => {
        await transaction
          .insert(gameImages)
          .values({
            checksum: image.checksum,
            data: image.data,
            mimeType: image.mimeType,
            size: image.size,
            sourceUrl: image.sourceUrl,
          })
          .onConflictDoNothing({ target: gameImages.checksum });
        await transaction
          .update(games)
          .set({ imageChecksum: image.checksum, updatedAt: sql`now()` })
          .where(and(eq(games.bggId, bggId), isNull(games.imageChecksum)));
      });
    }
    console.info(
      `Cached ${images.size} of ${pending.length} existing BGG cover images.`,
    );
  } finally {
    await client.end();
  }
}

void cacheExistingImages().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Image caching failed.",
  );
  process.exitCode = 1;
});
