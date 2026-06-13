import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

const userId = (name: string) => varchar(name, { length: 10 });
const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Directed, transient friend requests (deleted on accept/decline/cancel). */
export const friendRequests = pgTable(
  "friend_requests",
  { requester: userId("requester").notNull(), recipient: userId("recipient").notNull(), createdAt },
  (table) => ({ pk: primaryKey({ columns: [table.requester, table.recipient] }) }),
);

/** Symmetric friendships, stored once per pair as ordered (lo, hi). */
export const friendships = pgTable(
  "friendships",
  { userLo: userId("user_lo").notNull(), userHi: userId("user_hi").notNull(), createdAt },
  (table) => ({ pk: primaryKey({ columns: [table.userLo, table.userHi] }) }),
);

/** Directed blocks (blocker → blocked). */
export const blocks = pgTable(
  "blocks",
  { blocker: userId("blocker").notNull(), blocked: userId("blocked").notNull(), createdAt },
  (table) => ({ pk: primaryKey({ columns: [table.blocker, table.blocked] }) }),
);
