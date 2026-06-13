import type { GameError, UserId } from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type Result, err, ok } from "@ekittens/lib";
import type { RelationshipsRepository } from "./repository.ts";

type Outcome = Result<void, GameError>;

/**
 * The social-graph state machine. Friendships are symmetric (stored once per
 * ordered pair), requests directed and transient, blocks directed. A block is
 * the trump card. (three distinct shapes, three tables.)
 */
export interface RelationshipsService {
  sendRequest(from: UserId, to: UserId): Promise<Outcome>;
  accept(user: UserId, requester: UserId): Promise<Outcome>;
  decline(user: UserId, requester: UserId): Promise<Outcome>;
  cancel(user: UserId, recipient: UserId): Promise<Outcome>;
  removeFriend(user: UserId, other: UserId): Promise<Outcome>;
  block(user: UserId, target: UserId): Promise<Outcome>;
  unblock(user: UserId, target: UserId): Promise<Outcome>;
  friends(user: UserId): Promise<UserId[]>;
  incoming(user: UserId): Promise<UserId[]>;
  outgoing(user: UserId): Promise<UserId[]>;
  isFriend(a: UserId, b: UserId): Promise<boolean>;
}

export const createRelationshipsService = (
  repo: RelationshipsRepository,
): RelationshipsService => ({
  async sendRequest(from, to) {
    if (from === to) return err(gameError("validation-failed", "cannot friend yourself"));
    if (await repo.isBlocked(from, to)) return err(gameError("forbidden", "blocked"));
    if (await repo.areFriends(from, to)) return err(gameError("conflict", "already friends"));
    // Auto-accept an inverse pending request rather than creating a second one.
    if (await repo.hasRequest(to, from)) {
      await repo.addFriendship(from, to);
      await repo.removeRequest(to, from);
      await repo.removeRequest(from, to);
      return ok();
    }
    await repo.addRequest(from, to);
    return ok();
  },

  async accept(user, requester) {
    if (!(await repo.hasRequest(requester, user))) {
      return err(gameError("not-found", "no such request"));
    }
    await repo.addFriendship(user, requester);
    await repo.removeRequest(requester, user);
    return ok();
  },

  async decline(user, requester) {
    await repo.removeRequest(requester, user);
    return ok();
  },

  async cancel(user, recipient) {
    await repo.removeRequest(user, recipient);
    return ok();
  },

  async removeFriend(user, other) {
    await repo.removeFriendship(user, other);
    return ok();
  },

  async block(user, target) {
    if (user === target) return err(gameError("validation-failed", "cannot block yourself"));
    // Block trumps: remove friendship, cancel requests both ways, then bar new ones.
    await repo.removeFriendship(user, target);
    await repo.removeRequest(user, target);
    await repo.removeRequest(target, user);
    await repo.addBlock(user, target);
    return ok();
  },

  async unblock(user, target) {
    await repo.removeBlock(user, target); // does not restore the old friendship
    return ok();
  },

  async friends(user) {
    return (await repo.friendsOf(user)) as UserId[];
  },
  async incoming(user) {
    return (await repo.incoming(user)) as UserId[];
  },
  async outgoing(user) {
    return (await repo.outgoing(user)) as UserId[];
  },
  async isFriend(a, b) {
    return repo.areFriends(a, b);
  },
});
