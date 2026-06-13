import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/services/*/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://ekittens:ekittens@localhost:5432/ekittens",
  },
});
