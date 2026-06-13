import { and, eq, or } from "drizzle-orm";
import type { Database } from "../../lib/db.ts";
import { blocks, friendRequests, friendships } from "./schema.ts";

/** Order a pair canonically so a friendship is stored exactly once. */
export const orderedPair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

/** Port: the data access the relationships service needs (so it can be faked in tests). */
export interface RelationshipsRepository {
  hasRequest(requester: string, recipient: string): Promise<boolean>;
  addRequest(requester: string, recipient: string): Promise<void>;
  removeRequest(requester: string, recipient: string): Promise<void>;
  incoming(userId: string): Promise<string[]>;
  outgoing(userId: string): Promise<string[]>;
  areFriends(a: string, b: string): Promise<boolean>;
  addFriendship(a: string, b: string): Promise<void>;
  removeFriendship(a: string, b: string): Promise<void>;
  friendsOf(userId: string): Promise<string[]>;
  isBlocked(a: string, b: string): Promise<boolean>;
  addBlock(blocker: string, blocked: string): Promise<void>;
  removeBlock(blocker: string, blocked: string): Promise<void>;
}

export class DrizzleRelationshipsRepository implements RelationshipsRepository {
  constructor(private readonly db: Database) {}

  async hasRequest(requester: string, recipient: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(friendRequests)
      .where(and(eq(friendRequests.requester, requester), eq(friendRequests.recipient, recipient)))
      .limit(1);
    return row !== undefined;
  }

  async addRequest(requester: string, recipient: string): Promise<void> {
    await this.db.insert(friendRequests).values({ requester, recipient }).onConflictDoNothing();
  }

  async removeRequest(requester: string, recipient: string): Promise<void> {
    await this.db
      .delete(friendRequests)
      .where(and(eq(friendRequests.requester, requester), eq(friendRequests.recipient, recipient)));
  }

  async incoming(userId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.recipient, userId));
    return rows.map((row) => row.requester);
  }

  async outgoing(userId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.requester, userId));
    return rows.map((row) => row.recipient);
  }

  async areFriends(a: string, b: string): Promise<boolean> {
    const [lo, hi] = orderedPair(a, b);
    const [row] = await this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.userLo, lo), eq(friendships.userHi, hi)))
      .limit(1);
    return row !== undefined;
  }

  async addFriendship(a: string, b: string): Promise<void> {
    const [userLo, userHi] = orderedPair(a, b);
    await this.db.insert(friendships).values({ userLo, userHi }).onConflictDoNothing();
  }

  async removeFriendship(a: string, b: string): Promise<void> {
    const [lo, hi] = orderedPair(a, b);
    await this.db
      .delete(friendships)
      .where(and(eq(friendships.userLo, lo), eq(friendships.userHi, hi)));
  }

  async friendsOf(userId: string): Promise<string[]> {
    const rows = await this.db
      .select()
      .from(friendships)
      .where(or(eq(friendships.userLo, userId), eq(friendships.userHi, userId)));
    return rows.map((row) => (row.userLo === userId ? row.userHi : row.userLo));
  }

  async isBlocked(a: string, b: string): Promise<boolean> {
    const [row] = await this.db
      .select()
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blocker, a), eq(blocks.blocked, b)),
          and(eq(blocks.blocker, b), eq(blocks.blocked, a)),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  async addBlock(blocker: string, blocked: string): Promise<void> {
    await this.db.insert(blocks).values({ blocker, blocked }).onConflictDoNothing();
  }

  async removeBlock(blocker: string, blocked: string): Promise<void> {
    await this.db
      .delete(blocks)
      .where(and(eq(blocks.blocker, blocker), eq(blocks.blocked, blocked)));
  }
}
