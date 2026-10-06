import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { GameTitle } from "@/components/molecules/GameTitle/GameTitle";

const originalResizeObserver = globalThis.ResizeObserver;
const observations = new Set<() => void>();

/**
 * Re-measures every observed element, as a browser does after it relayouts.
 *
 * A heading that moved into or out of the tooltip is a different element, so
 * this is what distinguishes an observer following the rendered heading from
 * one left watching the element it replaced.
 *
 * @returns Nothing.
 */
function relayout(): void {
  act(() => {
    for (const measure of observations) {
      measure();
    }
  });
}

/**
 * Reports a fixed layout so JSDOM can express a clipped or a fitting heading.
 *
 * Detached elements report zero, matching a browser and revealing an observer
 * that is still measuring an element no longer in the document.
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
      get(this: HTMLElement) {
        return this.isConnected ? value : 0;
      },
    });
  }

  globalThis.ResizeObserver = class {
    /**
     * Records the callback that reports a measurement to the component.
     *
     * @param callback - Observer callback invoked on every measurement.
     */
    constructor(private readonly callback: ResizeObserverCallback) {}

    /**
     * Measures immediately and on every later relayout.
     *
     * @returns Nothing.
     */
    observe(): void {
      observations.add(this.measure);
      this.measure();
    }

    /**
     * Stops reporting measurements for this observer.
     *
     * @returns Nothing.
     */
    disconnect(): void {
      observations.delete(this.measure);
    }

    /**
     * Stops reporting measurements, which this stub does per observer.
     *
     * @returns Nothing.
     */
    unobserve(): void {
      this.disconnect();
    }

    /**
     * Reports one entry-free measurement to the observed component.
     *
     * @returns Nothing.
     */
    private readonly measure = (): void => {
      this.callback([], this);
    };
  };
}

describe("GameTitle", () => {
  afterEach(() => {
    observations.clear();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("reveals the whole name on hover when it is clipped", async () => {
    stubLayout(400, 200);
    render(<GameTitle name="Brass: Birmingham Deluxe Edition" />);
    relayout();

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
    relayout();

    await userEvent.hover(screen.getByRole("heading", { name: "Azul" }));

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
