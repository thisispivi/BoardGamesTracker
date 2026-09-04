import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import type { MailConfiguration, TransactionalMail } from "@/core";
import { getMailConfiguration } from "@/server/mail/config";
import { log } from "@/utils/logger";

let transporter: Transporter | undefined;

/**
 * Creates the reusable, pooled SMTP transport for transactional messages.
 *
 * @param configuration - Validated connection and sender settings.
 * @returns A pooled Nodemailer transport.
 */
function createTransport(configuration: MailConfiguration): Transporter {
  return nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    requireTLS: configuration.requireTls && !configuration.secure,
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    rateDelta: 1_000,
    rateLimit: 5,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    tls: { minVersion: "TLSv1.2" },
    ...(configuration.user === undefined || configuration.password === undefined
      ? {}
      : {
          auth: {
            user: configuration.user,
            pass: configuration.password,
          },
        }),
  });
}

/**
 * Returns the process-wide SMTP transport, creating it on first use.
 *
 * @param configuration - Validated connection and sender settings.
 * @returns The process-wide Nodemailer transport.
 */
function getTransport(configuration: MailConfiguration): Transporter {
  transporter ??= createTransport(configuration);
  return transporter;
}

/**
 * Sends one multipart transactional message without logging recipient data.
 *
 * @param recipient - Destination address passed directly to the SMTP transport.
 * @param mail - Rendered subject and multipart bodies.
 * @returns A promise that resolves after delivery succeeds or is safely logged.
 */
export async function sendTransactionalMail(
  recipient: string,
  mail: TransactionalMail,
): Promise<void> {
  const configuration = getMailConfiguration();
  if (!configuration) {
    log("error", "smtp_mail_skipped", { reason: "not_configured" });
    return;
  }

  try {
    const result = await getTransport(configuration).sendMail({
      from: {
        name: configuration.fromName,
        address: configuration.fromEmail,
      },
      to: recipient,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      ...(configuration.replyTo === undefined
        ? {}
        : { replyTo: configuration.replyTo }),
    });

    if (result.accepted.length === 0 || result.rejected.length > 0) {
      log("error", "smtp_mail_rejected", {
        acceptedCount: result.accepted.length,
        rejectedCount: result.rejected.length,
      });
      return;
    }

    log("info", "smtp_mail_sent", { acceptedCount: result.accepted.length });
  } catch {
    log("error", "smtp_mail_failed", { reason: "transport_error" });
  }
}
