import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("@/server/db", () => ({ db: { execute } }));
vi.mock("@/env", () => ({
  env: { HEALTH_CHECK_TOKEN: "health-check-token-0000" },
}));

import { GET } from "@/app/api/health/route";

/**
 * Builds one health probe.
 *
 * @param authorization - Authorization header to send, or null to send none.
 * @returns A request for the health endpoint.
 */
function probe(authorization: string | null): Request {
  return new Request(
    "https://tracker.test/api/health",
    authorization === null ? {} : { headers: { authorization } },
  );
}

beforeEach(() => {
  execute.mockReset();
  execute.mockResolvedValue([]);
});

describe("GET /api/health", () => {
  it("answers ok to a probe carrying the configured bearer token", async () => {
    const response = await GET(probe("Bearer health-check-token-0000"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("rejects a missing, wrong, or unprefixed token before querying the database", async () => {
    for (const authorization of [
      null,
      "Bearer wrong",
      "health-check-token-0000",
      "Bearer health-check-token-00000",
    ]) {
      expect((await GET(probe(authorization))).status).toBe(401);
    }
    expect(execute).not.toHaveBeenCalled();
  });

  it("reports an unreachable database without exposing the failure", async () => {
    execute.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:5432"));

    const response = await GET(probe("Bearer health-check-token-0000"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });
});
