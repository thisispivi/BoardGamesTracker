/** Languages supported by authentication email templates. */
export type MailLocale = "en" | "it";

/** Transactional authentication messages delivered through SMTP. */
export type TransactionalMailKind =
  "accountDeletion" | "emailChange" | "passwordReset" | "verification";

/** Safe dynamic values accepted by the transactional email renderer. */
export type TransactionalMailInput = {
  actionUrl: string;
  kind: TransactionalMailKind;
  locale: MailLocale;
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
