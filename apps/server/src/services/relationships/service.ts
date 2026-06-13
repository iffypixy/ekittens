import type { GameError, UserId } from "@ekittens/contract";
import { gameError } from "@ekittens/contract";
import { type Result, err, ok } from "@ekittens/lib";
import type { RelationshipsRepository } from "./repository.ts";

type Outcome = Result<void, GameError>;

/**
 * The social-graph state machine. Friendships are symmetric (stored once per
 * ordered pair), requests directed and transient, blocks directed. A block is
 * the trump card.
 */
export class RelationshipsService {
  constructor(private readonly repo: RelationshipsRepository) {}

  async sendRequest(from: UserId, to: UserId): Promise<Outcome> {
    if (from === to) return err(gameError("validation-failed", "cannot friend yourself"));
    if (await this.repo.isBlocked(from, to)) return err(gameError("forbidden", "blocked"));
    if (await this.repo.areFriends(from, to)) return err(gameError("conflict", "already friends"));
    // Auto-accept an inverse pending request rather than creating a second one.
    if (await this.repo.hasRequest(to, from)) {
      await this.repo.addFriendship(from, to);
      await this.repo.removeRequest(to, from);
      await this.repo.removeRequest(from, to);
      return ok();
    }
    await this.repo.addRequest(from, to);
    return ok();
  }

  async accept(user: UserId, requester: UserId): Promise<Outcome> {
    if (!(await this.repo.hasRequest(requester, user))) {
      return err(gameError("not-found", "no such request"));
    }
    await this.repo.addFriendship(user, requester);
    await this.repo.removeRequest(requester, user);
    return ok();
  }

  async decline(user: UserId, requester: UserId): Promise<Outcome> {
    await this.repo.removeRequest(requester, user);
    return ok();
  }

  async cancel(user: UserId, recipient: UserId): Promise<Outcome> {
    await this.repo.removeRequest(user, recipient);
    return ok();
  }

  async removeFriend(user: UserId, other: UserId): Promise<Outcome> {
    await this.repo.removeFriendship(user, other);
    return ok();
  }

  async block(user: UserId, target: UserId): Promise<Outcome> {
    if (user === target) return err(gameError("validation-failed", "cannot block yourself"));
    // Block trumps: remove friendship, cancel requests both ways, then bar new ones.
    await this.repo.removeFriendship(user, target);
    await this.repo.removeRequest(user, target);
    await this.repo.removeRequest(target, user);
    await this.repo.addBlock(user, target);
    return ok();
  }

  async unblock(user: UserId, target: UserId): Promise<Outcome> {
    await this.repo.removeBlock(user, target); // does not restore the old friendship
    return ok();
  }

  async friends(user: UserId): Promise<UserId[]> {
    return (await this.repo.friendsOf(user)) as UserId[];
  }

  async incoming(user: UserId): Promise<UserId[]> {
    return (await this.repo.incoming(user)) as UserId[];
  }

  async outgoing(user: UserId): Promise<UserId[]> {
    return (await this.repo.outgoing(user)) as UserId[];
  }

  async isFriend(a: UserId, b: UserId): Promise<boolean> {
    return this.repo.areFriends(a, b);
  }
}
