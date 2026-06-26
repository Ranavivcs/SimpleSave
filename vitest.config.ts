import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest config — resolves the `@/*` path alias (matches tsconfig `paths`) so
 * tests can import modules that use `@/...` imports, like the app code does.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
