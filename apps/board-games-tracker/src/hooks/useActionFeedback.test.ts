import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CollectionActionState } from "@/core";
import { useActionFeedback } from "@/hooks/useActionFeedback";

const toastError = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("useActionFeedback", () => {
  it("stays silent before the action has answered", () => {
    renderHook(() =>
      useActionFeedback({ message: "", success: false }, vi.fn()),
    );

    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("announces a failure once even when the callback changes identity", () => {
    const state: CollectionActionState = { message: "Nope", success: false };
    const onSuccess = vi.fn();
    const { rerender } = renderHook(() =>
      useActionFeedback(state, () => onSuccess()),
    );
    rerender();

    expect(toastError).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("runs the success callback after announcing the outcome", () => {
    vi.useFakeTimers();
    const onSuccess = vi.fn();
    renderHook(() =>
      useActionFeedback({ message: "Saved", success: true }, onSuccess),
    );

    expect(toastSuccess).toHaveBeenCalledWith("Saved");
    expect(onSuccess).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
