import type { PlayerId } from "@ekittens/contract";

export type Activity = "online" | "in-match" | "idle";
export type Status = Activity | "offline";

/**
 * Ephemeral presence projection driven by WS connect/disconnect. In-memory on
 * the owning node (a later refinement publishes it via Redis for multi-node).
 */
export class PresenceService {
  private readonly status = new Map<PlayerId, Activity>();

  set(userId: PlayerId, activity: Activity): void {
    this.status.set(userId, activity);
  }

  clear(userId: PlayerId): void {
    this.status.delete(userId);
  }

  statusOf(userId: PlayerId): Status {
    return this.status.get(userId) ?? "offline";
  }

  isOnline(userId: PlayerId): boolean {
    return this.status.has(userId);
  }
}
