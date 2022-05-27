import {redis} from "@/lib/redis";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {InjectQueue} from "@nestjs/bull";
import {Queue} from "bull";

import {Lobby} from "@modules/lobby";
import {shuffle} from "@lib/shuffle";
import {
  DrawCardDto,
  PlayCardDto,
  PlayDefuseDto,
  StartDto,
} from "./dtos/gateways";
import {Match, MatchPublic} from "./lib/typings";
import {Card, deck} from "./lib/deck";
import {plain} from "./lib/plain";

const events = {
  server: {
    START: "match:start",
    DRAW_CARD: "match:draw-card",
    PLAY_CARD: "match:play-card",
    PLAY_DEFUSE: "match:play-defuse",
    PLAY_NOPE: "match:play-nope",
  },
  client: {
    KICKED: "match:kicked",
    PLAYER_KICKED: "match:player-kicked",
    TURN_CHANGE: "match:turn-change",
    VICTORY: "match:victory",
    CARD_DREW: "match:card-drew",
    EXPLODING_KITTEN_DREW: "match:exploding-kitten-drew",
    PLAYER_DEFEATED: "match:player-defeated",
    DEFEAT: "match:defeat",
    FAVORED: "match:favored",
    CARD_RECEIVED: "match:card-received",
    FAVOR_CARD: "match:favor-card",
    FOLLOWING_CARDS: "match:following-cards",
    CARD_PLAYED: "match:card-played",
    ATTACKS_CHANGE: "match:attacks-change",
    PLAYER_FAVORED: "match:player-favored",
    NOPE_CHANGE: "match:nope-change",
    EXPLOSION_DEFUSED: "match:explosion-defused",
    DEFUSED: "match:defused",
    EXPLODING_KITTEN_SPOT_REQUEST: "match:exploding-kitten-spot-request",
    EXPLODING_KITTEN_SET: "match:exploding-kitten-set",
    SET_EXPLODING_KITTEN: "match:set-exploding-kitten",
  },
};

const INACTIVE_DELAY = 15000;
const EXPLOSION_DELAY = 10000;
const FAVOR_RESPONSE_DELAY = 10000;
const SPOT_RESPONSE_DELAY = 10000;
const PLAY_DELAY = 5000;

interface InactiveQueuePayload {
  matchId: string;
}

interface ExplosionQueuePayload {
  matchId: string;
}

interface FavorResponseQueuePayload {
  matchId: string;
  performerId: string;
  requestorId: string;
}

interface PlayQueuePayload {
  matchId: string;
  card: Card;
  playerId: string;
}

interface SpotResponseQueuePayload {
  matchId: string;
}

@WebSocketGateway({
  cookie: true,
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  },
})
export class MatchGateway implements OnGatewayInit {
  constructor(
    @InjectQueue("inactive")
    private readonly inactiveQueue: Queue<InactiveQueuePayload>,
    @InjectQueue("explosion")
    private readonly explosionQueue: Queue<ExplosionQueuePayload>,
    @InjectQueue("favor-response")
    private readonly favorResponseQueue: Queue<FavorResponseQueuePayload>,
    @InjectQueue("play")
    private readonly playQueue: Queue<PlayQueuePayload>,
    @InjectQueue("spot-response")
    private readonly spotResponseQueue: Queue<SpotResponseQueuePayload>,
  ) {}

  @WebSocketServer()
  server: Server;

  async afterInit() {
    await this.spotResponseQueue.process(async (job, done) => {
      const json = await redis.get(`match:${job.data.matchId}`);
      const match: Match = JSON.parse(json);

      if (!match) done();

      const player = match.players[match.turn];

      const idx = Math.round(Math.random() * match.deck.length);

      match.deck.splice(idx, 0, "exploding-kitten");

      this.server.to(player.id).emit(events.client.SET_EXPLODING_KITTEN, {
        idx,
      });

      this.server
        .to(match.id)
        .except(player.id)
        .emit(events.client.EXPLODING_KITTEN_SET);

      const next = match.players[match.turn + 1];

      if (!!next) match.turn++;
      else match.turn = 0;

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].id,
      });

      await this.inactiveQueue.add(
        {matchId: match.id},
        {
          delay: INACTIVE_DELAY,
          jobId: match.id,
        },
      );

      await redis.set(`match:${match.id}`, JSON.stringify(match));

