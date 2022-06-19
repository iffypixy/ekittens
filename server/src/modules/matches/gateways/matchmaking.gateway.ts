import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {InjectQueue} from "@nestjs/bull";
import {nanoid} from "nanoid";
import {Queue} from "bull";
import {NextFunction, Request, Response} from "express";
import {Redis} from "ioredis";
import {Server, Socket} from "socket.io";

import {User} from "@modules/users";
import {InjectRedis} from "@lib/redis";
import {session} from "@lib/session";
import {shuffle} from "@lib/utils";
import {ack, WsResponse, WsHelper} from "@lib/ws";
import {
  EXPLOSION_SPEEDUP,
  JOB_DELAY,
  MATCH_PLAYERS_NUMBER,
  QUEUES,
} from "../matches.constants";
import {
  OngoingMatch,
  OngoingMatchPlayer,
  CardActionQueuePayload,
  InactiveQueuePayload,
  FavorQueuePayload,
  ExplodingKittenDefusePayload,
  ExplodingKittenInsertionPayload,
} from "../lib/typings";
import {plain} from "../lib/plain";
import {match as contest} from "../lib/match";
import {deck} from "../lib/deck";
import {
  DefuseDto,
  DrawCardDto,
  FavorCardDto,
  InsertDto,
  LeaveMatchDto,
  PlayCardDto,
  SkipNopeDto,
  SpeedUpExplosionDto,
} from "../dtos/gateways";

const prefix = "match";

const events = {
  server: {
    JOIN_QUEUE: `${prefix}:join-queue`,
    LEAVE_MATCH: `${prefix}:leave-match`,
    PLAY_CARD: `${prefix}:play-card`,
    DRAW_CARD: `${prefix}:draw-card`,
    DEFUSE_EXPLODING_KITTEN: `${prefix}:defuse-exploding-kitten`,
    INSERT_EXPLODING_KITTEN: `${prefix}:insert-exploding-kitten`,
    SPEED_UP_EXPLOSION: `${prefix}:speed-up-explosion`,
    SKIP_NOPE: `${prefix}:skip-nope`,
    FAVOR_CARD: `${prefix}:favor-card`,
  },
  client: {
    PLAYER_DISCONNECT: `${prefix}:player-disconnect`,
    SELF_PLAYER_DISCONNECT: `${prefix}:self-player-disconnect`,
    PLAYER_KICK: `${prefix}:player-kick`,
    SELF_PLAYER_KICK: `${prefix}:self-kick`,
    PLAYER_LEAVE: `${prefix}:player-leave`,
    SELF_PLAYER_LEAVE: `${prefix}:self-player-leave`,
    TURN_CHANGE: `${prefix}:turn-change`,
    VICTORY: `${prefix}:victory`,
    CARD_DRAW: `${prefix}:card-draw`,
    EXPLODING_KITTEN_DRAW: `${prefix}:exploding-kitten-draw`,
    SELF_EXPLODING_KITTEN_DRAW: `${prefix}:self-exploding-kitten-draw`,
    PLAYER_DEFEAT: `${prefix}:player-defeat`,
    SELF_PLAYER_DEFEAT: `${prefix}:self-player-defeat`,
    PLAYER_FAVORED: `${prefix}:player-favored`,
    SELF_PLAYER_FAVORED: `${prefix}:self-player-favored`,
    CARD_RECEIVE: `${prefix}:card-receive`,
    CARD_FAVOR: `${prefix}:card-favor`,
    FAVORED_CARD_RECEIVE: `${prefix}:favored-card-receive`,
    CARD_FAVORED: `${prefix}:card-favored`,
    SELF_CARD_FAVORED: `${prefix}:self-card-favored`,
    INITIAL_CARDS_RECEIVE: `${prefix}:initial-cards-receive`,
    FOLLOWING_CARDS_RECEIVE: `${prefix}:following-cards-receive`,
    CARD_PLAY: `${prefix}:card-play`,
    SELF_CARD_PLAY: `${prefix}:self-card-play`,
    ATTACKS_CHANGE: `${prefix}:attacks-change`,
    NOPE_CHANGE: `${prefix}:nope-change`,
    EXPLOSION_DEFUSE: `${prefix}:explosion-defuse`,
    SELF_EXPLOSION_DEFUSE: `${prefix}:self-explosion-defuse`,
    EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:exploding-kitten-insert-request`,
    SELF_EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:self-exploding-kitten-insert-request`,
    EXPLODING_KITTEN_INSERT: `${prefix}:exploding-kitten-insert`,
    SELF_EXPLODING_KITTEN_INSERT: `${prefix}:self-exploding-kitten-insert`,
    MATCH_START: `${prefix}:match-start`,
    MESSAGE_RECEIVE: `${prefix}:message-receive`,
    NOPE_SKIP_VOTE: `${prefix}:nope-skip-vote`,
    SELF_NOPE_SKIP_VOTE: `${prefix}:self-nope-skip-vote`,
  },
};

