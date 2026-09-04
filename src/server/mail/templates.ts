import "server-only";

import { getTranslations } from "next-intl/server";

import type { TransactionalMail, TransactionalMailInput } from "@/core";
import { type AppLocale, defaultLocale, isLocale } from "@/i18n/config";

/** Light-theme palette mirroring the application tokens in `globals.css`. */
const palette = {
  accent: "#ef8354",
  background: "#f6f4ed",
  border: "#dedbd0",
  card: "#fffdf8",
  foreground: "#20231d",
  muted: "#6e7268",
  primary: "#18594b",
  primaryForeground: "#f9fff9",
} as const;

/** Dark-theme palette applied by mail clients that report a dark colour scheme. */
const darkPalette = {
  background: "#111511",
  border: "#30372f",
  card: "#191e19",
  foreground: "#edf0e8",
  muted: "#a3aa9d",
  primary: "#62c6a5",
  primaryForeground: "#092119",
} as const;

const fontStack = "'Avenir Next', 'Inter', 'Segoe UI', Arial, sans-serif";

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
 * Selects the language of an authentication email for one recipient.
 *
 * The locale preference cookie set by the language switcher wins, so a message
 * matches the language the account owner reads the application in; the browser
 * `Accept-Language` header is only consulted when no preference exists.
 *
 * @param request - Request whose language preference may be available.
 * @returns The supported locale used to render the message.
 */
export function getMailLocale(request?: Request): AppLocale {
  const preference = request?.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)locale=([^;]*)/)?.[1];
  if (isLocale(preference)) return preference;

  const primary = request?.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  return primary === "it" || primary?.startsWith("it-") ? "it" : defaultLocale;
}

/**
 * Renders a responsive, themed authentication email with a visible fallback URL.
 *
 * Copy comes from the message catalog of the recipient's own locale, and every
 * dynamic value is HTML-escaped before it reaches the markup.
 *
 * @param input - Trusted action URL and localized recipient details.
 * @returns Plain-text and HTML bodies with a matching subject.
 */
export async function buildTransactionalMail(
  input: TransactionalMailInput,
): Promise<TransactionalMail> {
  const t = await getTranslations({ locale: input.locale, namespace: "mail" });
  const body = t(`${input.kind}.body`, { email: input.newEmail ?? "" });
  const action = t(`${input.kind}.action`);
  const safety = t(`${input.kind}.safety`);
  const subject = t(`${input.kind}.subject`);
  const greeting = t("greeting", { name: input.name });
  const footer = t("footer");
  const safeUrl = escapeHtml(input.actionUrl);
  const logoUrl = escapeHtml(new URL("/icon-192.png", input.appUrl).toString());

  return {
    subject,
    text: `${greeting}\n\n${body}\n\n${action}: ${input.actionUrl}\n\n${safety}\n\n${footer}`,
    html: `<!doctype html>
<html lang="${input.locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${escapeHtml(subject)}</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .mail-canvas { background: ${darkPalette.background} !important; }
        .mail-card {
          background: ${darkPalette.card} !important;
          border-color: ${darkPalette.border} !important;
        }
        .mail-strong { color: ${darkPalette.foreground} !important; }
        .mail-quiet { color: ${darkPalette.muted} !important; }
        .mail-rule { border-top-color: ${darkPalette.border} !important; }
        .mail-action {
          background: ${darkPalette.primary} !important;
          color: ${darkPalette.primaryForeground} !important;
        }
        .mail-link { color: ${darkPalette.primary} !important; }
      }
    </style>
  </head>
  <body class="mail-canvas" style="margin:0;background:${palette.background};color:${palette.foreground};font-family:${fontStack}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(t(`${input.kind}.preview`))}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="mail-canvas" style="background:${palette.background};padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="mail-card" style="max-width:560px;background:${palette.card};border:1px solid ${palette.border};border-radius:22px;overflow:hidden">
          <tr><td style="padding:28px 32px 18px">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="padding-right:12px"><img alt="${escapeHtml(t("logoAlt"))}" height="40" src="${logoUrl}" style="display:block;border:0;border-radius:12px" width="40"></td>
              <td class="mail-strong" style="font-size:18px;font-weight:700;color:${palette.foreground}">Board Games Tracker</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:0 32px 32px">
            <p class="mail-strong" style="margin:0 0 18px;font-size:15px;line-height:24px;color:${palette.foreground}">${escapeHtml(greeting)}</p>
            <h1 class="mail-strong" style="margin:0 0 14px;font-size:28px;line-height:34px;letter-spacing:-0.5px;color:${palette.foreground}">${escapeHtml(t(`${input.kind}.heading`))}</h1>
            <p class="mail-quiet" style="margin:0 0 26px;color:${palette.muted};font-size:15px;line-height:24px">${escapeHtml(body)}</p>
            <p style="margin:0 0 26px"><a class="mail-action" href="${safeUrl}" style="display:inline-block;background:${palette.primary};color:${palette.primaryForeground};text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:999px">${escapeHtml(action)}</a></p>
            <p class="mail-quiet" style="margin:0 0 8px;color:${palette.muted};font-size:12px;line-height:19px">${escapeHtml(t("fallback"))}</p>
            <p style="margin:0 0 24px;word-break:break-all;font-size:12px;line-height:19px"><a class="mail-link" href="${safeUrl}" style="color:${palette.primary}">${safeUrl}</a></p>
            <p class="mail-quiet mail-rule" style="margin:0;padding-top:20px;border-top:1px solid ${palette.border};color:${palette.muted};font-size:12px;line-height:19px">${escapeHtml(safety)}</p>
          </td></tr>
        </table>
        <p class="mail-quiet" style="margin:18px 0 0;color:${palette.muted};font-size:11px;line-height:18px">${escapeHtml(footer)}</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