      done();
    });

    await this.playQueue.process(async (job, done) => {
      const {matchId, card, playerId} = job.data;

      const json = await redis.get(`match:${matchId}`);
      const match: Match = JSON.parse(json);

      if (!match) done();

      if (match.context.nope) done(null, true);

      const turn = () => {
        const next = match.players[match.turn + 1];

        if (!!next) match.turn++;
        else match.turn = 0;
      };

      const player = match.players[match.turn];

      if (card === "attack") {
        turn();

        match.context.attacks += 2;

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].id,
        });

        await this.inactiveQueue.add(
          {matchId: match.id},
          {
            delay: INACTIVE_DELAY,
            jobId: match.id,
          },
        );
      } else if (card === "favor") {
        this.server.to(playerId).emit(events.client.FAVORED, {
          playerId: player.id,
        });

        this.server
          .to(match.id)
          .except([player.id, playerId])
          .emit(events.client.PLAYER_FAVORED, {playerId});

        await this.favorResponseQueue.add(
          {
            matchId: match.id,
            performerId: playerId,
            requestorId: player.id,
          },
          {
            delay: FAVOR_RESPONSE_DELAY,
            jobId: match.id,
          },
        );
      } else if (card === "see-the-future") {
        const start = match.deck.length - 4;
        const end = match.deck.length - 1;

        const cards = match.deck.slice(start, end).filter(Boolean);

        this.server.to(player.id).emit(events.client.FOLLOWING_CARDS, {
          cards,
        });

        await this.inactiveQueue.add(
          {
            matchId: match.id,
          },
          {
            delay: INACTIVE_DELAY,
            jobId: match.id,
          },
        );
      } else if (card === "shuffle") {
        match.deck = shuffle(match.deck);

        await this.inactiveQueue.add(
          {
            matchId: match.id,
          },
          {
            delay: INACTIVE_DELAY,
            jobId: match.id,
          },
        );
      } else if (card === "skip") {
        turn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          playerId: match.players[match.turn].id,
        });

        await this.inactiveQueue.add(
          {matchId: match.id},
          {
            delay: INACTIVE_DELAY,
            jobId: match.id,
          },
        );
      }

      match.locked = false;

      await redis.set(`match:${match.id}`, JSON.stringify(match));

      done();
    });

    await this.favorResponseQueue.process(async (job, done) => {
      const json = await redis.get(`match:${job.data.matchId}`);
      const match: Match = JSON.parse(json);

      if (!match) done();

      const requestor = match.players.find(
        (player) => player.id === job.data.requestorId,
      );

      if (!requestor) done();

      const performer = match.players.find(
        (player) => player.id === job.data.performerId,
      );

      if (!performer) done();

      const idx = Math.floor(Math.random() * performer.cards.length);

      const card = performer.cards[idx];

      performer.cards.splice(idx, 1);
      requestor.cards.push(card);

      match.players.map((player) =>
        player.id === performer.id
          ? performer
          : player.id === requestor.id
          ? requestor
          : player,
      );

      this.server.to(requestor.id).emit(events.client.CARD_RECEIVED, {
        card,
      });

      this.server.to(performer.id).emit(events.client.FAVOR_CARD, {
        card,
      });

      await this.inactiveQueue.add(
        {matchId: match.id},
        {
          delay: INACTIVE_DELAY,
          jobId: match.id,
        },
      );

      await redis.set(`match:${match.id}`, JSON.stringify(match));

      done();
    });

    await this.explosionQueue.process(async (job, done) => {
      const json = await redis.get(`match:${job.data.matchId}`);
      const match: Match = JSON.parse(json);

      if (!match) done();

      const player = match.players[match.turn];

      if (!player) done();

      this.server.to(player.id).emit(events.client.DEFEAT);

      this.server
        .to(match.id)
        .except(player.id)
        .emit(events.client.PLAYER_DEFEATED, {
          playerId: player.id,
        });

      match.players.splice(match.turn, 1);

      const next = match.players[match.turn];

      if (!next) match.turn = 0;

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn],
      });

      await this.inactiveQueue.add(
        {matchId: match.id},
        {delay: INACTIVE_DELAY, jobId: match.id},
      );

      await redis.set(`match:${match.id}`, JSON.stringify(match));

      done();
    });

    await this.inactiveQueue.process(async (job, done) => {
      const json = await redis.get(`match:${job.data.matchId}`);
      const match: Match = JSON.parse(json);

      if (!match) done(null, true);

      const player = match.players[match.turn];

      this.server.to(player.id).emit(events.client.KICKED);

      this.server
        .to(match.id)
        .except(player.id)
        .emit(events.client.PLAYER_KICKED, {playerId: player.id});

      match.players.splice(match.turn, 1);

      const isEnd = match.players.length === 1;

      if (isEnd) {
        this.server.emit(events.client.VICTORY, {
          playerId: match.players[0].id,
        });

        await redis.del(`match:${match.id}`);

        done(null, true);
      }

      const next = match.players[match.turn + 1];

      if (!!next) match.turn++;
      else match.turn = 0;

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn].id,
      });

      await redis.set(`match:${match.id}`, JSON.stringify(match));

      done();
    });

    this.inactiveQueue.on("completed", async (job, stop: boolean) => {
      if (!stop) await this.inactiveQueue.add(job.data, job.opts);
    });
  }

  @SubscribeMessage(events.server.START)
  async start(
    @MessageBody() dto: StartDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{match: MatchPublic}> {
    const json = await redis.get(`lobby:${dto.lobbyId}`);
    const lobby: Lobby = JSON.parse(json);

    if (!lobby) throw new WsException("Invalid lobby id");

    const player = lobby.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    const isOwner = player.role === "owner";

    if (!isOwner)
      throw new WsException("You do not have permission to start the match");

    await redis.del(`lobby:${lobby.id}`);

    const {individual, main} = deck.generate(lobby.players.length);

    const players = lobby.players.map((player, idx) => ({
      ...player,
      cards: individual[idx],
    }));

    const match: Match = {
      id: lobby.id,
      deck: main,
      pile: [],
      turn: 0,
      locked: false,
      players,
      context: {
        attacks: 0,
        nope: false,
      },
    };

    await redis.set(`match:${match.id}`, JSON.stringify(match));

    await this.inactiveQueue.add(
      {
        matchId: match.id,
      },
      {
        delay: INACTIVE_DELAY,
        jobId: match.id,
      },
    );

    return {
      match: plain.match(match),
    };
  }

  @SubscribeMessage(events.server.DRAW_CARD)
  async drawCard(
    @MessageBody() dto: DrawCardDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<{card: Card}> {
    const json = await redis.get(`match:${dto.matchId}`);
    const match: Match = JSON.parse(json);

    if (!match) throw new WsException("Invalid match id");

    const player = match.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    const isTurn = match.players[match.turn].id === player.id;

    if (!isTurn) throw new WsException("It is not your turn");

    const job = await this.inactiveQueue.getJob(match.id);

    await job.remove();

    const card = match.deck[match.deck.length - 1];

    match.deck.shift();

    if (card === "exploding-kitten") {
      this.server
        .to(match.id)
        .except(player.id)
        .emit(events.client.EXPLODING_KITTEN_DREW, {
          playerId: player.id,
        });

      await this.explosionQueue.add(
        {
          matchId: match.id,
        },
        {
          jobId: match.id,
          delay: EXPLOSION_DELAY,
        },
      );
    } else {
      player.cards.push(card);

      this.server.to(match.id).except(player.id).emit(events.client.CARD_DREW, {
        playerId: player.id,
      });

      const next = match.players[match.turn + 1];

      if (!!next) match.turn++;
      else match.turn = 0;

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        playerId: match.players[match.turn],
      });

      await this.inactiveQueue.add(
        {
          matchId: match.id,
        },
        {
          delay: INACTIVE_DELAY,
          jobId: match.id,
        },
      );
    }

    return {
      card,
    };
  }

  @SubscribeMessage(events.server.PLAY_CARD)
  async playCard(
    @MessageBody() dto: PlayCardDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const json = await redis.get(`match:${dto.matchId}`);
    const match: Match = JSON.parse(json);

    if (!match) throw new WsException("Invalid match id");

    const player = match.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    const isTurn = match.players[match.turn].id === player.id;

    const job = await this.playQueue.getJob(match.id);

    const isNope = dto.card === "nope";

    const isAllowed = isNope && !!job;

    if (!isTurn && !isAllowed) throw new WsException("It is not your turn");

    if (match.locked && !isAllowed)
      throw new WsException("It is locked for now");

    this.server.to(match.id).except(player.id).emit(events.client.CARD_PLAYED, {
      card: dto.card,
      playerId: player.id,
    });

    if (isNope) {
      await job.remove();

      match.context.nope = !match.context.nope;

      this.server.to(match.id).emit(events.client.NOPE_CHANGE, {
        nope: match.context.nope,
      });

      await this.playQueue.add(job.data, job.opts);
    } else {
      match.locked = true;

      await this.playQueue.add(
        {
          matchId: match.id,
          playerId: dto.playerId,
          card: dto.card,
        },
        {
          delay: PLAY_DELAY,
          jobId: match.id,
        },
      );
    }

    await redis.set(`match:${match.id}`, JSON.stringify(match));
  }

  @SubscribeMessage(events.server.PLAY_DEFUSE)
  async playDefuse(
    @MessageBody() dto: PlayDefuseDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const json = await redis.get(`match:${dto.matchId}`);
    const match: Match = JSON.parse(json);

    if (!match) throw new WsException("Invalid match id");

    const player = match.players.find((player) => player.id === socket.id);

    const isParticipant = !!player;

    if (!isParticipant) throw new WsException("You are not a participant");

    const isTurn = match.players[match.turn].id === player.id;

    if (!isTurn) throw new WsException("It is not your turn");

    const job = await this.explosionQueue.getJob(match.id);

    if (!job) throw new WsException("There is no explosion");

    const hasDefuse = player.cards.includes("defuse");

    if (!hasDefuse) throw new WsException("You have no defuse card");

    await job.remove();

    const idx = player.cards.findIndex((card) => card === "defuse");

    player.cards.splice(idx, 1);

    this.server.to(player.id).emit(events.client.DEFUSED);

    this.server
      .to(match.id)
      .except(player.id)
      .emit(events.client.EXPLOSION_DEFUSED, {
        playerId: player.id,
      });

    this.server.to(player.id).emit(events.client.EXPLODING_KITTEN_SPOT_REQUEST);

    await this.spotResponseQueue.add(
      {matchId: match.id},
      {
        delay: SPOT_RESPONSE_DELAY,
        jobId: match.id,
      },
    );
  }
}
