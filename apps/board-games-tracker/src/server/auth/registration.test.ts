import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute, transaction } = vi.hoisted(() => ({
  execute: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db", () => ({ db: { transaction } }));

import { registerExclusively } from "@/server/auth/registration";

beforeEach(() => {
  vi.clearAllMocks();
  transaction.mockImplementation(
    async (
      operation: (connection: { execute: typeof execute }) => Promise<Response>,
    ) => operation({ execute }),
  );
});

describe("registration serialization", () => {
  it("runs the auth handler only after acquiring the database lock", async () => {
    execute.mockResolvedValue([{ acquired: true }]);
    const register = vi.fn(async () => Response.json({ created: true }));
    expect((await registerExclusively(register)).status).toBe(200);
    expect(register).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();
  });

  it("rejects a competing signup before it can become a second bootstrap administrator", async () => {
    execute.mockResolvedValue([{ acquired: false }]);
    const register = vi.fn();
    const response = await registerExclusively(register);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2");
    expect(register).not.toHaveBeenCalled();
  });

  it("fails closed when the lock query fails", async () => {
    execute.mockRejectedValue(new Error("database unavailable"));
    const register = vi.fn();
    await expect(registerExclusively(register)).rejects.toThrow(
      "database unavailable",
    );
    expect(register).not.toHaveBeenCalled();
  });
});
