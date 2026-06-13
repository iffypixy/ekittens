import { type NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as ratingsSchema from "../services/ratings/schema.ts";
import * as relationshipsSchema from "../services/relationships/schema.ts";
import * as usersSchema from "../services/users/schema.ts";

/** The aggregate Drizzle schema — each service contributes its own tables. */
export const schema = { ...usersSchema, ...ratingsSchema, ...relationshipsSchema };

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
}

export const createDatabase = (connectionString: string): DatabaseHandle => {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { db, pool };
};
