import type { PlayerId } from "@ekittens/contract";

export type Activity = "online" | "in-match" | "idle";
export type Status = Activity | "offline";

/**
 * Ephemeral presence projection driven by WS connect/disconnect. In-memory on
 * the owning node (a later refinement publishes it via Redis for multi-node).
 */
export interface PresenceService {
  set(userId: PlayerId, activity: Activity): void;
  clear(userId: PlayerId): void;
  statusOf(userId: PlayerId): Status;
  isOnline(userId: PlayerId): boolean;
}

export const createPresence = (): PresenceService => {
  const status = new Map<PlayerId, Activity>();
  return {
    set(userId, activity) {
      status.set(userId, activity);
    },
    clear(userId) {
      status.delete(userId);
    },
    statusOf(userId) {
      return status.get(userId) ?? "offline";
    },
    isOnline(userId) {
      return status.has(userId);
    },
  };
};
