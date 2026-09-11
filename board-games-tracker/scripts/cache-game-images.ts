import postgres from "postgres";

import { downloadBggImages } from "../src/server/images/bggImage";

/** A stored game whose remote artwork may need local caching. */
type ExistingGame = {
  bgg_id: number;
  image_url: string;
};

/**
 * Caches remote BGG artwork already referenced by existing game records.
 *
 * @returns A promise that resolves after every uncached image is processed.
 */
async function cacheExistingImages(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to cache game images.");
  }
  const database = postgres(process.env.DATABASE_URL, {
    max: 3,
    prepare: false,
    onnotice: () => undefined,
  });
  try {
    const games = await database<ExistingGame[]>`
      select bgg_id, image_url
      from games
      where image_checksum is null
        and image_url is not null
        and image_url like 'https://cf.geekdo-images.com/%'
      order by bgg_id
      limit 500
    `;
    const sources = new Map(games.map((game) => [game.bgg_id, game.image_url]));
    const images = await downloadBggImages(sources);
    for (const [bggId, image] of images) {
      await database.begin(async (transaction) => {
        await transaction`
          insert into game_images
            (checksum, data, mime_type, size, source_url)
          values
            (${image.checksum}, ${image.data}, ${image.mimeType}, ${image.size}, ${image.sourceUrl})
          on conflict (checksum) do nothing
        `;
        await transaction`
          update games
          set image_checksum = ${image.checksum}, updated_at = now()
          where bgg_id = ${bggId} and image_checksum is null
        `;
      });
    }
    console.log(
      `Cached ${images.size} of ${games.length} existing BGG cover images.`,
    );
  } finally {
    await database.end();
  }
}

void cacheExistingImages().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Image caching failed.",
  );
  process.exitCode = 1;
});
