import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { gameImages } from "@/server/db/schema";

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);

/** Serves immutable, content-addressed game artwork stored in PostgreSQL. */
export async function GET(
  request: Request,
  context: { params: Promise<{ checksum: string }> },
): Promise<Response> {
  const checksum = checksumSchema.safeParse((await context.params).checksum);
  if (!checksum.success) {
    return new Response(null, { status: 404 });
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

  const etag = `"${checksum.data}"`;
  const headers = new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(image.size),
    "Content-Type": image.mimeType,
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  });
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(new Uint8Array(image.data), { headers });
}
