import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/utils/setup.ts"],
    include: [
      "src/tests/unit/**/*.{test,spec}.{ts,tsx}",
      "src/tests/integration/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", ".next", "src/tests/e2e/**"],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.{ts,tsx}", "src/utils/**/*.{ts,tsx}", "src/config/**/*.{ts,tsx}", "src/components/ui/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/tests/**",
        "src/app/**",
        "src/models/**",
        "**/index.ts",
      ],
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  },
});
