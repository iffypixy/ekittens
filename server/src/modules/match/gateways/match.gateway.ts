import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {InjectQueue} from "@nestjs/bull";
import Bull, {Queue} from "bull";
import {NextFunction, Request, Response} from "express";
import {Server, Socket} from "socket.io";

import {UserInterim, UserService} from "@modules/user";
import {RedisService, RP} from "@lib/redis";
import {session} from "@lib/session";
import {utils} from "@lib/utils";
import {ack, WsResponse, WsService} from "@lib/ws";
import {elo} from "@lib/elo";
import {MatchPlayerService, MatchService} from "../services";
import {events} from "../lib/events";
import {MATCH_STATE, QUEUE} from "../lib/constants";
import {
  OngoingMatch,
  CardActionQueuePayload,
  InactivityQueuePayload,
  Card,
} from "../lib/typings";
import {contest} from "../lib/contest";
import {
  AlterFutureCardsDto,
  DefuseDto,
  DrawCardDto,
  InsertExplodingKittenDto,
  LeaveMatchDto,
  PlayCardDto,
  SkipNopeDto,
  SpeedUpExplosionDto,
  BuryCardDto,
  ShareFutureCardsDto,
  InsertImplodingKittenDto,
  NopeCardActionDto,
  JoinMatchDto,
  LeaveSpectatorsDto,
  JoinSpectatorsDto,
} from "../dtos/gateways";

