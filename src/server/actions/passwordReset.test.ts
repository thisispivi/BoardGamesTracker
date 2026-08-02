import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyPasswordReset,
  isUserCurrentlyBanned,
  verifyPasswordResetToken,
  writeAuditEvent,
} = vi.hoisted(() => ({
  applyPasswordReset: vi.fn(),
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
vi.mock("@/server/security/rateLimit", () => ({
  consumeRateLimit: vi.fn(() => true),
}));

import { resetPasswordAction } from "@/server/actions/passwordReset";

/** Builds a valid reset submission for action-level authorization tests. */
function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("password", "a-secure-password");
  formData.set("token", "signed-reset-token");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyPasswordResetToken.mockResolvedValue("user-1");
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
    );
    expect(writeAuditEvent).toHaveBeenCalledOnce();
  });
});
