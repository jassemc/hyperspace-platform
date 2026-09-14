import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

/**
 * Node-environment unit tests for the platform's pure logic — the
 * date/payload rules that are easy to get wrong and expensive to verify
 * by clicking. Component rendering is deliberately out of scope for now;
 * the browser checks in docs/ cover the interaction level.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["{app,components,lib}/**/*.{test,spec}.{ts,tsx}"],
  },
})
