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

/** Connect to the authenticated game socket (cookie carried by the upgrade request). */
export const connectGameSocket = (handlers: Handlers): GameSocket => {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${scheme}://${location.host}/ws`);

  socket.addEventListener("open", () => handlers.onOpen?.());
  socket.addEventListener("close", () => handlers.onClose?.());
  socket.addEventListener("message", (event) => {
    try {
      handlers.onMessage(JSON.parse(String(event.data)) as ServerMessage);
    } catch {
      // ignore malformed frames
    }
  });

  return {
    send(matchId, command) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "match:command", matchId, command }));
      }
    },
    close() {
      socket.close();
    },
  };
};
