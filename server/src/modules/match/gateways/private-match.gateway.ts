import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";
import {In} from "typeorm";
import {Sess} from "express-session";
import {InjectQueue} from "@nestjs/bull";
import {Queue} from "bull";

import {
  Relationship,
  RELATIONSHIP_STATUS,
  User,
  UserService,
} from "@modules/user";
import {ack, WsService, WsResponse, WsSession} from "@lib/ws";
import {events} from "../lib/events";
import {
  InviteFriendDto,
  JoinAsPlayerDto,
  JoinAsSpectatorDto,
  LeaveLobbyDto,
  StartMatchDto,
  KickParticipantDto,
  UpdateDisabledDto,
} from "../dtos/gateways";
import {deck} from "../lib/deck";
import {
  MATCH_STATE,
  MIN_NUMBER_OF_MATCH_PLAYERS,
  QUEUE,
} from "../lib/constants";
import {LobbyService, OngoingMatchService} from "../services";
import {
  Lobby,
  LobbyParticipant,
  Match,
  MatchPlayer,
  OngoingMatch,
} from "../entities";
import {InactivityQueuePayload, LobbyParticipantData} from "../lib/typings";

@WebSocketGateway()
export class PrivateMatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private service: WsService;

  constructor(
    private readonly userService: UserService,
    private readonly lobbyService: LobbyService,
    private readonly ongoingMatchService: OngoingMatchService,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
  ) {}

  private async handleAbandon(lobbyId: string, id: string) {
    const lobby = await this.lobbyService.get(lobbyId);

    if (!lobby) return;

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

    await this.userService.setInterim(participant.user.id, {
      activity: null,
    });

    const isEmpty = lobby.participants.length === 0;

    if (!isEmpty) {
      this.server.to(lobby.id).emit(events.client.PARTICIPANT_LEAVE, {
        participantId: participant.user.id,
      });

      const isLeader = participant.role === "leader";

      console.log(isLeader);

      if (isLeader) {
        lobby.participants = lobby.participants.map((participant, idx) =>
          idx === 0
            ? new LobbyParticipant({...participant, role: "leader"})
            : participant,
        );

        this.server.to(lobby.id).emit(events.client.LEADER_SWITCH, {
          participantId: lobby.participants[0].user.id,
        });
      }

      await this.lobbyService.save(lobby);
    }
  }

  afterInit(server: Server) {
    this.service = new WsService(server);
  }

  @SubscribeMessage(events.server.CREATE_LOBBY)
  async createLobby(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const user = socket.request.session.user;

    const interim = await this.userService.getInterim(user.id);

    const isInMatch = interim?.activity?.type === "in-match";

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = interim?.activity?.type === "in-lobby";

    if (isInLobby) return ack({ok: false, msg: "You are in another lobby"});

    const id = nanoid();

    const participant: LobbyParticipantData = {
      user,
      as: "player",
      role: "leader",
    };

    const lobby = new Lobby({id, participants: [participant], disabled: []});

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
          await this.handleAbandon(lobby.id, participant.user.id);
        }
      });
    });

    this.server.to(lobby.id).emit(events.client.SELF_LOBBY_CREATION, {
      lobby: lobby.public,
    });

    await this.userService.setInterim(user.id, {
      activity: {
        type: "in-lobby",
        lobbyId: lobby.id,
      },
    });

    await this.lobbyService.save(lobby);

    return ack({ok: true, payload: {lobby: lobby.public}});
  }

  @SubscribeMessage(events.server.LEAVE_LOBBY)
  async leaveLobby(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveLobbyDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    await this.handleAbandon(lobby.id, participant.user.id);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INVITE_FRIEND)
  async inviteFriend(
    @WsSession() session: Sess,
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InviteFriendDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const invited = await User.findOne({
      where: {id: dto.userId},
    });

    if (!invited) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {
          user1: {id: session.user.id},
          user2: {id: invited.id},
          status: RELATIONSHIP_STATUS.FRIENDS,
        },
        {
          user1: {id: invited.id},
          user2: {id: session.user.id},
          status: RELATIONSHIP_STATUS.FRIENDS,
        },
      ],
    });

    const areFriends = Boolean(relationship);

    if (!areFriends) return ack({ok: false, msg: "You are not friends"});

    const sockets = this.service
      .getSocketsByUserId(invited.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_LOBBY_INVITATION, {
      user: participant.user.public,
      lobby: lobby.public,
    });

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.JOIN_AS_SPECTATOR)
  async joinAsSpectator(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinAsSpectatorDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const user = socket.request.session.user;

    const interim = await this.userService.getInterim(user.id);

    const isInMatch = Boolean(interim?.activity?.matchId);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = Boolean(interim?.activity?.lobbyId);

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
          await this.handleAbandon(lobby.id, participant.user.id);
        }
      });
    });

    const inserted = new LobbyParticipant({
      user,
      as: "spectator",
      role: "member",
    });

    lobby.participants.push(inserted);

    this.server.to(ids).emit(events.client.SELF_PARTICIPANT_JOIN, {
      lobby: lobby.public,
    });

    this.server.to(lobby.id).except(ids).emit(events.client.PARTICIPANT_JOIN, {
      participant: inserted.public,
    });

    await this.userService.setInterim(user.id, {
      activity: {
        type: "in-lobby",
        lobbyId: lobby.id,
      },
    });

    await this.lobbyService.save(lobby);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.JOIN_AS_PLAYER)
  async joinAsPlayer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinAsPlayerDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const user = socket.request.session.user;

    const interim = await this.userService.getInterim(user.id);

    const isInMatch = Boolean(interim?.activity?.matchId);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    const isInLobby = Boolean(interim?.activity?.lobbyId);
    const isInThisLobby = interim?.activity?.lobbyId === lobby.id;

    if (isInLobby && !isInThisLobby)
      return ack({ok: false, msg: "You are in another lobby"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === user.id,
    );

    // const isPlayer = !!participant && participant.as === "player";

    // if (isPlayer) return ack({ok: false, msg: "You are already a player"});

    const sockets = this.service.getSocketsByUserId(user.id);
    const ids = sockets.map((socket) => socket.id);

    sockets.forEach((socket) => {
      const id = lobby.id;

      socket.join(id);

      socket.on("disconnect", async () => {
        const sockets = this.service
          .getSocketsByUserId(user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          await this.handleAbandon(lobby.id, user.id);
        }
      });
    });

    if (participant) {
      participant.as = "player";

      this.server.to(ids).emit(events.client.SELF_PLAYER_SWITCH);

      this.server.to(lobby.id).except(ids).emit(events.client.PLAYER_SWITCH, {
        participant: participant.user.id,
      });

      return ack({ok: true, payload: {lobby: lobby.public}});
    }

    const inserted = new LobbyParticipant({
      user,
      as: "player",
      role: lobby.participants.length === 0 ? "leader" : "member",
    });

    lobby.participants.push(inserted);

    this.server.to(ids).emit(events.client.SELF_PARTICIPANT_JOIN, {
      lobby: lobby.public,
    });

    this.server.to(lobby.id).except(ids).emit(events.client.PARTICIPANT_JOIN, {
      participant: inserted.public,
    });

    await this.userService.setInterim(user.id, {
      activity: {
        type: "in-lobby",
        lobbyId: lobby.id,
      },
    });

    await this.lobbyService.save(lobby);

    return ack({ok: true, payload: {lobby: lobby.public}});
  }

  @SubscribeMessage(events.server.KICK_PARTICIPANT)
  async kickParticipant(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: KickParticipantDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

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

    await this.handleAbandon(lobby.id, kicked.user.id);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.UPDATE_DISABLED)
  async updateDisabled(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: UpdateDisabledDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

    if (!lobby) return ack({ok: false, msg: "No lobby found"});

    const participant = lobby.participants.find(
      (participant) => participant.user.id === socket.request.session.user.id,
    );

    if (!participant)
      return ack({ok: false, msg: "You are not a participant of the lobby"});

    const isLeader = participant.role === "leader";

    if (!isLeader)
      return ack({ok: false, msg: "You are not a leader of the lobby"});

    lobby.disabled = dto.cards;

    this.server.to(lobby.id).emit(events.client.DISABLED_UPDATE, {
      disabled: lobby.disabled,
    });

    await this.lobbyService.save(lobby);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.START_MATCH)
  async startMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: StartMatchDto,
  ): Promise<WsResponse> {
    const lobby = await this.lobbyService.get(dto.lobbyId);

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

    console.log(lobby.disabled);

    const {individual, main} = deck.generate(asPlayers.length, {
      disabled: lobby.disabled,
    });

    const users: User[] = await User.find({
      where: {
        id: In(asPlayers.map((player) => player.user.id)),
      },
    });

    const players = users.map((user, idx) => ({
      user,
      cards: individual[idx],
      marked: [],
    }));

    const ongoing = new OngoingMatch({
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
        ikspot: null,
      },
      type: "private",
      last: null,
    });

    const match = Match.create({
      id: ongoing.id,
      type: "private",
      status: "ongoing",
    });

    await match.save();

    players.forEach(async (player) => {
      const created = MatchPlayer.create({
        match,
        user: player.user,
        rating: player.user.rating,
      });

      await created.save();

      await this.userService.setInterim(player.user.id, {
        activity: {
          type: "in-match",
          matchId: ongoing.id,
          lobbyId: null,
        },
      });

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

      await this.userService.setInterim(spectator.user.id, {
        activity: {
          type: "spectate",
          matchId: ongoing.id,
          lobbyId: null,
        },
      });
    });

    players.forEach((player) => {
      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.MATCH_START, {
        match: ongoing.public(player.user.id),
      });
    });

    await this.inactivityQueue.add(
      {matchId: match.id},
      {
        jobId: match.id,
        delay: QUEUE.INACTIVITY.DELAY.COMMON,
      },
    );

    await this.ongoingMatchService.save(ongoing);
    await this.lobbyService.delete(lobby.id);

    return ack({
      ok: true,
      payload: {match: ongoing.public(socket.request.session.user.id)},
    });
  }
}
