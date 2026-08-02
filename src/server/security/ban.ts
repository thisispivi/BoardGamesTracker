import "server-only";

import { z } from "zod";

const banStateSchema = z.object({
  banExpires: z.union([z.date(), z.string()]).nullish(),
  banned: z.boolean().nullish(),
});

/**
 * Reports whether an account is currently barred from using the application.
 *
 * Accepts an unknown shape because Better Auth hands back a loosely typed user
 * whose ban columns come from the admin plugin. A ban with a past expiry counts
 * as lifted, matching how that plugin releases expired bans on session creation;
 * an unparseable expiry counts as still banned so a bad value cannot open access.
 *
 * @param user - The account to inspect.
 * @returns Whether the account is banned right now.
 */
export function isCurrentlyBanned(user: unknown): boolean {
  const parsed = banStateSchema.safeParse(user);
  if (!parsed.success || !parsed.data.banned) {
    return false;
  }

  const { banExpires } = parsed.data;
  if (!banExpires) {
    return true;
  }

  const expiresAt =
    banExpires instanceof Date ? banExpires : new Date(banExpires);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > Date.now();
}
