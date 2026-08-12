import "@testing-library/jest-dom/vitest";

/** Minimal layout observer used by Radix floating controls in JSDOM. */
class TestResizeObserver implements ResizeObserver {
  /**
   * Stops observing every element in the no-op test implementation.
   *
   * @returns Nothing.
   */
  disconnect() {}

  /**
   * Starts observing an element in the no-op test implementation.
   *
   * @returns Nothing.
   */
  observe() {}

  /**
   * Stops observing an element in the no-op test implementation.
   *
   * @returns Nothing.
   */
  unobserve() {}
}

globalThis.ResizeObserver = TestResizeObserver;

HTMLElement.prototype.hasPointerCapture ??= () => false;
HTMLElement.prototype.releasePointerCapture ??= () => undefined;
HTMLElement.prototype.scrollIntoView ??= () => undefined;
