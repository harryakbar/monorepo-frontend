/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()] as any,
  base: "/",
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '**/*.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/setupTests.ts',
        '**/vite.config.ts',
        'dist/**',
      ],
    },
  },
});
