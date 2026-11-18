import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyPasswordReset,
  consumeRateLimit,
  isUserCurrentlyBanned,
  verifyPasswordResetToken,
  writeAuditEvent,
} = vi.hoisted(() => ({
  applyPasswordReset: vi.fn(),
  consumeRateLimit: vi.fn(),
  isUserCurrentlyBanned: vi.fn(),
  verifyPasswordResetToken: vi.fn(),
  writeAuditEvent: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/server/audit", () => ({ writeAuditEvent }));
vi.mock("@/server/auth/passwordReset", () => ({
  applyPasswordReset,
  verifyPasswordResetToken,
}));
vi.mock("@/server/security/accountAccess", () => ({
  isUserCurrentlyBanned,
}));
vi.mock("@/server/security/rateLimit", () => ({ consumeRateLimit }));

import { resetPasswordAction } from "@/server/actions/passwordReset";

/**
 * Builds a valid reset submission for action-level authorization tests.
 *
 * @returns A valid password-reset form submission.
 */
function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("password", "a-secure-password");
  formData.set("token", "signed-reset-token");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  consumeRateLimit.mockReturnValue(true);
  verifyPasswordResetToken.mockResolvedValue("user-1");
  applyPasswordReset.mockResolvedValue(true);
});

describe("resetPasswordAction", () => {
  it("refuses to change credentials for a banned account", async () => {
    isUserCurrentlyBanned.mockResolvedValue(true);

    await expect(
      resetPasswordAction({ message: "", success: false }, buildFormData()),
    ).resolves.toEqual({
      message: "reset.invalid",
      success: false,
    });
    expect(applyPasswordReset).not.toHaveBeenCalled();
    expect(writeAuditEvent).not.toHaveBeenCalled();
  });

  it("changes credentials for an allowed account", async () => {
    isUserCurrentlyBanned.mockResolvedValue(false);

    await expect(
      resetPasswordAction({ message: "", success: false }, buildFormData()),
    ).resolves.toEqual({
      message: "reset.done",
      success: true,
    });
    expect(applyPasswordReset).toHaveBeenCalledWith(
      "user-1",
      "a-secure-password",
      "signed-reset-token",
    );
    expect(writeAuditEvent).toHaveBeenCalledOnce();
  });

  it("reports a token consumed between the initial check and the write", async () => {
    isUserCurrentlyBanned.mockResolvedValue(false);
    applyPasswordReset.mockResolvedValue(false);
    expect(
      await resetPasswordAction(
        { message: "", success: false },
        buildFormData(),
      ),
    ).toEqual({ message: "reset.invalid", success: false });
    expect(writeAuditEvent).not.toHaveBeenCalled();
  });

  it("meters attempts per account so one target cannot lock out the rest", async () => {
    isUserCurrentlyBanned.mockResolvedValue(false);

    await resetPasswordAction({ message: "", success: false }, buildFormData());

    expect(consumeRateLimit).toHaveBeenCalledWith(
      "passwordReset:user-1",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("spends the per-account allowance only on a token that verified", async () => {
    verifyPasswordResetToken.mockResolvedValue(null);

    await resetPasswordAction({ message: "", success: false }, buildFormData());

    expect(consumeRateLimit).not.toHaveBeenCalledWith(
      expect.stringContaining("passwordReset:"),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("reports an exhausted account allowance without changing credentials", async () => {
    isUserCurrentlyBanned.mockResolvedValue(false);
    consumeRateLimit.mockImplementation(
      (key: string) => key !== "passwordReset:user-1",
    );

    expect(
      await resetPasswordAction(
        { message: "", success: false },
        buildFormData(),
      ),
    ).toEqual({ message: "reset.tooMany", success: false });
    expect(applyPasswordReset).not.toHaveBeenCalled();
  });

  it("rejects oversized tokens instead of truncating them into valid credentials", async () => {
    const form = buildFormData();
    form.set("token", "x".repeat(4_001));
    expect(
      (await resetPasswordAction({ message: "", success: false }, form))
        .success,
    ).toBe(false);
    expect(verifyPasswordResetToken).not.toHaveBeenCalled();
  });
});
