import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import english from "@messages/en.json";

vi.mock("next-intl/server", () => ({
  /**
   * Resolves catalog keys against the bundled English messages.
   *
   * @param options - Locale and namespace requested by the renderer.
   * @param options.namespace - Catalog branch the translator reads from.
   * @returns A translator over the requested namespace.
   */
  getTranslations: async ({ namespace }: { namespace: "mail" }) => {
    const catalog: Record<string, unknown> = english[namespace];
    return (key: string, values?: Record<string, string>) => {
      const message = key
        .split(".")
        .reduce<unknown>(
          (branch, segment) =>
            (branch as Record<string, unknown> | undefined)?.[segment],
          catalog,
        );
      return typeof message === "string"
        ? message.replaceAll(
            /\{(\w+)\}/g,
            (_match, name: string) => values?.[name] ?? "",
          )
        : key;
    };
  },
}));

const { buildTransactionalMail, getMailLocale } =
  await import("@/server/mail/templates");

describe("getMailLocale", () => {
  it("prefers the locale preference cookie over the browser languages", () => {
    expect(
      getMailLocale(
        new Request("https://games.example", {
          headers: {
            cookie: "theme=dark; locale=it",
            "accept-language": "en-US,en;q=0.9",
          },
        }),
      ),
    ).toBe("it");
  });

  it("uses Italian only when it is the primary requested language", () => {
    expect(
      getMailLocale(
        new Request("https://games.example", {
          headers: { "accept-language": "it-IT,it;q=0.9,en;q=0.8" },
        }),
      ),
    ).toBe("it");
    expect(
      getMailLocale(
        new Request("https://games.example", {
          headers: { "accept-language": "en-US,en;q=0.9,it;q=0.8" },
        }),
      ),
    ).toBe("en");
  });

  it("falls back to the default locale for an unsupported preference", () => {
    expect(
      getMailLocale(
        new Request("https://games.example", {
          headers: { cookie: "locale=fr" },
        }),
      ),
    ).toBe("en");
  });
});

describe("buildTransactionalMail", () => {
  it("renders matching plain-text and HTML action links", async () => {
    const mail = await buildTransactionalMail({
      actionUrl: "https://games.example/reset-password?token=opaque",
      appUrl: "https://games.example",
      kind: "passwordReset",
      locale: "en",
      name: "Alex",
    });

    expect(mail.subject).toBe(english.mail.passwordReset.subject);
    expect(mail.text).toContain(
      "https://games.example/reset-password?token=opaque",
    );
    expect(mail.html).toContain(
      'href="https://games.example/reset-password?token=opaque"',
    );
    expect(mail.html).toContain('src="https://games.example/icon-192.png"');
  });

  it("escapes user-controlled values in HTML email content", async () => {
    const mail = await buildTransactionalMail({
      actionUrl: "https://games.example/change?token=opaque&amp=value",
      appUrl: "https://games.example",
      kind: "emailChange",
      locale: "en",
      name: "<script>alert(1)</script>",
      newEmail: "new<script>@example.com",
    });

    expect(mail.html).not.toContain("<script>alert");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&amp;amp=value");
  });
});