const MATCHMAKING_JOB = {
  ID: "matchmaking",
  DELAY: 5000,
};

@WebSocketGateway()
export class MatchmakingGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private readonly helper: WsHelper;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue(QUEUES.MATCHMAKING)
    private readonly matchmakingQueue: Queue<null>,
    @InjectQueue(QUEUES.CARD_ACTION)
    private readonly cardActionQueue: Queue<CardActionQueuePayload>,
    @InjectQueue(QUEUES.INACTIVE)
    private readonly inactiveQueue: Queue<InactiveQueuePayload>,
    @InjectQueue(QUEUES.FAVOR)
    private readonly favorQueue: Queue<FavorQueuePayload>,
    @InjectQueue(QUEUES.EXPLODING_KITTEN_DEFUSE)
    private readonly explodingKittenDefuseQueue: Queue<ExplodingKittenDefusePayload>,
    @InjectQueue(QUEUES.EXPLODING_KITTEN_INSERTION)
    private readonly explodingKittenInsertionQueue: Queue<ExplodingKittenInsertionPayload>,
  ) {
    this.helper = new WsHelper(this.server);
  }

  private async addInactiveJob(payload: InactiveQueuePayload) {
    await this.inactiveQueue.add(payload, {
      jobId: payload.matchId,
      delay: JOB_DELAY.INACTIVE,
    });
  }

  private async addFavorJob(payload: FavorQueuePayload) {
    await this.favorQueue.add(payload, {
      jobId: payload.matchId,
      delay: JOB_DELAY.FAVOR_RESPONSE,
    });
  }

  private async addCardActionJob(payload: CardActionQueuePayload) {
    await this.cardActionQueue.add(payload, {
      jobId: payload.matchId,
      delay: JOB_DELAY.CARD_REPEAL,
    });
  }

  private async addExplodingKittenInsertionJob(
    payload: ExplodingKittenInsertionPayload,
  ) {
    await this.explodingKittenInsertionQueue.add(payload, {
      jobId: payload.matchId,
      delay: JOB_DELAY.EXPLODING_KITTEN_INSERTION,
    });
  }

  private async removeInactiveJob(id: string) {
    const job = await this.inactiveQueue.getJob(id);

    if (job) await job.remove();
  }

  afterInit() {
    this.server.use((socket, next: NextFunction) => {
      session(this.redis)(socket.request as Request, {} as Response, next);
    });

    this.matchmakingQueue.process(async (job, done) => {
      const queueJSON = await this.redis.get("queue");
      const queue: string[] = JSON.parse(queueJSON);

      if (!queue) return done();

      await this.redis.set("queue", JSON.stringify([]));

      const id = nanoid();

      const sockets = Array.from(this.server.of("/").sockets.values());

      const enqueued = sockets.filter((socket) =>
        queue.includes(socket.request.session.user.id),
      );

      enqueued.forEach((socket) => {
        socket.join(id);

        socket.on("disconnect", () => {
          const user = socket.request.session.user;

          const sockets = this.helper
            .getSocketsByUserId(user.id)
            .map((socket) => socket.id);

          this.server
            .to(match.id)
            .except(sockets)
            .emit(events.client.PLAYER_DISCONNECT, {playerId: user.id});

          this.server.to(sockets).emit(events.client.SELF_PLAYER_DISCONNECT);
        });
      });

      const users: User[] = [];

      enqueued
        .map((socket) => socket.request.session.user)
        .forEach((user) => {
          const includes = users.some((player) => player.id === user.id);

          if (!includes) users.push(user);
        });

      const {individual, main} = deck.init(users.length);

      const players: OngoingMatchPlayer[] = users.map((user, idx) => ({
        ...user,
        public: user.public,
        cards: individual[idx],
        isOut: false,
      }));

      const match: OngoingMatch = {
        id,
        players,
        out: [],
        deck: main,
        pile: [],
        turn: 0,
        playedBy: null,
        votes: {
          nopeSkip: [],
        },
        context: {
          nope: false,
          attacks: 0,
        },
      };

      this.server.to(id).emit(events.client.MATCH_START, {
        match: plain.match(match),
      });

      match.players.forEach((player) => {
        const sockets = Array.from(this.server.of("/").sockets.values()).filter(
          (socket) => socket.request.session.user.id === player.id,
        );

        sockets.forEach((socket) => {
          this.server.to(socket.id).emit(events.client.INITIAL_CARDS_RECEIVE, {
            cards: player.cards,
          });
        });
      });

      await this.redis.set(`match:${match.id}`, JSON.stringify(match));

      return done();
    });

    this.inactiveQueue.process(async (job, done) => {
      const {matchId} = job.data;

      const matchJSON = await this.redis.get(`match:${matchId}`);
      const match: OngoingMatch = JSON.parse(matchJSON) || null;

      if (!match) return done(null, {continue: false});

      const player = match.players[match.turn];

      const sockets = this.helper
        .getSocketsByUserId(player.id)
        .map((socket) => socket.id);

      this.server.to(match.id).except(sockets).emit(events.client.PLAYER_KICK, {
        playerId: player.id,
      });

      this.server.to(sockets).emit(events.client.SELF_PLAYER_KICK);

      match.players.splice(match.turn, 1);

      match.out.push(player);

      const isEnd = match.players.length === 1;

      if (isEnd) {
        const winner = match.players[0];

        this.server.to(match.id).emit(events.client.VICTORY, {
          playerId: winner.id,
        });

        await this.redis.del(`match:${match.id}`);

        // @todo: save match in db

        return done(null, {continue: false});
      }

      contest.updateTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].id,
      });

      await this.redis.set(`match:${match.id}`, JSON.stringify(match));

      return done(null, {continue: true});
    });

    this.inactiveQueue.on(
      "completed",
      async (job, payload: {continue: boolean}) => {
        if (payload.continue) await this.addInactiveJob(job.data);
      },
    );

    this.cardActionQueue.process(async (job, done) => {
      const {matchId, card, payload} = job.data;

      const matchJSON = await this.redis.get(`match:${matchId}`);
      const match: OngoingMatch = JSON.parse(matchJSON) || null;

      if (!match) return done();

      match.votes.nopeSkip = [];

      const isNoped = match.context.nope;

      if (isNoped) {
        match.context.nope = false;

        await this.addInactiveJob({matchId: match.id});

        await this.redis.set(`match:${match.id}`, JSON.stringify(match));

        return done();
      }

      const player = match.players[match.turn];

      if (card === "attack") {
        match.context.attacks += 2;

        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn],
        });

        await this.addInactiveJob({matchId: match.id});
      } else if (card === "favor") {
        const sockets = this.helper
          .getSocketsByUserId(payload.playerId)
          .map((socket) => socket.id);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.PLAYER_FAVORED, {
            playerId: player.id,
          });

        this.server.to(sockets).emit(events.client.SELF_PLAYER_FAVORED, {
          playerId: player.id,
        });

        await this.addFavorJob({
          matchId,
          requestedId: payload.playerId,
          requesterId: player.id,
        });
      } else if (card === "see-the-future") {
        const start = match.deck.length - 4;
        const end = match.deck.length - 1;

        const cards = match.deck.slice(start, end).filter(Boolean);

        const sockets = this.helper
          .getSocketsByUserId(player.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.FOLLOWING_CARDS_RECEIVE, {
          cards,
        });

        await this.addInactiveJob({matchId: match.id});
      } else if (card === "shuffle") {
        match.deck = shuffle(match.deck);

        await this.addInactiveJob({matchId: match.id});
      } else if (card === "skip") {
        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn],
        });

        await this.addInactiveJob({matchId: match.id});
      }

      await this.redis.set(`match:${match.id}`, JSON.stringify(match));

      return done();
    });

    this.favorQueue.process(async (job, done) => {
      const {matchId, requestedId} = job.data;

      const matchJSON = await this.redis.get(`match:${matchId}`);
      const match: OngoingMatch = JSON.parse(matchJSON) || null;

      if (!match) return done();

      const favored = match.players.find((player) => player.id === requestedId);

      if (!favored) return done();

      const idx = Math.floor(Math.random() * favored.cards.length);
      const card = favored.cards[idx];

      const player = match.players[match.turn];

      const sockets = {
        favored: this.helper
          .getSocketsByUserId(favored.id)
          .map((socket) => socket.id),
        player: this.helper
          .getSocketsByUserId(player.id)
          .map((socket) => socket.id),
      };

      this.server
        .to(match.id)
        .except([...sockets.favored, ...sockets.player])
        .emit(events.client.CARD_FAVORED);

      this.server.to(sockets.favored).emit(events.client.CARD_FAVOR, {
        card,
      });

      this.server.to(sockets.player).emit(events.client.FAVORED_CARD_RECEIVE, {
        card,
      });

      await this.addInactiveJob({matchId: match.id});

      return done();
    });

    this.explodingKittenDefuseQueue.process(async (job, done) => {
      const {matchId} = job.data;

      const matchJSON = await this.redis.get(`match:${matchId}`);
      const match: OngoingMatch = JSON.parse(matchJSON) || null;

      if (!match) return done();

      const player = match.players[match.turn];

      match.players.splice(match.turn, 1);

      match.out.push(player);

      const sockets = this.helper
        .getSocketsByUserId(player.id)
        .map((socket) => socket.id);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.PLAYER_DEFEAT, {
          playerId: player.id,
        });

      this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT);

      const isEnd = match.players.length === 1;

      if (isEnd) {
        const winner = match.players[0];

        this.server.to(match.id).emit(events.client.VICTORY, {
          playerId: winner.id,
        });

        // @todo: save match in db

        await this.redis.del(`match:${match.id}`);

        return done();
      }

      contest.updateTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].id,
      });

      await this.addInactiveJob({matchId: match.id});

      await this.redis.set(`match:${match.id}`, JSON.stringify(match));
    });

    this.explodingKittenInsertionQueue.process(async (job, done) => {
      const {matchId} = job.data;

      const matchJSON = await this.redis.get(`match:${matchId}`);
      const match: OngoingMatch = JSON.parse(matchJSON) || null;

      if (!match) return done();

      const length = match.deck.length + 1;

      const idx = Math.floor(Math.random() * length);

      match.deck.splice(idx, 0, "exploding-kitten");

      const player = match.players[match.turn];

      const sockets = this.helper
        .getSocketsByUserId(player.id)
        .map((socket) => socket.id);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.EXPLODING_KITTEN_INSERT);

      this.server.to(sockets).emit(events.client.SELF_EXPLODING_KITTEN_INSERT, {
        spot: idx,
      });

      const isAttacked = match.context.attacks > 0;

      if (!isAttacked) {
        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn],
        });
      }

      await this.addInactiveJob({matchId: match.id});

      await this.redis.set(`match:${match.id}`, JSON.stringify(match));

      return done();
    });
  }

  @SubscribeMessage(events.server.JOIN_QUEUE)
  async joinQueue(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const queueJSON = await this.redis.get("queue");
    const queue: string[] = JSON.parse(queueJSON) || [];

    const isEnqueued = queue.some(
      (enqueued) => enqueued === socket.request.session.user.id,
    );

    if (isEnqueued) return ack({ok: false, msg: "You are already enqueued"});

    const job = await this.matchmakingQueue.getJob(MATCHMAKING_JOB.ID);

    if (job) await job.remove();

    queue.push(socket.request.session.user.id);

    socket.on("disconnect", async () => {
      const queueJSON = await this.redis.get("queue");
      const queue: string[] = JSON.parse(queueJSON) || [];

      const sockets = Array.from(this.server.of("/").sockets.values());

      const user = socket.request.session.user;

      const left = sockets
        .filter((s) => s.request.session.user.id === user.id)
        .filter((s) => s.id !== socket.id);

      const isEmpty = left.length === 0;

      if (isEmpty) {
        const updated = queue.filter((enqueued) => enqueued !== user.id);

        await this.redis.set("queue", JSON.stringify(updated));
      }
    });

    const isFull = queue.length === MATCH_PLAYERS_NUMBER.MAX;
    const isEnough = queue.length >= MATCH_PLAYERS_NUMBER.MIN;

    if (isEnough)
      await this.matchmakingQueue.add(null, {
        jobId: !isFull && MATCHMAKING_JOB.ID,
        delay: !isFull && MATCHMAKING_JOB.DELAY,
      });

    await this.redis.set("queue", JSON.stringify(queue));

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_MATCH)
  async leaveMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveMatchDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const user = socket.request.session.user;

    const isPlayer = match.players.some((player) => player.id === user.id);

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    match.players = match.players.filter((player) => player.id !== user.id);

    const sockets = this.helper
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT);

    this.server.to(match.id).except(sockets).emit(events.client.PLAYER_DEFEAT, {
      playerId: user.id,
    });

    await this.redis.set(`match:${match.id}`, JSON.stringify(match));

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.DRAW_CARD)
  async drawCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DrawCardDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    await this.removeInactiveJob(match.id);

    const card = match.deck.shift();

    const sockets = this.helper
      .getSocketsByUserId(player.id)
      .map((socket) => socket.id);

    this.server.to(match.id).except(sockets).emit(events.client.CARD_DRAW, {
      playerId: player.id,
      card,
    });

    const isAttacked = match.context.attacks > 0;

    if (isAttacked) {
      match.context.attacks--;

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });
    }

    const isExplodingKitten = card === "exploding-kitten";

    if (!isExplodingKitten) {
      player.cards.push(card);

      match.players = match.players.map((p) =>
        p.id === player.id ? player : p,
      );

      const isStillAttacked = match.context.attacks > 0;

      if (!isStillAttacked) {
        contest.changeTurn(match);

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });
      }

      await this.addInactiveJob({matchId: match.id});
    } else {
      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.EXPLODING_KITTEN_DRAW, {
          playerId: player.id,
        });

      await this.explodingKittenDefuseQueue.add(
        {
          matchId: match.id,
          addedAt: Date.now(),
        },
        {
          jobId: match.id,
          delay: JOB_DELAY.EXPLODING_KITTEN_DEFUSE,
        },
      );
    }

    await this.redis.set(`match:${match.id}`, JSON.stringify(match));

    return ack({
      ok: true,
      payload: {
        card,
      },
    });
  }

  @SubscribeMessage(events.server.PLAY_CARD)
  async playCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: PlayCardDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    const job = await this.cardActionQueue.getJob(match.id);
    const isNopable = !!job;

    const hasPlayed = player.id === match.playedBy;

    const isPermitted = isTurn || (isNopable && !hasPlayed);

    if (!isPermitted)
      return ack({ok: false, msg: "You are not allowed to play a card"});

    await this.removeInactiveJob(match.id);

    const sockets = this.helper
      .getSocketsByUserId(player.id)
      .map((socket) => socket.id);

    this.server.to(match.id).except(sockets).emit(events.client.CARD_PLAY, {
      playerId: player.id,
      card: dto.card,
    });

    match.pile.push(dto.card);
    match.playedBy = player.id;

    const isNope = dto.card === "nope";

    if (isNope) {
      const job = await this.cardActionQueue.getJob(match.id);

      if (job) await job.remove();

      match.context.nope = !match.context.nope;

      this.server.to(match.id).emit(events.client.NOPE_CHANGE, {
        nope: match.context.nope,
      });

      await this.addCardActionJob(job.data);
    } else {
      await this.addCardActionJob({
        matchId: match.id,
        card: dto.card,
        payload: {playerId: dto.playerId},
      });
    }

    await this.redis.set(`match:${match.id}`, JSON.stringify(match));

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.DEFUSE_EXPLODING_KITTEN)
  async defuseExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DefuseDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const hasDefuseCard = player.cards.includes("defuse");

    if (!hasDefuseCard) return ack({ok: false, msg: "You have no defuse card"});

    const job = await this.explodingKittenDefuseQueue.getJob(match.id);
    const hasToDefuse = !!job;

    if (!hasToDefuse)
      return ack({ok: false, msg: "There is nothing to defuse"});

    await job.remove();

    const idx = player.cards.findIndex((card) => card === "defuse");

    player.cards.splice(idx, 1);

    const sockets = this.helper
      .getSocketsByUserId(player.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_EXPLOSION_DEFUSE);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLOSION_DEFUSE, {
        playerId: player.id,
      });

    this.server
      .to(sockets)
      .emit(events.client.SELF_EXPLODING_KITTEN_INSERT_REQUEST);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLODING_KITTEN_INSERT_REQUEST, {
        playerId: player.id,
      });

    await this.addExplodingKittenInsertionJob({matchId: match.id});

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INSERT_EXPLODING_KITTEN)
  async insertExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InsertDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const job = await this.explodingKittenInsertionQueue.getJob(match.id);
    const hasToInsert = !!job;

    if (!hasToInsert)
      return ack({
        ok: false,
        msg: "You are not asked to insert an exploding kitten",
      });

    await job.remove();

    match.deck.splice(parseInt(dto.spot, 10), 0, "exploding-kitten");

    match.deck = match.deck.filter(Boolean);

    const sockets = this.helper
      .getSocketsByUserId(player.id)
      .map((socket) => socket.id);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLODING_KITTEN_INSERT);

    const isAttacked = match.context.attacks > 0;

    if (!isAttacked) {
      contest.changeTurn(match);

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].id,
      });
    }

    await this.addInactiveJob({matchId: match.id});

    await this.redis.set(`match:${match.id}`, JSON.stringify(match));

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SPEED_UP_EXPLOSION)
  async speedUpExplosion(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SpeedUpExplosionDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const job = await this.explodingKittenDefuseQueue.getJob(match.id);
    const hasToDefuse = !!job;

    if (!hasToDefuse)
      return ack({ok: false, msg: "You do not even need to defuse"});

    const hasDefuseCard = player.cards.includes("defuse");

    if (hasDefuseCard) return ack({ok: false, msg: "You have a defuse card"});

    await job.remove();

    const left =
      JOB_DELAY.EXPLODING_KITTEN_DEFUSE -
      (Date.now() - job.data.addedAt) -
      EXPLOSION_SPEEDUP;

    const delay = left > 0 ? left : 0;

    await this.explodingKittenDefuseQueue.add(
      {
        matchId: match.id,
        addedAt: Date.now(),
      },
      {
        jobId: match.id,
        delay,
      },
    );

    return ack({ok: true, payload: {delay}});
  }

  @SubscribeMessage(events.server.SKIP_NOPE)
  async skipNope(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SkipNopeDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.id === match.players[match.turn].id;

    if (isTurn) return ack({ok: false, msg: "It is your turn to draw a card"});

    const job = await this.cardActionQueue.getJob(match.id);
    const isNopable = !!job;

    if (!isNopable)
      return ack({ok: false, msg: "There is nothing that could be noped"});

    const hasAlreadyVoted = match.votes.nopeSkip.includes(player.id);

    if (hasAlreadyVoted) return ack({ok: false, msg: "You have already voted"});

    match.votes.nopeSkip.push(player.id);

    const sockets = this.helper
      .getSocketsByUserId(player.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_NOPE_SKIP_VOTE);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.NOPE_SKIP_VOTE, {
        voted: match.votes.nopeSkip,
      });

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.FAVOR_CARD)
  async favorCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: FavorCardDto,
  ): Promise<WsResponse> {
    const matchJSON = await this.redis.get(`match:${dto.matchId}`);
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.id === socket.request.session.user.id,
    );

    const isPlayer = !!player;

    if (!isPlayer)
      return ack({ok: false, msg: "You are not a player of the match"});

    const job = await this.favorQueue.getJob(match.id);
    const isSomeoneRequested = !!job;

    if (!isSomeoneRequested)
      return ack({ok: false, msg: "Noone is requested to favor a card"});

    const isRequested = job.data.requestedId === player.id;

    if (!isRequested)
      return ack({ok: false, msg: "You are not requested to favor a card"});

    const requester = match.players.find(
      (player) => player.id === job.data.requesterId,
    );

    if (!requester) return ack({ok: false, msg: "No requester player found"});

    await job.remove();

    const hasChosenCard = player.cards.includes(dto.card);

    if (!hasChosenCard)
      return ack({ok: false, msg: "You do not have the chosen card"});

    const idx = player.cards.findIndex((card) => card === dto.card);

    const [card] = player.cards.splice(idx, 1);

    requester.cards.push(card);

    const sockets = {
      requested: this.helper
        .getSocketsByUserId(player.id)
        .map((socket) => socket.id),
      requester: this.helper
        .getSocketsByUserId(requester.id)
        .map((socket) => socket.id),
    };

    this.server
      .to(match.id)
      .except([...sockets.requested, ...sockets.requester])
      .emit(events.client.CARD_FAVORED, {
        requesterId: requester.id,
        requestedId: player.id,
      });

    this.server.to(sockets.requester).emit(events.client.FAVORED_CARD_RECEIVE, {
      card,
      requestedId: player.id,
    });

    this.server.to(sockets.requested).emit(events.client.SELF_CARD_FAVORED, {
      requesterId: requester.id,
    });

    return ack({ok: true});
  }
}
