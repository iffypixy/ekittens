import {InjectQueue} from "@nestjs/bull";
import {
  ConnectedSocket,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Queue} from "bull";
import {Redis} from "ioredis";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";
import {In} from "typeorm";

import {User, UserService} from "@modules/user";
import {InjectRedis, REDIS_PREFIX} from "@lib/redis";
import {utils} from "@lib/utils";
import {ack, WsHelper, WsResponse} from "@lib/ws";
import {MatchPlayerService, MatchService} from "../services";
import {MATCH_STATE, NUMBER_OF_MATCH_PLAYERS, QUEUE} from "../lib/constants";
import {
  InactivityQueuePayload,
  OngoingMatch,
  OngoingMatchPlayer,
} from "../lib/typings";
import {deck} from "../lib/deck";
import {plain} from "../lib/plain";

const prefix = "public-match";

const events = {
  server: {
    JOIN_QUEUE: `${prefix}:join-queue`,
    LEAVE_QUEUE: `${prefix}:leave-queue`,
  },
  client: {
    MATCH_START: `${prefix}:match-start`,
    PLAYER_DISCONNECT: `${prefix}:player-disconnect`,
    SELF_PLAYER_DISCONNECT: `${prefix}:self-player-disconnect`,
    INITIAL_CARDS_RECEIVE: `${prefix}:initial-cards-receive`,
    SELF_QUEUE_JOIN: `${prefix}:self-queue-join`,
    SELF_QUEUE_LEAVE: `${prefix}:self-queue-leave`,
  },
};

@WebSocketGateway()
export class PublicMatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private readonly helper: WsHelper;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue(QUEUE.MATCHMAKING.NAME)
    private readonly matchmakingQueue: Queue<null>,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
    private readonly matchService: MatchService,
    private readonly matchPlayerService: MatchPlayerService,
    private readonly userService: UserService,
  ) {
    this.helper = new WsHelper(this.server);
  }

  async afterInit() {
    await this.matchmakingQueue.process(async (_, done) => {
      const queueJSON = await this.redis.get(REDIS_PREFIX.QUEUE);
      const queue: User["id"][] = JSON.parse(queueJSON) || [];

      const queues = utils.splitArrayIntoChunks(
        queue,
        NUMBER_OF_MATCH_PLAYERS.MAX,
      );

      const filtered = queues.filter(
        (queue) => queue.length >= NUMBER_OF_MATCH_PLAYERS.MIN,
      );

      for (let i = 0; i < filtered.length; i++) {
        const queue = filtered[i];

        const id = nanoid();

        const {individual, main} = deck.generate(queue.length);

        const users: User[] = await this.userService.find({
          where: {id: In(queue)},
        });

        const players: OngoingMatchPlayer[] = users.map((user, idx) => ({
          user,
          cards: individual[idx],
          marked: [],
        }));

        const ongoing: OngoingMatch = {
          id,
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
          type: "public",
        };

        const match = this.matchService.create({
          id,
          status: "ongoing",
        });

        await this.matchService.save(match);

        for (let i = 0; i < players.length; i++) {
          const user = players[i].user;

          const player = this.matchPlayerService.create({
            match,
            user,
            rating: user.rating,
          });

          await this.matchPlayerService.save(player);
        }

        const sockets = queue.map(this.helper.getSocketsByUserId).flat();

        sockets.forEach((socket) => {
          socket.join(id);

          socket.on("disconnect", () => {
            const user = socket.request.session.user;

            const left = this.helper
              .getSocketsInRoomByUserId(id, user.id)
              .filter((s) => s.id !== socket.id);

            const isEmpty = left.length === 0;

            if (isEmpty) {
              this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
                playerId: user.id,
              });
            }
          });
        });

        this.server.to(id).emit(events.client.MATCH_START, {
          match: plain.match(ongoing),
        });

        players.forEach((player) => {
          const sockets = this.helper
            .getSocketsInRoomByUserId(id, player.user.id)
            .map((socket) => socket.id);

          this.server.to(sockets).emit(events.client.INITIAL_CARDS_RECEIVE, {
            cards: player.cards,
          });
        });

        this.redis.set(
          `${REDIS_PREFIX.MATCH}:${ongoing.id}`,
          JSON.stringify(ongoing),
        );
      }

      const updated = queues
        .filter((queue) => queue.length < NUMBER_OF_MATCH_PLAYERS.MIN)
        .flat();

      await this.redis.set(REDIS_PREFIX.QUEUE, JSON.stringify(updated));

      return done();
    });

    await this.matchmakingQueue.add(null, {
      repeat: {
        every: QUEUE.MATCHMAKING.REPEAT,
      },
    });
  }

  @SubscribeMessage(events.server.JOIN_QUEUE)
  async joinQueue(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const queueJSON = await this.redis.get(REDIS_PREFIX.QUEUE);
    const queue: User["id"][] = JSON.parse(queueJSON) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.includes(user.id);

    if (isEnqueued) return ack({ok: false, msg: "You are already enqueued"});

    const amount = await this.matchPlayerService.count({
      where: {user, match: {status: "ongoing"}},
    });

    const isInMatch = amount > 0;

    if (isInMatch) return ack({ok: false, msg: "You are already in match"});

    queue.push(user.id);

    const sockets = this.helper
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_QUEUE_JOIN);

    socket.on("disconnect", async () => {
      const queueJSON = await this.redis.get(REDIS_PREFIX.QUEUE);
      const queue: User["id"][] = JSON.parse(queueJSON) || [];

      const left = this.helper
        .getSocketsByUserId(user.id)
        .filter((s) => s.id !== socket.id);

      const isEmpty = left.length === 0;

      if (isEmpty) {
        const updated = queue.filter((id) => id !== user.id);

        await this.redis.set(REDIS_PREFIX.QUEUE, JSON.stringify(updated));
      }
    });

    await this.redis.set(REDIS_PREFIX.QUEUE, JSON.stringify(queue));

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_QUEUE)
  async leaveQueue(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const queueJSON = await this.redis.get(REDIS_PREFIX.QUEUE);
    const queue: User["id"][] = JSON.parse(queueJSON) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.includes(user.id);

    if (!isEnqueued) return ack({ok: false, msg: "You are not enqueued"});

    const updated = queue.filter((id) => id !== user.id);

    const sockets = this.helper
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_QUEUE_LEAVE);

    await this.redis.set(REDIS_PREFIX.QUEUE, JSON.stringify(updated));

    return ack({ok: true});
  }
}
