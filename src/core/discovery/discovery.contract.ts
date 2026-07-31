import { z } from "zod";

/** Validates the untrusted result payload returned by SearXNG. */
export const searxngResponseSchema = z.object({
  results: z
    .array(
      z.object({
        img_src: z
          .string()
          .max(2_000)
          .nullish()
          .transform((value) => value ?? ""),
        title: z.string().max(500),
        url: z.string().max(2_000),
      }),
    )
    .default([]),
});

/** Validates the untrusted item payload returned by BoardGameGeek search. */
export const bggSearchResponseSchema = z.object({
  items: z
    .array(
      z.object({
        href: z.string().max(2_000).nullish(),
        name: z.string().max(300).nullish(),
        objectid: z.union([z.string(), z.number()]),
        objecttype: z.string().max(60).nullish(),
        yearpublished: z.union([z.string(), z.number()]).nullish(),
      }),
    )
    .default([]),
});
