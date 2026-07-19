import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AddGameDialog } from "@/components/organisms/AddGameDialog/AddGameDialog";

import messages from "../../../../../messages/en.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server/actions/collection", () => ({
  addGameAction: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AddGameDialog", () => {
  it("starts a debounced search after three characters without a button", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AddGameDialog currency="EUR" />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add a game" }));
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
    const input = screen.getByPlaceholderText("Game title or BGG URL");

    fireEvent.change(input, { target: { value: "Wi" } });
    act(() => vi.advanceTimersByTime(500));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Win" } });
    act(() => vi.advanceTimersByTime(349));
    expect(fetchMock).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games/search?q=Win",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
