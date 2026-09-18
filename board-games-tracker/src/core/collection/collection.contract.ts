import { z } from "zod";

import {
  bggImageUrlSchema,
  emptyAsNull,
  moneySpentSchema,
  refineGameRanges,
  yearPublishedSchema,
} from "@/core/shared/shared.contract";

/** Validates a collection-item identifier. */
export const itemIdSchema = z.uuid();

/**
 * Reads the gifted checkbox, which is absent from the form when unchecked.
 *
 * A missing or blank value therefore means not gifted, unlike the required
 * Boolean fields that reject anything but an explicit `true` or `false`.
 */
export const giftedSchema = z
  .enum(["true", "false"])
  .nullish()
  .transform((value) => value === "true");

/** Purchase fields every owned entry carries, as a form submits them. */
const purchaseFields = {
  gifted: giftedSchema,
  moneySpent: z.coerce.number().pipe(moneySpentSchema),
};

/**
 * Records no price for a gift, whatever the form sent alongside the checkbox.
 *
 * @param item - Parsed fields carrying the gifted flag and the submitted price.
 * @returns The same fields with the price cleared when the entry is a gift.
 */
function clearGiftedSpend<
  TItem extends { gifted: boolean; moneySpent: number },
>(item: TItem): TItem {
  return { ...item, moneySpent: item.gifted ? 0 : item.moneySpent };
}

/** Validates editable metadata supplied while adding a game. */
export const gameDetailsSchema = z
  .object({
    ...purchaseFields,
    categories: z.string().trim().max(500),
    description: z.string().trim().max(2_000),
    families: z.string().trim().max(1_000),
    imageUrl: emptyAsNull(bggImageUrlSchema),
    maxPlayers: z.coerce.number().int().min(1).max(99),
    maxPlaytime: z.coerce.number().int().min(1).max(10_000),
    mechanics: z.string().trim().max(1_000),
    minPlayers: z.coerce.number().int().min(1).max(99),
    minPlaytime: z.coerce.number().int().min(0).max(10_000),
    weight: emptyAsNull(z.coerce.number().min(1).max(5)),
    yearPublished: emptyAsNull(z.coerce.number().pipe(yearPublishedSchema)),
  })
  .superRefine(refineGameRanges)
  .transform(clearGiftedSpend);

/** Validates user-owned collection fields. */
export const editCollectionItemSchema = z
  .object({
    ...purchaseFields,
    itemId: itemIdSchema,
    notes: z.string().trim().max(4_000),
    personalRating: emptyAsNull(z.coerce.number().min(0).max(10)),
  })
  .transform(clearGiftedSpend);

/** Validates the purchase recorded when a wished-for game joins the collection. */
export const purchaseCollectionItemSchema = z
  .object({ ...purchaseFields, itemId: itemIdSchema })
  .transform(clearGiftedSpend);

/** Validates the collection destination selected by the user. */
export const libraryDestinationSchema = z.enum(["collection", "wishlist"]);
