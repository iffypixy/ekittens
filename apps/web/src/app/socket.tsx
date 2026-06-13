import type { CommandWire } from "@ekittens/contract";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMatchStore } from "../lib/store.ts";
import { type GameSocket, connectGameSocket } from "../lib/ws.ts";

interface SocketValue {
  send: (matchId: string, command: CommandWire) => void;
}

const SocketContext = createContext<SocketValue>({ send: () => {} });

export const useGameSocket = (): SocketValue => useContext(SocketContext);

/** Establishes the authenticated game socket while `enabled`, routing messages to the store. */
export const SocketProvider = ({
  enabled,
  children,
}: { enabled: boolean; children: ReactNode }) => {
  const socketRef = useRef<GameSocket | null>(null);
  const navigate = useNavigate();
  const setStart = useMatchStore((store) => store.setStart);
  const setView = useMatchStore((store) => store.setView);
  const setError = useMatchStore((store) => store.setError);

  useEffect(() => {
    if (!enabled) return;
    const socket = connectGameSocket({
      onMessage: (message) => {
        if (message.type === "match:start") {
          setStart(message.matchId);
          navigate(`/match/${message.matchId}`);
        } else if (message.type === "match:view") {
          setView(message.matchId, message.view);
        } else if (message.type === "match:error") {
          setError(message.error.code);
        }
      },
    });
    socketRef.current = socket;
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, navigate, setStart, setView, setError]);

  const send = useCallback((matchId: string, command: CommandWire) => {
    socketRef.current?.send(matchId, command);
  }, []);

  return <SocketContext.Provider value={{ send }}>{children}</SocketContext.Provider>;
};
