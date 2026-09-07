import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { GameTitle } from "@/components/molecules/GameTitle/GameTitle";

const originalResizeObserver = globalThis.ResizeObserver;

/**
 * Reports a fixed layout so JSDOM can express a clipped or a fitting heading.
 *
 * @param scrollWidth - Width the heading content would need to fit on one line.
 * @param clientWidth - Width the heading is actually given.
 * @returns Nothing.
 */
function stubLayout(scrollWidth: number, clientWidth: number): void {
  for (const [property, value] of [
    ["scrollWidth", scrollWidth],
    ["clientWidth", clientWidth],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get: () => value,
    });
  }

  globalThis.ResizeObserver = class {
    /**
     * Measures immediately, standing in for a browser layout pass.
     *
     * @param callback - Observer callback invoked on the first observation.
     */
    constructor(private readonly callback: ResizeObserverCallback) {}

    /**
     * Reports one entry-free measurement for the observed element.
     *
     * @returns Nothing.
     */
    observe(): void {
      this.callback([], this);
    }

    /**
     * Stops observing, which the stub never needs to undo.
     *
     * @returns Nothing.
     */
    disconnect(): void {}

    /**
     * Stops observing one element, which the stub never needs to undo.
     *
     * @returns Nothing.
     */
    unobserve(): void {}
  };
}

describe("GameTitle", () => {
  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("reveals the whole name on hover when it is clipped", async () => {
    stubLayout(400, 200);
    render(<GameTitle name="Brass: Birmingham Deluxe Edition" />);

    await userEvent.hover(
      screen.getByRole("heading", {
        name: "Brass: Birmingham Deluxe Edition",
      }),
    );

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Brass: Birmingham Deluxe Edition",
    );
  });

  it("adds no tooltip to a name that already fits", async () => {
    stubLayout(120, 200);
    render(<GameTitle name="Azul" />);

    await userEvent.hover(screen.getByRole("heading", { name: "Azul" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
