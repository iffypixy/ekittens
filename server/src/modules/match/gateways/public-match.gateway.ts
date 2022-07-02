import {InjectQueue} from "@nestjs/bull";
import {
  ConnectedSocket,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Queue} from "bull";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";
import {In} from "typeorm";

import {User, UserInterim, UserService} from "@modules/user";
import {RP, RedisService} from "@lib/redis";
import {utils} from "@lib/utils";
import {ack, WsHelper, WsResponse} from "@lib/ws";
import {MatchPlayerService, MatchService} from "../services";
import {events} from "../lib/events";
import {
  MATCH_STATE,
  MAX_NUMBER_OF_MATCH_PLAYERS,
  MIN_NUMBER_OF_MATCH_PLAYERS,
  QUEUE,
} from "../lib/constants";
import {
  InactivityQueuePayload,
  OngoingMatch,
  OngoingMatchPlayer,
} from "../lib/typings";
import {deck} from "../lib/deck";
import {plain} from "../lib/plain";

@WebSocketGateway()
export class PublicMatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private readonly helper: WsHelper;

  constructor(
    @InjectQueue(QUEUE.MATCHMAKING.NAME)
    private readonly matchmakingQueue: Queue<null>,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
    private readonly redisService: RedisService,
    private readonly matchService: MatchService,
    private readonly matchPlayerService: MatchPlayerService,
    private readonly userService: UserService,
  ) {
    this.helper = new WsHelper(this.server);
  }

  async afterInit() {
    await this.matchmakingQueue.process(async (_, done) => {
      const queue = (await this.redisService.get<string[]>(RP.QUEUE)) || [];

      const queues = utils
        .splitIntoChunks(queue, MAX_NUMBER_OF_MATCH_PLAYERS)
        .filter((queue) => queue.length >= MIN_NUMBER_OF_MATCH_PLAYERS);

      for (let i = 0; i < queues.length; i++) {
        const queue = queues[i];

        const {individual, main} = deck.generate(queue.length);

        const users: User[] = await this.userService.find({
          where: {
            id: In(queue),
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
          type: "public",
        };

        const match = await this.matchService.create({
          id: ongoing.id,
          type: "public",
          status: "ongoing",
        });

        players.forEach(async (player) => {
          const user = player.user;

          await this.matchPlayerService.create({
            match,
            user,
            rating: user.rating,
          });

          await this.redisService.update<UserInterim>(`${RP.USER}:${user.id}`, {
            matchId: match.id,
          });

          const sockets = this.helper.getSocketsByUserId(user.id);

          sockets.forEach((socket) => {
            socket.join(match.id);

            socket.on("disconnect", () => {
              const sockets = this.helper
                .getSocketsByUserId(user.id)
                .filter((s) => s.id !== socket.id);

              const isDisconnected = sockets.length === 0;

              if (isDisconnected) {
                this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
                  playerId: user.id,
                });
              }
            });
          });
        });

        this.server.to(ongoing.id).emit(events.client.MATCH_START, {
          match: plain.match(ongoing),
        });

        players.forEach((player) => {
          const sockets = this.helper.getSocketsByUserId(player.user.id);

          sockets.forEach((socket) => {
            this.server
              .to(socket.id)
              .emit(events.client.INITIAL_CARDS_RECEIVE, {
                cards: player.cards,
              });
          });
        });

        await this.inactivityQueue.add(
          {matchId: match.id},
          {
            jobId: match.id,
            delay: QUEUE.INACTIVITY.DELAY,
          },
        );

        this.redisService.set(`${RP.MATCH}:${ongoing.id}`, ongoing);
      }

      const updated = queues.filter(
        (queue) => queue.length < MIN_NUMBER_OF_MATCH_PLAYERS,
      );

      await this.redisService.set(RP.QUEUE, updated);

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
    const queue = (await this.redisService.get<string[]>(RP.QUEUE)) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.includes(user.id);

    if (isEnqueued) return ack({ok: false, msg: "You are already enqueued"});

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isInMatch = !!interim && !!interim.matchId;

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    queue.push(user.id);

    const sockets = this.helper.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.on("disconnect", async () => {
        const sockets = this.helper
          .getSocketsByUserId(user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          const queue = (await this.redisService.get<string[]>(RP.QUEUE)) || [];

          const updated = queue.filter((id) => id !== user.id);

          await this.redisService.set(RP.QUEUE, updated);
        }
      });
    });

    const ids = sockets.map((socket) => socket.id);

    this.server.to(ids).emit(events.client.SELF_QUEUE_JOIN);

    await this.redisService.set(RP.QUEUE, queue);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_QUEUE)
  async leaveQueue(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const queue = (await this.redisService.get<string[]>(RP.QUEUE)) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.includes(user.id);

    if (!isEnqueued) return ack({ok: false, msg: "You are not enqueued"});

    const updated = queue.filter((id) => id !== user.id);

    const sockets = this.helper
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_QUEUE_LEAVE);

    await this.redisService.set(RP.QUEUE, updated);

    return ack({ok: true});
  }
}
