import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";
import {In} from "typeorm";

import {User, UserInterim, UserService} from "@modules/user";
import {RedisService, RP} from "@lib/redis";
import {ack, WsService, WsResponse} from "@lib/ws";
import {events} from "../lib/events";
import {
  Lobby,
  LobbyParticipant,
  OngoingMatch,
  OngoingMatchPlayer,
} from "../lib/typings";
import {
  InviteFriendDto,
  JoinAsPlayerDto,
  JoinAsSpectatorDto,
  LeaveLobbyDto,
  StartMatchDto,
  KickParticipantDto,
  UpdateDisabledDto,
} from "../dtos/gateways";
import {plain} from "../lib/plain";
import {deck} from "../lib/deck";
import {MATCH_STATE, MIN_NUMBER_OF_MATCH_PLAYERS} from "../lib/constants";
import {MatchPlayerService, MatchService} from "../services";

@WebSocketGateway()
export class PrivateMatchGateway {
  @WebSocketServer()
  private readonly server: Server;
  private readonly service: WsService;

  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly matchService: MatchService,
    private readonly matchPlayerService: MatchPlayerService,
  ) {
    this.service = new WsService(this.server);
  }

  private async handleAbandon(lobby: Lobby, id: string) {
    const participant = lobby.participants.find(
      (participant) => participant.user.id === id,
    );

    if (!participant) return;

    lobby.participants = lobby.participants.filter(
      (p) => p.user.id !== participant.user.id,
    );

    const sockets = this.service.getSocketsByUserId(participant.user.id);

    sockets.forEach((socket) => {
      socket.leave(lobby.id);
    });

    await this.redisService.update<UserInterim>(
      `${RP.USER}:${participant.user.id}`,
      {
        lobbyId: null,
      },
    );

    const isEmpty = lobby.participants.length === 0;

    if (isEmpty) await this.redisService.delete(`${RP.LOBBY}:${lobby.id}`);
    else {
      this.server.to(lobby.id).emit(events.client.PARTICIPANT_LEAVE, {
        participantId: participant.user.id,
      });

      const isLeader = participant.role === "leader";

      if (isLeader) {
        const leader = lobby.participants[0];

        leader.role === "leader";

        this.server.to(lobby.id).emit(events.client.LEADER_SWITCH, {
          participantId: leader.user.id,
        });
      }

      await this.redisService.set(`${RP.LOBBY}:${lobby.id}`, lobby);
    }
  }

  @SubscribeMessage(events.server.CREATE_LOBBY)
  async createLobby(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const user = socket.request.session.user;

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isInMatch = !!(interim && interim.matchId);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = !!(interim && interim.lobbyId);

    if (isInLobby) return ack({ok: false, msg: "You are in another lobby"});

    const id = nanoid();

    const participant: LobbyParticipant = {
      user,
      as: "player",
      role: "leader",
    };

    const lobby: Lobby = {
      id,
      participants: [participant],
      disabled: [],
    };

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      const id = lobby.id;

      socket.join(id);

      socket.on("disconnect", async () => {
        const sockets = this.service
          .getSocketsByUserId(participant.user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          const lobby = await this.redisService.get<Lobby>(`${RP.LOBBY}:${id}`);

          if (!lobby) return;

          await this.handleAbandon(lobby, participant.user.id);
        }
      });
    });

    this.server.to(lobby.id).emit(events.client.SELF_LOBBY_CREATION, {
      lobby: plain.lobby(lobby),
    });

    await this.redisService.update(`${RP.USER}:${user.id}`, {
      lobbyId: lobby.id,
    });

    await this.redisService.set(`${RP.LOBBY}:${lobby.id}`, lobby);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_LOBBY)
  async leaveLobby(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveLobbyDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    await this.handleAbandon(lobby, participant.user.id);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INVITE_FRIEND)
  async inviteFriend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InviteFriendDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const invited = await this.userService.findOne({where: {id: dto.userId}});

    if (!invited) return ack({ok: false, msg: "No user found"});

    // @todo: check if they are friends

    const sockets = this.service
      .getSocketsByUserId(invited.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_LOBBY_INVITATION, {
      user: participant.user.public,
      lobby: plain.lobby(lobby),
    });

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.JOIN_AS_SPECTATOR)
  async joinAsSpectator(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinAsSpectatorDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const user = socket.request.session.user;

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isInMatch = !!(interim && interim.matchId);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = !!(interim && interim.lobbyId);

    if (isInLobby) return ack({ok: false, msg: "You are in another lobby"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === user.id,
    );

    const isSpectator = participant && participant.as === "spectator";

    if (isSpectator)
      return ack({ok: false, msg: "You are already a spectator"});

    const sockets = this.service.getSocketsByUserId(user.id);
    const ids = sockets.map((socket) => socket.id);

    if (participant) {
      participant.as = "spectator";

      this.server.to(ids).emit(events.client.SELF_SPECTATOR_SWITCH);

      this.server
        .to(lobby.id)
        .except(ids)
        .emit(events.client.SPECTATOR_SWITCH, {
          userId: user.id,
        });

      return ack({ok: true});
    }

    sockets.forEach((socket) => {
      const id = lobby.id;

      socket.join(id);

      socket.on("disconnect", async () => {
        const sockets = this.service
          .getSocketsByUserId(participant.user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          const lobby = await this.redisService.get<Lobby>(`${RP.LOBBY}:${id}`);

          if (!lobby) return;

          await this.handleAbandon(lobby, participant.user.id);
        }
      });
    });

    const inserted: LobbyParticipant = {
      user,
      as: "spectator",
      role: "member",
    };

    lobby.participants.push(inserted);

    this.server.to(ids).emit(events.client.SELF_PARTICIPANT_JOIN, {
      lobby: plain.lobby(lobby),
    });

    this.server
      .to(lobby.id)
      .except(ids)
      .emit(events.client.PARTICIPANT_JOIN, {
        participant: plain.lobbyParticipant(inserted),
      });

    await this.redisService.update<UserInterim>(`${RP.USER}:${user.id}`, {
      lobbyId: lobby.id,
    });

    await this.redisService.set(`${RP.LOBBY}:${lobby.id}`, lobby);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.JOIN_AS_PLAYER)
  async joinAsPlayer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinAsPlayerDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const user = socket.request.session.user;

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isInMatch = !!(interim && interim.matchId);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = !!(interim && interim.lobbyId);

    if (isInLobby) return ack({ok: false, msg: "You are in another lobby"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === user.id,
    );

    const isPlayer = !!participant && participant.as === "player";

    if (isPlayer) return ack({ok: false, msg: "You are already a player"});

    const sockets = this.service.getSocketsByUserId(participant.user.id);
    const ids = sockets.map((socket) => socket.id);

    if (participant) {
      participant.as = "player";

      this.server.to(ids).emit(events.client.SELF_PLAYER_SWITCH);

      this.server.to(lobby.id).except(ids).emit(events.client.PLAYER_SWITCH, {
        participant: participant.user.id,
      });

      return ack({ok: true});
    }

    sockets.forEach((socket) => {
      const id = lobby.id;

      socket.join(id);

      socket.on("disconnect", async () => {
        const sockets = this.service
          .getSocketsByUserId(participant.user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          const lobby = await this.redisService.get<Lobby>(`${RP.LOBBY}:${id}`);

          if (!lobby) return;

          await this.handleAbandon(lobby, participant.user.id);
        }
      });
    });

    const inserted: LobbyParticipant = {
      user,
      as: "player",
      role: "member",
    };

    lobby.participants.push(inserted);

    this.server.to(ids).emit(events.client.SELF_PARTICIPANT_JOIN, {
      lobby: plain.lobby(lobby),
    });

    this.server
      .to(lobby.id)
      .except(ids)
      .emit(events.client.PARTICIPANT_JOIN, {
        participant: plain.lobbyParticipant(inserted),
      });

    await this.redisService.update(`${RP.USER}:${user.id}`, {
      lobbyId: lobby.id,
    });

    await this.redisService.set(`${RP.LOBBY}:${lobby.id}`, lobby);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.KICK_PARTICIPANT)
  async kickParticipant(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: KickParticipantDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const isLeader = participant.role === "leader";

    if (!isLeader)
      return ack({ok: false, msg: "You are not a leader of the lobby"});

    const kicked = lobby.participants.find(
      (participant) => participant.user.id === dto.participantId,
    );

    if (!kicked) return ack({ok: false, msg: "No participant found"});

    await this.handleAbandon(lobby, kicked.user.id);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.UPDATE_DISABLED)
  async updateDisabled(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateDisabledDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const isLeader = participant.role === "leader";

    if (!isLeader)
      return ack({ok: false, msg: "You are not a leader of the lobby"});

    lobby.disabled = dto.disabled;

    this.server.to(lobby.id).emit(events.client.DISABLED_UPDATE, {
      disabled: lobby.disabled,
    });

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.START_MATCH)
  async startMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: StartMatchDto,
  ): Promise<WsResponse> {
    const lobby = await this.redisService.get<Lobby>(
      `${RP.LOBBY}:${dto.lobbyId}`,
    );

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const isLeader = participant.role === "leader";

    if (!isLeader)
      return ack({ok: false, msg: "You are not a leader of the lobby"});

    const asPlayers = lobby.participants.filter(
      (participant) => participant.as === "player",
    );

    const isEnough = asPlayers.length >= MIN_NUMBER_OF_MATCH_PLAYERS;

    if (!isEnough)
      return ack({ok: false, msg: "Number of players is not enough"});

    const {individual, main} = deck.generate(asPlayers.length);

    const users: User[] = await this.userService.find({
      where: {
        id: In(asPlayers.map((player) => player.user.id)),
      },
    });

    const players: OngoingMatchPlayer[] = users.map((user, idx) => ({
      user,
      cards: individual[idx],
      marked: [],
    }));

    const ongoing: OngoingMatch = {
      id: nanoid(),
      players,
      out: [],
      spectators: [],
      draw: main,
      discard: [],
      turn: 0,
      state: {
        type: MATCH_STATE.WAITING_FOR_ACTION,
        at: Date.now(),
        payload: null,
      },
      votes: {
        skip: [],
      },
      context: {
        noped: false,
        attacks: 0,
        reversed: false,
      },
      type: "private",
    };

    const match = await this.matchService.create({
      id: ongoing.id,
      type: "private",
      status: "ongoing",
    });

    players.forEach(async (player) => {
      await this.matchPlayerService.create({
        match,
        user: player.user,
        rating: player.user.rating,
      });

      await this.redisService.update<UserInterim>(
        `${RP.USER}:${player.user.id}`,
        {
          matchId: match.id,
          lobbyId: null,
        },
      );

      const sockets = this.service.getSocketsByUserId(player.user.id);

      sockets.forEach((socket) => {
        socket.join(match.id);

        socket.on("disconnect", () => {
          const sockets = this.service
            .getSocketsByUserId(player.user.id)
            .filter((s) => s.id !== socket.id);

          const isDisconnected = sockets.length === 0;

          if (isDisconnected) {
            this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
              playerId: player.user.id,
            });
          }
        });
      });
    });

    const asSpectators = lobby.participants.filter(
      (participant) => participant.as === "spectator",
    );

    asSpectators.forEach(async (spectator) => {
      const sockets = this.service.getSocketsByUserId(spectator.user.id);

      sockets.forEach((socket) => {
        socket.join(lobby.id);
      });

      await this.redisService.update<UserInterim>(
        `${RP.USER}:${spectator.user.id}`,
        {
          lobbyId: null,
        },
      );
    });

    this.server.to(ongoing.id).emit(events.client.MATCH_START, {
      match: plain.match(ongoing),
    });

    players.forEach((player) => {
      const sockets = this.service.getSocketsByUserId(player.user.id);

      sockets.forEach((socket) => {
        this.server.to(socket.id).emit(events.client.INITIAL_CARDS_RECEIVE, {
          cards: player.cards,
        });
      });
    });

    await this.redisService.set(`${RP.MATCH}:${ongoing.id}`, ongoing);
    await this.redisService.delete(`${RP.LOBBY}:${lobby.id}`);

    return ack({ok: true});
  }
}
