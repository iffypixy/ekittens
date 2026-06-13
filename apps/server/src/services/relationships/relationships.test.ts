import type { UserId } from "@ekittens/contract";
import { describe, expect, it } from "vitest";
import { type RelationshipsRepository, orderedPair } from "./repository.ts";
import { RelationshipsService } from "./service.ts";

const uid = (value: string): UserId => value as UserId;

const fakeRepo = (): RelationshipsRepository => {
  const requests = new Set<string>();
  const friends = new Set<string>();
  const blocked = new Set<string>();
  const rk = (a: string, b: string): string => `${a}>${b}`;
  const fk = (a: string, b: string): string => orderedPair(a, b).join("|");
  const parts = (key: string): [string, string] => {
    const [a = "", b = ""] = key.split(key.includes(">") ? ">" : "|");
    return [a, b];
  };
  return {
    async hasRequest(r, c) {
      return requests.has(rk(r, c));
    },
    async addRequest(r, c) {
      requests.add(rk(r, c));
    },
    async removeRequest(r, c) {
      requests.delete(rk(r, c));
    },
    async incoming(u) {
      return [...requests]
        .map((k) => parts(k))
        .filter(([, c]) => c === u)
        .map(([r]) => r);
    },
    async outgoing(u) {
      return [...requests]
        .map((k) => parts(k))
        .filter(([r]) => r === u)
        .map(([, c]) => c);
    },
    async areFriends(a, b) {
      return friends.has(fk(a, b));
    },
    async addFriendship(a, b) {
      friends.add(fk(a, b));
    },
    async removeFriendship(a, b) {
      friends.delete(fk(a, b));
    },
    async friendsOf(u) {
      return [...friends]
        .map((k) => parts(k))
        .filter(([lo, hi]) => lo === u || hi === u)
        .map(([lo, hi]) => (lo === u ? hi : lo));
    },
    async isBlocked(a, b) {
      return blocked.has(rk(a, b)) || blocked.has(rk(b, a));
    },
    async addBlock(a, b) {
      blocked.add(rk(a, b));
    },
    async removeBlock(a, b) {
      blocked.delete(rk(a, b));
    },
  };
};

describe("relationships state machine", () => {
  it("creates a pending request, visible to both sides", async () => {
    const svc = new RelationshipsService(fakeRepo());
    expect((await svc.sendRequest(uid("A"), uid("B"))).ok).toBe(true);
    expect(await svc.outgoing(uid("A"))).toEqual([uid("B")]);
    expect(await svc.incoming(uid("B"))).toEqual([uid("A")]);
    expect(await svc.isFriend(uid("A"), uid("B"))).toBe(false);
  });

  it("auto-accepts when an inverse request already exists", async () => {
    const svc = new RelationshipsService(fakeRepo());
    await svc.sendRequest(uid("A"), uid("B"));
    await svc.sendRequest(uid("B"), uid("A")); // inverse → instant friendship
    expect(await svc.isFriend(uid("A"), uid("B"))).toBe(true);
    expect(await svc.outgoing(uid("A"))).toEqual([]);
    expect(await svc.outgoing(uid("B"))).toEqual([]);
  });

  it("accept turns a request into a symmetric friendship", async () => {
    const svc = new RelationshipsService(fakeRepo());
    await svc.sendRequest(uid("A"), uid("B"));
    expect((await svc.accept(uid("B"), uid("A"))).ok).toBe(true);
    expect(await svc.isFriend(uid("B"), uid("A"))).toBe(true);
    expect(await svc.friends(uid("A"))).toEqual([uid("B")]);
  });

  it("refuses to friend yourself", async () => {
    const svc = new RelationshipsService(fakeRepo());
    const result = await svc.sendRequest(uid("A"), uid("A"));
    expect(result.ok).toBe(false);
  });

  it("block is the trump card: removes friendship and bars new requests", async () => {
    const svc = new RelationshipsService(fakeRepo());
    await svc.sendRequest(uid("A"), uid("B"));
    await svc.accept(uid("B"), uid("A"));
    expect(await svc.isFriend(uid("A"), uid("B"))).toBe(true);

    await svc.block(uid("A"), uid("B"));
    expect(await svc.isFriend(uid("A"), uid("B"))).toBe(false);
    expect((await svc.sendRequest(uid("B"), uid("A"))).ok).toBe(false); // barred
    expect((await svc.sendRequest(uid("A"), uid("B"))).ok).toBe(false);
  });
});
