import { getTranslations } from "next-intl/server";

import { bggIdSchema } from "@/core";
import { scrapeBggMetadata } from "@/server/bgg/scrape";
import { consumeRateLimit } from "@/server/security/rateLimit";
import { getSession } from "@/server/session";
import { log } from "@/utils/logger";

/**
 * Returns BoardGameGeek details for the single game a user has selected.
 *
 * Fetching one game on selection, rather than every result of every keystroke,
 * keeps the instance well under BoardGameGeek's throttle so the values are
 * actually available when the game is saved.
 *
 * @param request - The incoming request.
 * @returns The game's metadata, or a translated error.
 */
export async function GET(request: Request): Promise<Response> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return Response.json({ error: t("search.unauthorized") }, { status: 401 });
  }
  if (!consumeRateLimit(`metadata:${session.user.id}`, 30, 60_000)) {
    return Response.json({ error: t("search.tooMany") }, { status: 429 });
  }

  const bggId = bggIdSchema.safeParse(
    Number(new URL(request.url).searchParams.get("bggId")),
  );
  if (!bggId.success) {
    return Response.json({ error: t("search.terms") }, { status: 400 });
  }

  try {
    const metadata = (await scrapeBggMetadata([bggId.data])).get(bggId.data);
    return Response.json({ metadata: metadata ?? null });
  } catch (error) {
    log("warn", "game_metadata_failed", {
      actorId: session.user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ metadata: null });
  }
}
