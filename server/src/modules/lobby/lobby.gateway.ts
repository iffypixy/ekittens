import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";

import {redis} from "@lib/redis";
import {
  CreateLobbyDto,
  JoinLobbyDto,
  KickPlayerDto,
  LeaveDto,
} from "./dtos/gateways";
import {Lobby, LobbyPlayer} from "./lib/typings";

const events = {
  server: {
    CREATE: "lobby:create",
    JOIN: "lobby:join",
    KICK_PLAYER: "lobby:kick-player",
    LEAVE: "lobby:leave",
  },
  client: {
    PLAYER_JOINED: "lobby:player-joined",
  },
};

@WebSocketGateway({
  cookie: true,
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  },
})
export class LobbyGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(events.server.CREATE)
  async createLobby(
    @MessageBody() dto: CreateLobbyDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{lobby: Lobby}> {
    const player: LobbyPlayer = {
      id: socket.id,
      username: dto.username,
      avatar: dto.avatar,
      role: "owner",
    };

    const lobby: Lobby = {
      id: nanoid(6),
      players: [player],
    };

    socket.join(lobby.id);

    await redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));

    return {lobby};
  }

  @SubscribeMessage(events.server.JOIN)
  async joinLobby(
    @MessageBody() dto: JoinLobbyDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{lobby: Lobby}> {
    const json = await redis.get(`lobby:${dto.lobbyId}`);

    const lobby: Lobby = JSON.parse(json);

    if (!lobby) throw new WsException("Invalid lobby id");

    const isAlreadyParticipant = lobby.players.some(
      (player) => player.id === socket.id,
    );

    if (isAlreadyParticipant)
      throw new WsException("You are already a participant");

    const player: LobbyPlayer = {
      id: socket.id,
      username: dto.username,
      avatar: dto.avatar,
      role: "member",
    };

    lobby.players.push(player);

    this.server.to(lobby.id).emit(events.client.PLAYER_JOINED, {player});

    socket.join(lobby.id);

    await redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));

    return {
      lobby,
    };
  }

  @SubscribeMessage(events.server.KICK_PLAYER)
  async kickPlayer(
    @MessageBody() dto: KickPlayerDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{lobby: Lobby}> {
    const json = await redis.get(`lobby:${dto.lobbyId}`);

    const lobby: Lobby = JSON.parse(json);

    if (!lobby) throw new WsException("Invalid lobby id");

    const player = lobby.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    const isOwner = player.role === "owner";

    if (!isOwner) throw new WsException("You are not an owner");

    lobby.players = lobby.players.filter(
      (player) => player.id !== dto.playerId,
    );

    await redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));

    return {
      lobby,
    };
  }

  @SubscribeMessage(events.server.LEAVE)
  async leave(
    @MessageBody() dto: LeaveDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{lobby: Lobby}> {
    const json = await redis.get(`lobby:${dto.lobbyId}`);

    const lobby: Lobby = JSON.parse(json);

    if (!lobby) throw new WsException("Invalid lobby id");

    const player = lobby.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    lobby.players = lobby.players.filter((player) => player.id !== socket.id);

    const isOwner = player.role === "owner";

    if (isOwner) lobby.players[0].role = "owner";

    await redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));

    return {
      lobby,
    };
  }
}
