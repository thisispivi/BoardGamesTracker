import { z } from "zod";

/**
 * Validates an HTTP endpoint without credentials, query strings, or fragments.
 *
 * Every refinement here parses leniently: Zod keeps running checks after the
 * URL format check fails, so throwing on plain text would surface as an
 * exception instead of a configuration error.
 */
export const httpEndpointSchema = z
  .url()
  .max(2_000)
  .refine((value) => {
    const url = URL.parse(value);
    return (
      url !== null &&
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
    (value) => URL.parse(value)?.pathname === "/",
    "An application origin without a path is required.",
  )
  .transform((value) => new URL(value).origin);

/** Restricts database configuration to PostgreSQL connection URLs. */
export const databaseUrlSchema = z
  .url()
  .max(4_000)
  .refine((value) => {
    const protocol = URL.parse(value)?.protocol;
    return (
      protocol !== undefined && ["postgres:", "postgresql:"].includes(protocol)
    );
  }, "A PostgreSQL connection URL is required.");
