import messages from "@messages/en.json";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountSettingsCard } from "@/components/organisms/AccountSettingsCard/AccountSettingsCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/client/authClient", () => ({
  authClient: {
    changeEmail: vi.fn(),
    changePassword: vi.fn(),
    deleteUser: vi.fn(),
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => {
  cleanup();
});

/**
 * Renders the account card for an address on a server with or without mail.
 *
 * @param mailEnabled - Whether the server can send verification email.
 * @returns Nothing.
 */
function renderCard(mailEnabled: boolean): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AccountSettingsCard
        email="owner@example.com"
        mailEnabled={mailEnabled}
      />
    </NextIntlClientProvider>,
  );
}

describe("AccountSettingsCard", () => {
  it("offers an email change when the address can be verified", () => {
    renderCard(true);

    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAttribute(
      "readonly",
    );
    expect(
      screen.getByRole("button", { name: "Save email" }),
    ).toBeInTheDocument();
  });

  it("locks the address when no verification email can be sent", () => {
    renderCard(false);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "readonly",
    );
    expect(
      screen.queryByRole("button", { name: "Save email" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.settings.emailNeedsMail),
    ).toBeInTheDocument();
  });
});
