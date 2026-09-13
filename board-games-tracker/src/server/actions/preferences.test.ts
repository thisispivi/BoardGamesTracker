import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db", async () => ({
  db: (await import("@/test/database")).testDb,
}));
vi.mock("@/server/session", () => ({ requireUser }));
vi.mock("@/server/audit", () => ({ writeAuditEvent: vi.fn() }));
vi.mock("@/server/revalidate", () => ({ revalidateAccountRoutes: vi.fn() }));
vi.mock("@/env", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import {
  getShareTokenAction,
  regenerateShareTokenAction,
  setCurrencyAction,
  setSharingAction,
} from "@/server/actions/preferences";
import { user } from "@/server/db/schema";
import { migrateTestDatabase, testDatabase, testDb } from "@/test/database";

beforeAll(migrateTestDatabase, 30_000);
afterAll(async () => {
  await testDatabase.close();
});
beforeEach(async () => {
  await testDb.delete(user);
  await testDb
    .insert(user)
    .values({ id: "owner", name: "Owner", email: "owner@example.com" });
  requireUser.mockResolvedValue({ user: { id: "owner", role: "user" } });
});

/**
 * Builds the sharing form the settings switches submit.
 *
 * Unchecked switches are absent from a real submission, so only enabled ones
 * are set here.
 *
 * @param switches - The switches the user turned on.
 * @param switches.collection - Whether the owned collection is published.
 * @param switches.prices - Whether recorded prices travel with a shared library.
 * @param switches.wishlist - Whether the wishlist is published.
 * @returns Form data matching a settings submission.
 */
function sharingForm(switches: {
  collection?: boolean;
  prices?: boolean;
  wishlist?: boolean;
}): FormData {
  const form = new FormData();
  if (switches.collection) form.set("shareCollection", "on");
  if (switches.wishlist) form.set("shareWishlist", "on");
  if (switches.prices) form.set("sharePrices", "on");
  return form;
}

/**
 * Reads the sharing columns of the fixture account.
 *
 * @returns The stored sharing preferences and token.
 */
async function storedSharing(): Promise<{
  shareCollection: boolean;
  sharePrices: boolean;
  shareToken: string | null;
  shareWishlist: boolean;
}> {
  const [row] = await testDb
    .select({
      shareCollection: user.shareCollection,
      sharePrices: user.sharePrices,
      shareToken: user.shareToken,
      shareWishlist: user.shareWishlist,
    })
    .from(user)
    .where(eq(user.id, "owner"))
    .limit(1);
  if (!row) throw new Error("The fixture account is missing.");
  return row;
}

describe("library sharing preferences", () => {
  it("mints a token when the first library is published", async () => {
    await setSharingAction(sharingForm({ collection: true }));

    const stored = await storedSharing();
    expect(stored.shareCollection).toBe(true);
    expect(stored.sharePrices).toBe(false);
    expect(stored.shareToken).toMatch(/^[a-f0-9]{32}$/);
  });

  it("refuses to keep prices published when no library is", async () => {
    await setSharingAction(sharingForm({ collection: true, prices: true }));
    expect((await storedSharing()).sharePrices).toBe(true);

    await setSharingAction(sharingForm({ prices: true }));

    const stored = await storedSharing();
    expect(stored.sharePrices).toBe(false);
    expect(stored.shareToken).toBeNull();
  });

  it("revokes every handed-out link once sharing is turned off", async () => {
    await setSharingAction(sharingForm({ wishlist: true }));
    const published = await storedSharing();

    await setSharingAction(sharingForm({}));
    expect((await storedSharing()).shareToken).toBeNull();

    await setSharingAction(sharingForm({ wishlist: true }));
    expect((await storedSharing()).shareToken).not.toBe(published.shareToken);
  });

  it("answers repeated link copies with the same token", async () => {
    await setSharingAction(sharingForm({ collection: true }));
    const minted = await getShareTokenAction();

    expect(minted).toMatch(/^[a-f0-9]{32}$/);
    expect(await getShareTokenAction()).toBe(minted);
  });

  it("withholds a token from an account that shares nothing", async () => {
    expect(await getShareTokenAction()).toBeNull();
    expect(await regenerateShareTokenAction()).toBeNull();
    expect((await storedSharing()).shareToken).toBeNull();
  });

  it("rotates the token away from the previous link", async () => {
    await setSharingAction(sharingForm({ collection: true }));
    const original = await getShareTokenAction();

    const rotated = await regenerateShareTokenAction();

    expect(rotated).toMatch(/^[a-f0-9]{32}$/);
    expect(rotated).not.toBe(original);
    expect((await storedSharing()).shareToken).toBe(rotated);
  });
});

describe("display currency", () => {
  it("stores a supported ISO 4217 code", async () => {
    const form = new FormData();
    form.set("currency", "SEK");

    await setCurrencyAction(form);

    const [row] = await testDb
      .select({ currency: user.currency })
      .from(user)
      .where(eq(user.id, "owner"))
      .limit(1);
    expect(row?.currency).toBe("SEK");
  });

  it("ignores a currency the application does not format", async () => {
    const form = new FormData();
    form.set("currency", "XBT");

    await setCurrencyAction(form);

    const [row] = await testDb
      .select({ currency: user.currency })
      .from(user)
      .where(eq(user.id, "owner"))
      .limit(1);
    expect(row?.currency).toBe("EUR");
  });
});
