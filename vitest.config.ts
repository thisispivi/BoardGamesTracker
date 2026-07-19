import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Vitest configuration for unit and component tests. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
    environment: "jsdom",
    include: ["src/core/tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/core/tests/setup.ts"],
    testTimeout: 10_000,
  },
});