@WebSocketGateway()
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private readonly service: WsService;

  constructor(
    @InjectQueue(QUEUE.CARD_ACTION.NAME)
    private readonly cardActionQueue: Queue<CardActionQueuePayload>,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
    private readonly redisService: RedisService,
    private readonly matchService: MatchService,
    private readonly matchPlayerService: MatchPlayerService,
    private readonly userService: UserService,
  ) {
    this.service = new WsService(this.server);
  }

  private async startInactivityTimer(
    payload: InactivityQueuePayload,
    options?: Bull.JobOptions,
  ) {
    await this.inactivityQueue.add(
      payload,
      options || {
        jobId: payload.matchId,
        delay: QUEUE.INACTIVITY.DELAY,
      },
    );
  }

  private async startCardActionTimer(
    payload: CardActionQueuePayload,
    options?: Bull.JobOptions,
  ) {
    await this.cardActionQueue.add(
      payload,
      options || {
        jobId: payload.matchId,
        delay: QUEUE.CARD_ACTION.DELAY,
      },
    );
  }

  private async stopInactivityTimer(id: Bull.Job["id"]) {
    const job = await this.inactivityQueue.getJob(id);

    if (job) await job.remove();
  }

  private async handleDefeat(match: OngoingMatch, id: string): Promise<void> {
    const loser = match.out.find((player) => player.user.id === id);
    const user = loser.user;

    let ratingShift: number;

    const isPublic = match.type === "public";

    if (isPublic) {
      const opponents = [...match.players, ...match.out].filter(
        (p) => p.user.id !== user.id,
      );

      const rating = elo.ifLost(
        user.rating,
        opponents.map((player) => player.user.rating),
      );

      ratingShift = rating - user.rating;

      await this.userService.update(user, {rating});
    }

    await this.matchPlayerService.update(
      {user},
      {
        ratingShift,
        isWinner: false,
      },
    );

    await this.redisService.update<UserInterim>(`${RP.USER}:${user.id}`, {
      matchId: null,
    });
  }

  private async handleVictory(match: OngoingMatch, id: string): Promise<void> {
    const winner = match.players.find((player) => player.user.id === id);
    const user = winner.user;

    let ratingShift: number;

    const isPublic = match.type === "public";

    if (isPublic) {
      const opponents = [...match.players, ...match.out].filter(
        (p) => p.user.id !== user.id,
      );

      const rating = elo.ifLost(
        user.rating,
        opponents.map((player) => player.user.rating),
      );

      ratingShift = rating - user.rating;

      await this.userService.update(user, {rating});
    }

    await this.matchPlayerService.update(
      {user},
      {
        ratingShift,
        isWinner: true,
      },
    );

    await this.redisService.update<UserInterim>(`${RP.USER}:${user.id}`, {
      matchId: null,
    });
  }

  private async handleEnd(ongoing: OngoingMatch): Promise<void> {
    await this.matchService.update({id: ongoing.id}, {status: "completed"});

    await this.redisService.delete(`${RP.MATCH}:${ongoing.id}`);
  }

  async afterInit() {
    this.server.use((socket, next: NextFunction) => {
      session(this.redisService.redis)(
        socket.request as Request,
        {} as Response,
        next,
      );
    });

    await this.inactivityQueue.process(async (job, done) => {
      const {matchId} = job.data;

      const match = await this.redisService.get<OngoingMatch>(
        `${RP.MATCH}:${matchId}`,
      );

      if (!match) return done(null, {continue: false});

      const player = match.players[match.turn];

      contest.removePlayer(match, player.user.id);

      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.SELF_PLAYER_KICK);

      this.server.to(match.id).except(sockets).emit(events.client.PLAYER_KICK, {
        playerId: player.user.id,
      });

      await this.handleDefeat(match, player.user.id);

      if (contest.isEnd(match)) {
        const winner = match.players[0];

        this.server.to(match.id).emit(events.client.VICTORY, {
          playerId: winner.user.id,
        });

        await this.handleVictory(match, winner.user.id);
        await this.handleEnd(match);

        return done(null, {continue: false});
      }

      const isReversed = match.context.reversed;

      if (isReversed) {
        const previous = match.players[match.turn - 1];

        if (previous) match.turn--;
        else match.turn = match.players.length - 1;
      }

      contest.updateTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn],
      });

      contest.resetStatus(match);

      await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

      return done(null, {continue: true});
    });

    this.inactivityQueue.on(
      "completed",
      async (job, payload: {continue: boolean}) => {
        if (payload.continue) await this.startInactivityTimer(job.data);
      },
    );

    await this.cardActionQueue.process(async (job, done) => {
      const {matchId, card, payload} = job.data;

      const match = await this.redisService.get<OngoingMatch>(
        `${RP.MATCH}:${matchId}`,
      );

      if (!match) return done();

      contest.resetSkipVotes(match);

      const isNoped = match.context.noped;

      if (isNoped) {
        this.server.to(match.id).emit(events.client.ACTION_NOPED);

        contest.resetNope(match);

        this.server.to(match.id).emit(events.client.NOPED_CHANGE, {
          noped: match.context.noped,
        });

        contest.resetStatus(match);

        await this.startInactivityTimer({matchId: match.id});

        await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

        return done();
      }

      const player = match.players[match.turn];

      const isAttack = card === "attack";
      const isTargetedAttack = card === "targeted-attack";
      const isPersonalAttack = card === "personal-attack";
      const isSeeTheFuture3X = card === "see-the-future-3x";
      const isSeeTheFuture5X = card === "see-the-future-5x";
      const isSeeTheFuture = isSeeTheFuture3X || isSeeTheFuture5X;
      const isAlterTheFuture3X = card === "alter-the-future-3x";
      const isShareTheFuture3X = card === "share-the-future-3x";
      const isShuffle = card === "shuffle";
      const isSkip = card === "skip";
      const isSuperSkip = card === "super-skip";
      const isDrawFromTheBottom = card === "draw-from-the-bottom";
      const isSwapTopAndBottom = card === "swap-top-and-bottom";
      const isReverse = card === "reverse";
      const isCatomicBomb = card === "catomic-bomb";
      const isMark = card === "mark";
      const isBury = card === "bury";

      if (isAttack) {
        contest.addAttacks(match, 2);

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn],
        });

        contest.resetStatus(match);
      } else if (isSeeTheFuture) {
        const end = isSeeTheFuture3X ? 3 : isSeeTheFuture5X ? 5 : 0;

        const cards = match.draw.slice(0, end).filter(Boolean);

        const sockets = this.service
          .getSocketsByUserId(player.user.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.FUTURE_CARDS_RECEIVE, {
          cards,
        });

        contest.resetStatus(match);
      } else if (isShuffle) {
        match.draw = utils.shuffle(match.draw);
      } else if (isSkip) {
        contest.lessenAttacks(match);

        if (!contest.isAttacked(match)) {
          contest.changeTurn(match);

          this.server.to(match.id).emit(events.client.TURN_CHANGE, {
            playerId: match.players[match.turn],
          });
        }

        contest.resetStatus(match);
      } else if (isTargetedAttack) {
        contest.addAttacks(match, 2);

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        match.turn = match.players.findIndex(
          (player) => player.user.id === payload.playerId,
        );

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].user.id,
        });

        contest.resetStatus(match);
      } else if (isDrawFromTheBottom) {
        const card = match.draw.pop();

        const sockets = this.service
          .getSocketsByUserId(player.user.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.SELF_BOTTOM_CARD_DRAW, {
          card,
        });

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.BOTTOM_CARD_DRAW);

        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].user.id,
        });

        contest.resetStatus(match);
      } else if (isReverse) {
        contest.reverse(match);

        contest.resetStatus(match);
      } else if (isSuperSkip) {
        contest.resetAttacks(match);

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn],
        });

        contest.resetStatus(match);
      } else if (isSwapTopAndBottom) {
        contest.swapTopAndBottom(match);

        contest.resetStatus(match);
      } else if (isCatomicBomb) {
        const deck = match.draw.filter((card) => card !== "exploding-kitten");
        const shuffled = utils.shuffle(deck);

        const amount = match.draw.filter(
          (card) => card === "exploding-kitten",
        ).length;

        const addition = new Array<Card>(amount).fill("exploding-kitten");

        shuffled.unshift(...addition);

        match.draw = shuffled;

        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].user.id,
        });

        contest.resetStatus(match);
      } else if (isPersonalAttack) {
        contest.addAttacks(match, 3);

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        contest.resetStatus(match);
      } else if (isAlterTheFuture3X) {
        contest.setState(match, {
          type: MATCH_STATE.FUTURE_CARDS_ALTER,
        });
      } else if (isMark) {
        const target = match.players.find(
          (player) => player.user.id === payload.playerId,
        );

        target.marked.push(payload.cardIndex);

        const card = target.cards[payload.cardIndex];

        const sockets = this.service
          .getSocketsByUserId(target.user.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.SELF_CARD_MARK, {
          card,
          playerId: player.user.id,
          cardIndex: payload.cardIndex,
        });

        this.server.to(match.id).except(sockets).emit(events.client.CARD_MARK, {
          card,
          playerId: player.user.id,
          cardIndex: payload.cardIndex,
        });

        contest.resetStatus(match);

        match.players = match.players.map((p) =>
          p.user.id === target.user.id ? target : p,
        );
      } else if (isBury) {
        const card = match.draw.shift();

        const sockets = this.service
          .getSocketsByUserId(player.user.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.SELF_BURYING_CARD_DISPLAY, {
          card,
        });

        contest.setState(match, {
          type: MATCH_STATE.CARD_BURY,
        });
      } else if (isShareTheFuture3X) {
        contest.setState(match, {
          type: MATCH_STATE.FUTURE_CARDS_SHARE,
        });
      }

      await this.startInactivityTimer({matchId: match.id});

      match.players = match.players.map((p) =>
        p.user.id === player.user.id ? player : p,
      );

      await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

      return done();
    });
  }

  @SubscribeMessage(events.server.JOIN_MATCH)
  async joinMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinMatchDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const user = socket.request.session.user;

    const player = [...match.players, ...match.out].find(
      (player) => player.user.id === user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const sockets = this.service
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    const isJoined = sockets.includes(socket.id);

    if (isJoined) return ack({ok: false, msg: "You are already joined"});

    socket.join(match.id);

    socket.on("disconnect", () => {
      const sockets = this.service
        .getSocketsByUserId(user.id)
        .filter((s) => s.id !== socket.id);

      const isDisconnected = sockets.length === 0;

      if (isDisconnected) {
        this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
          playerId: user.id,
        });
      }
    });

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.JOIN_SPECTATORS)
  async joinSpectators(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinSpectatorsDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const id = match.id;

    const user = socket.request.session.user;

    const isPlayer = match.players.some((player) => player.user.id === user.id);

    if (isPlayer) return ack({ok: false, msg: "You are a player of the match"});

    const sockets = this.service
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    const isInRoom = sockets.includes(socket.id);

    if (isInRoom) return ack({ok: false, msg: "You are already a spectator"});

    socket.join(id);

    socket.on("disconnect", async () => {
      const sockets = this.service
        .getSocketsByUserId(user.id)
        .filter((s) => s.id !== socket.id);

      const isDisconnected = sockets.length === 0;

      if (isDisconnected) {
        const match = await this.redisService.get<OngoingMatch>(
          `${RP.MATCH}:${id}`,
        );

        if (!match) return;

        match.spectators = match.spectators.filter(
          (spec) => spec.id !== user.id,
        );

        this.server.to(match.id).emit(events.client.SPECTATOR_LEAVE, {
          userId: user.id,
        });

        await this.redisService.set(`${RP.MATCH}:${id}`, match);
      }
    });

    const isSpectator = match.spectators.some((spec) => spec.id === user.id);

    if (!isSpectator) {
      match.spectators.push(user);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.NEW_SPECTATOR, {
          user: user.public,
        });
    }

    await this.redisService.set(`${RP.MATCH}:${id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_SPECTATORS)
  async leaveSpectators(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveSpectatorsDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const user = socket.request.session.user;

    const isSpectator = match.spectators.some((spec) => spec.id === user.id);

    if (!isSpectator) return ack({ok: false, msg: "You are not a spectator"});

    socket.leave(match.id);

    const left = this.service
      .getSocketsByUserId(user.id)
      .filter((s) => s.id !== socket.id);

    const isEmpty = left.length === 0;

    if (isEmpty) {
      match.spectators = match.spectators.filter((spec) => spec.id !== user.id);

      this.server.to(match.id).emit(events.client.SPECTATOR_LEAVE, {
        userId: user.id,
      });

      await this.redisService.set(`${RP.MATCH}:${match.id}`, match);
    }

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_MATCH)
  async leaveMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveMatchDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const playerIndex = match.players.findIndex(
      (p) => p.user.id === player.user.id,
    );

    const isTurn = playerIndex === match.turn;

    if (isTurn) await this.stopInactivityTimer(match.id);

    contest.removePlayer(match, player.user.id);

    const sockets = this.service.getSocketsByUserId(player.user.id);

    sockets.forEach((socket) => {
      socket.leave(match.id);
    });

    const ids = sockets.map((socket) => socket.id);

    this.server.to(ids).emit(events.client.SELF_PLAYER_LEAVE);

    this.server.to(match.id).except(ids).emit(events.client.PLAYER_LEAVE, {
      playerId: player.user.id,
    });

    this.handleDefeat(match, player.user.id);

    if (contest.isEnd(match)) {
      const winner = match.players[0];

      this.server.to(match.id).emit(events.client.VICTORY, {
        playerId: winner.user.id,
      });

      await this.handleVictory(match, winner.user.id);
      await this.handleEnd(match);

      return ack({ok: true});
    }

    const isTurnAffected = playerIndex >= match.turn;

    if (isTurnAffected) {
      if (isTurn) {
        const isReversed = match.context.reversed;

        if (isReversed) {
          const previous = match.players[match.turn - 1];

          if (previous) match.turn--;
          else match.turn = match.players.length - 1;
        }

        contest.updateTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].user.id,
        });

        contest.setState(match, {
          type: MATCH_STATE.WAITING_FOR_ACTION,
        });
      } else {
        match.turn--;
      }
    }

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.DRAW_CARD)
  async drawCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DrawCardDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(match, MATCH_STATE.WAITING_FOR_ACTION);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to draw a card"});

    await this.stopInactivityTimer(match.id);

    const card = match.draw.shift();

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_CARD_DRAW, {
      card,
    });

    this.server.to(match.id).except(sockets).emit(events.client.CARD_DRAW, {
      playerId: player.user.id,
    });

    if (contest.isAttacked(match)) {
      contest.lessenAttacks(match);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });
    }

    const isClosedImplodingKitten = card === "imploding-kitten-closed";
    const isOpenImplodingKitten = card === "imploding-kitten-open";
    const isImplodingKitten = isClosedImplodingKitten || isOpenImplodingKitten;

    const isExplodingKitten = card === "exploding-kitten";

    const hasEnoughStreakingKittens =
      player.cards.filter((card) => card === "streaking-kitten").length >=
      player.cards.filter((card) => card === "exploding-kitten").length + 1;

    const isExposedToExplodingKitten =
      isExplodingKitten && !hasEnoughStreakingKittens;

    if (isImplodingKitten) {
      if (isClosedImplodingKitten) {
        this.server
          .to(sockets)
          .emit(events.client.SELF_CLOSED_IMPLODING_KITTEN_DRAW);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.CLOSED_IMPLODING_KITTEN_DRAW, {
            playerId: player.user.id,
          });

        contest.setState(match, {
          type: MATCH_STATE.IMPLODING_KITTEN_INSERTION,
        });
      } else if (isOpenImplodingKitten) {
        this.server
          .to(sockets)
          .emit(events.client.SELF_OPEN_IMPLODING_KITTEN_DRAW);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.OPEN_IMPLODING_KITTEN_DRAW, {
            playerId: player.user.id,
          });

        contest.removePlayer(match, player.user.id);

        this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.PLAYER_DEFEAT, {
            playerId: player.user.id,
          });

        await this.handleDefeat(match, player.user.id);

        if (contest.isEnd(match)) {
          const winner = match.players[0];

          this.server.to(match.id).emit(events.client.VICTORY, {
            playerId: winner.user.id,
          });

          await this.handleVictory(match, winner.user.id);
          await this.handleEnd(match);

          return ack({ok: true});
        }

        const isReversed = match.context.reversed;

        if (isReversed) {
          const previous = match.players[match.turn - 1];

          if (previous) match.turn--;
          else match.turn = match.players.length - 1;
        }

        contest.updateTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].user.id,
        });

        contest.setState(match, {
          type: MATCH_STATE.WAITING_FOR_ACTION,
        });
      }
    } else if (isExposedToExplodingKitten) {
      this.server.to(sockets).emit(events.client.SELF_EXPLOSION);

      this.server.to(match.id).except(sockets).emit(events.client.EXPLOSION, {
        playerId: player.user.id,
      });

      contest.setState(match, {
        type: MATCH_STATE.EXPLODING_KITTEN_DEFUSE,
      });
    } else {
      player.cards.push(card);

      if (!contest.isAttacked(match)) {
        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });
      }

      contest.setState(match, {
        type: MATCH_STATE.WAITING_FOR_ACTION,
      });
    }

    await this.startInactivityTimer({matchId: match.id});

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({
      ok: true,
    });
  }

  @SubscribeMessage(events.server.PLAY_CARD)
  async playCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: PlayCardDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(match, MATCH_STATE.WAITING_FOR_ACTION);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to play a card"});

    const card = player.cards[dto.cardIndex];

    if (!card) return ack({ok: false, msg: "No card found"});

    const isTargetedAttack = card === "targeted-attack";
    const isMark = card === "mark";

    if (isTargetedAttack) {
      const payload: {
        playerId: string;
      } = dto.payload;

      const targeted = match.players
        .filter((p) => p.user.id !== player.user.id)
        .find((player) => player.user.id === payload.playerId);

      if (!targeted) return ack({ok: false, msg: "No targeted player found"});
    } else if (isMark) {
      const payload: {
        playerId: string;
        cardIndex: number;
      } = dto.payload;

      const targeted = match.players
        .filter((p) => p.user.id !== player.user.id)
        .find((player) => player.user.id === payload.playerId);

      if (!targeted) return ack({ok: false, msg: "No targeted player found"});

      const card = targeted.cards[payload.cardIndex];

      if (!card) return ack({ok: false, msg: "No targeted card found"});

      const isAlreadyMarked = targeted.marked.includes(payload.cardIndex);

      if (isAlreadyMarked)
        return ack({ok: false, msg: "Targeted card is already marked"});
    }

    await this.stopInactivityTimer(match.id);

    player.marked = player.marked
      .filter((index) => index !== dto.cardIndex)
      .map((index) => (index > dto.cardIndex ? index - 1 : index));

    match.discard.push(card);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_CARD_PLAY);

    this.server.to(match.id).except(sockets).emit(events.client.CARD_PLAY, {
      card,
      playerId: player.user.id,
      cardIndex: dto.cardIndex,
    });

    contest.setState(match, {
      type: MATCH_STATE.ACTION_DELAY,
    });

    await this.startCardActionTimer({
      card,
      matchId: match.id,
      payload: dto.payload,
    });

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.NOPE_CARD_ACTION)
  async nopeCardAction(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: NopeCardActionDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isAllowed = contest.isState(match, MATCH_STATE.ACTION_DELAY);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to nope a card"});

    const job = await this.cardActionQueue.getJob(match.id);

    await job.remove();

    contest.toggleNoped(match);

    this.server.to(match.id).emit(events.client.NOPED_CHANGE, {
      noped: match.context.noped,
    });

    await this.startCardActionTimer(job.data);

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.DEFUSE_EXPLODING_KITTEN)
  async defuseExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DefuseDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(
      match,
      MATCH_STATE.EXPLODING_KITTEN_DEFUSE,
    );

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to defuse an exploding kitten",
      });

    const card = player.cards[dto.cardIndex];

    const isDefuse = card === "defuse";

    if (!isDefuse) return ack({ok: false, msg: "It is not a defuse card"});

    await this.stopInactivityTimer(match.id);

    player.cards.splice(dto.cardIndex, 1);

    match.discard.push("defuse");

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_EXPLOSION_DEFUSE);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLOSION_DEFUSE, {
        playerId: player.user.id,
      });

    this.server
      .to(sockets)
      .emit(events.client.SELF_EXPLODING_KITTEN_INSERT_REQUEST);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLODING_KITTEN_INSERT_REQUEST, {
        playerId: player.user.id,
      });

    contest.setState(match, {
      type: MATCH_STATE.EXPLODING_KITTEN_INSERTION,
    });

    await this.startInactivityTimer({matchId: match.id});

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INSERT_EXPLODING_KITTEN)
  async insertExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InsertExplodingKittenDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(
      match,
      MATCH_STATE.EXPLODING_KITTEN_INSERTION,
    );

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to insert an exploding kitten",
      });

    await this.stopInactivityTimer(match.id);

    match.draw.splice(dto.spotIndex, 0, "exploding-kitten");

    match.draw = match.draw.filter(Boolean);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLODING_KITTEN_INSERT);

    if (!contest.isAttacked(match)) {
      contest.changeTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].user.id,
      });
    }

    contest.resetStatus(match);

    await this.startInactivityTimer({matchId: match.id});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SKIP_NOPE)
  async skipNope(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SkipNopeDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isAllowed = contest.isState(match, MATCH_STATE.ACTION_DELAY);

    if (!isAllowed) return ack({ok: false, msg: "It is not nope wait"});

    const current = match.players[match.turn];

    const isTurn = player.user.id === current.user.id;

    if (isTurn)
      return ack({ok: false, msg: "You can't skip nope on your turn"});

    const hasAlreadyVoted = match.votes.skip.includes(player.user.id);

    if (hasAlreadyVoted) return ack({ok: false, msg: "You have already voted"});

    await this.stopInactivityTimer(match.id);

    match.votes.skip.push(player.user.id);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_NOPE_SKIP_VOTE);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.NOPE_SKIP_VOTE, {
        voted: match.votes.skip,
      });

    const toSkip =
      match.players
        .map((player) => player.user.id)
        .filter((id) => id !== current.user.id)
        .sort()
        .toString() === [...match.votes.skip].sort().toString();

    if (toSkip) {
      const job = await this.cardActionQueue.getJob(match.id);

      await job.remove();

      await this.startCardActionTimer(job.data, {});

      this.server.to(match.id).emit(events.client.ACTION_SKIPPED);
    }

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.ALTER_FUTURE_CARDS)
  async alterFutureCards(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: AlterFutureCardsDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(match, MATCH_STATE.FUTURE_CARDS_ALTER);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to alter future cards"});

    const areTheSameCards =
      [...dto.order].sort().toString() ===
      match.draw.slice(0, 3).filter(Boolean).sort().toString();

    if (!areTheSameCards)
      return ack({ok: false, msg: "The cards are not the same"});

    await this.stopInactivityTimer(match.id);

    match.draw.splice(0, 3, ...dto.order);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_FUTURE_CARDS_ALTER, {
      cards: dto.order,
    });

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.FUTURE_CARDS_ALTER);

    contest.resetStatus(match);

    await this.startInactivityTimer({matchId: match.id});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SPEED_UP_EXPLOSION)
  async speedUpExplosion(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SpeedUpExplosionDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(
      match,
      MATCH_STATE.EXPLODING_KITTEN_DEFUSE,
    );

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to speed up an explosion",
      });

    const hasDefuse = player.cards.includes("defuse");

    if (hasDefuse) return ack({ok: false, msg: "You have a defuse card"});

    await this.stopInactivityTimer(match.id);

    await this.startInactivityTimer({matchId: match.id}, {});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.BURY_CARD)
  async buryCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: BuryCardDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(match, MATCH_STATE.CARD_BURY);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to bury a card"});

    await this.stopInactivityTimer(match.id);

    const card = match.draw.shift();

    match.draw.splice(dto.spotIndex, 0, card);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_CARD_BURY, {
      spotIndex: dto.spotIndex,
    });

    this.server.to(match.id).except(sockets).emit(events.client.CARD_BURY);

    contest.changeTurn(match);

    this.server.to(match.id).emit(events.client.TURN_CHANGE, {
      playerId: match.players[match.turn].user.id,
    });

    contest.resetStatus(match);

    await this.startInactivityTimer({matchId: match.id});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SHARE_FUTURE_CARDS)
  async shareFutureCards(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: ShareFutureCardsDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(match, MATCH_STATE.FUTURE_CARDS_SHARE);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to share future cards"});

    const areTheSameCards =
      [...dto.order].sort().toString() ===
      match.draw.slice(0, 3).filter(Boolean).sort().toString();

    if (!areTheSameCards)
      return ack({ok: false, msg: "The cards are not the same"});

    await this.stopInactivityTimer(match.id);

    match.draw.splice(0, 3, ...dto.order);

    const duplicate = {...match};

    contest.changeTurn(duplicate);

    const next = duplicate.players[duplicate.turn];

    const sockets = {
      player: this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id),
      next: this.service
        .getSocketsByUserId(next.user.id)
        .map((socket) => socket.id),
    };

    this.server.to(sockets.player).emit(events.client.SELF_FUTURE_CARDS_SHARE, {
      cards: dto.order,
    });

    this.server
      .to(sockets.next)
      .emit(events.client.SELF_FUTURE_CARDS_PLAYER_SHARE, {
        playerId: player.user.id,
        cards: dto.order,
      });

    this.server
      .to(match.id)
      .except(sockets.player)
      .emit(events.client.FUTURE_CARDS_SHARE);

    contest.resetStatus(match);

    await this.startInactivityTimer({matchId: match.id});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INSERT_IMPLODING_KITTEN)
  async insertImplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InsertImplodingKittenDto,
  ): Promise<WsResponse> {
    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${dto.matchId}`,
    );

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = contest.isState(
      match,
      MATCH_STATE.IMPLODING_KITTEN_INSERTION,
    );

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to insert an imploding kitten",
      });

    await this.stopInactivityTimer(match.id);

    match.draw.splice(dto.spotIndex, 0, "imploding-kitten-open");

    match.draw = match.draw.filter(Boolean);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.IMPLODING_KITTEN_INSERT, {
        spot: dto.spotIndex,
      });

    if (!contest.isAttacked(match)) {
      contest.changeTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].user.id,
      });
    }

    contest.resetStatus(match);

    await this.startInactivityTimer({matchId: match.id});

    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);

    return ack({ok: true});
  }
}
