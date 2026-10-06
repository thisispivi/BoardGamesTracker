import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, log, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  log: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("@/server/mail/config", () => ({
  getMailConfiguration: () => ({
    fromEmail: "mail@example.com",
    fromName: "Board Games Tracker",
    host: "smtp.example.com",
    password: "credential",
    port: 587,
    replyTo: "support@example.com",
    requireTls: true,
    secure: false,
    user: "smtp-user",
  }),
}));
vi.mock("@/server/logger", () => ({ log }));

import { sendTransactionalMail } from "@/server/mail/sender";

describe("sendTransactionalMail", () => {
  beforeEach(() => {
    createTransport.mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({
      accepted: ["recipient@example.com"],
      rejected: [],
    });
  });

  it("reuses a pooled, TLS-required transport and sends multipart content", async () => {
    await sendTransactionalMail("recipient@example.com", {
      html: "<p>Action</p>",
      subject: "Account action",
      text: "Action",
    });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        pool: true,
        port: 587,
        requireTLS: true,
        secure: false,
        tls: { minVersion: "TLSv1.2" },
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: {
          address: "mail@example.com",
          name: "Board Games Tracker",
        },
        html: "<p>Action</p>",
        replyTo: "support@example.com",
        text: "Action",
        to: "recipient@example.com",
      }),
    );
    expect(log).toHaveBeenCalledWith("info", "smtp_mail_sent", {
      acceptedCount: 1,
    });
  });
});
