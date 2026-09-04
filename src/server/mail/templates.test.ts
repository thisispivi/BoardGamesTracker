import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildTransactionalMail, getMailLocale } from "@/server/mail/templates";

describe("getMailLocale", () => {
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
});

describe("buildTransactionalMail", () => {
  it("renders matching plain-text and HTML action links", () => {
    const mail = buildTransactionalMail({
      actionUrl: "https://games.example/reset-password?token=opaque",
      kind: "passwordReset",
      locale: "en",
      name: "Alex",
    });

    expect(mail.subject).toBe("Reset your password");
    expect(mail.text).toContain(
      "https://games.example/reset-password?token=opaque",
    );
    expect(mail.html).toContain(
      'href="https://games.example/reset-password?token=opaque"',
    );
  });

  it("escapes user-controlled values in HTML email content", () => {
    const mail = buildTransactionalMail({
      actionUrl: "https://games.example/change?token=opaque&amp=value",
      kind: "emailChange",
      locale: "en",
      name: "<script>alert(1)</script>",
      newEmail: "new<script>@example.com",
    });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&amp;amp=value");
  });
});
