import "server-only";

import type { TransactionalMailKind } from "@/core";
import { env } from "@/env";
import { sendTransactionalMail } from "@/server/mail/sender";
import { buildTransactionalMail, getMailLocale } from "@/server/mail/templates";
import { log } from "@/utils/logger";
import { normalizeMailActionUrl } from "@/utils/mailActionUrl";

/** Values supplied by Better Auth for an account-action message. */
type AuthActionMailInput = {
  kind: TransactionalMailKind;
  name: string;
  newEmail?: string;
  recipient: string;
  request?: Request;
  url: string;
};

/**
 * Validates and delivers one localized Better Auth action message.
 *
 * @param input - Better Auth recipient and signed action details.
 * @returns A promise that resolves after the delivery attempt finishes.
 */
export async function sendAuthActionMail(
  input: AuthActionMailInput,
): Promise<void> {
  const actionUrl = normalizeMailActionUrl(
    input.url,
    env.NEXT_PUBLIC_APP_URL,
    env.BETTER_AUTH_URL,
  );
  if (!actionUrl) {
    log("error", "mail_action_url_rejected", { kind: input.kind });
    return;
  }

  const mail = await buildTransactionalMail({
    actionUrl,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    kind: input.kind,
    locale: getMailLocale(input.request),
    name: input.name,
    ...(input.newEmail === undefined ? {} : { newEmail: input.newEmail }),
  });
  await sendTransactionalMail(input.recipient, mail);
}
