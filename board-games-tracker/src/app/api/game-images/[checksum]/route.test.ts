import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));

import { GET } from "@/app/api/game-images/[checksum]/route";
import { gameImages } from "@/server/db/schema";
import { setupTestDatabase, testDb } from "@/test/database";

const checksum = "a".repeat(64);
const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

setupTestDatabase();

/**
 * Requests one stored image the way the browser does.
 *
 * @param requested - Checksum placed in the URL.
 * @param headers - Request headers sent by the browser.
 * @returns The route's response.
 */
function getImage(
  requested: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  return GET(
    new Request(`https://tracker.test/api/game-images/${requested}`, {
      headers,
    }),
    { params: Promise.resolve({ checksum: requested }) },
  );
}

describe("GET /api/game-images/[checksum]", () => {
  it("serves stored artwork with immutable caching headers", async () => {
    await testDb.execute(
      sql`insert into ${gameImages} (checksum, data, mime_type, size, source_url) values (${checksum}, decode(${bytes.toString("hex")}, 'hex'), 'image/jpeg', ${bytes.byteLength}, 'https://cf.geekdo-images.com/cover.jpg')`,
    );

    const response = await getImage(checksum);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("etag")).toBe(`"${checksum}"`);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
  });

  it("answers a matching revalidation without reading the image", async () => {
    const select = vi.spyOn(testDb, "select");

    const response = await getImage(checksum, {
      "if-none-match": `"${checksum}"`,
    });

    expect(response.status).toBe(304);
    expect(response.headers.get("etag")).toBe(`"${checksum}"`);
    expect(select).not.toHaveBeenCalled();
    select.mockRestore();
  });

  it.each(["not-a-checksum", "b".repeat(64)])(
    "returns 404 for %s",
    async (requested) => {
      expect((await getImage(requested)).status).toBe(404);
    },
  );
});
