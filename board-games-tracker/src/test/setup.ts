import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

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

/** Visibility observer that never reports an intersection, used by scroll-driven components in JSDOM. */
class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly scrollMargin = "0px";
  readonly thresholds: readonly number[] = [];

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
   * Reports the queued entries, of which the no-op implementation has none.
   *
   * @returns An empty list.
   */
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /**
   * Stops observing an element in the no-op test implementation.
   *
   * @returns Nothing.
   */
  unobserve() {}
}

globalThis.IntersectionObserver ??= TestIntersectionObserver;

HTMLElement.prototype.hasPointerCapture ??= () => false;
HTMLElement.prototype.releasePointerCapture ??= () => undefined;
HTMLElement.prototype.scrollIntoView ??= () => undefined;
