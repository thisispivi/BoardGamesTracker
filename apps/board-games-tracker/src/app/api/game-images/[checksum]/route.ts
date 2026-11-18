import { eq } from "drizzle-orm";

import { checksumSchema } from "@/core";
import { db } from "@/server/db";
import { gameImages } from "@/server/db/schema";

/**
 * Serves immutable, content-addressed game artwork stored in PostgreSQL.
 *
 * The ETag is the checksum named in the URL, and stored bytes never change for
 * a checksum, so a matching `If-None-Match` is answered with 304 before the
 * image is read from the database.
 *
 * @param request - The incoming request.
 * @param context - Route context supplied by Next.js.
 * @param context.params - Route parameters carrying the requested checksum.
 * @returns The HTTP response for the request.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ checksum: string }> },
): Promise<Response> {
  const checksum = checksumSchema.safeParse((await context.params).checksum);
  if (!checksum.success) {
    return new Response(null, { status: 404 });
  }

  const etag = `"${checksum.data}"`;
  const cacheHeaders = {
    "Cache-Control": `public, max-age=${365 * 24 * 60 * 60}, immutable`,
    ETag: etag,
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  const [image] = await db
    .select({
      data: gameImages.data,
      mimeType: gameImages.mimeType,
      size: gameImages.size,
    })
    .from(gameImages)
    .where(eq(gameImages.checksum, checksum.data))
    .limit(1);
  if (!image) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      ...cacheHeaders,
      "Content-Length": String(image.size),
      "Content-Type": image.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
