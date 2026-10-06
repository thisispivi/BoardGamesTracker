import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** Better Auth user records with administrative fields. */
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    role: text("role").notNull().default("user"),
    currency: text("currency").notNull().default("EUR"),
    shareCollection: boolean("share_collection").notNull().default(false),
    shareWishlist: boolean("share_wishlist").notNull().default(false),
    sharePrices: boolean("share_prices").notNull().default(false),
    shareToken: text("share_token"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("user_email_unique").on(table.email),
    index("user_role_idx").on(table.role),
    uniqueIndex("user_share_token_unique").on(table.shareToken),
    check("user_currency_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      "user_share_token_check",
      sql`${table.shareToken} is null or ${table.shareToken} ~ '^[a-f0-9]{32}$'`,
    ),
    check(
      "user_share_prices_check",
      sql`not ${table.sharePrices} or ${table.shareCollection} or ${table.shareWishlist}`,
    ),
  ],
);

/** Better Auth session records. */
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    uniqueIndex("session_token_unique").on(table.token),
    index("session_user_idx").on(table.userId),
  ],
);

/** Better Auth identity-provider and password credentials. */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("account_provider_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_idx").on(table.userId),
  ],
);

/** Better Auth verification challenges. */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Content-addressed board-game artwork stored directly in PostgreSQL. */
export const gameImages = pgTable(
  "game_images",
  {
    checksum: text("checksum").primaryKey(),
    data: bytea("data").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    sourceUrl: text("source_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "game_images_checksum_check",
      sql`${table.checksum} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "game_images_mime_type_check",
      sql`${table.mimeType} in ('image/jpeg', 'image/png', 'image/webp')`,
    ),
    check(
      "game_images_size_check",
      sql`${table.size} > 0 and ${table.size} <= 5242880 and octet_length(${table.data}) = ${table.size}`,
    ),
  ],
);

/** Canonical board-game metadata shared between collections. */
export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bggId: integer("bgg_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    thumbnailUrl: text("thumbnail_url"),
    imageChecksum: text("image_checksum").references(
      () => gameImages.checksum,
      { onDelete: "set null" },
    ),
    yearPublished: integer("year_published"),
    minPlayers: integer("min_players").notNull().default(1),
    maxPlayers: integer("max_players").notNull().default(1),
    minPlaytime: integer("min_playtime").notNull().default(0),
    maxPlaytime: integer("max_playtime").notNull().default(0),
    weight: numeric("weight", { mode: "number", precision: 6, scale: 5 }),
    bggRating: numeric("bgg_rating", {
      mode: "number",
      precision: 4,
      scale: 2,
    }),
    isExpansion: boolean("is_expansion").notNull().default(false),
    expandsBggIds: integer("expands_bgg_ids")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    expansionBggIds: integer("expansion_bgg_ids")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    categories: jsonb("categories").$type<string[]>().notNull().default([]),
    mechanics: jsonb("mechanics").$type<string[]>().notNull().default([]),
    families: jsonb("families").$type<string[]>().notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("games_bgg_id_unique").on(table.bggId),
    index("games_name_idx").on(table.name),
    index("games_image_checksum_idx").on(table.imageChecksum),
  ],
);

/** A user-owned collection entry and personal metadata. */
export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    owned: boolean("owned").notNull().default(true),
    favorite: boolean("favorite").notNull().default(false),
    hasPlayed: boolean("has_played").notNull().default(false),
    wishlist: boolean("wishlist").notNull().default(false),
    personalRating: numeric("personal_rating", {
      mode: "number",
      precision: 3,
      scale: 1,
    }),
    notes: text("notes").notNull().default(""),
    moneySpent: numeric("money_spent", {
      mode: "number",
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default(0),
    gifted: boolean("gifted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("collection_user_game_unique").on(table.userId, table.gameId),
    index("collection_user_idx").on(table.userId),
    index("collection_user_wishlist_idx").on(table.userId, table.wishlist),
    check(
      "collection_location_check",
      sql`${table.owned} <> ${table.wishlist}`,
    ),
    check("collection_money_spent_check", sql`${table.moneySpent} >= 0`),
  ],
);

/** Security and administrative audit event. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_created_idx").on(table.createdAt),
    index("audit_actor_idx").on(table.actorId),
  ],
);

/** User-to-collection relational map. */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  collectionItems: many(collectionItems),
}));

/** Collection-to-game relational map. */
export const collectionRelations = relations(collectionItems, ({ one }) => ({
  user: one(user, { fields: [collectionItems.userId], references: [user.id] }),
  game: one(games, {
    fields: [collectionItems.gameId],
    references: [games.id],
  }),
}));

/** Game-to-collection relational map. */
export const gameRelations = relations(games, ({ many }) => ({
  collectionItems: many(collectionItems),
}));
