import messages from "@messages/en.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";

const { requestPasswordReset } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/utils/authClient", () => ({
  authClient: {
    requestPasswordReset,
    sendVerificationEmail: vi.fn(),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
  },
}));

describe("AuthForm", () => {
  it("offers an enumeration-safe SMTP password-recovery flow", async () => {
    requestPasswordReset.mockResolvedValue({ data: { status: true } });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthForm
          allowSignUp={false}
          bootstrapRequired={false}
          initialMode="login"
          mailEnabled
        />
      </NextIntlClientProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Forgot your password?" }),
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(requestPasswordReset).toHaveBeenCalledWith({
        email: "alex@example.com",
        redirectTo: "/reset-password",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/If an account exists/)).toBeInTheDocument();
  });
});
