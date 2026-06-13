import type { PlayerId } from "@ekittens/contract";
import { WebSocket } from "ws";

/**
 * The connection registry: maps each user to their live sockets (a user may
 * have several tabs). Services publish to a user; the hub fans out to all of
 * that user's sockets.
 */
export interface Hub {
  add(userId: PlayerId, socket: WebSocket): void;
  remove(userId: PlayerId, socket: WebSocket): void;
  send(userId: PlayerId, message: unknown): void;
  isOnline(userId: PlayerId): boolean;
}

export const createHub = (): Hub => {
  const sockets = new Map<PlayerId, Set<WebSocket>>();

  return {
    add(userId, socket) {
      const existing = sockets.get(userId) ?? new Set<WebSocket>();
      existing.add(socket);
      sockets.set(userId, existing);
    },
    remove(userId, socket) {
      const set = sockets.get(userId);
      if (!set) return;
      set.delete(socket);
      if (set.size === 0) sockets.delete(userId);
    },
    send(userId, message) {
      const set = sockets.get(userId);
      if (!set) return;
      const data = JSON.stringify(message);
      for (const socket of set) {
        if (socket.readyState === WebSocket.OPEN) socket.send(data);
      }
    },
    isOnline(userId) {
      return sockets.has(userId);
    },
  };
};
