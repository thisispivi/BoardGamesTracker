import messages from "@messages/en.json";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/organisms/AuthForm/AuthForm";

const { requestPasswordReset, signInEmail, toastError } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  signInEmail: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/client/authClient", () => ({
  authClient: {
    requestPasswordReset,
    sendVerificationEmail: vi.fn(),
    signIn: { email: signInEmail },
    signUp: { email: vi.fn() },
  },
}));
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Renders the sign-in form with mail delivery configured.
 *
 * @returns Nothing.
 */
function renderSignIn(): void {
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
}

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

  it("reports an unreachable server and re-enables the form", async () => {
    signInEmail.mockRejectedValue(new Error("network down"));
    renderSignIn();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The server could not be reached. Check your connection and try again.",
      ),
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });
});
