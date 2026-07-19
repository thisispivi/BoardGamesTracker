import { z } from "zod";

/** Validates artwork hosted by BoardGameGeek's secure image CDN. */
export const bggImageUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "cf.geekdo-images.com";
}, "Artwork must use the secure BoardGameGeek image host.");

/** Validates a bounded, non-empty taxonomy label. */
export const labelSchema = z.string().trim().min(1).max(120);
