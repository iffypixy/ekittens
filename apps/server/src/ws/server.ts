import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { MatchId, PlayerId } from "@ekittens/contract";
import { clientMessage } from "@ekittens/contract";
import type { FastifyInstance } from "fastify";
import { type RawData, type WebSocket, WebSocketServer } from "ws";
import type { ServerContext } from "../context.ts";

const HEARTBEAT_MS = 30_000;

const readCookie = (header: string | undefined, name: string): string | undefined => {
  if (header === undefined) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name)
      return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
};

const authenticate = async (
  app: FastifyInstance,
  request: IncomingMessage,
  ctx: ServerContext,
): Promise<PlayerId | undefined> => {
  const raw = readCookie(request.headers.cookie, "sid");
  if (raw === undefined) return undefined;
  const unsigned = app.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value === null) return undefined;
  return ctx.sessions.userId(unsigned.value);
};

const handleMessage = (
  userId: PlayerId,
  raw: RawData,
  ctx: ServerContext,
  socket: WebSocket,
): void => {
  let json: unknown;
  try {
    json = JSON.parse(raw.toString());
  } catch {
    socket.send(JSON.stringify({ type: "error", error: { code: "validation-failed" } }));
    return;
  }
  const parsed = clientMessage.safeParse(json);
  if (!parsed.success) {
    socket.send(JSON.stringify({ type: "error", error: { code: "validation-failed" } }));
    return;
  }
  const message = parsed.data;
  switch (message.type) {
    case "ping":
      socket.send(JSON.stringify({ type: "pong" }));
      return;
    case "match:command":
      ctx.matches.submit(message.matchId as MatchId, userId, message.command);
      return;
  }
};

const onConnection = (socket: WebSocket, userId: PlayerId, ctx: ServerContext): void => {
  ctx.hub.add(userId, socket);
  ctx.presence.set(userId, "online");

  let alive = true;
  socket.on("pong", () => {
    alive = true;
  });
  const heartbeat = setInterval(() => {
    if (!alive) {
      socket.terminate();
      return;
    }
    alive = false;
    socket.ping();
  }, HEARTBEAT_MS);

  socket.on("message", (raw) => handleMessage(userId, raw, ctx, socket));
  socket.on("close", () => {
    clearInterval(heartbeat);
    ctx.hub.remove(userId, socket);
    if (!ctx.hub.isOnline(userId)) ctx.presence.clear(userId);
  });
};

/** Attach the raw WebSocket transport to Fastify's HTTP server, authenticated by the session cookie. */
export const attachWebSocket = (app: FastifyInstance, ctx: ServerContext): void => {
  const wss = new WebSocketServer({ noServer: true });

  app.server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }
    void authenticate(app, request, ctx).then((userId) => {
      if (userId === undefined) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => onConnection(ws, userId, ctx));
    });
  });
};
