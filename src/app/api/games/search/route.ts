import { z } from "zod";

import { log } from "@/lib/logger";
import { getTranslations } from "next-intl/server";
import { discoverBoardGameByUrl } from "@/server/discovery/bgg-url";
import { parseBoardGameUrl } from "@/server/discovery/result-parser";
import { searchBoardGames } from "@/server/discovery/searxng";
import { getSession } from "@/server/session";

const querySchema = z.string().trim().min(3).max(500);
const requests = new Map<string, { count: number; resetsAt: number }>();

/** Applies a small per-user metasearch limit for a single-instance deployment. */
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const current = requests.get(userId);
  if (!current || current.resetsAt <= now) {
    requests.set(userId, { count: 1, resetsAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 20;
}

/** Discovers BoardGameGeek links for authenticated collection editors. */
export async function GET(request: Request): Promise<Response> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return Response.json({ error: t("search.unauthorized") }, { status: 401 });
  }
  if (isRateLimited(session.user.id)) {
    return Response.json({ error: t("search.tooMany") }, { status: 429 });
  }

  const query = querySchema.safeParse(
    new URL(request.url).searchParams.get("q"),
  );
  if (!query.success) {
    return Response.json({ error: t("search.terms") }, { status: 400 });
  }

  try {
    if (parseBoardGameUrl(query.data)) {
      const game = await discoverBoardGameByUrl(query.data);
      return Response.json({ results: game ? [game] : [] });
    }
    return Response.json({ results: await searchBoardGames(query.data) });
  } catch (error) {
    log("warn", "game_discovery_failed", {
      actorId: session.user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: t("add.unavailable") }, { status: 502 });
  }
}
