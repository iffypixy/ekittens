import type { CommandWire, DomainEvent, MatchId, MatchView } from "@ekittens/contract";

export type ServerMessage =
  | { type: "match:start"; matchId: MatchId }
  | { type: "match:view"; matchId: MatchId; view: MatchView }
  | { type: "match:event"; matchId: MatchId; event: DomainEvent }
  | { type: "match:error"; matchId: MatchId; error: { code: string } }
  | { type: "pong" }
  | { type: "error"; error: { code: string } };

export interface GameSocket {
  send(matchId: string, command: CommandWire): void;
  close(): void;
}

interface Handlers {
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

const RECONNECT_MAX_MS = 10_000;

/**
 * Connect to the authenticated game socket (cookie carried by the upgrade).
 * Auto-reconnects with exponential backoff; on reconnect the server re-hydrates
 * any in-progress match view.
 */
export const connectGameSocket = (handlers: Handlers): GameSocket => {
  let socket: WebSocket;
  let closedByCaller = false;
  let attempt = 0;

  const open = (): void => {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    socket = new WebSocket(`${scheme}://${location.host}/ws`);

    socket.addEventListener("open", () => {
      attempt = 0;
      handlers.onOpen?.();
    });
    socket.addEventListener("message", (event) => {
      try {
        handlers.onMessage(JSON.parse(String(event.data)) as ServerMessage);
      } catch {
        // ignore malformed frames
      }
    });
    socket.addEventListener("error", () => socket.close());
    socket.addEventListener("close", () => {
      handlers.onClose?.();
      if (closedByCaller) return;
      attempt += 1;
      setTimeout(open, Math.min(1000 * 2 ** (attempt - 1), RECONNECT_MAX_MS));
    });
  };

  open();

  return {
    send(matchId, command) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "match:command", matchId, command }));
      }
    },
    close() {
      closedByCaller = true;
      socket.close();
    },
  };
};
