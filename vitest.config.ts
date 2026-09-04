import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Vitest configuration for unit and component tests. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@messages": fileURLToPath(new URL("./messages", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      /*
       * Scope is the files the suite actually imports, not all of `src`, so
       * this floor measures how well the tested modules are tested. It stops a
       * covered module from growing an untested branch; it says nothing about
       * a brand-new file that ships with no test at all, which review catches.
       * Raise these as coverage grows rather than leaving slack behind.
       */
      thresholds: {
        branches: 60,
        functions: 75,
        lines: 80,
        statements: 80,
      },
    },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "messages/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10_000,
  },
});
