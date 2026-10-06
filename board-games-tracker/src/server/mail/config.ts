import "server-only";

import type { MailConfiguration } from "@/core";
import { env } from "@/env";

/**
 * Reports whether enough SMTP settings exist to enable email authentication flows.
 *
 * @returns Whether a host and sender address have both been configured.
 */
export function isMailConfigured(): boolean {
  return getMailConfiguration() !== null;
}

/**
 * Returns a complete SMTP configuration and rejects unsafe partial credentials.
 *
 * @returns Validated SMTP settings, or null when transactional email is disabled.
 */
export function getMailConfiguration(): MailConfiguration | null {
  if (!env.SMTP_HOST && !env.SMTP_FROM_EMAIL) return null;
  if (!env.SMTP_HOST || !env.SMTP_FROM_EMAIL) {
    throw new Error(
      "SMTP_HOST and SMTP_FROM_EMAIL must be configured together.",
    );
  }
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  }

  return {
    fromEmail: env.SMTP_FROM_EMAIL,
    fromName: env.SMTP_FROM_NAME,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    requireTls: env.SMTP_REQUIRE_TLS,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_PASSWORD === undefined ? {} : { password: env.SMTP_PASSWORD }),
    ...(env.SMTP_REPLY_TO === undefined ? {} : { replyTo: env.SMTP_REPLY_TO }),
    ...(env.SMTP_USER === undefined ? {} : { user: env.SMTP_USER }),
  };
}
