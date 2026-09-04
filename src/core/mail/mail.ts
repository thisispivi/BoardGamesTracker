import type { AppLocale } from "@/i18n/config";

/** Transactional authentication messages delivered through SMTP. */
export type TransactionalMailKind =
  "accountDeletion" | "emailChange" | "passwordReset" | "verification";

/** Safe dynamic values accepted by the transactional email renderer. */
export type TransactionalMailInput = {
  actionUrl: string;
  appUrl: string;
  kind: TransactionalMailKind;
  locale: AppLocale;
  name: string;
  newEmail?: string;
};

/** Fully rendered multipart email content ready for delivery. */
export type TransactionalMail = {
  html: string;
  subject: string;
  text: string;
};

/** Validated SMTP settings used to create the shared transport. */
export type MailConfiguration = {
  fromEmail: string;
  fromName: string;
  host: string;
  password?: string;
  port: number;
  replyTo?: string;
  requireTls: boolean;
  secure: boolean;
  user?: string;
};
