import { z } from "zod";

/** Validates an HTTP endpoint without credentials, query strings, or fragments. */
export const httpEndpointSchema = z
  .url()
  .max(2_000)
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  }, "An HTTP or HTTPS URL without credentials, query, or fragment is required.");

/** Normalizes an application origin and rejects unsupported path deployments. */
export const appOriginSchema = httpEndpointSchema
  .refine(
    (value) => new URL(value).pathname === "/",
    "An application origin without a path is required.",
  )
  .transform((value) => new URL(value).origin);

/** Restricts database configuration to PostgreSQL connection URLs. */
export const databaseUrlSchema = z
  .url()
  .max(4_000)
  .refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "A PostgreSQL connection URL is required.",
  );
