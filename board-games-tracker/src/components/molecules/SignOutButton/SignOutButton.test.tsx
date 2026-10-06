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

import { SignOutButton } from "@/components/molecules/SignOutButton/SignOutButton";

const { push, refresh, signOut, toastError } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/client/authClient", () => ({ authClient: { signOut } }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/**
 * Renders the button inside the translation provider it depends on.
 *
 * @returns Nothing.
 */
function renderButton(): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SignOutButton />
    </NextIntlClientProvider>,
  );
}

describe("SignOutButton", () => {
  it("returns to the public entry page once the session is revoked", async () => {
    signOut.mockResolvedValue(undefined);
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("keeps the user in place when revoking the session fails", async () => {
    signOut.mockRejectedValue(new Error("network down"));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Signing out failed. Try again."),
    );
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
