import type { UserId } from "@ekittens/contract";
import { describe, expect, it } from "vitest";
import { RelationshipsRepository, orderedPair } from "./repository.ts";
import { RelationshipsService } from "./service.ts";

const uid = (value: string): UserId => value as UserId;

/** In-memory social graph so the service can be tested without a database. */
class FakeRelationshipsRepository extends RelationshipsRepository {
  private readonly requests = new Set<string>();
  private readonly friends = new Set<string>();
  private readonly blocks = new Set<string>();

  constructor() {
    super(undefined as never);
  }

  private requestKey(requester: string, recipient: string): string {
    return `${requester}>${recipient}`;
  }

  private friendKey(a: string, b: string): string {
    return orderedPair(a, b).join("|");
  }

  private split(key: string): [string, string] {
    const [a = "", b = ""] = key.split(key.includes(">") ? ">" : "|");
    return [a, b];
  }

  override async hasRequest(requester: string, recipient: string): Promise<boolean> {
    return this.requests.has(this.requestKey(requester, recipient));
  }

  override async addRequest(requester: string, recipient: string): Promise<void> {
    this.requests.add(this.requestKey(requester, recipient));
  }

  override async removeRequest(requester: string, recipient: string): Promise<void> {
    this.requests.delete(this.requestKey(requester, recipient));
  }

  override async incoming(userId: string): Promise<string[]> {
    return [...this.requests]
      .map((key) => this.split(key))
      .filter(([, recipient]) => recipient === userId)
      .map(([requester]) => requester);
  }

  override async outgoing(userId: string): Promise<string[]> {
    return [...this.requests]
      .map((key) => this.split(key))
      .filter(([requester]) => requester === userId)
      .map(([, recipient]) => recipient);
  }

  override async areFriends(a: string, b: string): Promise<boolean> {
    return this.friends.has(this.friendKey(a, b));
  }

  override async addFriendship(a: string, b: string): Promise<void> {
    this.friends.add(this.friendKey(a, b));
  }

  override async removeFriendship(a: string, b: string): Promise<void> {
    this.friends.delete(this.friendKey(a, b));
  }

  override async friendsOf(userId: string): Promise<string[]> {
    return [...this.friends]
      .map((key) => this.split(key))
      .filter(([low, high]) => low === userId || high === userId)
      .map(([low, high]) => (low === userId ? high : low));
  }

  override async isBlocked(a: string, b: string): Promise<boolean> {
    return this.blocks.has(this.requestKey(a, b)) || this.blocks.has(this.requestKey(b, a));
  }

  override async addBlock(blocker: string, blocked: string): Promise<void> {
    this.blocks.add(this.requestKey(blocker, blocked));
  }

  override async removeBlock(blocker: string, blocked: string): Promise<void> {
    this.blocks.delete(this.requestKey(blocker, blocked));
  }
}

describe("friendships, requests, and blocks", () => {
  it("creates a pending request, visible to both sides", async () => {
    const relationships = new RelationshipsService(new FakeRelationshipsRepository());
    expect((await relationships.sendRequest(uid("A"), uid("B"))).ok).toBe(true);
    expect(await relationships.outgoing(uid("A"))).toEqual([uid("B")]);
    expect(await relationships.incoming(uid("B"))).toEqual([uid("A")]);
    expect(await relationships.isFriend(uid("A"), uid("B"))).toBe(false);
  });

  it("becomes friends instantly when both sides request each other", async () => {
    const relationships = new RelationshipsService(new FakeRelationshipsRepository());
    await relationships.sendRequest(uid("A"), uid("B"));
    await relationships.sendRequest(uid("B"), uid("A"));
    expect(await relationships.isFriend(uid("A"), uid("B"))).toBe(true);
    expect(await relationships.outgoing(uid("A"))).toEqual([]);
    expect(await relationships.outgoing(uid("B"))).toEqual([]);
  });

  it("turns an accepted request into a friendship both sides can see", async () => {
    const relationships = new RelationshipsService(new FakeRelationshipsRepository());
    await relationships.sendRequest(uid("A"), uid("B"));
    expect((await relationships.accept(uid("B"), uid("A"))).ok).toBe(true);
    expect(await relationships.isFriend(uid("B"), uid("A"))).toBe(true);
    expect(await relationships.friends(uid("A"))).toEqual([uid("B")]);
  });

  it("refuses to friend yourself", async () => {
    const relationships = new RelationshipsService(new FakeRelationshipsRepository());
    const result = await relationships.sendRequest(uid("A"), uid("A"));
    expect(result.ok).toBe(false);
  });

  it("blocking removes the friendship and bars new requests both ways", async () => {
    const relationships = new RelationshipsService(new FakeRelationshipsRepository());
    await relationships.sendRequest(uid("A"), uid("B"));
    await relationships.accept(uid("B"), uid("A"));
    expect(await relationships.isFriend(uid("A"), uid("B"))).toBe(true);

    await relationships.block(uid("A"), uid("B"));
    expect(await relationships.isFriend(uid("A"), uid("B"))).toBe(false);
    expect((await relationships.sendRequest(uid("B"), uid("A"))).ok).toBe(false);
    expect((await relationships.sendRequest(uid("A"), uid("B"))).ok).toBe(false);
  });
});
