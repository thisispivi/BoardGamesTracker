import "server-only";

import type {
  MailLocale,
  TransactionalMail,
  TransactionalMailInput,
} from "@/core";

/** Localized semantic content inserted into the shared email frame. */
type MailCopy = {
  action: string;
  body: string;
  heading: string;
  preview: string;
  safety: string;
  subject: string;
};

/**
 * Escapes dynamic text before inserting it into an HTML email.
 *
 * @param value - User or framework text destined for HTML.
 * @returns Text with HTML-significant characters encoded.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Selects the supported mail language from an authentication request.
 *
 * @param request - Request whose language preference may be available.
 * @returns Italian for an Italian primary preference, otherwise English.
 */
export function getMailLocale(request?: Request): MailLocale {
  const primary = request?.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  return primary === "it" || primary?.startsWith("it-") ? "it" : "en";
}

/**
 * Produces localized copy for one authentication email purpose.
 *
 * @param input - Trusted action URL and bounded recipient details.
 * @returns Semantic text used by both HTML and plain-text bodies.
 */
function getMailCopy(input: TransactionalMailInput): MailCopy {
  const newEmail = input.newEmail ?? "";
  if (input.locale === "it") {
    if (input.kind === "verification") {
      return {
        action: "Verifica indirizzo email",
        body: "Conferma che questo indirizzo email appartiene a te per completare la configurazione dell’account.",
        heading: "Verifica il tuo indirizzo email",
        preview: "Completa la verifica dell’account Board Games Tracker.",
        safety:
          "Se non hai creato questo account, puoi ignorare questa email. Il link scade tra 60 minuti.",
        subject: "Verifica il tuo indirizzo email",
      };
    }
    if (input.kind === "passwordReset") {
      return {
        action: "Reimposta password",
        body: "Abbiamo ricevuto una richiesta di reimpostazione della password del tuo account.",
        heading: "Scegli una nuova password",
        preview: "Usa questo link sicuro per reimpostare la password.",
        safety:
          "Se non hai richiesto la reimpostazione, ignora questa email. Il link scade tra 60 minuti e può essere usato una sola volta.",
        subject: "Reimposta la password",
      };
    }
    if (input.kind === "emailChange") {
      return {
        action: "Conferma modifica email",
        body: `È stata richiesta la sostituzione del tuo indirizzo email con ${newEmail}. Conferma la modifica dal tuo indirizzo attuale.`,
        heading: "Conferma il nuovo indirizzo email",
        preview: "Autorizza la modifica dell’indirizzo email del tuo account.",
        safety:
          "Se non hai richiesto questa modifica, non usare il link e cambia la password. Il link scade tra 60 minuti.",
        subject: "Conferma la modifica dell’indirizzo email",
      };
    }
    return {
      action: "Conferma eliminazione account",
      body: "È stata richiesta l’eliminazione definitiva del tuo account e dei dati associati.",
      heading: "Conferma l’eliminazione dell’account",
      preview: "Conferma la richiesta di eliminazione dell’account.",
      safety:
        "Non usare il link se non hai richiesto l’eliminazione. Il link scade tra 24 ore.",
      subject: "Conferma l’eliminazione dell’account",
    };
  }

  if (input.kind === "verification") {
    return {
      action: "Verify email address",
      body: "Confirm that this email address belongs to you to finish setting up your account.",
      heading: "Verify your email address",
      preview: "Complete your Board Games Tracker account verification.",
      safety:
        "If you did not create this account, you can ignore this email. The link expires in 60 minutes.",
      subject: "Verify your email address",
    };
  }
  if (input.kind === "passwordReset") {
    return {
      action: "Reset password",
      body: "We received a request to reset the password for your account.",
      heading: "Choose a new password",
      preview: "Use this secure link to reset your password.",
      safety:
        "If you did not request a reset, ignore this email. The link expires in 60 minutes and can be used only once.",
      subject: "Reset your password",
    };
  }
  if (input.kind === "emailChange") {
    return {
      action: "Confirm email change",
      body: `A request was made to replace your email address with ${newEmail}. Confirm the change from your current address.`,
      heading: "Confirm your new email address",
      preview: "Authorize the email-address change for your account.",
      safety:
        "If you did not request this change, do not use the link and change your password. The link expires in 60 minutes.",
      subject: "Confirm your email-address change",
    };
  }
  return {
    action: "Confirm account deletion",
    body: "A request was made to permanently delete your account and its associated data.",
    heading: "Confirm account deletion",
    preview: "Confirm your account-deletion request.",
    safety:
      "Do not use the link if you did not request deletion. The link expires in 24 hours.",
    subject: "Confirm account deletion",
  };
}

/**
 * Renders a responsive multipart authentication email with a visible fallback URL.
 *
 * @param input - Trusted action URL and localized recipient details.
 * @returns Plain-text and HTML bodies with a matching subject.
 */
export function buildTransactionalMail(
  input: TransactionalMailInput,
): TransactionalMail {
  const copy = getMailCopy(input);
  const safeBody = escapeHtml(copy.body);
  const safeUrl = escapeHtml(input.actionUrl);
  const greeting =
    input.locale === "it" ? `Ciao ${input.name},` : `Hi ${input.name},`;
  const footer =
    input.locale === "it"
      ? "Questa email è stata inviata automaticamente da Board Games Tracker."
      : "This email was sent automatically by Board Games Tracker.";
  const fallback =
    input.locale === "it"
      ? "Se il pulsante non funziona, copia questo indirizzo nel browser:"
      : "If the button does not work, copy this address into your browser:";

  return {
    subject: copy.subject,
    text: `${greeting}\n\n${copy.body}\n\n${copy.action}: ${input.actionUrl}\n\n${copy.safety}\n\n${footer}`,
    html: `<!doctype html>
<html lang="${input.locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0;background:#f6f4ed;color:#20231d;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(copy.preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ed;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:1px solid #dedbd0;border-radius:18px;overflow:hidden">
          <tr><td style="padding:28px 32px 18px;font-size:18px;font-weight:700;color:#18594b">Board Games Tracker</td></tr>
          <tr><td style="padding:0 32px 32px">
            <p style="margin:0 0 18px;font-size:15px;line-height:24px">${escapeHtml(greeting)}</p>
            <h1 style="margin:0 0 14px;font-size:28px;line-height:34px;letter-spacing:-0.5px">${escapeHtml(copy.heading)}</h1>
            <p style="margin:0 0 26px;color:#5f645b;font-size:15px;line-height:24px">${safeBody}</p>
            <p style="margin:0 0 26px"><a href="${safeUrl}" style="display:inline-block;background:#18594b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 20px;border-radius:999px">${escapeHtml(copy.action)}</a></p>
            <p style="margin:0 0 8px;color:#6e7268;font-size:12px;line-height:19px">${escapeHtml(fallback)}</p>
            <p style="margin:0 0 24px;word-break:break-all;font-size:12px;line-height:19px"><a href="${safeUrl}" style="color:#18594b">${safeUrl}</a></p>
            <p style="margin:0;padding-top:20px;border-top:1px solid #dedbd0;color:#6e7268;font-size:12px;line-height:19px">${escapeHtml(copy.safety)}</p>
          </td></tr>
        </table>
        <p style="margin:18px 0 0;color:#777b72;font-size:11px;line-height:18px">${escapeHtml(footer)}</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
