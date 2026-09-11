import messages from "@messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "@/app/error";

const captureException = vi.fn();
const reload = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (error: unknown) => captureException(error),
}));

vi.mock("@/components/templates/AuthShell/AuthShell", () => ({
  AuthShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

/**
 * Renders the boundary for one error inside the English message provider.
 *
 * @param error - Error handed to the boundary by Next.js.
 * @param reset - Callback that asks Next.js to retry the boundary.
 * @returns Nothing.
 */
function renderBoundary(
  error: Error & { digest?: string },
  reset: () => void,
): void {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ErrorBoundary error={error} reset={reset} />
    </NextIntlClientProvider>,
  );
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    captureException.mockClear();
    reload.mockClear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload },
    });
  });

  it("reports the failure without showing its message", () => {
    renderBoundary(new Error("connect ECONNREFUSED 10.0.0.1:5432"), vi.fn());

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/ECONNREFUSED/)).toBeNull();
  });

  it("resets the boundary for a client render failure", () => {
    const reset = vi.fn();
    renderBoundary(new Error("render failed"), reset);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads for a server failure that a stale bundle would repeat", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("server failed"), {
      digest: "2289407792",
    });
    renderBoundary(error, reset);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });
});
