import { defineConfig } from "@playwright/test";

/**
 * Assumes the full stack is running (docker compose up; server + web dev).
 * Run with `pnpm --filter @ekittens/e2e e2e`.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.WEB_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
});
