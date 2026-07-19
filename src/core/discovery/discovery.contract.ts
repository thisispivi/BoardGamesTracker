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

/** Validates the untrusted SPARQL result payload returned by Wikidata. */
export const wikidataResponseSchema = z.object({
  results: z.object({
    bindings: z.array(
      z.object({
        bggId: z.object({ value: z.string() }),
        date: z.object({ value: z.string() }).optional(),
      }),
    ),
  }),
});
