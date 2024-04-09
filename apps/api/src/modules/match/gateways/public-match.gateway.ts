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

import {User, UserService} from "@modules/user";
import {RP, RedisService} from "@lib/redis";
import {utils} from "@lib/utils";
import {ack, WsService, WsResponse} from "@lib/ws";

import {events} from "../lib/events";
import {
  MATCH_STATE,
  MAX_NUMBER_OF_MATCH_PLAYERS,
  MIN_NUMBER_OF_MATCH_PLAYERS,
  QUEUE,
} from "../lib/constants";
import {Enqueued, InactivityQueuePayload} from "../lib/typings";
import {deck} from "../lib/deck";
import {Match, MatchPlayer, OngoingMatch} from "../entities";
import {LOBBY_MODE} from "../lib/modes";
import {chatEvents} from "@modules/chat";

@WebSocketGateway()
export class PublicMatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private service: WsService;

  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    @InjectQueue(QUEUE.MATCHMAKING.NAME)
    private readonly matchmakingQueue: Queue<null>,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
  ) {}

  async afterInit(server: Server) {
    this.service = new WsService(server);

    this.matchmakingQueue.process(async (_, done) => {
      const queue = (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

      const queues = utils.splitIntoChunks(queue, MAX_NUMBER_OF_MATCH_PLAYERS);

      const ready = queues.filter(
        (queue) => queue.length >= MIN_NUMBER_OF_MATCH_PLAYERS,
      );

      for (let i = 0; i < ready.length; i++) {
        const queue = ready[i];

        const {individual, main} = deck.generate(queue.length, {
          exclude: ["streaking-kitten"],
        });

        const users: User[] = await User.find({
          where: {
            id: In(queue.map((enqueued) => enqueued.id)),
          },
        });

        const players = users.map((user, idx) => ({
          user,
          cards: individual[idx],
          marked: [],
        }));

        const ongoing = new OngoingMatch({
          id: nanoid(),
          players: [
            ...players.sort((a, b) =>
              a.user.username.localeCompare(b.user.username),
            ),
          ],
          out: [],
          spectators: [],
          draw: main,
          discard: [],
          turn: 0,
          state: {
            type: MATCH_STATE.WFA,
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
          type: "public",
          last: null,
        });

        const match = Match.create({
          id: ongoing.id,
          type: "public",
          status: "ongoing",
        });

        await match.save();

        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          const user = player.user;

          const created = MatchPlayer.create({
            match,
            user,
            rating: user.rating,
          });

          await created.save();

          await this.userService.setInterim(user.id, {
            activity: {
              type: "in-match",
              matchId: ongoing.id,
            },
          });

          const sockets = this.service.getSocketsByUserId(user.id);

          sockets.forEach((socket) => {
            socket.join(ongoing.id);

            socket.on("disconnect", () => {
              const sockets = this.service
                .getSocketsByUserId(user.id)
                .filter((s) => s.id !== socket.id);

              const isDisconnected = sockets.length === 0;

              if (isDisconnected) {
                this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
                  playerId: user.id,
                });

                this.server.to(match.id).emit(chatEvents.client.NEW_MESSAGE, {
                  message: {
                    id: nanoid(),
                    sender: {username: "SERVER"},
                    text: `${player.user.username} disconnected`,
                    createdAt: Date.now(),
                  },
                });
              }
            });
          });
        }

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

        this.redisService.set(`${RP.MATCH}:${ongoing.id}`, ongoing);
      }

      const updated = queues
        .filter((queue) => queue.length < MIN_NUMBER_OF_MATCH_PLAYERS)
        .flat();

      await this.redisService.set(RP.QUEUE, updated);

      return done();
    });

    this.matchmakingQueue.add(null, {
      repeat: {
        every: QUEUE.MATCHMAKING.REPEAT,
      },
    });
  }

  @SubscribeMessage(events.server.JOIN_QUEUE)
  async joinQueue(@ConnectedSocket() socket: Socket): Promise<WsResponse> {
    const queue = (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.some((enqueued) => enqueued.id === user.id);

    if (isEnqueued) return ack({ok: false, msg: "You are already enqueued"});

    const interim = await this.userService.getInterim(user.id);

    const isInMatch = !!(interim?.activity?.matchId || null);

    if (isInMatch) return ack({ok: false, msg: "You are in match"});

    queue.push({id: user.id, at: Date.now()});

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.on("disconnect", async () => {
        const sockets = this.service
          .getSocketsByUserId(user.id)
          .filter((s) => s.id !== socket.id);

        const isDisconnected = sockets.length === 0;

        if (isDisconnected) {
          const queue =
            (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

          const updated = queue.filter((enqueued) => enqueued.id !== user.id);

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
    const queue = (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

    const user = socket.request.session.user;

    const isEnqueued = queue.some((enqueued) => enqueued.id === user.id);

    if (!isEnqueued) return ack({ok: false, msg: "You are not enqueued"});

    const updated = queue.filter((enqueued) => enqueued.id !== user.id);

    const sockets = this.service
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_QUEUE_LEAVE);

    await this.redisService.set(RP.QUEUE, updated);

    return ack({ok: true});
  }
}
