import "server-only";

import { revalidatePath } from "next/cache";

/** Routes that render the signed-in user's games, counts, or statistics. */
const libraryRoutes = [
  "/collection",
  "/wishlist",
  "/dashboard",
  "/stats",
  "/play",
] as const;

/**
 * Revalidates every route that renders a user's own library.
 *
 * Adding, editing, or removing one entry changes the collection and wishlist
 * grids, the dashboard counters, the statistics charts, and the picker pool at
 * once, so they are invalidated together rather than per call site.
 *
 * @returns Nothing.
 */
export function revalidateLibraryRoutes(): void {
  for (const route of libraryRoutes) {
    revalidatePath(route);
  }
}

/**
 * Revalidates the account settings page, such as after a sharing change.
 *
 * @returns Nothing.
 */
export function revalidateSettingsRoutes(): void {
  revalidatePath("/settings");
}

/**
 * Revalidates the administrator console after an account or catalog change.
 *
 * @returns Nothing.
 */
export function revalidateAdminRoutes(): void {
  revalidatePath("/admin");
}

/**
 * Revalidates every route below the root layout, such as after a locale change.
 *
 * @returns Nothing.
 */
export function revalidateAllRoutes(): void {
  revalidatePath("/", "layout");
}

/**
 * Revalidates the account settings page along with every library route.
 *
 * @returns Nothing.
 */
export function revalidateAccountRoutes(): void {
  revalidateSettingsRoutes();
  revalidateLibraryRoutes();
}

/**
 * Revalidates the administrator console along with every library route.
 *
 * Game metadata is shared, so one correction changes what every user sees.
 *
 * @returns Nothing.
 */
export function revalidateSharedGameRoutes(): void {
  revalidateAdminRoutes();
  revalidateLibraryRoutes();
}
