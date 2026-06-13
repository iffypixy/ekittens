import type { PlayerId } from "@ekittens/contract";
import { WebSocket } from "ws";

/**
 * The connection registry: maps each user to their live sockets (a user may
 * have several tabs). Services publish to a user; the hub fans out to all of
 * that user's sockets.
 */
export class Hub {
  private readonly sockets = new Map<PlayerId, Set<WebSocket>>();

  add(userId: PlayerId, socket: WebSocket): void {
    const existing = this.sockets.get(userId) ?? new Set<WebSocket>();
    existing.add(socket);
    this.sockets.set(userId, existing);
  }

  remove(userId: PlayerId, socket: WebSocket): void {
    const set = this.sockets.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.sockets.delete(userId);
  }

  send(userId: PlayerId, message: unknown): void {
    const set = this.sockets.get(userId);
    if (!set) return;
    const data = JSON.stringify(message);
    for (const socket of set) {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    }
  }

  isOnline(userId: PlayerId): boolean {
    return this.sockets.has(userId);
  }
}
