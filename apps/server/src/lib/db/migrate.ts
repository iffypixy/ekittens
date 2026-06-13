import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { loadConfig } from "../config/config.ts";
import { createDatabase } from "./db.ts";

/** Apply pending Drizzle migrations. Run via `pnpm db:migrate`. */
export const runMigrations = async (connectionString: string): Promise<void> => {
  const { db, pool } = createDatabase(connectionString);
  const migrationsFolder = fileURLToPath(new URL("../../../drizzle", import.meta.url));
  await migrate(db, { migrationsFolder });
  await pool.end();
};

if (import.meta.url === `file://${process.argv[1]}`) {
  await runMigrations(loadConfig().DATABASE_URL);
}
